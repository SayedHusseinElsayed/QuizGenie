
import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useApp } from '../App';
import { LayoutDashboard, PlusCircle, BookOpen, LogOut, GraduationCap, Globe, Menu, X, List, ChevronDown, Users, PlayCircle, Shield } from 'lucide-react';
import { UserRole, Language } from '../types';
import NotificationBell from './NotificationBell';

const Layout = () => {
  const { user, logout, language, setLanguage, t } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);

  const toggleLang = () => {
    setLanguage(language === Language.EN ? Language.AR : Language.EN);
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
      to={to}
      onClick={() => setIsMobileMenuOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
          ? 'bg-primary-50 text-primary-600 font-medium'
          : 'text-slate-600 hover:bg-slate-50'
        }`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );

  const getAvatar = () => {
    if (user?.role === UserRole.TEACHER) {
      return '/teacher-avatar.png';
    }
    return '/student-avatar.png';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 z-50 w-64 bg-white border-e border-slate-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : (language === Language.AR ? 'translate-x-full' : '-translate-x-full')
        }`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-600 font-bold text-xl">
              <GraduationCap size={28} />
              <span>QuizGenie</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <NavItem to="/dashboard" icon={LayoutDashboard} label={t.dashboard.stats} />

            {user?.role === UserRole.TEACHER && (
              <>
                <NavItem to="/create-quiz" icon={PlusCircle} label={t.dashboard.create_quiz} />
                <NavItem to="/quizzes" icon={List} label={t.quizzes_list.title} />
                <NavItem to="/students" icon={Users} label={t.dashboard.students} />
              </>
            )}
            {user?.role === UserRole.OWNER && (
              <NavItem to="/admin" icon={Shield} label="Admin Dashboard" />
            )}
            {user?.role === UserRole.STUDENT && (
              <NavItem to="/dashboard" icon={BookOpen} label={t.dashboard.my_quizzes} />
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 py-3 px-6 flex items-center justify-between shadow-sm z-10">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-600">
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4 ms-auto">
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-full border border-slate-200 transition-all"
            >
              <Globe size={16} />
              <span>{t.common.language_toggle}</span>
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-full transition-colors border border-transparent hover:border-slate-100"
              >
                <img
                  src={getAvatar()}
                  alt="Avatar"
                  className="w-9 h-9 rounded-full bg-slate-200 object-cover border border-slate-200"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-900 leading-none">{user?.full_name}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-none">{user?.role}</p>
                </div>
                <ChevronDown size={16} className="text-slate-400 hidden md:block" />
              </button>

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsProfileOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                    <div className="px-4 py-3 border-b border-slate-50 md:hidden">
                      <span className="text-sm font-medium">{language === Language.AR ? 'العربية' : 'English'}</span>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    {user?.role === UserRole.TEACHER && (
                      <>
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            setShowQuickGuide(true);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <PlayCircle size={16} />
                          <span>Quick Guide</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            window.location.hash = '#/support';
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors border-t border-slate-50"
                        >
                          <Users size={16} />
                          <span>Support</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-50"
                    >
                      <LogOut size={16} />
                      <span>{language === Language.EN ? 'Logout' : 'تسجيل خروج'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Quick Guide Video Modal */}
      {showQuickGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PlayCircle className="text-primary-600" size={20} />
                Quick Guide - How to Use QuizGenie
              </h3>
              <button
                onClick={() => setShowQuickGuide(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={24} />
              </button>
            </div>
            <div className="relative bg-black" style={{ paddingBottom: '56.25%' }}>
              <video
                className="absolute inset-0 w-full h-full"
                controls
                autoPlay
                src="/Demo/quickguide.mp4"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Watch this quick guide to learn how to create quizzes, invite students, and manage submissions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
