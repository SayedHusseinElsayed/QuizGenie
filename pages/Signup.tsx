import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { UserRole } from '../types';
import { useApp } from '../App';
import { GraduationCap, ArrowRight, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { t } = useApp();
  const [role, setRole] = useState<UserRole>(UserRole.TEACHER);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (role === UserRole.TEACHER) {
        result = await authService.signUpTeacher(formData.email, formData.password, formData.fullName);
      } else {
        result = await authService.signUpStudent(formData.email, formData.password, formData.fullName);
      }

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || t.auth.signup.signup_failed);
      }
    } catch (err) {
      setError(t.auth.signup.unexpected_error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-slate-200">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.auth.signup.check_email_title}</h2>
          <p className="text-slate-600 mb-6">
            {t.auth.signup.check_email_message} <strong>{formData.email}</strong>.
            {t.auth.signup.check_email_instruction}
          </p>
          <Link to="/login" className="block w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition">
            {t.auth.signup.go_to_login}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Left Brand Panel */}
      <div className="md:w-1/3 bg-slate-900 text-white p-8 md:p-12 flex flex-col justify-between">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <GraduationCap size={32} /> QuizGenie
        </div>
        <div className="my-12">
          <h1 className="text-4xl font-bold mb-6">{t.auth.signup.hero_title}</h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-8">
            {t.auth.signup.hero_subtitle}
          </p>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900"></div>
              ))}
            </div>
            <p>{t.auth.signup.trusted_by}</p>
          </div>
        </div>
        <div className="text-sm text-slate-500">
          © 2024 QuizGenie Inc.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="md:w-2/3 flex items-center justify-center p-6 md:p-12 bg-slate-50">
        <div className="max-w-md w-full">
          <div className="flex justify-end mb-8">
            <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-slate-900">
              {t.auth.signup.already_have_account}
            </Link>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2">{t.auth.signup.title}</h2>
          <p className="text-slate-500 mb-8">{t.auth.signup.subtitle}</p>

          {/* Role Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex mb-8">
            <button
              type="button"
              onClick={() => setRole(UserRole.TEACHER)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${role === UserRole.TEACHER ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <GraduationCap size={18} /> {t.auth.signup.teacher}
            </button>
            <button
              type="button"
              onClick={() => setRole(UserRole.STUDENT)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${role === UserRole.STUDENT ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <User size={18} /> {t.auth.signup.student}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder={t.auth.signup.full_name}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-200 outline-none transition"
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                placeholder={t.auth.signup.email}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-200 outline-none transition"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                placeholder={t.auth.signup.password}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-200 outline-none transition"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-70 mt-4 shadow-xl shadow-slate-900/10"
            >
              {loading ? t.auth.signup.creating : t.auth.signup.sign_up_btn} <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;