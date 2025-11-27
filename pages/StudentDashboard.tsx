import React, { useEffect, useState } from 'react';
import { useApp } from '../App';
import { dbService } from '../services/dbService';
import { Quiz, Submission } from '../types';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Clock, Award, CheckCircle, History, X, Eye, ArrowLeft, Check, XCircle, User, FileText, AlertCircle, ChevronRight } from 'lucide-react';

// Component defined outside to prevent re-renders/animation resets
const CircleProgress = ({ percentage }: { percentage: number }) => {
   const size = 52;
   const strokeWidth = 4;
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
         <span className={`absolute text-[11px] font-bold ${color}`}>{Math.round(percentage)}%</span>
      </div>
   );
};

const StudentDashboard = () => {
   const { t, user } = useApp();
   const [quizzes, setQuizzes] = useState<Quiz[]>([]);
   const [submissions, setSubmissions] = useState<Submission[]>([]);

   const [historyModalOpen, setHistoryModalOpen] = useState(false);
   const [viewingQuizId, setViewingQuizId] = useState<string | null>(null);
   const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

   const navigate = useNavigate();

   useEffect(() => {
      const load = async () => {
         if (!user) return;

         const all = await dbService.getQuizzes();
         setQuizzes(all);

         const history = await dbService.getMySubmissions();
         setSubmissions(history);

         all.forEach(q => {
            const myInvite = q.invites?.find(i => i.email === user.email);
            if (myInvite && myInvite.status === 'PENDING') {
               dbService.acceptInvite(q.id, user.email);
            }
         });
      };
      load();
   }, [user]);

   const getStatus = (q: Quiz) => {
      const myInvite = q.invites?.find(i => i.email === user?.email);
      return myInvite?.status || 'PENDING';
   };

   const getMyBestScore = (quizId: string) => {
      const mySubs = submissions.filter(s => s.quiz_id === quizId && s.status === 'GRADED');
      if (mySubs.length === 0) return null;
      return Math.max(...mySubs.map(s => s.score));
   };

   const openQuizHistory = (quizId: string) => {
      setViewingQuizId(quizId);
      setSelectedSubmission(null);
      setHistoryModalOpen(true);
   };

   const currentQuizSubmissions = viewingQuizId
      ? submissions.filter(s => s.quiz_id === viewingQuizId).sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
      : [];

   const currentQuizDetails = viewingQuizId ? quizzes.find(q => q.id === viewingQuizId) : null;

   return (
      <div className="container mx-auto max-w-[1600px] px-4 lg:px-8 pt-6 pb-20">
         <div className="flex justify-between items-center mb-8">
            <div>
               <h1 className="text-2xl font-bold text-slate-900">{t.student.my_quizzes}</h1>
               <p className="text-slate-500 mt-1">Track your progress and take assigned quizzes</p>
            </div>
         </div>

         {quizzes.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                  <Clock size={40} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">No Pending Quizzes</h3>
               <p className="text-slate-500">You haven't been assigned any new quizzes yet.</p>
            </div>
         ) : (
            <div className="space-y-5">
               {quizzes.map((quiz) => {
                  const status = getStatus(quiz);
                  const isCompleted = status === 'COMPLETED';
                  const bestScore = getMyBestScore(quiz.id);
                  const attemptsUsed = submissions.filter(s => s.quiz_id === quiz.id).length;
                  const canRetake = attemptsUsed < quiz.settings.max_attempts;

                  const totalPoints = quiz.questions.reduce((acc, q) => acc + q.points, 0) || 1;
                  const percentage = bestScore !== null ? (bestScore / totalPoints) * 100 : 0;

                  return (
                     <div key={quiz.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                        <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center">

                           {/* Left: Quiz Info */}
                           <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                 <h3 className="font-bold text-xl text-slate-900 truncate group-hover:text-primary-600 transition-colors">{quiz.title}</h3>
                                 {isCompleted && <CheckCircle size={20} className="text-green-500 shrink-0" />}

                                 <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1 rounded-full">
                                    <User size={12} />
                                    <span>{quiz.teacher_name || 'Teacher'}</span>
                                 </div>
                              </div>

                              <p className="text-slate-600 mb-4 line-clamp-1 md:line-clamp-2">{quiz.description}</p>

                              {/* Metadata Badges */}
                              <div className="flex flex-wrap gap-3">
                                 <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                    <Clock size={14} className="text-slate-400" /> {quiz.settings.time_limit_minutes} min
                                 </div>
                                 <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                    <Award size={14} className="text-slate-400" /> {totalPoints} pts
                                 </div>
                                 <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                    <History size={14} className="text-slate-400" /> Attempts: <span className={attemptsUsed >= quiz.settings.max_attempts ? 'text-red-600 font-bold' : 'text-slate-900 font-bold'}>{attemptsUsed}/{quiz.settings.max_attempts}</span>
                                 </div>
                                 <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${quiz.settings.grading_mode === 'MANUAL' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                    {quiz.settings.grading_mode === 'MANUAL' ? <FileText size={14} /> : <CheckCircle size={14} />}
                                    {quiz.settings.grading_mode === 'MANUAL' ? 'Manual Grading' : 'Auto Grading'}
                                 </div>
                              </div>
                           </div>

                           {/* Right: Status & Actions */}
                           <div className="flex flex-col md:flex-row items-center gap-6 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8 w-full md:w-auto justify-between md:justify-end">

                              {/* Score Widget */}
                              <div className="flex items-center gap-4 min-w-[140px] justify-center md:justify-start">
                                 {bestScore !== null ? (
                                    <div className="flex items-center gap-3">
                                       <CircleProgress percentage={percentage} />
                                       <div className="flex flex-col">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Score</span>
                                          <span className="font-black text-slate-900 text-xl">{bestScore} <span className="text-sm font-medium text-slate-400">/ {totalPoints}</span></span>
                                       </div>
                                    </div>
                                 ) : (attemptsUsed > 0 && (
                                    <div className="flex flex-col items-center text-center">
                                       <span className="text-amber-600 font-bold text-sm mb-1">Pending Review</span>
                                       <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Waiting for Teacher</span>
                                    </div>
                                 ))}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-3 w-full md:w-auto">
                                 {isCompleted && (
                                    <button
                                       onClick={() => openQuizHistory(quiz.id)}
                                       className="flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 hover:border-primary-300 hover:text-primary-700 transition text-sm shadow-sm whitespace-nowrap"
                                    >
                                       <Eye size={18} /> Results
                                    </button>
                                 )}

                                 {(!isCompleted || canRetake) && (
                                    <button
                                       onClick={() => navigate(`/quiz/${quiz.id}`)}
                                       className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition text-sm shadow-lg whitespace-nowrap ${isCompleted
                                             ? 'bg-slate-100 text-primary-600 border border-primary-200 hover:bg-primary-50 shadow-none'
                                             : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/20'
                                          }`}
                                    >
                                       {isCompleted ? <><History size={18} /> Retake Quiz</> : <><PlayCircle size={18} /> Start Quiz</>}
                                    </button>
                                 )}

                                 {!canRetake && isCompleted && (
                                    <div className="px-4 py-2.5 bg-slate-100 text-slate-400 rounded-xl font-bold text-sm border border-slate-200 flex items-center gap-2 cursor-not-allowed">
                                       <XCircle size={16} /> Max Attempts
                                    </div>
                                 )}
                              </div>
                           </div>

                        </div>
                     </div>
                  );
               })}
            </div>
         )}

         {/* HISTORY & RESULTS MODAL */}
         {historyModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                  {/* Modal Header */}
                  <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                     <div className="flex items-center gap-4">
                        {selectedSubmission ? (
                           <button onClick={() => setSelectedSubmission(null)} className="p-2 hover:bg-white rounded-full transition shadow-sm border border-transparent hover:border-slate-200 text-slate-500">
                              <ArrowLeft size={20} />
                           </button>
                        ) : (
                           <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600"><History size={22} /></div>
                        )}
                        <div>
                           <h2 className="text-xl font-bold text-slate-900">{selectedSubmission ? "Submission Details" : currentQuizDetails?.title}</h2>
                           {!selectedSubmission && <p className="text-sm text-slate-500 font-medium">{currentQuizSubmissions.length} Attempts History</p>}
                        </div>
                     </div>
                     <button onClick={() => setHistoryModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"><X size={24} /></button>
                  </div>

                  <div className="overflow-y-auto p-0 flex-1 bg-slate-50/50">
                     {!selectedSubmission ? (
                        // LAYER 1: LIST OF ATTEMPTS
                        <div className="p-6">
                           {currentQuizSubmissions.length === 0 ? (
                              <div className="text-center py-12 text-slate-500">No attempts recorded yet.</div>
                           ) : (
                              <div className="space-y-3">
                                 {currentQuizSubmissions.map((sub, idx) => (
                                    <div key={sub.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-primary-300 hover:shadow-md transition flex items-center justify-between group cursor-pointer" onClick={() => setSelectedSubmission(sub)}>
                                       <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-sm">
                                             #{currentQuizSubmissions.length - idx}
                                          </div>
                                          <div>
                                             <p className="font-bold text-slate-900 text-lg">
                                                {sub.status === 'GRADED' ? `${sub.score} pts` : 'Pending'}
                                             </p>
                                             <p className="text-xs text-slate-500 font-medium">{new Date(sub.submitted_at).toLocaleString()}</p>
                                          </div>
                                       </div>

                                       <div className="flex items-center gap-4">
                                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.status === 'GRADED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                             {sub.status === 'GRADED' ? 'Graded' : 'In Review'}
                                          </span>
                                          <ChevronRight size={20} className="text-slate-300 group-hover:text-primary-500 transition" />
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     ) : (
                        // LAYER 2: SUBMISSION DETAILS
                        <div className="p-6 space-y-6">
                           {/* Summary Card */}
                           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                              <div>
                                 <p className="text-slate-500 text-sm font-bold uppercase mb-1">Attempt Date</p>
                                 <p className="font-medium text-slate-900">{new Date(selectedSubmission.submitted_at).toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-slate-500 text-sm font-bold uppercase mb-1">Score</p>
                                 <p className="text-3xl font-black text-primary-600">{selectedSubmission.score}</p>
                              </div>
                           </div>

                           {selectedSubmission.status === 'PENDING_REVIEW' ? (
                              <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                                 <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4"><Clock size={32} /></div>
                                 <h3 className="text-lg font-bold text-slate-900">Results Hidden</h3>
                                 <p className="text-slate-500 mt-2 max-w-md mx-auto">This attempt is pending manual grading or the teacher has disabled immediate results.</p>
                              </div>
                           ) : (
                              <div className="space-y-4">
                                 {currentQuizDetails?.questions.map((q, idx) => {
                                    const studentAns = selectedSubmission.answers[q.id];

                                    // Grading Check
                                    let awardedPoints = 0;
                                    let isCorrect = false;
                                    let isManual = false;

                                    // Check if grading_details exists and is an array
                                    if (selectedSubmission.grading_details && Array.isArray(selectedSubmission.grading_details)) {
                                       const gradingDetail = selectedSubmission.grading_details.find(gd => gd.question_id === q.id);
                                       if (gradingDetail) {
                                          awardedPoints = gradingDetail.points_awarded;
                                          isCorrect = awardedPoints === q.points;
                                          isManual = true;
                                       }
                                    } else {
                                       isCorrect = String(studentAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();
                                       awardedPoints = isCorrect ? q.points : 0;
                                    }

                                    // Answer Display Logic: Check for existence, including 0 or false
                                    const displayAnswer = (studentAns !== undefined && studentAns !== null && studentAns !== '') ? String(studentAns) : "No Answer";

                                    return (
                                       <div key={q.id} className={`bg-white p-6 rounded-2xl border shadow-sm transition-all ${isCorrect ? 'border-slate-200' : 'border-red-100 ring-1 ring-red-50'}`}>
                                          <div className="flex justify-between items-start mb-4">
                                             <div className="flex gap-4">
                                                <span className="flex-shrink-0 w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center text-sm font-bold mt-0.5">{idx + 1}</span>
                                                <div>
                                                   <p className="font-bold text-slate-900 text-lg">{q.text}</p>
                                                   <span className="text-xs font-medium text-slate-400 uppercase">{q.type}</span>
                                                </div>
                                             </div>
                                             <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${isCorrect ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                {isCorrect ? <Check size={14} /> : <XCircle size={14} />}
                                                {awardedPoints} / {q.points} pts
                                             </span>
                                          </div>

                                          <div className="grid md:grid-cols-2 gap-4 ml-12">
                                             <div className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                                                <span className={`text-[10px] uppercase font-bold mb-2 block ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>Your Answer</span>
                                                <p className="font-bold text-slate-900">{displayAnswer}</p>
                                             </div>

                                             {!isCorrect && q.correct_answer && (
                                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80">
                                                   <span className="text-[10px] uppercase font-bold mb-2 block text-slate-500">Correct Answer</span>
                                                   <p className="font-bold text-slate-700">{String(q.correct_answer)}</p>
                                                </div>
                                             )}

                                             {isManual && !isCorrect && (
                                                <div className="md:col-span-2 text-xs text-amber-600 font-medium flex items-center gap-1.5 bg-amber-50 p-2 rounded-lg border border-amber-100 w-fit">
                                                   <AlertCircle size={14} /> Teacher marked this as incorrect.
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    );
                                 })}
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default StudentDashboard;