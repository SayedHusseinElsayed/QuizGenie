import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { dbService, generateUUID } from '../services/dbService';
import { supabase } from '../services/supabase';
import { Quiz, QuestionType, Question, QuizInvite, Submission, NotificationType } from '../types';
import {
   ArrowLeft, Save, Trash2, Plus, Settings, Users,
   FileText, BrainCircuit, Share2, CheckCircle, ChevronDown, ChevronUp, X, PlayCircle, Link as LinkIcon, Copy, UserPlus, Clock, Eye, Check, XCircle, Calculator, Edit2, Mail, AlertTriangle
} from 'lucide-react';

// Component defined outside to prevent re-renders
const CircleProgress = ({ percentage }: { percentage: number }) => {
   const size = 40;
   const strokeWidth = 3;
   const radius = (size - strokeWidth) / 2;
   const circumference = radius * 2 * Math.PI;
   const offset = circumference - (percentage / 100) * circumference;

   let color = 'text-primary-600';
   if (percentage >= 80) color = 'text-green-500';
   else if (percentage < 50) color = 'text-amber-500';

   return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
         <svg className="transform -rotate-90 w-full h-full">
            <circle className="text-slate-100" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
            <circle
               className={`${color} transition-all duration-1000 ease-out`}
               strokeWidth={strokeWidth}
               strokeDasharray={circumference}
               strokeDashoffset={offset}
               strokeLinecap="round"
               stroke="currentColor"
               fill="transparent"
               r={radius} cx={size / 2} cy={size / 2}
            />
         </svg>
         <span className={`absolute text-[10px] font-bold ${color}`}>{Math.round(percentage)}%</span>
      </div>
   );
};

