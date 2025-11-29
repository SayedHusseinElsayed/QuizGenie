
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole, Language } from './types';
import { TRANSLATIONS, MOCK_USER } from './constants';
import Dashboard from './pages/Dashboard';
import QuizCreator from './pages/QuizCreator';
import QuizPlayer from './pages/QuizPlayer';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import StudentsList from './pages/StudentsList';
import AdminDashboard from './pages/AdminDashboard';
import Landing from './pages/Landing';
import QuizzesList from './pages/QuizzesList';
import QuizManager from './pages/QuizManager';
import PublicQuizIntro from './pages/PublicQuizIntro';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Support from './pages/Support';
import Layout from './components/Layout';
import { dbService } from './services/dbService';
import { supabase, isSupabaseConfigured } from './services/supabase';
import { Database, Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';

// --- Contexts ---
interface AppContextType {
  user: User | null;
  login: (role: UserRole, name?: string) => void;
  logout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
}

const AppContext = createContext<AppContextType>({} as AppContextType);
export const useApp = () => useContext(AppContext);

// --- Dev Tools Component ---
const DevTools = () => {
  const [expanded, setExpanded] = useState(false);

  const toggleDbMode = () => {
    if (isSupabaseConfigured) {
      // Switch to Local
      localStorage.setItem('qura_force_dev_mode', 'true');
    } else {
      // Switch to Supabase
      localStorage.removeItem('qura_force_dev_mode');
    }
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 left-4 z-[100] font-mono text-xs">
      {expanded ? (
        <div className="bg-slate-900 text-slate-200 p-4 rounded-lg shadow-xl border border-slate-700 w-64">
          <div className="flex justify-between items-center mb-3">
            <span className={`font-bold flex items-center gap-2 ${isSupabaseConfigured ? 'text-blue-400' : 'text-green-400'}`}>
              <Database size={12} /> {isSupabaseConfigured ? 'Supabase DB' : 'Local Storage'}
            </span>
            <button onClick={() => setExpanded(false)} className="text-slate-500 hover:text-white">✕</button>
          </div>
          <p className="mb-4 text-slate-400 leading-relaxed">
            {isSupabaseConfigured
              ? "Connected to Cloud DB. If you see fetch errors, switch to Local."
              : "Dev Mode: Data saved in browser."}
          </p>

          <div className="space-y-2">
            <button
              onClick={toggleDbMode}
              className="w-full bg-slate-800 border border-slate-600 text-white px-3 py-2 rounded hover:bg-slate-700 flex items-center justify-center gap-2 transition"
            >
              {isSupabaseConfigured ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              Switch to {isSupabaseConfigured ? 'Local Mode' : 'Cloud DB'}
            </button>

            {!isSupabaseConfigured && (
              <button
                onClick={() => {
                  if (confirm("Are you sure? This will delete all quizzes and guides.")) {
                    dbService.clearAllData();
                  }
                }}
                className="w-full bg-red-900/50 border border-red-800 text-red-200 px-3 py-2 rounded hover:bg-red-900 flex items-center justify-center gap-2 transition"
              >
                <Trash2 size={12} /> Reset Data
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className={`bg-slate-900 px-3 py-1.5 rounded-full shadow-lg border border-slate-700 flex items-center gap-2 hover:bg-slate-800 transition ${isSupabaseConfigured ? 'text-blue-400' : 'text-green-400'}`}
        >
          <div className={`w-2 h-2 rounded-full animate-pulse ${isSupabaseConfigured ? 'bg-blue-500' : 'bg-green-500'}`}></div>
          {isSupabaseConfigured ? 'DB Connected' : 'Dev Mode'}
        </button>
      )}
    </div>
  );
};

// --- Main App ---
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          // Check active session
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUser({
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                role: profile.role,
                avatar_url: profile.avatar_url,
                is_verified: true
              });
            }
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
              if (profile) setUser({
                id: profile.id, email: profile.email, full_name: profile.full_name, role: profile.role, avatar_url: profile.avatar_url
              });
            } else {
              setUser(null);
            }
            setLoadingAuth(false);
          });

          setLoadingAuth(false);
          return () => subscription.unsubscribe();
        } catch (e) {
          console.error("Supabase Init Error:", e);
          setLoadingAuth(false);
        }

      } else {
        // Local Storage Fallback
        const storedUser = localStorage.getItem('qura_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            localStorage.removeItem('qura_user');
          }
        }
        setLoadingAuth(false);
      }
    };

    initAuth();
  }, []);

  // Update document direction and language when language changes
  useEffect(() => {
    const isRTL = language === Language.AR;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = isRTL ? 'ar' : 'en';
  }, [language]);

  const t = TRANSLATIONS[language];

  const login = (role: UserRole, name?: string) => {
    if (!isSupabaseConfigured) {
      const newUser = {
        ...MOCK_USER,
        role,
        id: role === UserRole.TEACHER ? 'teacher-1' : `student-${Date.now()}`,
        full_name: name || (role === UserRole.TEACHER ? 'Dr. Sarah Ahmed' : 'Student')
      } as User;

      setUser(newUser);
      localStorage.setItem('qura_user', JSON.stringify(newUser));
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      setUser(null);
      localStorage.removeItem('qura_user');
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-4">
        <Loader2 className="animate-spin text-primary-600" size={32} />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ user, login, logout, language, setLanguage, t }}>
      <HashRouter>
        <Routes>
          <Route path="/" element={!user ? <Landing /> : <Navigate to="/dashboard" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" />} />
          <Route path="/share/:id" element={<PublicQuizIntro />} />

          <Route element={<Layout />}>
            <Route path="/dashboard" element={user ? (user.role === UserRole.TEACHER ? <Dashboard /> : <StudentDashboard />) : <Navigate to="/" />} />
            <Route path="/create-quiz" element={user?.role === UserRole.TEACHER ? <QuizCreator /> : <Navigate to="/dashboard" />} />
            <Route path="/quizzes" element={user?.role === UserRole.TEACHER ? <QuizzesList /> : <Navigate to="/dashboard" />} />
            <Route path="/quiz-manager/:id" element={user?.role === UserRole.TEACHER ? <QuizManager /> : <Navigate to="/dashboard" />} />
            <Route path="/students" element={user?.role === UserRole.TEACHER ? <StudentsList /> : <Navigate to="/dashboard" />} />
            <Route path="/students" element={user?.role === UserRole.TEACHER ? <StudentsList /> : <Navigate to="/dashboard" />} />
            <Route path="/admin" element={user?.role === UserRole.OWNER ? <AdminDashboard /> : <Navigate to="/dashboard" />} />
            <Route path="/support" element={user?.role === UserRole.TEACHER ? <Support /> : <Navigate to="/dashboard" />} />
            <Route path="/quiz/:id" element={<QuizPlayer />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <DevTools />
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
