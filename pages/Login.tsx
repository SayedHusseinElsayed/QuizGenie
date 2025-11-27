
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../App';
import { authService } from '../services/authService';
import { GraduationCap, ArrowRight, Mail, Lock } from 'lucide-react';
import { UserRole } from '../types';

const Login = () => {
   const navigate = useNavigate();
   const { login, t } = useApp(); // Used to update Global Context
   const [formData, setFormData] = useState({ email: '', password: '' });
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
         const { user, error } = await authService.login(formData.email, formData.password);

         if (error) {
            setError(error);
         } else if (user) {
            // Update App Context
            // Note: The App context `login` function currently sets LocalStorage.
            // In a full Supabase app, App.tsx should listen to onAuthStateChange.
            // For now, we manually trigger the context update to keep UI in sync.
            login(user.role, user.full_name);
            navigate('/dashboard');
         }
      } catch (err) {
         setError(t.auth.login.login_failed);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-white flex flex-col md:flex-row">
         <div className="md:w-1/3 bg-primary-600 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <Link to="/" className="flex items-center gap-2 text-2xl font-bold relative z-10">
               <GraduationCap size={32} /> QuizGenie
            </Link>
            <div className="my-12 relative z-10">
               <h1 className="text-4xl font-bold mb-4">{t.auth.login.hero_title}</h1>
               <p className="text-primary-100 text-lg leading-relaxed">
                  {t.auth.login.hero_subtitle}
               </p>
            </div>
            <div className="text-sm text-primary-200 relative z-10">
               {t.auth.login.secure_login}
            </div>
         </div>

         <div className="md:w-2/3 flex items-center justify-center p-6 md:p-12 bg-slate-50">
            <div className="max-w-md w-full">
               <div className="flex justify-end mb-8">
                  <Link to="/signup" className="text-sm font-bold text-slate-500 hover:text-primary-600">
                     {t.auth.login.no_account}
                  </Link>
               </div>

               <h2 className="text-3xl font-bold text-slate-900 mb-2">{t.auth.login.title}</h2>
               <p className="text-slate-500 mb-8">{t.auth.login.subtitle}</p>

               <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">{error}</div>}

                  <div className="relative">
                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                     <input
                        type="email"
                        placeholder={t.auth.login.email}
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
                        placeholder={t.auth.login.password}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-200 outline-none transition"
                        required
                     />
                  </div>

                  <button
                     type="submit"
                     disabled={loading}
                     className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold hover:bg-primary-700 transition flex items-center justify-center gap-2 disabled:opacity-70 mt-4 shadow-lg shadow-primary-600/20"
                  >
                     {loading ? t.auth.login.logging_in : t.auth.login.login_btn} <ArrowRight size={20} />
                  </button>
               </form>
            </div>
         </div>
      </div>
   );
};

export default Login;
