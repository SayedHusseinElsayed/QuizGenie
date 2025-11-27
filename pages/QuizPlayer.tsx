

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { Quiz, QuestionType, NotificationType } from '../types';
import { CheckCircle, AlertCircle, Timer, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Calculator, Lock, RefreshCw } from 'lucide-react';
import { useApp } from '../App';

const QuizPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [loading, setLoading] = useState(true);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [canTake, setCanTake] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const quizzes = await dbService.getQuizzes();
      const found = quizzes.find(q => q.id === id);

      if (found) {
        // Check attempts first
        const used = await dbService.getStudentAttempts(found.id);
        setAttemptsUsed(used);

        // Handle Randomization if enabled
        if (found.settings.shuffle_questions) {
          // Fisher-Yates Shuffle
          for (let i = found.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [found.questions[i], found.questions[j]] = [found.questions[j], found.questions[i]];
          }
        }

        setQuiz(found);

        if (used < found.settings.max_attempts) {
          setCanTake(true);
          setTimeLeft(found.settings.time_limit_minutes * 60);

          // Initialize Ordering
          const initialAnswers: any = {};
          found.questions.forEach(q => {
            if (q.type === QuestionType.ORDERING && q.options) {
              initialAnswers[q.id] = [...q.options];
            }
          });
          setAnswers(initialAnswers);
        } else {
          setCanTake(false);
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (canTake && timeLeft > 0 && !submitted) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (canTake && timeLeft === 0 && !submitted && quiz) {
      handleSubmit();
    }
  }, [timeLeft, submitted, quiz, canTake]);

  const handleAnswer = (val: any) => {
    if (!quiz) return;
    const qId = quiz.questions[currentIdx].id;
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const moveItem = (arr: string[], from: number, to: number) => {
    const newArr = [...arr];
    const [removed] = newArr.splice(from, 1);
    newArr.splice(to, 0, removed);
    return newArr;
  };

  // SCORING LOGIC
  const calculateScore = () => {
    if (!quiz) return 0;
    let total = 0;
    quiz.questions.forEach(q => {
      const ans = answers[q.id];
      if (!ans) return;

      if (q.type === QuestionType.ORDERING) {
        const ansString = Array.isArray(ans) ? ans.join(', ') : ans;
        if (ansString === q.correct_answer) total += q.points;
      } else if (q.type === QuestionType.ESSAY) {
        // Manual grading required
      } else if (q.type === QuestionType.NUMERICAL) {
        if (parseFloat(ans) === parseFloat(q.correct_answer as string)) {
          total += q.points;
        }
      } else if (q.type === QuestionType.MATCHING) {
        // Parse correct answer JSON and compare with student's matches
        try {
          const correctMatches = typeof q.correct_answer === 'string'
            ? JSON.parse(q.correct_answer)
            : q.correct_answer;

          // Check if all matches are correct
          let allCorrect = true;
          for (const [item, correctChoice] of Object.entries(correctMatches)) {
            if (ans[item] !== correctChoice) {
              allCorrect = false;
              break;
            }
          }

          if (allCorrect && Object.keys(ans).length === Object.keys(correctMatches).length) {
            total += q.points;
          }
        } catch (e) {
          console.error('Error parsing matching answer:', e);
        }
      } else {
        // Case-insensitive string comparison for standard types
        const normalizedAns = String(ans).trim().toLowerCase();
        const normalizedCorrect = String(q.correct_answer).trim().toLowerCase();

        if (normalizedAns === normalizedCorrect) {
          total += q.points;
        }
      }
    });
    return total;
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const s = calculateScore();
    setScore(s);
    setSubmitted(true);
    // Increase local attempt count to show correct UI state immediately
    setAttemptsUsed(prev => prev + 1);
    await dbService.submitQuiz(quiz.id, answers, s, quiz.questions);

    // Create notification for teacher
    try {
      if (user && quiz.teacher_id) {
        await dbService.createNotification({
          user_id: quiz.teacher_id,
          type: NotificationType.QUIZ_SUBMISSION,
          title: 'New Quiz Submission',
          message: `${user.full_name} submitted "${quiz.title}"`,
          quiz_id: quiz.id,
          related_user_name: user.full_name,
          is_read: false
        });
      }
    } catch (e) {
      console.error('Failed to create notification:', e);
      // Don't block submission if notification fails
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Checking quiz availability...</div>;
  if (!quiz) return <div className="p-12 text-center text-red-500">Quiz not found or not available.</div>;

  // Blocked View
  if (!canTake && !submitted) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
          <Lock size={40} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Maximum Attempts Reached</h1>
        <p className="text-slate-600 mb-6">
          You have already taken this quiz {attemptsUsed} times.
        </p>
        <button onClick={() => navigate('/dashboard')} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Submitted View
  if (submitted) {
    // Determine if we should show score
    // Show score ONLY if grading is AUTO AND Show Results Immediately is TRUE
    const showResults = quiz.settings.grading_mode === 'AUTO' && quiz.settings.show_results_immediately;
    const canRetake = attemptsUsed < quiz.settings.max_attempts;

    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
          <CheckCircle size={48} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Quiz Submitted!</h1>
        <p className="text-slate-600 mb-8">Your answers have been recorded successfully.</p>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-8">
          {!showResults ? (
            <div className="text-center">
              <p className="text-sm text-slate-500 uppercase font-bold">Status</p>
              <p className="text-xl font-bold text-amber-600 mt-2">Pending Review</p>
              <p className="text-xs text-slate-400 mt-2">
                {quiz.settings.grading_mode === 'MANUAL'
                  ? 'Your teacher will grade your answers.'
                  : 'Results are hidden until released by your teacher.'}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 uppercase font-bold">Your Score</p>
              <p className="text-5xl font-bold text-primary-600 mt-2">{score} / {quiz.questions.reduce((acc, q) => acc + q.points, 0)}</p>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate('/dashboard')} className="bg-slate-100 text-slate-700 px-8 py-3 rounded-xl font-medium hover:bg-slate-200 transition">
            Return to Dashboard
          </button>
          {canRetake && (
            <button onClick={() => window.location.reload()} className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 shadow-lg flex items-center justify-center gap-2 transition">
              <RefreshCw size={18} /> Take Quiz Again
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentIdx];

  // Helper function to render different input types
  const renderQuestionInput = () => {
    switch (currentQ.type) {
      case QuestionType.ORDERING:
        const currentOrder = answers[currentQ.id] || currentQ.options || [];
        return (
          <div className="space-y-2">
            <p className="text-sm text-slate-500 mb-2">Reorder the items below:</p>
            {currentOrder.map((item: string, idx: number) => (
              <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 text-slate-900 shadow-sm">
                <div className="flex flex-col gap-1">
                  <button disabled={idx === 0} onClick={() => handleAnswer(moveItem(currentOrder, idx, idx - 1))} className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button disabled={idx === currentOrder.length - 1} onClick={() => handleAnswer(moveItem(currentOrder, idx, idx + 1))} className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded disabled:opacity-30"><ArrowDown size={14} /></button>
                </div>
                <span className="font-medium text-slate-900">{item}</span>
              </div>
            ))}
          </div>
        );
      case QuestionType.MATCHING:
        const items = currentQ.options?.filter((_, i) => i % 2 === 0) || [];
        const choices = currentQ.options?.filter((_, i) => i % 2 === 1) || [];
        const currentMatches = answers[currentQ.id] || {};

        const handleDragStart = (e: React.DragEvent, choice: string) => {
          e.dataTransfer.setData('text/plain', choice);
          e.dataTransfer.effectAllowed = 'move';
        };

        const handleDragOver = (e: React.DragEvent) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        };

        const handleDrop = (e: React.DragEvent, item: string) => {
          e.preventDefault();
          const choice = e.dataTransfer.getData('text/plain');
          const newMatches = { ...currentMatches, [item]: choice };
          handleAnswer(newMatches);
        };

        const handleRemoveMatch = (item: string) => {
          const newMatches = { ...currentMatches };
          delete newMatches[item];
          handleAnswer(newMatches);
        };

        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-3">Drag choices from the right to match with items on the left:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left Column - Items */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Items</p>
                {items.map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-slate-900 font-medium">
                    {item}
                  </div>
                ))}
              </div>

              {/* Middle Column - Drop Zones */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Your Answers</p>
                {items.map((item, i) => (
                  <div
                    key={i}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, item)}
                    className="p-3 rounded-lg border-2 border-dashed border-slate-300 bg-white min-h-[48px] flex items-center justify-between hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
                  >
                    {currentMatches[item] ? (
                      <>
                        <span className="text-slate-900 font-medium">{currentMatches[item]}</span>
                        <button
                          onClick={() => handleRemoveMatch(item)}
                          className="text-red-500 hover:text-red-700 text-xs ml-2"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <span className="text-slate-400 text-sm w-full text-center">Drop here</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Right Column - Draggable Choices */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Choices</p>
                {choices
                  .filter(choice => !Object.values(currentMatches).includes(choice)) // Hide used choices
                  .map((choice, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={(e) => handleDragStart(e, choice)}
                      className="p-3 rounded-lg bg-white border border-slate-300 text-slate-900 font-medium cursor-move hover:bg-slate-50 hover:border-primary-400 transition-all active:opacity-50"
                    >
                      {choice}
                    </div>
                  ))}
                {choices.filter(choice => !Object.values(currentMatches).includes(choice)).length === 0 && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm text-center">
                    ✓ All choices used
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Drag choices from the right column and drop them into the answer boxes in the middle.
              </p>
            </div>
          </div>
        );
      case QuestionType.ESSAY:
        return <textarea value={answers[currentQ.id] || ''} onChange={(e) => handleAnswer(e.target.value)} placeholder="Type answer..." className="w-full border border-slate-300 rounded-xl p-4 min-h-[150px] bg-white text-slate-900" />;
      case QuestionType.NUMERICAL:
        return (
          <div className="relative">
            <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="number" value={answers[currentQ.id] || ''} onChange={(e) => handleAnswer(e.target.value)} placeholder="Enter number..." className="w-full border border-slate-300 rounded-xl py-4 pl-12 pr-4 bg-white text-slate-900" />
          </div>
        );
      default:
        let displayOptions = currentQ.options;
        if (currentQ.type === QuestionType.TRUE_FALSE && (!displayOptions || displayOptions.length === 0)) displayOptions = ["True", "False"];

        if (displayOptions && displayOptions.length > 0) {
          return (
            <div className="space-y-3">
              {displayOptions.map((opt, i) => {
                const isSelected = answers[currentQ.id] === opt;
                return (
                  <button key={i} onClick={() => handleAnswer(opt)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-primary-600 bg-primary-50 text-primary-700 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-primary-600' : 'border-slate-300'}`}>{isSelected && <div className="w-3 h-3 bg-primary-600 rounded-full" />}</div>
                      {currentQ.option_visuals && currentQ.option_visuals[i] ? <div className="flex items-center gap-3"><div className="w-12 h-12 svg-icon" dangerouslySetInnerHTML={{ __html: currentQ.option_visuals[i] }} /><span>{opt}</span></div> : <span>{opt}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        }
        return <input type="text" value={answers[currentQ.id] || ''} onChange={(e) => handleAnswer(e.target.value)} placeholder="Type answer..." className="w-full border border-slate-300 rounded-xl p-4 bg-white text-slate-900" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 pt-6 px-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between mb-8 sticky top-4 z-10">
        <div><h2 className="font-bold text-slate-900">{quiz.title}</h2><p className="text-xs text-slate-500">Q {currentIdx + 1} of {quiz.questions.length}</p></div>
        <div className={`flex items-center gap-2 font-mono font-bold text-lg ${timeLeft < 60 ? 'text-red-500' : 'text-slate-700'}`}><Timer size={20} /><span>{formatTime(timeLeft)}</span></div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
        <div className="flex-1">
          <span className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded mb-4">{currentQ.type}</span>
          {currentQ.svg_content && <div className="mb-6 flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-100"><div className="w-full max-w-md h-auto svg-container" dangerouslySetInnerHTML={{ __html: currentQ.svg_content }} /></div>}
          {!currentQ.svg_content && currentQ.media_url && <div className="mb-6 rounded-xl border border-slate-100 overflow-hidden bg-slate-50 flex justify-center"><img src={currentQ.media_url} alt="Visual" className="max-h-[300px] object-contain" /></div>}
          <h3 className="text-xl font-medium text-slate-900 mb-6 leading-relaxed">{currentQ.text}</h3>
          {renderQuestionInput()}
        </div>
        <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
          <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} className="flex items-center gap-2 text-slate-500 font-medium hover:text-slate-900 disabled:opacity-30"><ArrowLeft size={20} /> Previous</button>
          {currentIdx === quiz.questions.length - 1 ? <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg">Submit Quiz</button> : <button onClick={() => setCurrentIdx(Math.min(quiz.questions.length - 1, currentIdx + 1))} className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-700 shadow-lg">Next <ArrowRight size={20} /></button>}
        </div>
      </div>
    </div>
  );
};

export default QuizPlayer;
