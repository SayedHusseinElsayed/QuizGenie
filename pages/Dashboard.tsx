
import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../App';
import { dbService } from '../services/dbService';
import { Quiz, Submission } from '../types';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import {
  Users, FileText, Clock, CheckCircle, TrendingUp, TrendingDown,
  MoreHorizontal, Calendar, ArrowRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Dashboard = () => {
  const { t, user } = useApp();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadData = async () => {
      const data = await dbService.getQuizzes();
      setQuizzes(data);

      // Load all submissions from all quizzes
      const submissions: Submission[] = [];
      for (const quiz of data) {
        const quizSubs = await dbService.getQuizSubmissions(quiz.id);
        submissions.push(...quizSubs);
      }
      setAllSubmissions(submissions);
    };
    loadData();
  }, [user, location]); // Reload when location changes

  // Calculate real statistics
  const stats = useMemo(() => {
    // Count unique students
    const uniqueStudents = new Set(allSubmissions.map(s => s.student_id)).size;

    // Count pending reviews (submissions with MANUAL grading that are SUBMITTED)
    const pendingReviews = allSubmissions.filter(s => s.status === 'SUBMITTED').length;

    // Calculate average score
    const totalScore = allSubmissions.reduce((sum, s) => sum + s.score, 0);
    const avgScore = allSubmissions.length > 0
      ? Math.round((totalScore / allSubmissions.length))
      : 0;

    // Calculate total possible score for average percentage
    const totalPossible = allSubmissions.reduce((sum, s) => {
      const quiz = quizzes.find(q => q.id === s.quiz_id);
      const maxScore = quiz?.questions.reduce((a, q) => a + q.points, 0) || 100;
      return sum + maxScore;
    }, 0);

    const avgPercentage = totalPossible > 0
      ? Math.round((totalScore / totalPossible) * 100)
      : 0;

    return [
      {
        label: t.dashboard.total_students,
        value: uniqueStudents.toString(),
        icon: Users,
        color: "bg-blue-500",
        trend: uniqueStudents > 0 ? `${uniqueStudents} active` : "0",
        trendUp: true,
        description: "unique students"
      },
      {
        label: t.dashboard.active_quizzes,
        value: quizzes.length.toString(),
        icon: FileText,
        color: "bg-indigo-500",
        trend: quizzes.length > 0 ? `${quizzes.length} total` : "0",
        trendUp: true,
        description: "created quizzes"
      },
      {
        label: t.dashboard.pending_review,
        value: pendingReviews.toString(),
        icon: Clock,
        color: "bg-amber-500",
        trend: pendingReviews > 0 ? "needs grading" : "all graded",
        trendUp: false,
        description: "submissions"
      },
      {
        label: "Avg. Score",
        value: `${avgPercentage}%`,
        icon: CheckCircle,
        color: "bg-emerald-500",
        trend: `${avgScore} pts avg`,
        trendUp: avgPercentage >= 70,
        description: "across all quizzes"
      }
    ];
  }, [quizzes, allSubmissions, t]);

  const performanceData = [
    { name: 'Week 1', score: 65, avg: 60 },
    { name: 'Week 2', score: 78, avg: 65 },
    { name: 'Week 3', score: 82, avg: 70 },
    { name: 'Week 4', score: 75, avg: 72 },
    { name: 'Week 5', score: 85, avg: 75 },
    { name: 'Week 6', score: 88, avg: 78 },
  ];

  const distributionData = [
    { name: 'Excellent (>90%)', value: 30, color: '#10b981' },
    { name: 'Good (70-90%)', value: 45, color: '#6366f1' },
    { name: 'Average (50-70%)', value: 15, color: '#f59e0b' },
    { name: 'Needs Help (<50%)', value: 10, color: '#ef4444' },
  ];

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto max-w-[1600px] px-4 lg:px-8 space-y-8 pt-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {t.dashboard.welcome} {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            <Calendar size={16} />
            {getCurrentDate()}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/create-quiz')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2"
          >
            <span>+</span> {t.dashboard.create_quiz}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.color} bg-opacity-10 p-3 rounded-xl text-opacity-100`}>
                <stat.icon size={24} className={stat.color.replace('bg-', 'text-')} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${stat.trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                {stat.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stat.trend}
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
              <p className="text-xs text-slate-400 mt-2">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Class Performance Overview</h2>
              <p className="text-sm text-slate-500">Average scores over the last 6 weeks</p>
            </div>
            <select className="bg-slate-50 border-none text-sm font-medium text-slate-600 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-100 transition">
              <option>Last 6 Weeks</option>
              <option>Last Semester</option>
              <option>All Time</option>
            </select>
          </div>
          <div style={{ width: '100%', height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
                <Area
                  type="monotone"
                  dataKey="avg"
                  stroke="#cbd5e1"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Score Distribution</h2>
          <p className="text-sm text-slate-500 mb-6">Student performance breakdown</p>

          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-900">124</span>
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wide">Students</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {distributionData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-slate-600 font-medium truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Quizzes Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t.dashboard.active_quizzes}</h2>
            <p className="text-sm text-slate-500">Manage your recent assessments</p>
          </div>
          <button
            onClick={() => navigate('/quizzes')}
            className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
          >
            View All <ArrowRight size={16} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-4 ps-4">Quiz Title</th>
                <th className="pb-4">Questions</th>
                <th className="pb-4">Created</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right pe-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {quizzes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FileText size={48} className="mb-3 opacity-20" />
                      <p className="font-medium">No quizzes found</p>
                      <button
                        onClick={() => navigate('/create-quiz')}
                        className="mt-3 text-primary-600 hover:underline"
                      >
                        Create your first quiz
                      </button>
                    </div>
                  </td>
                </tr>
              ) : quizzes.slice(0, 5).map((q) => (
                <tr key={q.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition group">
                  <td className="py-4 ps-4">
                    <div className="font-semibold text-slate-900">{q.title}</div>
                    <div className="text-xs text-slate-500">{q.description || 'No description'}</div>
                  </td>
                  <td className="py-4 text-slate-600">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                      {q.questions.length} Qs
                    </span>
                  </td>
                  <td className="py-4 text-slate-500">
                    {new Date(q.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${q.status === 'PUBLISHED'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${q.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}></span>
                      {q.status}
                    </span>
                  </td>
                  <td className="py-4 text-right pe-4">
                    <button
                      onClick={() => navigate(`/quiz-manager/${q.id}`)}
                      className="text-slate-400 hover:text-primary-600 transition-colors p-2 hover:bg-primary-50 rounded-lg"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
