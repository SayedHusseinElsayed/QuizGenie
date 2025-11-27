

import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { UserRole, Language } from '../types';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, CheckCircle, Sparkles, Zap, ArrowRight,
  X, Menu, Brain, FileText, BarChart3, Users, Check, XCircle, Mail, Twitter, Linkedin,
  Languages, ShieldCheck, Quote, Star, Play
} from 'lucide-react';
import InteractiveNetworkBackground from '../components/InteractiveNetworkBackground';
import PaymentModal from '../components/PaymentModal';

const Landing = () => {
  const { t, setLanguage, language } = useApp();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const [scrolled, setScrolled] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'school'>('pro');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Contact Form Submitted:', {
        to: 'sayed.hussein.elsayed@gmail.com',
        ...contactForm
      });
      setSubmitStatus('success');
      setContactForm({ name: '', email: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const NavLink = ({ label, target }: { label: string; target: string }) => (
    <button
      onClick={() => scrollTo(target)}
      className="text-slate-600 hover:text-primary-600 font-medium transition-colors text-sm md:text-base"
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">

      {/* Navigation */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-600 font-bold text-2xl cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <GraduationCap size={32} />
            <span>QuizGenie</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            <NavLink label={t.landing.nav.features} target="features" />
            <NavLink label={t.landing.nav.services} target="services" />
            <NavLink label={t.landing.nav.how_it_works} target="problem-solution" />
            <NavLink label={t.landing.nav.pricing} target="pricing" />
            <NavLink label={t.landing.nav.about} target="about" />
            <NavLink label={t.landing.nav.contact} target="contact" />
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === Language.EN ? Language.AR : Language.EN)}
              className="text-slate-500 hover:text-primary-600 transition-colors font-medium"
            >
              {t.common.language_toggle}
            </button>
            <button onClick={() => navigate('/login')} className="text-slate-900 font-semibold hover:text-primary-600 transition">
              {t.landing.nav.login}
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="bg-primary-600 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-primary-700 transition shadow-lg shadow-primary-500/20 hover:-translate-y-0.5 transform"
            >
              {t.landing.nav.signup}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="lg:hidden text-slate-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-lg lg:hidden p-6 flex flex-col gap-4 animate-in slide-in-from-top-5 max-h-[80vh] overflow-y-auto">
            <NavLink label={t.landing.nav.features} target="features" />
            <NavLink label={t.landing.nav.services} target="services" />
            <NavLink label={t.landing.nav.how_it_works} target="problem-solution" />
            <NavLink label={t.landing.nav.pricing} target="pricing" />
            <NavLink label={t.landing.nav.about} target="about" />
            <NavLink label={t.landing.nav.contact} target="contact" />
            <hr />
            <button onClick={() => navigate('/login')} className="w-full py-3 text-center text-slate-900 font-bold border border-slate-200 rounded-xl">
              {t.landing.nav.login}
            </button>
            <button onClick={() => navigate('/signup')} className="w-full py-3 text-center bg-primary-600 text-white rounded-xl font-bold">
              {t.landing.nav.signup}
            </button>
            <button
              onClick={() => {
                setLanguage(language === Language.EN ? Language.AR : Language.EN);
                setIsMenuOpen(false);
              }}
              className="w-full py-3 text-center bg-slate-100 text-slate-600 rounded-xl font-bold"
            >
              {t.common.language_toggle}
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <InteractiveNetworkBackground />

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-primary-100 shadow-sm text-primary-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
              <Sparkles size={14} />
              <span>{t.landing.hero.badge}</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6">
              {t.landing.hero.title} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">
                {t.landing.hero.title_highlight}
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              {t.landing.hero.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-800 shadow-lg transition transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                {t.landing.hero.cta_primary} <ArrowRight size={18} />
              </button>
              <button
                onClick={() => setIsVideoOpen(true)}
                className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-50 transition flex items-center justify-center gap-2"
              >
                <Play size={18} className="fill-current" />
                {t.landing.hero.cta_secondary}
              </button>
            </div>

            <p className="mt-8 text-sm text-slate-500 font-medium">
              {t.landing.hero.trusted_by}
            </p>
          </div>
        </div>

      </section >

      {/* Stats Section */}
      < section className="py-10 border-y border-slate-100 bg-slate-50/50" >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { label: t.landing.stats.users, value: "10k+", icon: Users },
              { label: t.landing.stats.quizzes, value: "500k", icon: FileText },
              { label: t.landing.stats.saved, value: "1M+", icon: Zap },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="text-3xl md:text-4xl font-black text-slate-900 mb-1">{stat.value}</div>
                <div className="flex items-center gap-2 text-slate-500 text-sm md:text-base font-medium uppercase tracking-wide">
                  <stat.icon size={16} className="text-primary-500" />
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* Services Section (New) */}
      < section id="services" className="py-24 bg-white" >
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t.landing.services.title}</h2>
            <p className="text-lg text-slate-500">{t.landing.services.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Brain, title: t.landing.services.s1_title, desc: t.landing.services.s1_desc, color: "bg-purple-100 text-purple-600" },
              { icon: ShieldCheck, title: t.landing.services.s2_title, desc: t.landing.services.s2_desc, color: "bg-green-100 text-green-600" },
              { icon: Languages, title: t.landing.services.s3_title, desc: t.landing.services.s3_desc, color: "bg-blue-100 text-blue-600" },
              { icon: BarChart3, title: t.landing.services.s4_title, desc: t.landing.services.s4_desc, color: "bg-amber-100 text-amber-600" }
            ].map((s, i) => (
              <div key={i} className="bg-slate-50 p-8 rounded-3xl hover:shadow-lg transition-shadow group cursor-pointer">
                <div className={`w-14 h-14 ${s.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <s.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h3>
                <p className="text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* Interactive Features */}
      < section id="features" className="py-24 bg-slate-900 text-white" >
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.landing.features.title}</h2>
            <p className="text-slate-400 text-lg">{t.landing.features.subtitle}</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
              {[
                { id: 'quiz', icon: Brain, label: t.landing.features.tabs.quiz },
                { id: 'analytics', icon: BarChart3, label: t.landing.features.tabs.analytics },
                { id: 'grading', icon: CheckCircle, label: t.landing.features.tabs.grading },
              ].map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFeature(idx)}
                  className={`text-start p-6 rounded-2xl transition-all duration-300 flex items-center gap-4 ${activeFeature === idx
                    ? 'bg-primary-600 text-white shadow-lg ring-2 ring-primary-400 ring-offset-2 ring-offset-slate-900'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                    }`}
                >
                  <tab.icon size={24} />
                  <span className="text-lg font-bold">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="w-full lg:w-2/3 bg-slate-800 rounded-3xl p-8 md:p-12 border border-slate-700 min-h-[400px] flex flex-col justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg">
                  {React.createElement(
                    [Brain, BarChart3, CheckCircle][activeFeature],
                    { size: 32, className: "text-white" }
                  )}
                </div>
                <h3 className="text-3xl font-bold mb-4">
                  {t.landing.features.content[[`quiz_title`, `analytics_title`, `grading_title`][activeFeature]]}
                </h3>
                <p className="text-slate-300 text-xl leading-relaxed">
                  {t.landing.features.content[[`quiz_desc`, `analytics_desc`, `grading_desc`][activeFeature]]}
                </p>

                <button className="mt-8 text-primary-400 font-bold flex items-center gap-2 hover:gap-4 transition-all">
                  Explore Feature <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Problem vs Solution */}
      < section id="problem-solution" className="py-24 bg-slate-50" >
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t.landing.problem_solution.title}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 relative">
            <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full border border-slate-200 shadow-sm text-slate-400">
              <ArrowRight size={24} />
            </div>

            <div className="bg-red-50/50 border border-red-100 rounded-3xl p-8 md:p-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <XCircle size={20} />
                </div>
                <h3 className="text-xl font-bold text-red-900">{t.landing.problem_solution.problem_title}</h3>
              </div>
              <ul className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-4 text-red-800/80">
                    <X size={20} className="mt-0.5 flex-shrink-0 opacity-60" />
                    <span className="text-lg font-medium">{t.landing.problem_solution[`problem_${i}`]}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-primary-200 rounded-3xl p-8 md:p-12 shadow-xl shadow-primary-900/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary-600 text-white px-4 py-1 rounded-bl-xl text-xs font-bold uppercase">Recommended</div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                  <CheckCircle size={20} />
                </div>
                <h3 className="text-xl font-bold text-primary-900">{t.landing.problem_solution.solution_title}</h3>
              </div>
              <ul className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-4 text-slate-700">
                    <Check size={20} className="mt-0.5 flex-shrink-0 text-green-500" />
                    <span className="text-lg font-medium">{t.landing.problem_solution[`solution_${i}`]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section >

      {/* Testimonials (New) */}
      < section className="py-24 bg-white" >
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t.landing.testimonials.title}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
                <Quote size={32} className="text-primary-200 mb-6" />
                <p className="text-slate-600 text-lg mb-6 italic">"{t.landing.testimonials[`t${i}_text`]}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">
                    {t.landing.testimonials[`t${i}_author`][0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{t.landing.testimonials[`t${i}_author`]}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{t.landing.testimonials[`t${i}_role`]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* Pricing */}
      < section id="pricing" className="py-24 bg-slate-50" >
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t.landing.pricing.title}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {['free', 'pro', 'school'].map((plan, i) => (
              <div key={plan} className={`relative bg-white rounded-3xl p-8 border ${i === 1 ? 'border-primary-500 shadow-xl shadow-primary-500/10 scale-105 z-10' : 'border-slate-200 shadow-sm'}`}>
                {i === 1 && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Most Popular</div>}

                <h3 className="text-xl font-bold text-slate-900 mb-2">{t.landing.pricing[plan].title}</h3>
                <div className="text-4xl font-black text-slate-900 mb-6">{t.landing.pricing[plan].price}<span className="text-base font-medium text-slate-500 font-sans">/mo</span></div>

                <button
                  onClick={() => {
                    if (plan === 'free') {
                      navigate('/signup');
                    } else if (plan === 'pro' || plan === 'school') {
                      setSelectedPlan(plan as 'pro' | 'school');
                      setShowPaymentModal(true);
                    }
                  }}
                  className={`w-full py-3 rounded-xl font-bold mb-8 transition ${i === 1 ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                  {plan === 'free' ? 'Get Started' : 'Choose Plan'}
                </button>

                <ul className="space-y-4">
                  {t.landing.pricing[plan].features.map((feat: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* About Us (New Section) */}
      < section id="about" className="py-24 bg-white" >
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                {t.landing.about.title}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">{t.landing.about.subtitle}</h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">{t.landing.about.desc_1}</p>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">{t.landing.about.desc_2}</p>

              <div className="flex flex-wrap gap-4">
                {t.landing.about.values.map((val: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-bold text-slate-700">
                    <Star size={16} className="text-amber-400 fill-current" /> {val}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                alt="Team working"
                className="rounded-3xl shadow-2xl rotate-2 border border-slate-100"
              />
            </div>
          </div>
        </div>
      </section >

      {/* Contact */}
      < section id="contact" className="py-24 bg-slate-50" >
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-3xl p-8 md:p-16 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="grid lg:grid-cols-2 gap-16">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-6">{t.landing.contact.title}</h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-8">{t.landing.contact.subtitle}</p>

                <div className="space-y-6">


                  <div className="flex gap-4 mt-8">
                    <a href="#" className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center hover:bg-primary-600 hover:text-white transition">
                      <Twitter size={18} />
                    </a>
                    <a href="#" className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center hover:bg-primary-600 hover:text-white transition">
                      <Linkedin size={18} />
                    </a>
                  </div>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleContactSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{t.landing.contact.name}</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{t.landing.contact.email}</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.landing.contact.message}</label>
                  <textarea
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg disabled:opacity-70"
                >
                  {isSubmitting ? 'Sending...' : t.landing.contact.submit}
                </button>

                {submitStatus === 'success' && (
                  <div className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2">
                    <CheckCircle size={20} />
                    Message sent successfully!
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section >

      {/* Footer */}
      < footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800" >
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 text-white font-bold text-2xl mb-6">
                <GraduationCap size={32} />
                <span>QuizGenie</span>
              </div>
              <p className="text-sm leading-relaxed mb-6">{t.landing.footer.desc}</p>
              <div className="flex gap-4">
                <a href="#" className="text-slate-400 hover:text-white transition"><Twitter size={20} /></a>
                <a href="#" className="text-slate-400 hover:text-white transition"><Linkedin size={20} /></a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">{t.landing.footer.links_1}</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => scrollTo('features')} className="hover:text-primary-400 transition">Features</button></li>
                <li><button onClick={() => scrollTo('pricing')} className="hover:text-primary-400 transition">Pricing</button></li>
                <li><button onClick={() => scrollTo('services')} className="hover:text-primary-400 transition">Services</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">{t.landing.footer.links_2}</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => scrollTo('about')} className="hover:text-primary-400 transition">About Us</button></li>
                <li><a href="#" className="hover:text-primary-400 transition">Careers</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">{t.landing.footer.links_3}</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-primary-400 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium">
            <p>{t.landing.footer.copyright}</p>
            <div className="flex items-center gap-6">
              <button onClick={() => setLanguage(Language.EN)} className={`hover:text-white ${language === Language.EN ? 'text-white' : ''}`}>English</button>
              <button onClick={() => setLanguage(Language.AR)} className={`hover:text-white ${language === Language.AR ? 'text-white' : ''}`}>العربية</button>
            </div>
          </div>
        </div>
      </footer >
      {/* Video Modal */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            <div className="aspect-video w-full">
              <video
                className="w-full h-full object-contain"
                controls
                autoPlay
                src="/Demo/sitedemo.mp4"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setIsVideoOpen(false)} />
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={selectedPlan}
        onSuccess={() => {
          setShowPaymentModal(false);
          navigate('/dashboard');
        }}
      />
    </div >
  );
};

export default Landing;
