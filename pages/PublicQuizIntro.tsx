

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { Quiz, UserRole } from '../types';
import { useApp } from '../App';
import { GraduationCap, Clock, HelpCircle, ArrowRight, BookOpen } from 'lucide-react';

const PublicQuizIntro = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { login } = useApp();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');

  useEffect(() => {
    const loadQuiz = async () => {
      const quizzes = await dbService.getQuizzes();
      const found = quizzes.find(q => q.id === id);
      setQuiz(found || null);
      setLoading(false);
    };
    loadQuiz();
  }, [id]);

  const handleStart = () => {
    if (!name.trim()) return;
    login(UserRole.STUDENT, name);
    navigate(`/quiz/${id}`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading quiz details...</div>;
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-500 p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Quiz Not Found</h1>
        <p>This link might be invalid or the quiz has been removed.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-primary-600 font-bold hover:underline">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30 text-white">
            <BookOpen size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{quiz.title}</h1>
          <div className="flex items-center justify-center gap-4 text-slate-400 text-sm">
            <span className="flex items-center gap-1"><Clock size={14} /> {quiz.settings.time_limit_minutes} mins</span>
            <span className="flex items-center gap-1"><HelpCircle size={14} /> {quiz.questions.length} questions</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-slate-600 text-center mb-8 leading-relaxed">
            {quiz.description || "You have been invited to take this quiz. Please enter your full name below to begin."}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Your Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-primary-500 outline-none font-medium text-lg text-slate-900 bg-white"
                autoFocus
              />
            </div>

            <button
              onClick={handleStart}
              disabled={!name.trim()}
              className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Start Quiz <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">Powered by QuizGenie AI LMS</p>
        </div>
      </div>
    </div>
  );
};

export default PublicQuizIntro;