const QuizManager = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const { t, user } = useApp();

   const [quiz, setQuiz] = useState<Quiz | null>(null);
   const [activeTab, setActiveTab] = useState<'questions' | 'invitations' | 'submissions' | 'settings' | 'context'>('questions');
   const [isDirty, setIsDirty] = useState(false);
   const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
   const [submissions, setSubmissions] = useState<Submission[]>([]);

   // Modal States
   const [showInviteModal, setShowInviteModal] = useState(false);
   const [inviteMode, setInviteMode] = useState<'DIRECT' | 'LINK'>('DIRECT');
   const [inviteEmails, setInviteEmails] = useState('');

   // Student Search States
   const [availableStudents, setAvailableStudents] = useState<{ id: string; full_name: string; email: string }[]>([]);
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedStudents, setSelectedStudents] = useState<string[]>([]); // email list

   // Submission Detail
   const [selectedStudent, setSelectedStudent] = useState<{ name: string, email: string, id: string } | null>(null);
   const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

   // Grading
   const [gradingValues, setGradingValues] = useState<Record<string, number>>({});
   const [isGradingMode, setIsGradingMode] = useState(false);
   const [isSavingGrades, setIsSavingGrades] = useState(false);

   // --- Data Loading ---
   useEffect(() => {
      const load = async () => {
         const quizzes = await dbService.getQuizzes();
         const found = quizzes.find(q => q.id === id);
         if (found) setQuiz(found);
      };
      load();
   }, [id]);

   useEffect(() => {
      if (activeTab === 'submissions' && quiz) {
         const loadSubs = async () => {
            const data = await dbService.getQuizSubmissions(quiz.id);
            setSubmissions(data);
         };
         loadSubs();
      } else if (activeTab === 'invitations' && quiz) {
         const loadInvites = async () => {
            const invites = await dbService.getQuizInvites(quiz.id);
            setQuiz(prev => prev ? { ...prev, invites } : null);
         };
         loadInvites();
      }
   }, [activeTab, quiz?.id]);

   // Load available students when modal opens
   useEffect(() => {
      if (showInviteModal && user) {
         const loadStudents = async () => {
            const students = await dbService.getTeacherStudents();
            setAvailableStudents(students);
         };
         loadStudents();
      } else {
         // Reset when modal closes
         setSearchQuery('');
         setSelectedStudents([]);
      }
   }, [showInviteModal, user]);

   // --- Actions ---
   const handleSave = async () => {
      if (quiz) {
         await dbService.saveQuiz(quiz);
         setIsDirty(false);
         alert("Changes saved successfully!");
      }
   };

   const navigateToStudentProfile = async (email: string) => {
      try {
         // First, try to find student from existing submissions
         const studentSubmission = submissions.find(s => s.student_email === email);
         if (studentSubmission) {
            navigate(`/student/${studentSubmission.student_id}`);
            return;
         }

         // If no submission found, look up student ID from database
         const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .eq('role', 'STUDENT')
            .single();

         if (error || !data) {
            alert('Student profile not found. The student may not have registered yet.');
            return;
         }

         navigate(`/student/${data.id}`);
      } catch (e) {
         console.error('Error navigating to student profile:', e);
         alert('Unable to open student profile.');
      }
   };

   const handleInvite = async () => {
      if (!quiz) return;

      // Combine selected students + manual emails
      const manualEmails = inviteEmails.split(',').map(e => e.trim().toLowerCase()).filter(e => e.includes('@'));
      const allEmails = [...selectedStudents, ...manualEmails];

      // Remove duplicates
      const uniqueEmails = [...new Set(allEmails)];

      if (uniqueEmails.length === 0) {
         alert("Please select students or enter email addresses.");
         return;
      }

      const emails = uniqueEmails;

      const newInvites: QuizInvite[] = emails.map(email => ({
         id: generateUUID(),
         name: 'Pending Student',
         email: email,
         status: 'PENDING',
         invited_at: new Date().toISOString()
      }));

      try {
         await dbService.addInvites(quiz.id, newInvites);
         setQuiz({ ...quiz, invites: [...(quiz.invites || []), ...newInvites] });

         // Create notifications for invited students
         console.log('🔔 Creating notifications for', newInvites.length, 'invites...');
         let notificationsCreated = 0;

         for (const invite of newInvites) {
            try {
               const teacherName = user?.full_name || 'A teacher';
               console.log('Looking up user for email:', invite.email);

               // Look up student user ID from email in profiles table
               const { data: profiles, error: profileError } = await supabase
                  .from('profiles')
                  .select('id, email')
                  .eq('email', invite.email)
                  .single();

               console.log('Profile lookup result:', { profiles, profileError });

               if (profiles?.id) {
                  console.log('✓ Found student profile, creating notification...');

                  // Student exists in system, create notification
                  await dbService.createNotification({
                     user_id: profiles.id,
                     type: NotificationType.QUIZ_INVITE,
                     title: 'New Quiz Invitation',
                     message: `${teacherName} invited you to take "${quiz.title}"`,
                     quiz_id: quiz.id,
                     related_user_name: teacherName,
                     is_read: false
                  });

                  notificationsCreated++;
                  console.log('✓ Notification created for', invite.email);
               } else {
                  console.log('⚠️ Student not found in profiles table:', invite.email);
               }
            } catch (e) {
               console.error('❌ Failed to create notification for', invite.email, e);
            }
         }

         console.log(`🔔 Created ${notificationsCreated} notifications out of ${newInvites.length} invites`);

         setInviteEmails('');
         setShowInviteModal(false);
         alert(`Successfully invited ${newInvites.length} students. ${notificationsCreated} notifications sent.`);
      } catch (e) {
         console.error(e);
         alert("Failed to save invites.");
      }
   };

   const handleRemoveInvite = async (inviteId: string, inviteStatus: string) => {
      if (!quiz) return;

      // Only allow removing pending invitations
      if (inviteStatus !== 'PENDING') {
         alert('Cannot remove invitations that have been accepted.');
         return;
      }

      if (!window.confirm('Remove this invitation?')) return;

      try {
         await dbService.removeInvite(quiz.id, inviteId);
         setQuiz({ ...quiz, invites: quiz.invites?.filter(inv => inv.id !== inviteId) });
         alert('Invitation removed successfully.');
      } catch (e) {
         console.error(e);
         alert('Failed to remove invitation.');
      }
   };

   const copyPublicLink = () => {
      if (!quiz) return;
      const baseUrl = window.location.href.split('#')[0];
      const link = `${baseUrl}#/share/${quiz.id}`;
      navigator.clipboard.writeText(link);
      alert("Public link copied to clipboard!");
   };

   // --- Question Management ---
   const updateQuestion = (index: number, updates: Partial<Question>) => {
      if (!quiz) return;
      const updatedQuestions = [...quiz.questions];
      updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
      setQuiz({ ...quiz, questions: updatedQuestions });
      setIsDirty(true);
   };

   const deleteQuestion = (index: number) => {
      if (!quiz) return;
      if (window.confirm("Are you sure you want to delete this question?")) {
         const updatedQuestions = [...quiz.questions];
         updatedQuestions.splice(index, 1); // Remove question at index
         setQuiz({ ...quiz, questions: updatedQuestions });
         setIsDirty(true);
         setExpandedQuestion(null);
      }
   };

   const addQuestion = () => {
      if (!quiz) return;
      const newQ: Question = {
         id: generateUUID(),
         text: 'New Question',
         type: QuestionType.SINGLE_CHOICE,
         points: 1,
         options: ['Option 1', 'Option 2'],
         correct_answer: 'Option 1'
      };
      setQuiz({ ...quiz, questions: [...quiz.questions, newQ] });
      setExpandedQuestion(newQ.id);
      setIsDirty(true);
   };

   // Option Helpers
   const updateOption = (qIdx: number, optIdx: number, val: string) => {
      if (!quiz) return;
      const q = quiz.questions[qIdx];
      const newOpts = [...(q.options || [])];
      const oldVal = newOpts[optIdx];
      newOpts[optIdx] = val;
      let newCorrect = q.correct_answer;
      if (q.correct_answer === oldVal) newCorrect = val;
      updateQuestion(qIdx, { options: newOpts, correct_answer: newCorrect });
   };

   const addOption = (qIdx: number) => {
      if (!quiz) return;
      const q = quiz.questions[qIdx];
      const newOpts = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
      updateQuestion(qIdx, { options: newOpts });
   };

   const removeOption = (qIdx: number, optIdx: number) => {
      if (!quiz) return;
      const q = quiz.questions[qIdx];
      const newOpts = [...(q.options || [])];
      newOpts.splice(optIdx, 1);
      updateQuestion(qIdx, { options: newOpts });
   };

   // --- Submission Grouping ---
   const groupedSubmissions = useMemo(() => {
      const groups: Record<string, Submission[]> = {};
      submissions.forEach(sub => {
         const key = sub.student_id;
         if (!groups[key]) groups[key] = [];
         groups[key].push(sub);
      });
      return Object.values(groups).map(subs => {
         const bestScore = Math.max(...subs.map(s => s.score));
         const latest = subs.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];
         return {
            student_id: latest.student_id,
            student_name: latest.student_name,
            student_email: latest.student_email,
            attempts: subs.length,
            best_score: bestScore,
            latest_submission: latest.submitted_at,
            submissions: subs
         };
      });
   }, [submissions]);

   // --- Grading & Settings Logic ---
   const handleTotalScoreChange = (newTotal: number) => {
      if (!quiz || quiz.questions.length === 0) return;
      const count = quiz.questions.length;
      const basePoints = Math.floor(newTotal / count);
      const remainder = newTotal % count;
      const newQuestions = quiz.questions.map((q, i) => ({
         ...q,
         points: basePoints + (i < remainder ? 1 : 0)
      }));
      setQuiz({ ...quiz, questions: newQuestions });
      setIsDirty(true);
   };

   const initGrading = (submission: Submission) => {
      const initialGrading: Record<string, number> = {};

      // Check if grading_details exists and is an array
      if (submission.grading_details && Array.isArray(submission.grading_details) && submission.grading_details.length > 0) {
         // Convert array format to Record format for the UI
         submission.grading_details.forEach(gd => {
            initialGrading[gd.question_id] = gd.points_awarded;
         });
         setGradingValues(initialGrading);
      } else {
         quiz?.questions.forEach(q => {
            const studentAns = submission.answers[q.id];
            const isCorrect = String(studentAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();
            initialGrading[q.id] = isCorrect ? q.points : 0;
         });
         setGradingValues(initialGrading);
      }
      setIsGradingMode(true);
   };

   const updateGrade = (questionId: string, points: number) => {
      setGradingValues(prev => ({ ...prev, [questionId]: points }));
   };

   const saveGrades = async (submissionId: string) => {
      if (isSavingGrades) return;
      setIsSavingGrades(true);
      const newTotalScore = Object.values(gradingValues).reduce((a, b) => a + b, 0);
      try {
         await dbService.gradeSubmission(submissionId, newTotalScore, gradingValues, quiz!.questions);
         alert("Grades saved and published successfully!");
         const data = await dbService.getQuizSubmissions(quiz!.id);
         setSubmissions(data);
         setIsGradingMode(false);
      } catch (e) {
         alert("Failed to save grades.");
      } finally {
         setIsSavingGrades(false);
      }
   };

   if (!quiz) return <div className="p-12 text-center">{t.common.loading}</div>;

   const settings = quiz.settings || {
      time_limit_minutes: 10, max_attempts: 1, passing_score: 50,
      shuffle_questions: false, show_results_immediately: false, grading_mode: 'AUTO'
   };
   const currentTotalScore = quiz.questions.reduce((a, q) => a + q.points, 0);

   return (
      <div className="container mx-auto max-w-[1600px] px-4 lg:px-8 pb-20">
         {/* HEADER */}
         <div className="flex items-center justify-between mb-6 pt-6">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate('/quizzes')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"><ArrowLeft size={24} /></button>
               <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                     {quiz.title}
                     <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase border border-green-200">{quiz.status}</span>
                  </h1>
                  <p className="text-slate-500 text-sm mt-0.5">Created on {new Date(quiz.created_at).toLocaleDateString()}</p>
               </div>
            </div>
            <div className="flex gap-3">
               <button onClick={() => navigate(`/quiz/${quiz.id}`)} className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg font-bold border border-slate-200 transition"><PlayCircle size={18} /> Preview</button>
               <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium border border-slate-200 transition"><Share2 size={18} /> Invite</button>
               {isDirty && (
                  <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 shadow-lg transition animate-in fade-in slide-in-from-right-5"><Save size={18} /> {t.common.save}</button>
               )}
            </div>
         </div>

         {/* TABS */}
         <div className="bg-white border-b border-slate-200 sticky top-0 z-20 flex gap-8 px-6 mb-6 shadow-sm rounded-t-xl mx-1">
            {[
               { id: 'questions', label: t.quiz_manager.tabs.questions, icon: FileText },
               { id: 'invitations', label: t.quiz_manager.tabs.invitations, icon: UserPlus },
               { id: 'submissions', label: t.quiz_manager.tabs.submissions, icon: Users },
               { id: 'settings', label: t.quiz_manager.tabs.settings, icon: Settings },
               { id: 'context', label: t.quiz_manager.tabs.context, icon: BrainCircuit },
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 border-b-2 text-sm font-bold transition-colors ${activeTab === tab.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
               >
                  <tab.icon size={18} /> {tab.label}
               </button>
            ))}
         </div>

         {/* 1. QUESTIONS TAB */}
         {activeTab === 'questions' && (
            <div className="space-y-4">
               {quiz.questions.map((q, i) => {
                  const isExpanded = expandedQuestion === q.id;
                  return (
                     <div key={q.id} className={`bg-white rounded-xl border transition-all ${isExpanded ? 'border-primary-500 shadow-md ring-1 ring-primary-100' : 'border-slate-200 shadow-sm'}`}>
                        {/* Question Header */}
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 rounded-t-xl" onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}>
                           <div className="flex items-center gap-4">
                              <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm border border-slate-200">{i + 1}</span>
                              <div>
                                 <p className={`font-bold text-sm ${isExpanded ? 'text-primary-700' : 'text-slate-700'} line-clamp-1`}>{q.text}</p>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{q.type}</span>
                                    <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200">{q.points} pts</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <button
                                 type="button"
                                 onClick={(e) => { e.stopPropagation(); deleteQuestion(i); }}
                                 className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              >
                                 <Trash2 size={16} />
                              </button>
                              {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                           </div>
                        </div>

                        {/* Expanded Editor */}
                        {isExpanded && (
                           <div className="p-6 border-t border-slate-100 bg-slate-50/30 rounded-b-xl">
                              <div className="grid md:grid-cols-4 gap-6">
                                 {/* Left: Question Text & Options */}
                                 <div className="md:col-span-3 space-y-6">
                                    <div>
                                       <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Question</label>
                                       <input className="w-full text-lg font-medium text-slate-900 border border-slate-300 rounded-lg p-3 bg-white" value={q.text} onChange={(e) => updateQuestion(i, { text: e.target.value })} />
                                    </div>

                                    {/* Options Editor */}
                                    {q.options && (
                                       <div className="bg-white p-4 rounded-xl border border-slate-200">
                                          <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Choices</label>
                                          <div className="space-y-3">
                                             {q.options.map((opt, optIdx) => (
                                                <div key={optIdx} className="flex items-center gap-3">
                                                   {q.type !== QuestionType.ORDERING && (
                                                      <input
                                                         type="radio"
                                                         name={`c-${q.id}`}
                                                         checked={q.correct_answer === opt}
                                                         onChange={() => updateQuestion(i, { correct_answer: opt })}
                                                         className="w-4 h-4 cursor-pointer"
                                                      />
                                                   )}
                                                   <input
                                                      value={opt}
                                                      onChange={(e) => updateOption(i, optIdx, e.target.value)}
                                                      className="flex-1 text-sm border border-slate-200 rounded-lg py-2 px-3 text-slate-900 bg-white focus:ring-2 focus:ring-primary-200 outline-none"
                                                   />
                                                   <button onClick={() => removeOption(i, optIdx)} className="text-slate-300 hover:text-red-500"><X size={16} /></button>
                                                </div>
                                             ))}
                                             <button onClick={() => addOption(i)} className="text-sm text-primary-600 font-bold hover:underline mt-2 flex items-center gap-1"><Plus size={14} /> Add Option</button>
                                          </div>
                                       </div>
                                    )}
                                 </div>

                                 {/* Right: Type & Points */}
                                 <div className="space-y-4">
                                    <div>
                                       <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Type</label>
                                       <select value={q.type} onChange={(e) => updateQuestion(i, { type: e.target.value as QuestionType })} className="w-full text-sm font-bold bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900">
                                          {Object.values(QuestionType).map(t => <option key={t} value={t}>{t}</option>)}
                                       </select>
                                    </div>
                                    <div>
                                       <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Points</label>
                                       <input
                                          type="number"
                                          min="1"
                                          value={q.points}
                                          onChange={(e) => updateQuestion(i, { points: parseInt(e.target.value) || 1 })}
                                          className="w-full text-sm font-bold bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900"
                                       />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  );
               })}
               <button onClick={addQuestion} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-primary-500 hover:text-primary-600 font-bold bg-white flex items-center justify-center gap-2 transition"><Plus size={20} /> Add Question</button>
            </div>
         )}

         {/* 2. INVITATIONS TAB */}
         {activeTab === 'invitations' && (
            <div className="space-y-6">
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
                     <h3 className="font-bold text-slate-900 flex items-center gap-2"><Mail size={18} className="text-indigo-500" /> Invited Students</h3>
                     <button onClick={() => setShowInviteModal(true)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition">Invite New</button>
                  </div>
                  <table className="w-full">
                     <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                           <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Student Email</th>
                           <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Invited At</th>
                           <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                           <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {!quiz.invites || quiz.invites.length === 0 ? (
                           <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">No students invited yet.</td></tr>
                        ) : quiz.invites.map(inv => (
                           <tr key={inv.id} className="hover:bg-slate-50/50">
                              <td className="px-6 py-4">
                                 <button
                                    onClick={() => navigateToStudentProfile(inv.email!)}
                                    className="text-left hover:bg-slate-50 -m-2 p-2 rounded-lg transition group/student"
                                 >
                                    <p className="font-bold text-slate-900 group-hover/student:text-primary-600 transition">{inv.name || 'Pending Student'}</p>
                                    <p className="text-xs text-slate-500 group-hover/student:text-primary-500 transition">{inv.email}</p>
                                 </button>
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-sm">{new Date(inv.invited_at).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                 <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${inv.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                    inv.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                                       'bg-amber-100 text-amber-700'
                                    }`}>
                                    {inv.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 {inv.status === 'PENDING' && (
                                    <button
                                       onClick={() => handleRemoveInvite(inv.id, inv.status)}
                                       className="text-red-600 hover:text-red-800 font-bold text-sm flex items-center gap-1 ml-auto"
                                    >
                                       <Trash2 size={14} /> Remove
                                    </button>
                                 )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* 3. SUBMISSIONS TAB */}
         {activeTab === 'submissions' && (
            <div className="space-y-6">
               {groupedSubmissions.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                     <CheckCircle size={48} className="mx-auto text-slate-300 mb-4" />
                     <h3 className="text-lg font-bold text-slate-900 mb-2">No Submissions Yet</h3>
                     <p className="text-slate-500 mb-6">Detailed student results will appear here once they complete the quiz.</p>
                  </div>
               ) : (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                     <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                           <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Student</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Attempts</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Best Score</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Latest Activity</th>
                              <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {groupedSubmissions.map(group => {
                              const totalPoints = quiz.questions.reduce((a, q) => a + q.points, 0) || 1;
                              const percentage = Math.round((group.best_score / totalPoints) * 100);

                              return (
                                 <tr key={group.student_id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                       <button
                                          onClick={() => navigate(`/student/${group.student_id}`)}
                                          className="text-left hover:bg-slate-50 -m-2 p-2 rounded-lg transition group/student"
                                       >
                                          <p className="font-bold text-slate-900 group-hover/student:text-primary-600 transition">{group.student_name}</p>
                                          <p className="text-xs text-slate-500 group-hover/student:text-primary-500 transition">{group.student_email}</p>
                                       </button>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex items-center gap-2">
                                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-xs font-bold">{group.attempts} / {quiz.settings.max_attempts}</span>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex items-center gap-3">
                                          <CircleProgress percentage={percentage} />
                                          <div>
                                             <p className="font-bold text-green-600">{group.best_score} pts</p>
                                             <p className="text-[10px] text-slate-400 font-medium uppercase">of {totalPoints} pts</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                       {new Date(group.latest_submission).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <button
                                          onClick={() => setSelectedStudent({ name: group.student_name, email: group.student_email, id: group.student_id })}
                                          className="text-primary-600 hover:text-primary-800 font-bold text-sm flex items-center gap-1 ml-auto"
                                       >
                                          <Eye size={16} /> View Details
                                       </button>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               )}
            </div>
         )}

         {/* 4. SETTINGS TAB */}
         {activeTab === 'settings' && (
            <div className="space-y-6">
               <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2"><Settings size={20} className="text-slate-500" /> {t.quiz_manager.tabs.settings}</h3>

                  {/* General Information */}
                  <div className="border-b border-slate-100 pb-6 mb-6 space-y-4">
                     <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">General Information</h4>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Quiz Title</label>
                        <input
                           type="text"
                           value={quiz.title}
                           onChange={(e) => { setQuiz({ ...quiz, title: e.target.value }); setIsDirty(true); }}
                           className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-primary-200 outline-none bg-white"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                        <textarea
                           value={quiz.description}
                           onChange={(e) => { setQuiz({ ...quiz, description: e.target.value }); setIsDirty(true); }}
                           className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-primary-200 outline-none bg-white h-24 resize-none"
                        />
                     </div>
                  </div>

                  {/* Row 1: Total Score and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">{t.quiz_manager.settings.total_score}</label>
                        <div className="relative">
                           <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                           <input
                              type="number"
                              min="1"
                              value={currentTotalScore}
                              onChange={(e) => handleTotalScoreChange(parseInt(e.target.value) || 0)}
                              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-primary-200 outline-none bg-white"
                           />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Calculated from {quiz.questions.length} questions. Editing this redistributes points.</p>
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Time Limit (Minutes)</label>
                        <div className="relative">
                           <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                           <input
                              type="number"
                              min="1"
                              value={settings.time_limit_minutes}
                              onChange={(e) => {
                                 setQuiz({ ...quiz, settings: { ...settings, time_limit_minutes: parseInt(e.target.value) || 0 } });
                                 setIsDirty(true);
                              }}
                              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-primary-200 outline-none bg-white"
                           />
                        </div>
                     </div>
                  </div>

                  {/* Row 2: Attempts and Passing Score */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Max Attempts</label>
                        <input
                           type="number"
                           min="1"
                           value={settings.max_attempts}
                           onChange={(e) => {
                              setQuiz({ ...quiz, settings: { ...settings, max_attempts: parseInt(e.target.value) || 1 } });
                              setIsDirty(true);
                           }}
                           className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-primary-200 outline-none bg-white"
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Passing Score (%)</label>
                        <input
                           type="number"
                           min="1"
                           max="100"
                           value={settings.passing_score}
                           onChange={(e) => {
                              setQuiz({ ...quiz, settings: { ...settings, passing_score: parseInt(e.target.value) || 0 } });
                              setIsDirty(true);
                           }}
                           className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-primary-200 outline-none bg-white"
                        />
                     </div>
                  </div>

                  {/* Row 3: Grading Mode */}
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">{t.quiz_manager.settings.grading_mode}</label>
                     <select
                        value={settings.grading_mode || 'AUTO'}
                        onChange={(e) => {
                           setQuiz({ ...quiz, settings: { ...settings, grading_mode: e.target.value as any } });
                           setIsDirty(true);
                        }}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-primary-200 outline-none bg-white"
                     >
                        <option value="AUTO">{t.quiz_manager.settings.auto}</option>
                        <option value="MANUAL">{t.quiz_manager.settings.manual}</option>
                     </select>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                     <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition bg-white">
                        <input
                           type="checkbox"
                           checked={settings.shuffle_questions}
                           onChange={(e) => {
                              setQuiz({ ...quiz, settings: { ...settings, shuffle_questions: e.target.checked } });
                              setIsDirty(true);
                           }}
                           className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="font-medium text-slate-700">Shuffle Questions</span>
                     </label>

                     <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition bg-white">
                        <input
                           type="checkbox"
                           checked={settings.show_results_immediately}
                           onChange={(e) => {
                              setQuiz({ ...quiz, settings: { ...settings, show_results_immediately: e.target.checked } });
                              setIsDirty(true);
                           }}
                           className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="font-medium text-slate-700">Show Results Immediately</span>
                     </label>
                  </div>
               </div>

               <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                  <h3 className="font-bold text-red-800 mb-2">Danger Zone</h3>
                  <p className="text-red-600/80 text-sm mb-4">Deleting a quiz will remove all student submissions and cannot be undone.</p>
                  <button className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold hover:bg-red-50 transition text-sm">
                     Delete Quiz
                  </button>
               </div>
            </div>
         )}

         {/* 5. CONTEXT TAB */}
         {activeTab === 'context' && (
            <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 uppercase mb-2 flex items-center gap-2"><BrainCircuit size={16} /> {t.quiz_manager.context.prompt_label}</label>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-slate-700 italic leading-relaxed whitespace-pre-wrap min-h-[200px]">
                     {quiz.ai_prompt || "No custom prompt provided."}
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700 uppercase mb-2 flex items-center gap-2"><FileText size={16} /> {t.quiz_manager.context.resources_label}</label>
                  {!quiz.resources || quiz.resources.length === 0 ? (
                     <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-center text-slate-500">No resources uploaded.</div>
                  ) : (
                     <div className="space-y-3">
                        {quiz.resources.map((res, i) => (
                           <div key={i} className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0"><FileText size={20} /></div>
                              <div className="flex-1 overflow-hidden"><p className="font-bold text-slate-900 truncate">{res.name}</p></div>
                              {res.url && <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"><LinkIcon size={18} /></a>}
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* MODALS */}

         {/* Invite Modal */}
         {showInviteModal && (
            <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
                  <div className="flex items-center justify-between p-6 border-b border-slate-200">
                     <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><UserPlus className="text-primary-600" /> Invite Students</h3>
                     <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-xl m-6 mb-4">
                     <button onClick={() => setInviteMode('DIRECT')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${inviteMode === 'DIRECT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Select Students</button>
                     <button onClick={() => setInviteMode('LINK')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${inviteMode === 'LINK' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Public Link</button>
                  </div>

                  {inviteMode === 'DIRECT' ? (
                     <div className="flex-1 overflow-hidden flex flex-col px-6">
                        {/* Search Input */}
                        <div className="mb-4">
                           <input
                              type="text"
                              placeholder="🔍 Search by name or email..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full border border-slate-300 rounded-xl p-3 outline-none text-slate-900 bg-white focus:ring-2 focus:ring-primary-200"
                           />
                        </div>

                        {/* Student List (Scrollable) */}
                        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 mb-4">
                           {availableStudents.length === 0 ? (
                              <div className="p-8 text-center text-slate-500">
                                 <Users size={48} className="mx-auto mb-2 text-slate-300" />
                                 <p className="text-sm">No students found</p>
                              </div>
                           ) : (
                              <div className="divide-y divide-slate-200">
                                 {availableStudents
                                    .filter(student =>
                                       student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                       student.email.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    .map(student => (
                                       <label
                                          key={student.email}
                                          className="flex items-center gap-3 p-4 hover:bg-white cursor-pointer transition group"
                                       >
                                          <input
                                             type="checkbox"
                                             checked={selectedStudents.includes(student.email)}
                                             onChange={(e) => {
                                                if (e.target.checked) {
                                                   setSelectedStudents([...selectedStudents, student.email]);
                                                } else {
                                                   setSelectedStudents(selectedStudents.filter(email => email !== student.email));
                                                }
                                             }}
                                             className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                                          />
                                          <div className="flex-1">
                                             <p className="font-bold text-slate-900 group-hover:text-primary-600 transition">{student.full_name}</p>
                                             <p className="text-xs text-slate-500">{student.email}</p>
                                          </div>
                                       </label>
                                    ))}
                              </div>
                           )}
                        </div>

                        {/* Manual Entry (Optional) */}
                        <div className="border-t border-slate-200 pt-4 mb-4">
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Or enter emails manually:</label>
                           <textarea
                              value={inviteEmails}
                              onChange={(e) => setInviteEmails(e.target.value)}
                              className="w-full border border-slate-300 rounded-xl p-3 h-20 outline-none text-slate-900 bg-white text-sm focus:ring-2 focus:ring-primary-200"
                              placeholder="email1@example.com, email2@example.com"
                           />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center pb-6">
                           <span className="text-sm text-slate-600">
                              <strong>{selectedStudents.length}</strong> student{selectedStudents.length !== 1 ? 's' : ''} selected
                           </span>
                           <button
                              onClick={handleInvite}
                              disabled={selectedStudents.length === 0 && !inviteEmails.trim()}
                              className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              Invite {selectedStudents.length > 0 ? selectedStudents.length : ''} Student{selectedStudents.length !== 1 ? 's' : ''}
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="px-6 pb-6 space-y-6">
                        <div className="flex items-center gap-2">
                           <input readOnly value={`${window.location.href.split('#')[0]}#/share/${quiz.id}`} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-600" />
                           <button onClick={copyPublicLink} className="bg-slate-900 text-white p-3 rounded-xl"><Copy size={20} /></button>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* Grading/Detail Modal */}
         {selectedStudent && (
            <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                     <div>
                        <h3 className="text-xl font-bold text-slate-900">{selectedStudent.name}</h3>
                        <p className="text-sm text-slate-500">{selectedStudent.email}</p>
                     </div>
                     <button onClick={() => { setSelectedStudent(null); setIsGradingMode(false); }} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-4">
                     {submissions.filter(s => s.student_id === selectedStudent.id).map((sub, idx) => (
                        <div key={sub.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all ${expandedSubmissionId === sub.id ? 'border-primary-200 ring-1 ring-primary-100' : 'border-slate-200'}`}>
                           <div
                              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                              onClick={() => {
                                 setExpandedSubmissionId(expandedSubmissionId === sub.id ? null : sub.id);
                                 if (expandedSubmissionId !== sub.id) initGrading(sub);
                              }}
                           >
                              <div className="flex items-center gap-4">
                                 <span className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-sm">#{idx + 1}</span>
                                 <div>
                                    <p className="font-bold text-slate-900">Score: {sub.score} pts</p>
                                    <p className="text-xs text-slate-500">{new Date(sub.submitted_at).toLocaleString()}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 <span className={`px-2 py-1 rounded text-xs font-bold ${sub.status === 'GRADED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{sub.status}</span>
                                 {expandedSubmissionId === sub.id ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                              </div>
                           </div>

                           {expandedSubmissionId === sub.id && (
                              <div className="border-t border-slate-100 p-4 space-y-6 bg-slate-50/30">
                                 <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 mb-4">
                                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                                       <Edit2 size={18} />
                                       <span>{t.quiz_manager.submissions.manual_grading_title}</span>
                                    </div>
                                    <button
                                       onClick={() => saveGrades(sub.id)}
                                       disabled={isSavingGrades}
                                       className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition shadow-sm flex items-center gap-2"
                                    >
                                       {isSavingGrades ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                                       {isSavingGrades ? "Saving..." : t.quiz_manager.submissions.save_grades}
                                    </button>
                                 </div>

                                 {quiz.questions.map((q, qIdx) => {
                                    const studentAnswer = sub.answers[q.id];
                                    const currentScore = gradingValues[q.id] ?? 0;

                                    return (
                                       <div key={q.id} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                                          <div className="flex justify-between items-start mb-4">
                                             <div className="flex gap-3">
                                                <span className="text-xs font-bold text-slate-400 mt-1">Q{qIdx + 1}</span>
                                                <p className="text-sm font-bold text-slate-900 max-w-lg">{q.text}</p>
                                             </div>
                                             <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                                <span className="text-xs font-bold text-slate-500 uppercase">Score</span>
                                                <input
                                                   type="number"
                                                   min="0"
                                                   max={q.points}
                                                   value={currentScore}
                                                   onChange={(e) => updateGrade(q.id, Math.min(q.points, Math.max(0, parseInt(e.target.value) || 0)))}
                                                   className="w-16 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded px-1 py-0.5 focus:ring-2 focus:ring-primary-200 outline-none"
                                                />
                                                <span className="text-xs text-slate-400">/ {q.points}</span>
                                             </div>
                                          </div>

                                          <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                                             <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                                                <span className="block text-xs font-bold mb-1 text-slate-500 uppercase">Student Answer</span>
                                                <p className="font-medium text-slate-900 whitespace-pre-wrap">{String(studentAnswer || "No Answer")}</p>
                                             </div>
                                             <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                                                <span className="block text-xs font-bold mb-1 text-slate-500 uppercase">Correct Answer</span>
                                                <p className="font-medium text-slate-700 whitespace-pre-wrap">{String(q.correct_answer)}</p>
                                             </div>
                                          </div>

                                          <div className="flex gap-2 justify-end">
                                             <button onClick={() => updateGrade(q.id, q.points)} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition ${currentScore === q.points ? 'bg-green-100 text-green-700 ring-1 ring-green-300' : 'bg-slate-100 text-slate-500 hover:bg-green-50 hover:text-green-600'}`}><Check size={14} /> Correct</button>
                                             <button onClick={() => updateGrade(q.id, 0)} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition ${currentScore === 0 ? 'bg-red-100 text-red-700 ring-1 ring-red-300' : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600'}`}><XCircle size={14} /> Incorrect</button>
                                          </div>
                                       </div>
                                    );
                                 })}

                                 <div className="bg-slate-100 p-4 rounded-xl flex justify-between items-center">
                                    <span className="font-bold text-slate-700">Total Score Calculation</span>
                                    <span className="text-2xl font-black text-primary-600">
                                       {Object.values(gradingValues).reduce((a, b) => a + b, 0)} <span className="text-sm text-slate-400 font-medium">/ {currentTotalScore}</span>
                                    </span>
                                 </div>
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default QuizManager;