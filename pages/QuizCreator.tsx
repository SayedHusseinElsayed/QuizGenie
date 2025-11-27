

import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { QuestionType, Language, Question, Quiz, QuizResource } from '../types';
import { generateAIQuiz, regenerateSingleQuestion } from '../services/geminiService';
import { dbService, fileToBase64, generateUUID } from '../services/dbService';
import { UploadCloud, Sparkles, Save, Trash2, Plus, Check, Settings2, ArrowLeft, FileText, List, CheckSquare, Type, AlignLeft, ArrowUpAz, Eye, Edit3, RefreshCw, X, Image as ImageIcon, Calculator, PieChart, Circle, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '../services/subscriptionService';
import PaymentModal from '../components/PaymentModal';

const GRADE_LEVELS = [
  "KG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10",
  "Grade 11", "Grade 12", "University", "Professional"
];

const QuizCreator = () => {
  const { t, language, user } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<'CONFIG' | 'PREVIEW'>('CONFIG');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'EDIT' | 'STUDENT'>('EDIT');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Config State
  const [topic, setTopic] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [gradeLevel, setGradeLevel] = useState('Grade 9');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  // Per-type counts
  const [typeConfigs, setTypeConfigs] = useState<Partial<Record<QuestionType, number>>>({
    [QuestionType.SINGLE_CHOICE]: 3,
    [QuestionType.TRUE_FALSE]: 2
  });

  // Generated Quiz State
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [quizTitle, setQuizTitle] = useState('');

  // AUTH CHECK
  useEffect(() => {
    if (!user) {
      alert("Please login to create quizzes.");
      navigate('/login');
    }
  }, [user, navigate]);


  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);

      // Check each file size
      const oversizedFiles = fileArray.filter((file: File) => file.size > MAX_FILE_SIZE);

      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map((f: File) => `${f.name} (${formatFileSize(f.size)})`).join('\n');
        alert(`The following files exceed the 50MB limit:\n\n${fileNames}\n\nPlease upload smaller files.`);
        e.target.value = ''; // Clear the input
        return;
      }

      setFiles(fileArray);

      // Log file sizes for user awareness
      const totalSize = fileArray.reduce((sum: number, file: File) => sum + file.size, 0);
      console.log(`Uploaded ${fileArray.length} file(s), total size: ${formatFileSize(totalSize)}`);
      fileArray.forEach((file: File) => {
        console.log(`- ${file.name}: ${formatFileSize(file.size)}`);
      });
    }
  };

  const handleTypeToggle = (type: QuestionType) => {
    setTypeConfigs(prev => {
      const next = { ...prev };
      if (next[type] !== undefined) {
        delete next[type];
      } else {
        next[type] = 1; // Default to 1 question
      }
      return next;
    });
  };

  const handleTypeCountChange = (type: QuestionType, count: number) => {
    setTypeConfigs(prev => ({
      ...prev,
      [type]: Math.max(1, count)
    }));
  };

  const getTotalQuestions = () => {
    return (Object.values(typeConfigs) as (number | undefined)[]).reduce((a, b) => a + (b || 0), 0);
  };

  const handleGenerate = async () => {
    // Basic validation
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    // Limit to 2MB to prevent XHR errors with Gemini Proxy
    if (totalSize > 2 * 1024 * 1024) {
      alert("Total file size is too large for the AI service. Please keep total uploads under 2MB.");
      return;
    }

    // CHECK SUBSCRIPTION LIMITS
    if (user) {
      const check = await subscriptionService.canCreateQuiz(user.id);
      if (!check.allowed) {
        setShowPaymentModal(true);
        return;
      }
    }

    setLoading(true);
    try {
      const resources = await Promise.all(files.map(async (f) => ({
        mimeType: f.type,
        data: await fileToBase64(f)
      })));

      const questions = await generateAIQuiz({
        topic,
        resources,
        language,
        difficulty,
        gradeLevel,
        typeCounts: typeConfigs
      });

      // Prepare image URLs for auto-binding fallback (optional)
      const uploadedImages = await Promise.all(
        files
          .filter(f => f.type.startsWith('image/'))
          .map(async f => `data:${f.type};base64,${await fileToBase64(f)}`)
      );

      const processedQuestions = questions.map((q: any, i: number) => {
        let media_url = q.media_url;
        return { ...q, id: generateUUID(), media_url };
      });

      setGeneratedQuestions(processedQuestions);

      // Use Filename as title if available, else generic. Ignore topic/instructions for title.
      if (files.length > 0) {
        const name = files[0].name.replace(/\.[^/.]+$/, "");
        setQuizTitle(name);
      } else {
        setQuizTitle(language === Language.AR ? 'اختبار جديد' : 'New AI Quiz');
      }

      setStep('PREVIEW');
      setViewMode('EDIT');
    } catch (error: any) {
      alert(`Generation Failed: ${error.message || "Unknown error"}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateQuestion = async (idx: number) => {
    const q = generatedQuestions[idx];
    setRegeneratingId(q.id);

    try {
      const resources = await Promise.all(files.map(async (f) => ({
        mimeType: f.type,
        data: await fileToBase64(f)
      })));

      const newQ = await regenerateSingleQuestion(
        { topic, resources, language, difficulty, gradeLevel },
        q.type,
        q.text
      );

      const newQs = [...generatedQuestions];
      newQs[idx] = {
        ...newQ,
        id: q.id,
        media_url: q.media_url,
        svg_content: newQ.svg_content || q.svg_content
      };
      setGeneratedQuestions(newQs);
    } catch (e) {
      console.error(e);
      alert("Failed to regenerate question.");
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleSave = async () => {
    console.log("=== HANDLE SAVE CLICKED ===");
    try {
      if (!user) {
        alert("You must be logged in to save.");
        return;
      }

      console.log("User authenticated:", user.id);
      console.log("Questions to save:", generatedQuestions.length);
      console.log("Files to upload:", files.length);

      setSaving(true);

      const quizId = generateUUID();
      console.log("Generated quiz ID:", quizId);

      // 1. Upload files first (if any)
      // TEMPORARY: Skip file uploads due to Supabase Storage timeout issues
      const finalResources: QuizResource[] = [];

      console.log("⚠️ File uploads temporarily disabled due to Supabase Storage timeouts");
      console.log("Quiz will be saved without file attachments");

      // Uncomment below when Supabase Storage is working
      /*
      if (files.length > 0) {
        console.log("Starting file uploads...");
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          console.log(`Uploading file ${i + 1}/${files.length}: ${f.name} (${formatFileSize(f.size)})`);
          try {
            const publicUrl = await dbService.uploadQuizResource(quizId, f);
            if (publicUrl) {
              finalResources.push({ name: f.name, type: f.type, url: publicUrl });
              console.log(`✓ File ${i + 1} uploaded successfully`);
            } else {
              console.warn(`✗ File ${i + 1} upload returned null`);
            }
          } catch (fileErr: any) {
            console.error(`✗ File ${i + 1} upload failed:`, fileErr.message);
            // Continue with other files
          }
        }
        console.log(`✓ File uploads complete (${finalResources.length}/${files.length} successful)`);
        
        if (finalResources.length === 0 && files.length > 0) {
          console.warn("All file uploads failed, but continuing to save quiz without files");
        }
      } else {
        console.log("No files to upload, skipping file upload step");
      }
      */

      console.log("Creating quiz object...");
      const newQuiz: Quiz = {
        id: quizId,
        teacher_id: user.id,
        title: quizTitle || 'Untitled Quiz',
        description: topic ? `AI Instructions: ${topic}` : 'Generated from uploaded resources',
        language,
        status: 'PUBLISHED',
        questions: generatedQuestions,
        settings: {
          time_limit_minutes: 10,
          passing_score: 60,
          max_attempts: 3,
          shuffle_questions: true,
          show_results_immediately: true,
          grading_mode: 'AUTO' // Default to Auto
        },
        created_at: new Date().toISOString(),
        ai_prompt: topic || '',
        resources: finalResources
      };

      console.log(`Calling dbService.saveQuiz with ${generatedQuestions.length} questions...`);
      await dbService.saveQuiz(newQuiz);
      console.log("✓ dbService.saveQuiz completed successfully");

      // Increment usage count
      await subscriptionService.incrementQuizCount(user.id);

      alert(`Quiz Saved Successfully! (${generatedQuestions.length} questions)`);
      navigate('/quizzes');
    } catch (error: any) {
      console.error("=== SAVE ERROR ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Full error:", error);
      alert(`Failed to save quiz. Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Helper to handle image upload for a question
  const handleQuestionImageUpload = async (qIdx: number, file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const newQs = [...generatedQuestions];
      newQs[qIdx].media_url = `data:${file.type};base64,${base64}`;
      setGeneratedQuestions(newQs);
    } catch (e) {
      console.error("Image upload failed", e);
    }
  };

  const getTypeIcon = (type: QuestionType) => {
    switch (type) {
      case QuestionType.SINGLE_CHOICE: return <List size={16} />;
      case QuestionType.MULTIPLE_CHOICE: return <CheckSquare size={16} />;
      case QuestionType.TRUE_FALSE: return <Check size={16} />;
      case QuestionType.ORDERING: return <ArrowUpAz size={16} />;
      case QuestionType.ESSAY: return <AlignLeft size={16} />;
      case QuestionType.NUMERICAL: return <Calculator size={16} />;
      case QuestionType.GRAPHICAL: return <PieChart size={16} />;
      default: return <Type size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mb-4"></div>
        <h2 className="text-xl font-bold text-slate-700">{t.quiz_creator.generating}</h2>
        <p className="text-slate-500 mt-2">Gemini is analyzing resources and building questions...</p>
      </div>
    );
  }

  if (step === 'PREVIEW') {
    return (
      <div className="container mx-auto max-w-[1600px] px-4 lg:px-8 space-y-8 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-slate-50 z-10 py-4 border-b border-slate-200/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setStep('CONFIG')} className="p-2 hover:bg-white rounded-full text-slate-500 transition shadow-sm border border-transparent hover:border-slate-200">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">{t.quiz_creator.review}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="bg-white rounded-lg border border-slate-200 p-1 flex items-center shadow-sm">
              <button
                onClick={() => setViewMode('EDIT')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition ${viewMode === 'EDIT' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Edit3 size={16} /> {t.quiz_creator.editor_view}
              </button>
              <button
                onClick={() => setViewMode('STUDENT')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition ${viewMode === 'STUDENT' ? 'bg-primary-50 text-primary-700' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Eye size={16} /> {t.quiz_creator.student_view}
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 font-bold shadow-lg shadow-primary-500/20 transition transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
              {saving ? "Saving..." : t.quiz_creator.publish}
            </button>
          </div>
        </div>

        {/* Title Editor */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Quiz Title</label>
          <input
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            disabled={viewMode === 'STUDENT'}
            className="w-full text-3xl font-bold text-slate-900 border-b-2 border-slate-100 focus:border-primary-500 outline-none py-2 bg-transparent placeholder-slate-300 transition-colors disabled:opacity-75 disabled:border-transparent"
            placeholder="Enter Quiz Title..."
          />
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {generatedQuestions.map((q, idx) => (
            <div key={q.id || idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group transition-all hover:shadow-md hover:border-primary-200 relative">
              {/* Loading Overlay for Regeneration */}
              {regeneratingId === q.id && (
                <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2 text-primary-600 font-bold">
                    <RefreshCw className="animate-spin" size={32} />
                    <span>Regenerating...</span>
                  </div>
                </div>
              )}

              {/* Card Header */}
              <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-sm text-sm">
                    {idx + 1}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                    {getTypeIcon(q.type)}
                    <span>{t.quiz_creator.types[q.type] || q.type}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-400 px-2 border-l border-slate-200">
                    {q.points} Points
                  </span>
                </div>

                {viewMode === 'EDIT' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRegenerateQuestion(idx)}
                      className="text-slate-400 hover:text-primary-600 hover:bg-primary-50 p-2 rounded-lg transition"
                      title={t.quiz_creator.regenerate}
                    >
                      <RefreshCw size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newQs = [...generatedQuestions];
                        newQs.splice(idx, 1);
                        setGeneratedQuestions(newQs);
                      }}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                      title="Remove Question"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-6">
                <div>
                  {viewMode === 'EDIT' && <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Question Text</label>}
                  <input
                    value={q.text || ''}
                    disabled={viewMode === 'STUDENT'}
                    onChange={(e) => {
                      const newQs = [...generatedQuestions];
                      newQs[idx].text = e.target.value;
                      setGeneratedQuestions(newQs);
                    }}
                    className={`w-full font-medium text-lg text-slate-900 outline-none rounded-xl transition ${viewMode === 'EDIT' ? 'border border-slate-200 p-4 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white' : 'bg-transparent border-none p-0'}`}
                  />
                </div>

                {/* SVG Graphics Display */}
                {q.svg_content && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 flex justify-center">
                    <div
                      className="w-full max-w-md h-auto svg-container"
                      dangerouslySetInnerHTML={{ __html: q.svg_content }}
                    />
                  </div>
                )}

                {/* Media/Image Attachment Section (Fallback) */}
                {viewMode === 'EDIT' && !q.svg_content && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Attached Image (Optional)</label>
                    {q.media_url ? (
                      <div className="relative inline-block group">
                        <img src={q.media_url} alt="Question Attachment" className="h-32 rounded-lg border border-slate-200 object-cover" />
                        <button
                          onClick={() => {
                            const newQs = [...generatedQuestions];
                            newQs[idx].media_url = undefined;
                            setGeneratedQuestions(newQs);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <label className="cursor-pointer flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition">
                          <ImageIcon size={16} />
                          Upload Image
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && handleQuestionImageUpload(idx, e.target.files[0])} />
                        </label>
                        {q.type === QuestionType.GRAPHICAL && <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded">Recommended for Graphical Questions</span>}
                      </div>
                    )}
                  </div>
                )}
                {viewMode === 'STUDENT' && q.media_url && !q.svg_content && (
                  <img src={q.media_url} alt="Question Visual" className="max-h-64 rounded-lg border border-slate-200 object-contain" />
                )}

                {/* ---------------- STUDENT INTERACTIVE VIEW ---------------- */}
                {viewMode === 'STUDENT' && (
                  <div className="mt-4">
                    {/* Choice Based */}
                    {(q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.TRUE_FALSE || (q.type === QuestionType.GRAPHICAL && q.options && q.options.length > 0)) && (
                      <div className="space-y-3">
                        {q.options?.map((opt, i) => (
                          <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-slate-300 hover:bg-slate-50 cursor-pointer group bg-white">
                            <div className="w-5 h-5 rounded-full border-2 border-slate-400 flex items-center justify-center">
                              <div className="w-2.5 h-2.5 bg-slate-300 rounded-full opacity-0"></div>
                            </div>
                            <span className="text-slate-900 font-medium">{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Multiple Choice */}
                    {q.type === QuestionType.MULTIPLE_CHOICE && (
                      <div className="space-y-3">
                        {q.options?.map((opt, i) => (
                          <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-slate-300 hover:bg-slate-50 cursor-pointer group bg-white">
                            <div className="w-5 h-5 rounded border-2 border-slate-400 flex items-center justify-center"></div>
                            <span className="text-slate-900 font-medium">{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Text Inputs */}
                    {(q.type === QuestionType.SHORT_ANSWER || q.type === QuestionType.FILL_BLANK || (q.type === QuestionType.GRAPHICAL && (!q.options || q.options.length === 0))) && (
                      <input
                        disabled
                        placeholder="Type your answer here..."
                        className="w-full p-4 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 cursor-not-allowed"
                      />
                    )}

                    {/* Essay */}
                    {q.type === QuestionType.ESSAY && (
                      <textarea
                        disabled
                        placeholder="Type your essay answer here..."
                        className="w-full p-4 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 min-h-[120px] cursor-not-allowed"
                      />
                    )}

                    {/* Numerical */}
                    {q.type === QuestionType.NUMERICAL && (
                      <div className="relative">
                        <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                          disabled
                          type="number"
                          placeholder="Enter number..."
                          className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 cursor-not-allowed"
                        />
                      </div>
                    )}

                    {/* Ordering */}
                    {q.type === QuestionType.ORDERING && (
                      <div className="space-y-2">
                        {q.options?.map((opt, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-300 bg-white shadow-sm">
                            <div className="flex flex-col gap-0.5 text-slate-500">
                              <ArrowUpAz size={16} />
                            </div>
                            <span className="text-slate-900 font-medium">{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Matching */}
                    {q.type === QuestionType.MATCHING && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Left Column - Items to Match */}
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-3">Items</p>
                            {q.options?.filter((_, i) => i % 2 === 0).map((item, i) => (
                              <div key={i} className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-slate-900 font-medium">
                                {item}
                              </div>
                            ))}
                          </div>

                          {/* Middle Column - Answer Boxes */}
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-3">Answers</p>
                            {q.options?.filter((_, i) => i % 2 === 0).map((_, i) => (
                              <div key={i} className="p-3 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 text-center min-h-[48px] flex items-center justify-center">
                                Drop here
                              </div>
                            ))}
                          </div>

                          {/* Right Column - Choices */}
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-3">Choices</p>
                            {q.options?.filter((_, i) => i % 2 === 1).map((choice, i) => (
                              <div key={i} className="p-3 rounded-lg bg-white border border-slate-300 text-slate-900 font-medium cursor-move hover:bg-slate-50 transition">
                                {choice}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------- EDITOR VIEW OPTIONS ---------------- */}
                {viewMode === 'EDIT' && (q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.ORDERING || (q.type === QuestionType.GRAPHICAL && q.options)) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-3 uppercase">Choices</label>
                    <div className="grid grid-cols-1 gap-3">
                      {q.options?.map((opt, optIdx) => {
                        const isCorrect = String(q.correct_answer).includes(opt);
                        return (
                          <div key={optIdx} className={`flex items-center gap-3 p-3 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
                            }`}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isCorrect ? 'border-green-500' : 'border-slate-300'
                              }`}>
                              {isCorrect && <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />}
                            </div>

                            <input
                              value={opt || ''}
                              onChange={(e) => {
                                const newQs = [...generatedQuestions];
                                if (newQs[idx].options) newQs[idx].options![optIdx] = e.target.value;
                                setGeneratedQuestions(newQs);
                              }}
                              className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700"
                            />

                            <button
                              onClick={() => {
                                const newQs = [...generatedQuestions];
                                newQs[idx].options?.splice(optIdx, 1);
                                setGeneratedQuestions(newQs);
                              }}
                              className="text-slate-300 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}

                      <button
                        onClick={() => {
                          const newQs = [...generatedQuestions];
                          if (!newQs[idx].options) newQs[idx].options = [];
                          newQs[idx].options?.push(`New Option ${newQs[idx].options?.length || 0}`);
                          setGeneratedQuestions(newQs);
                        }}
                        className="text-primary-600 font-bold text-sm hover:underline flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Choice
                      </button>
                    </div>
                  </div>
                )}

                {/* True / False Editor */}
                {viewMode === 'EDIT' && q.type === QuestionType.TRUE_FALSE && (
                  <div className="flex gap-4">
                    {['True', 'False'].map(val => {
                      const isCorrect = String(q.correct_answer).toLowerCase() === val.toLowerCase();
                      return (
                        <button
                          key={val}
                          onClick={() => {
                            const newQs = [...generatedQuestions];
                            newQs[idx].correct_answer = val;
                            setGeneratedQuestions(newQs);
                          }}
                          className={`px-6 py-2.5 rounded-lg font-bold border transition-all flex-1 ${isCorrect
                            ? 'bg-green-600 text-white border-green-600 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Numerical Editor */}
                {viewMode === 'EDIT' && q.type === QuestionType.NUMERICAL && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Correct Number</label>
                    <input
                      type="number"
                      value={q.correct_answer as string || ''}
                      onChange={(e) => {
                        const newQs = [...generatedQuestions];
                        newQs[idx].correct_answer = e.target.value;
                        setGeneratedQuestions(newQs);
                      }}
                      placeholder="Correct Value"
                      className="w-full border border-slate-300 rounded-lg p-3 bg-white outline-none focus:ring-2 focus:ring-primary-200 text-slate-900"
                    />
                  </div>
                )}

                {/* Matching Editor */}
                {viewMode === 'EDIT' && q.type === QuestionType.MATCHING && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-3 uppercase">Matching Pairs</label>
                    <div className="space-y-3">
                      {q.options && q.options.length > 0 && (
                        <>
                          {Array.from({ length: Math.ceil(q.options.length / 2) }).map((_, pairIdx) => {
                            const itemIdx = pairIdx * 2;
                            const matchIdx = pairIdx * 2 + 1;
                            return (
                              <div key={pairIdx} className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <div>
                                  <label className="text-xs text-slate-500 font-medium mb-1 block">Item {pairIdx + 1}</label>
                                  <input
                                    value={q.options[itemIdx] || ''}
                                    onChange={(e) => {
                                      const newQs = [...generatedQuestions];
                                      if (newQs[idx].options) newQs[idx].options![itemIdx] = e.target.value;
                                      setGeneratedQuestions(newQs);
                                    }}
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                                    placeholder="Enter item"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <label className="text-xs text-slate-500 font-medium mb-1 block">Match {pairIdx + 1}</label>
                                    <input
                                      value={q.options[matchIdx] || ''}
                                      onChange={(e) => {
                                        const newQs = [...generatedQuestions];
                                        if (newQs[idx].options) newQs[idx].options![matchIdx] = e.target.value;
                                        setGeneratedQuestions(newQs);
                                      }}
                                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                                      placeholder="Enter match"
                                    />
                                  </div>
                                  <button
                                    onClick={() => {
                                      const newQs = [...generatedQuestions];
                                      newQs[idx].options?.splice(itemIdx, 2);
                                      setGeneratedQuestions(newQs);
                                    }}
                                    className="self-end text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                                    title="Remove pair"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                      <button
                        onClick={() => {
                          const newQs = [...generatedQuestions];
                          if (!newQs[idx].options) newQs[idx].options = [];
                          newQs[idx].options?.push('New Item', 'New Match');
                          setGeneratedQuestions(newQs);
                        }}
                        className="text-primary-600 font-bold text-sm hover:underline flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Matching Pair
                      </button>
                    </div>
                  </div>
                )}

                {/* Explanation / Answer Key - ONLY IN EDIT MODE */}
                {viewMode === 'EDIT' && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mt-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Correct Answer & Explanation</span>
                    </div>
                    {/* Only show raw text edit for non-choice types or if complex */}
                    {(q.type === QuestionType.SHORT_ANSWER || q.type === QuestionType.FILL_BLANK) && (
                      <input
                        value={q.correct_answer as string || ''}
                        onChange={(e) => {
                          const newQs = [...generatedQuestions];
                          newQs[idx].correct_answer = e.target.value;
                          setGeneratedQuestions(newQs);
                        }}
                        className="w-full text-sm font-mono text-green-700 bg-green-50/50 p-2 rounded border border-green-100 mb-2 focus:outline-none focus:border-green-300"
                      />
                    )}
                    <input
                      value={q.explanation || ''}
                      onChange={(e) => {
                        const newQs = [...generatedQuestions];
                        newQs[idx].explanation = e.target.value;
                        setGeneratedQuestions(newQs);
                      }}
                      placeholder="Add explanation for students..."
                      className="w-full text-sm text-slate-600 bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-primary-200 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {viewMode === 'EDIT' && (
          <button
            onClick={() => setGeneratedQuestions([...generatedQuestions, { id: generateUUID(), text: 'New Question', type: QuestionType.SHORT_ANSWER, points: 1, explanation: '' }])}
            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50/50 flex items-center justify-center gap-2 font-bold transition group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center group-hover:bg-primary-100 group-hover:text-primary-600 transition">
              <Plus size={20} />
            </div>
            {t.quiz_creator.add_question}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-[1600px] px-4 lg:px-8 pb-20">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 pt-6">{t.quiz_creator.title}</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Config Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800"><Settings2 size={20} className="text-primary-500" /> Basic Setup</h2>
            {/* Upload Section */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">{t.quiz_creator.upload_label}</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition cursor-pointer relative group">
                <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={32} />
                </div>
                <p className="text-slate-900 font-bold">Click to upload or drag & drop</p>
                <p className="text-slate-500 text-sm mt-1">PDFs, Word docs, Images, or Text files (Max 2MB Total)</p>
              </div>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {files.map((f, i) => (
                    <span key={i} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                      <FileText size={14} className="text-slate-400" />
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Topic / Prompt */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">{t.quiz_creator.topic_label}</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter specific instructions for the AI (e.g. 'Focus on Chapter 3 dates', 'Make questions challenging', 'Include reasoning')..."
                className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-primary-500 outline-none h-28 resize-none bg-white text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">{t.quiz_creator.grade_level_label}</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  {GRADE_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e: any) => setDifficulty(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || (!topic && files.length === 0) || getTotalQuestions() === 0}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
          >
            <Sparkles size={20} className="text-yellow-400" />
            {t.quiz_creator.generate_btn} ({getTotalQuestions()} Qs)
          </button>
        </div>

        {/* Right Config Column - Types */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
            <h2 className="text-lg font-bold mb-4 text-slate-800">{t.quiz_creator.config_section}</h2>

            <div className="space-y-3">
              {Object.values(QuestionType).map((type) => (
                <div key={type} className={`p-3 rounded-xl border transition-all duration-200 ${typeConfigs[type] !== undefined ? 'border-primary-500 bg-primary-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer select-none w-full">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${typeConfigs[type] !== undefined ? 'bg-primary-600 border-primary-600' : 'border-slate-300 bg-white'}`}>
                        {typeConfigs[type] !== undefined && <Check size={14} className="text-white" />}
                        <input
                          type="checkbox"
                          checked={typeConfigs[type] !== undefined}
                          onChange={() => handleTypeToggle(type)}
                          className="hidden"
                        />
                      </div>
                      <span className={`text-sm font-semibold flex-1 ${typeConfigs[type] !== undefined ? 'text-primary-900' : 'text-slate-600'}`}>
                        {t.quiz_creator.types[type]}
                      </span>
                    </label>
                  </div>

                  {typeConfigs[type] !== undefined && (
                    <div className="mt-3 pl-8 flex items-center gap-3 animate-in slide-in-from-top-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Count</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={typeConfigs[type]}
                        onChange={(e) => handleTypeCountChange(type, parseInt(e.target.value))}
                        className="w-20 border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-200 outline-none bg-white"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          handleGenerate(); // Retry generation after upgrade
        }}
      />
    </div>
  );
};

export default QuizCreator;
