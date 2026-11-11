import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { PAPER_SECTIONS, TRANSLATIONS, translateBackendError } from './translations';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Download, 
  Layers, 
  ChevronRight, 
  RefreshCw, 
  LogOut, 
  BookOpen, 
  ArrowRight, 
  PlusCircle, 
  ArrowDown, 
  Clock, 
  Search, 
  FileSpreadsheet, 
  Trash2, 
  ExternalLink, 
  ShieldAlert, 
  GraduationCap, 
  Lock, 
  Unlock,
  Globe,
  LayoutGrid,
  ClipboardList,
  Flame,
  Calendar,
  CalendarRange
} from 'lucide-react';

// ---------------------------------------------------------------------------------
// INITIAL DATA (Real-World: Starts Clean with No Dummy Content)
// ---------------------------------------------------------------------------------
const INITIAL_PAPERS = [];
const INITIAL_SUBMISSIONS = [];

const PRESET_USERS = {
  teacher: {
    id: 'usr-teacher-01',
    name: 'Eng. K. A. Perera',
    role: 'teacher',
    roleTitle: 'Course Lecturer (Combined Mathematics)',
    email: 'teacher@maths.lk',
    initials: 'KP'
  }
};

const getPaperSection = (paper) => {
  const raw = paper?.section;
  if (!raw) return 'Full Papers';
  return PAPER_SECTIONS.find(s => s.toLowerCase() === raw.toLowerCase()) || raw;
};

const SECTION_STYLES = {
  'Home Work Assignment': {
    Icon: ClipboardList,
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  'Challenge Papers': {
    Icon: Flame,
    badgeClass: 'bg-orange-50 text-[#ff6600] border-orange-200',
  },
  'Week Test': {
    Icon: Calendar,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  'Month Test': {
    Icon: CalendarRange,
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  'Full Papers': {
    Icon: FileText,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Tutes: {
    Icon: BookOpen,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
};

function LanguageToggle({ lang, setLang, fullLabels = false, title = 'Select Language' }) {
  return (
    <div
      className="inline-flex items-center p-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-bold shrink-0"
      role="group"
      aria-label={title}
      title={title}
    >
      <span className="pl-2 pr-1 text-[#ff6600] flex items-center">
        <Globe className="w-3.5 h-3.5" />
      </span>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
          lang === 'en'
            ? 'bg-white text-[#ff6600] shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {fullLabels ? 'English' : 'EN'}
      </button>
      <button
        type="button"
        onClick={() => setLang('si')}
        className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
          lang === 'si'
            ? 'bg-white text-[#ff6600] shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {fullLabels ? 'සිංහල' : 'සිං'}
      </button>
    </div>
  );
}

export default function App() {
  // Language State (Default: English 'en', Secondary: Sinhala 'si')
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('cm_portal_lang');
    return saved === 'si' ? 'si' : 'en';
  });
  const t = TRANSLATIONS[lang];

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('cm_moodle_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Data persistence
  const [papers, setPapers] = useState(() => {
    const saved = localStorage.getItem('cm_moodle_papers');
    return saved ? JSON.parse(saved) : INITIAL_PAPERS;
  });

  const [submissions, setSubmissions] = useState(() => {
    const saved = localStorage.getItem('cm_moodle_submissions');
    return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
  });

  // Active Live Exam Session for Current Student
  const [activeSession, setActiveSession] = useState(() => {
    const saved = localStorage.getItem('cm_active_exam_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation: 'courses' | 'assignment' | 'teacher_grading'
  const [activeView, setActiveView] = useState('courses');
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [selectedSection, setSelectedSection] = useState('ALL');

  // Modals & UI States
  const [showConfirmStartModal, setShowConfirmStartModal] = useState(false);
  const [showAddPaperModal, setShowAddPaperModal] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Anti-Cheat: Tab Switch Alert State
  const [tabSwitchAlert, setTabSwitchAlert] = useState(false);

  // Initial Data Load from ASP.NET Core Web API
  useEffect(() => {
    async function fetchFromBackend() {
      try {
        const fetchedPapers = await api.getPapers();
        setPapers(fetchedPapers || []);
        setIsBackendConnected(true);
      } catch {
        console.info('Backend not available yet, using local state.');
      }

      try {
        const fetchedSubmissions = await api.getSubmissions();
        setSubmissions(fetchedSubmissions || []);
        setIsBackendConnected(true);
      } catch {
        // fallback
      }
    }
    fetchFromBackend();
  }, []);

  const handleDeletePaper = async (paperId) => {
    if (!window.confirm(t.confirms.deletePaper)) {
      return;
    }
    try {
      await api.deletePaper(paperId);
    } catch (err) {
      console.warn('API delete paper fallback:', err);
    }
    setPapers(prev => prev.filter(p => p.id !== paperId));
    setSubmissions(prev => prev.filter(s => s.paperId !== paperId));
    if (selectedPaperId === paperId) {
      setSelectedPaperId(null);
      setActiveView('courses');
    }
    showToast(t.toasts.paperDeleted, 'info');
  };

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('cm_portal_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cm_moodle_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('cm_moodle_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('cm_moodle_papers', JSON.stringify(papers));
  }, [papers]);

  useEffect(() => {
    localStorage.setItem('cm_moodle_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('cm_active_exam_session', JSON.stringify(activeSession));
    } else {
      localStorage.removeItem('cm_active_exam_session');
    }
  }, [activeSession]);

  // Anti-Cheat Tab Switch Tracker when an exam is active
  useEffect(() => {
    if (!activeSession) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setActiveSession(prev => {
          if (!prev) return null;
          const updated = (prev.tabSwitches || 0) + 1;
          if (prev.backendSessionId) {
            api.logTabSwitch(prev.backendSessionId).catch(() => {});
          }
          return { ...prev, tabSwitches: updated };
        });
        setTabSwitchAlert(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeSession]);

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setActiveView('courses');
    const roleLabel = user.role === 'teacher' ? t.common.teacherRole : t.common.studentRole;
    showToast(t.toasts.loggedInAs(user.name, roleLabel), 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveSession(null);
    setShowUserDropdown(false);
    setActiveView('courses');
    setSelectedSection('ALL');
    showToast(t.toasts.loggedOut, 'info');
  };

  const currentPaper = papers.find(p => p.id === selectedPaperId) || papers[0] || null;
  const userSubmission = (currentUser?.role === 'student' && currentPaper)
    ? submissions.find(s => s.paperId === currentPaper.id && s.studentIndex === currentUser.indexNo)
    : null;

  // Student Starts Exam (Paper unlocks and countdown begins simultaneously)
  const handleStartExam = async () => {
    const now = new Date();
    const writingEndsAt = new Date(now.getTime() + currentPaper.durationMinutes * 60 * 1000);
    const hardCutoffAt = new Date(now.getTime() + (currentPaper.durationMinutes + currentPaper.gracePeriodMinutes) * 60 * 1000);

    let backendSession = null;
    try {
      backendSession = await api.startExamSession(currentPaper.id, currentUser.indexNo);
      setIsBackendConnected(true);
    } catch (err) {
      console.warn('Backend start session offline fallback:', err);
    }

    const sessionData = {
      backendSessionId: backendSession?.id || null,
      paperId: currentPaper.id,
      studentIndex: currentUser.indexNo,
      startedAt: now.toISOString(),
      writingEndsAt: writingEndsAt.toISOString(),
      hardCutoffAt: hardCutoffAt.toISOString(),
      durationMinutes: currentPaper.durationMinutes,
      gracePeriodMinutes: currentPaper.gracePeriodMinutes,
      tabSwitches: 0
    };

    setActiveSession(sessionData);
    setShowConfirmStartModal(false);
    showToast(t.toasts.examStarted, 'warning');
  };

  // Submit Answer Script
  const handleSubmitAnswer = async (payload) => {
    if (!activeSession) return;

    const submissionTime = new Date();
    const writingDeadline = new Date(activeSession.writingEndsAt);
    const hardDeadline = new Date(activeSession.hardCutoffAt);

    let status = 'ON_TIME';
    if (submissionTime > hardDeadline) {
      status = 'DISQUALIFIED';
    } else if (submissionTime > writingDeadline) {
      status = 'LATE';
    }

    const startTime = new Date(activeSession.startedAt);
    const durationTakenMins = Math.max(1, Math.round((submissionTime - startTime) / 60000));

    const formattedDate = submissionTime.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const subPayload = {
      paperId: activeSession.paperId,
      studentIndex: currentUser.indexNo,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      fileName: payload.fileName,
      filePath: payload.filePath || '',
      fileSizeMb: payload.fileSizeMb,
      filesCount: payload.filesCount,
      tabSwitches: activeSession.tabSwitches || 0
    };

    let savedSub = null;
    try {
      savedSub = await api.submitAnswer(subPayload);
      setIsBackendConnected(true);
    } catch (err) {
      console.warn('Backend submit offline fallback:', err);
    }

    const newSub = savedSub || {
      id: userSubmission ? userSubmission.id : 'sub-' + Date.now(),
      paperId: activeSession.paperId,
      studentName: currentUser.name,
      studentIndex: currentUser.indexNo,
      studentEmail: currentUser.email,
      submittedAt: formattedDate,
      status: status,
      durationTakenMins: durationTakenMins,
      fileName: payload.fileName,
      filePath: payload.filePath || '',
      fileSizeMb: payload.fileSizeMb,
      filesCount: payload.filesCount,
      tabSwitches: activeSession.tabSwitches || 0,
      marks: null,
      feedback: status === 'DISQUALIFIED' ? 'Grace period time limit violated.' : 'Pending lecturer review'
    };

    if (userSubmission) {
      setSubmissions(submissions.map(s => s.id === (savedSub?.id || userSubmission.id) ? newSub : s));
    } else {
      setSubmissions([newSub, ...submissions.filter(s => s.id !== newSub.id)]);
    }

    setActiveSession(null);

    if (newSub.status === 'ON_TIME') {
      showToast(t.toasts.submittedOnTime, 'success');
    } else if (newSub.status === 'LATE') {
      showToast(t.toasts.submittedLate, 'warning');
    } else {
      showToast(t.toasts.submittedDisqualified, 'error');
    }
  };

  // Teacher Adds New Paper
  const handleCreatePaper = async (newPaperData) => {
    const targetSection = newPaperData.section || 'Full Papers';
    let savedPaper = null;
    try {
      savedPaper = await api.createPaper({
        title: newPaperData.title,
        subject: newPaperData.subject,
        section: targetSection,
        durationMinutes: Number(newPaperData.durationMinutes),
        gracePeriodMinutes: Number(newPaperData.gracePeriodMinutes || 15),
        dueDate: newPaperData.dueDate,
        pdfUrl: newPaperData.pdfUrl,
        pdfFileName: newPaperData.pdfFileName,
        instructions: newPaperData.instructions,
        totalMarks: Number(newPaperData.totalMarks || 100)
      });
      setIsBackendConnected(true);
    } catch (err) {
      console.warn('Backend create paper offline fallback:', err);
    }

    const newPaper = savedPaper || {
      id: 'paper-' + Date.now(),
      code: `CM-26-P${papers.length + 1}`,
      title: newPaperData.title,
      subject: newPaperData.subject,
      section: targetSection,
      courseName: 'Combined Mathematics 2026 (A/L)',
      durationMinutes: Number(newPaperData.durationMinutes),
      gracePeriodMinutes: Number(newPaperData.gracePeriodMinutes || 15),
      openedDate: new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      dueDate: newPaperData.dueDate || 'Wednesday, 11 November 2026, 11:59 PM',
      pdfUrl: newPaperData.pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      pdfFileName: newPaperData.pdfFileName || 'Model_Paper.pdf',
      pdfFileSize: '2.5 MB',
      instructions: newPaperData.instructions || t.createPaperModal.defaultInstructions,
      totalMarks: Number(newPaperData.totalMarks || 100)
    };

    const createdSection = getPaperSection(newPaper);
    setPapers([newPaper, ...papers]);
    if (selectedSection !== 'ALL' && selectedSection !== createdSection) {
      setSelectedSection(createdSection);
    }
    setShowAddPaperModal(false);
    showToast(t.toasts.paperCreated, 'success');
  };

  // If not logged in, show clean Moodle login
  if (!currentUser) {
    return (
      <MoodleLoginPage
        onLogin={handleLogin}
        presetUsers={PRESET_USERS}
        lang={lang}
        setLang={setLang}
        t={t}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-[#ff6600] selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.08)] flex items-center space-x-2.5 border text-xs font-bold backdrop-blur-md ${
            toastMessage.type === 'error'
              ? 'bg-red-50/95 border-red-200 text-red-700'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50/95 border-amber-200 text-amber-800'
              : toastMessage.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
              : 'bg-white/95 border-orange-200 text-slate-800'
          }`}>
            {toastMessage.type === 'error' && <XCircle className="w-4 h-4 shrink-0 text-red-500" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />}
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
            {toastMessage.type === 'info' && <CheckCircle2 className="w-4 h-4 shrink-0 text-[#ff6600]" />}
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Anti-Cheat Tab Switch Alert Modal */}
      {tabSwitchAlert && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-red-200 max-w-md w-full p-7 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{t.tabSwitchModal.title}</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {t.tabSwitchModal.beforeCount}
                <b className="text-red-600 font-black font-mono">
                  {t.tabSwitchModal.countText(activeSession.tabSwitches || 1)}
                </b>
                {t.tabSwitchModal.afterCount}
              </p>
            </div>
            <button
              onClick={() => setTabSwitchAlert(false)}
              className="w-full py-3 rounded-full bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold text-xs shadow-md shadow-orange-500/25 transition cursor-pointer"
            >
              {t.tabSwitchModal.dismiss}
            </button>
          </div>
        </div>
      )}

      {/* Floating Pill Navbar (SwiftDrop Style) */}
      <div className="sticky top-0 z-40 pt-3 sm:pt-4 px-3 sm:px-6 pointer-events-none">
        <header className="max-w-6xl mx-auto flex items-center justify-between gap-2 bg-white/90 backdrop-blur-xl px-4 sm:px-6 py-2.5 rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] border border-slate-200/80 pointer-events-auto transition-all">
          <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
            <div
              onClick={() => setActiveView('courses')}
              className="flex items-center space-x-2.5 cursor-pointer group min-w-0"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#ff6600] to-[#ff9900] flex items-center justify-center text-white shadow-md shadow-orange-500/25 shrink-0 group-hover:scale-105 transition">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <span className="font-black text-sm sm:text-base text-slate-900 block leading-tight tracking-tight truncate">
                  {t.common.courseTitle}<span className="text-[#ff6600]">.</span>
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold block truncate">
                  {t.common.portalSubtitle}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5 pl-3 border-l border-slate-200/80 shrink-0">
              <button
                onClick={() => setActiveView('courses')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeView === 'courses'
                    ? 'bg-[#ff6600] text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-600 hover:text-[#ff6600] hover:bg-orange-50'
                }`}
              >
                {t.nav.papers}
              </button>
              {currentUser.role === 'teacher' && (
                <button
                  onClick={() => setActiveView('teacher_grading')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    activeView === 'teacher_grading'
                      ? 'bg-[#ff6600] text-white shadow-md shadow-orange-500/20'
                      : 'text-slate-600 hover:text-[#ff6600] hover:bg-orange-50'
                  }`}
                >
                  {t.nav.grading}
                </button>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            {currentUser.role === 'teacher' && (
              <button
                onClick={() => setShowAddPaperModal(true)}
                className="hidden lg:inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-[#111827] hover:bg-[#ff6600] text-white font-bold text-xs whitespace-nowrap transition shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{t.nav.addModelPaper}</span>
              </button>
            )}

            {/* Language Switcher */}
            <LanguageToggle
              lang={lang}
              setLang={setLang}
              title={t.nav.selectLanguage}
            />

            {/* User Badge */}
            <div className="flex items-center space-x-2 px-1.5 lg:px-3 py-1 bg-orange-50/80 border border-orange-200/70 rounded-full text-xs">
              <div className="w-6 h-6 rounded-full bg-[#ff7a00] text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs">
                {currentUser.initials || 'ST'}
              </div>
              <div className="text-left hidden lg:block">
                <span className="font-bold text-slate-900 block leading-none max-w-[110px] truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-[#ff6600] font-bold font-mono">
                  {currentUser.role === 'student' ? (currentUser.indexNo || t.common.studentRole) : t.common.teacherRole}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 md:px-3.5 md:py-1.5 rounded-full bg-white hover:bg-[#ff6600] text-slate-600 hover:text-white border border-slate-200 hover:border-[#ff6600] text-xs font-bold whitespace-nowrap transition flex items-center space-x-1 cursor-pointer"
              title={t.nav.logoutTitle}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">{t.nav.logout}</span>
            </button>
          </div>
        </header>
      </div>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5 md:py-7">
        {activeView === 'courses' ? (
          <MoodleCoursesView 
            papers={papers}
            currentUser={currentUser}
            submissions={submissions}
            selectedSection={selectedSection}
            onSelectSection={setSelectedSection}
            t={t}
            onSelectPaper={(paperId) => {
              setSelectedPaperId(paperId);
              setActiveView('assignment');
            }}
            onDeletePaper={handleDeletePaper}
            onOpenGrading={(paperId) => {
              setSelectedPaperId(paperId);
              setActiveView('teacher_grading');
            }}
            onOpenAddPaperModal={() => setShowAddPaperModal(true)}
          />
        ) : activeView === 'assignment' && currentPaper ? (
          <MoodleExamAssignmentView 
            paper={currentPaper}
            currentUser={currentUser}
            submission={userSubmission}
            activeSession={activeSession && activeSession.paperId === currentPaper.id ? activeSession : null}
            t={t}
            onRequestStartExam={() => setShowConfirmStartModal(true)}
            onSubmitAnswer={handleSubmitAnswer}
            onCancelExam={() => {
              if (confirm(t.confirms.abandonExam)) {
                setActiveSession(null);
                showToast(t.toasts.examCancelled, 'info');
              }
            }}
            onViewAllSubmissions={() => setActiveView('teacher_grading')}
            onBack={() => setActiveView('courses')}
          />
        ) : activeView === 'teacher_grading' && currentPaper ? (
          <MoodleTeacherGradingView 
            paper={currentPaper}
            papers={papers}
            submissions={submissions.filter(s => s.paperId === currentPaper.id)}
            t={t}
            onSelectPaper={(id) => setSelectedPaperId(id)}
            onGradeSubmission={(sub) => setGradingSubmission(sub)}
            onBack={() => setActiveView('assignment')}
          />
        ) : (
          <MoodleCoursesView 
            papers={papers}
            currentUser={currentUser}
            submissions={submissions}
            selectedSection={selectedSection}
            onSelectSection={setSelectedSection}
            t={t}
            onSelectPaper={(paperId) => {
              setSelectedPaperId(paperId);
              setActiveView('assignment');
            }}
            onDeletePaper={handleDeletePaper}
            onOpenGrading={(paperId) => {
              setSelectedPaperId(paperId);
              setActiveView('teacher_grading');
            }}
            onOpenAddPaperModal={() => setShowAddPaperModal(true)}
          />
        )}
      </main>

      {/* Start Exam Confirmation Modal (Anti-Leak Protection) */}
      {showConfirmStartModal && currentPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full p-7 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/80 text-[#ff6600] flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[11px] font-black text-[#ff6600] uppercase tracking-wider">{currentPaper.subject}</span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5 tracking-tight">{currentPaper.title}</h3>
            </div>

            {/* Strict Exam Start Notice */}
            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 text-slate-700 text-xs space-y-2 leading-relaxed">
              <div className="font-black flex items-center space-x-1.5 text-[#ff6600]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t.startExamModal.heading}</span>
              </div>
              <p>
                {t.startExamModal.para1Before}
                <b className="text-slate-900">{t.startExamModal.para1ButtonName}</b>
                {t.startExamModal.para1Middle}
                <b className="font-mono text-[#ff6600]">{t.startExamModal.para1Duration(currentPaper.durationMinutes)}</b>
                {t.startExamModal.para1After}
              </p>
              <p>
                {t.startExamModal.para2(currentPaper.durationMinutes, currentPaper.gracePeriodMinutes)}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setShowConfirmStartModal(false)}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                {t.startExamModal.cancel}
              </button>
              <button
                onClick={handleStartExam}
                className="px-5 py-2.5 rounded-full bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold text-xs shadow-md shadow-orange-500/25 flex items-center space-x-1.5 transition cursor-pointer"
              >
                <span>{t.startExamModal.confirm}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Paper Modal (Teacher) */}
      {showAddPaperModal && (
        <MoodleCreatePaperModal 
          t={t}
          defaultSection={selectedSection === 'ALL' ? 'Full Papers' : selectedSection}
          onSave={handleCreatePaper}
          onClose={() => setShowAddPaperModal(false)}
        />
      )}

      {/* Grade Submission Modal (Teacher) */}
      {gradingSubmission && currentPaper && (
        <MoodleGradeModal 
          submission={gradingSubmission}
          paper={currentPaper}
          t={t}
          onSave={async (updatedSub) => {
            try {
              if (updatedSub.marks !== null) {
                await api.gradeSubmission(updatedSub.id, Number(updatedSub.marks), updatedSub.feedback || '');
                setIsBackendConnected(true);
              }
            } catch (err) {
              console.warn('Backend grade submission offline fallback:', err);
            }
            setSubmissions(submissions.map(s => s.id === updatedSub.id ? updatedSub : s));
            setGradingSubmission(null);
            showToast(t.toasts.gradeSaved, 'success');
          }}
          onClose={() => setGradingSubmission(null)}
        />
      )}

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200/70 py-4 mt-auto text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="inline-flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-medium">{t.footer.portalInfo}</span>
          </div>
          <span>
            {t.footer.loggedInAs} <b className="text-slate-900">{currentUser.name}</b>{' '}
            {currentUser.indexNo ? <span className="font-mono font-bold text-[#ff6600]">({currentUser.indexNo})</span> : ''}
          </span>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------------
// 1. MOODLE LOGIN & REGISTRATION PAGE
// ---------------------------------------------------------------------------------
function MoodleLoginPage({ onLogin, presetUsers, lang, setLang, t }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regIndexNo, setRegIndexNo] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const resolveError = (errObj, fallback) => {
    if (!errObj) return null;
    if (errObj.type === 'key') return t.login[errObj.key];
    return translateBackendError(errObj.message, lang, fallback);
  };

  // Handle Real Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const user = await api.loginWithCredentials(identifier, password);
      onLogin(user);
    } catch (err) {
      // If backend unreachable or error, check presets
      const matched = Object.values(presetUsers).find(
        u => u.email.toLowerCase() === identifier.toLowerCase() || (u.indexNo && u.indexNo.toLowerCase() === identifier.toLowerCase())
      );
      if (matched && password === 'admin') {
        onLogin(matched);
      } else {
        setLoginError({ type: 'raw', message: err.message });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Real Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError(null);

    if (regPassword !== regConfirmPassword) {
      setRegError({ type: 'key', key: 'passwordMismatch' });
      return;
    }

    if (regPassword.length < 4) {
      setRegError({ type: 'key', key: 'passwordTooShort' });
      return;
    }

    setIsRegistering(true);
    try {
      const newUser = await api.registerStudent({
        name: regName,
        email: regEmail,
        phoneNumber: regPhone,
        indexNo: regIndexNo,
        password: regPassword
      });
      onLogin(newUser);
    } catch (err) {
      setRegError({ type: 'raw', message: err.message });
    } finally {
      setIsRegistering(false);
    }
  };

  const displayLoginError = resolveError(loginError, t.login.loginFallbackError);
  const displayRegError = resolveError(regError, t.login.registerFallbackError);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#fffaf4] to-[#f1f5f9] flex flex-col justify-center items-center p-4 selection:bg-[#ff6600] selection:text-white relative overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl p-7 sm:p-9 space-y-6 relative z-10">
        <div className="flex justify-end -mt-1 -mb-2">
          <LanguageToggle
            lang={lang}
            setLang={setLang}
            fullLabels
            title={t.nav.selectLanguage}
          />
        </div>

        <div className="text-center space-y-2.5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#ff6600] to-[#ff9900] mx-auto flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t.login.title}<span className="text-[#ff6600]">.</span>
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            {t.login.subtitle}
          </p>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`py-2 text-xs font-bold text-center rounded-lg transition cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-[#ff6600] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.login.loginTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`py-2 text-xs font-bold text-center rounded-lg transition cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-[#ff6600] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.login.registerTab}
          </button>
        </div>

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <div className="space-y-4">
            {displayLoginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {displayLoginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">{t.login.identifierLabel}</label>
                <input
                  type="text"
                  required
                  placeholder={t.login.identifierPlaceholder}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">{t.login.passwordLabel}</label>
                <input
                  type="password"
                  required
                  placeholder={t.login.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 px-4 rounded-full bg-[#111827] hover:bg-[#ff6600] text-white font-bold text-xs sm:text-sm transition shadow-md hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t.login.signingIn}</span>
                  </>
                ) : (
                  <span>{t.login.loginButton}</span>
                )}
              </button>
            </form>

            {/* Lecturer Quick Access */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('teacher@maths.lk');
                  setPassword('admin');
                }}
                className="text-xs font-semibold text-[#ff6600] hover:underline cursor-pointer"
              >
                {t.login.adminQuickFill}
              </button>
            </div>
          </div>
        )}

        {/* REGISTRATION FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            {displayRegError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {displayRegError}
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">{t.login.fullNameLabel}</label>
              <input
                type="text"
                required
                placeholder={t.login.fullNamePlaceholder}
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">{t.login.indexNoLabel}</label>
                <input
                  type="text"
                  required
                  placeholder={t.login.indexNoPlaceholder}
                  value={regIndexNo}
                  onChange={(e) => setRegIndexNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 text-xs sm:text-sm font-mono text-slate-900 placeholder:text-slate-400 transition"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">{t.login.phoneLabel}</label>
                <input
                  type="tel"
                  required
                  placeholder={t.login.phonePlaceholder}
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">{t.login.emailLabel}</label>
              <input
                type="email"
                required
                placeholder={t.login.emailPlaceholder}
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">{t.login.regPasswordLabel}</label>
                <input
                  type="password"
                  required
                  placeholder={t.login.regPasswordPlaceholder}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">{t.login.confirmPasswordLabel}</label>
                <input
                  type="password"
                  required
                  placeholder={t.login.confirmPasswordPlaceholder}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-3 px-4 rounded-full bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold text-xs sm:text-sm transition shadow-md shadow-orange-500/25 hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isRegistering ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.login.registering}</span>
                </>
              ) : (
                <span>{t.login.registerButton}</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------
// 2. COURSES / PAPERS LIST VIEW (With Section Sidebar Navigation)
// ---------------------------------------------------------------------------------
function MoodleCoursesView({
  papers,
  currentUser,
  submissions,
  selectedSection,
  onSelectSection,
  t,
  onSelectPaper,
  onDeletePaper,
  onOpenGrading,
  onOpenAddPaperModal,
}) {
  const filteredPapers =
    selectedSection === 'ALL'
      ? papers
      : papers.filter((p) => getPaperSection(p) === selectedSection);

  const activeSectionLabel =
    selectedSection === 'ALL'
      ? t.courses.allSectionTitle
      : t.sections.items[selectedSection] || selectedSection;

  const ActiveHeaderIcon =
    selectedSection === 'ALL'
      ? LayoutGrid
      : SECTION_STYLES[selectedSection]?.Icon || BookOpen;

  return (
    <div className="space-y-6">
      {/* Course Banner (SwiftDrop Signature Vibrant Orange Gradient Card) */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#ff7a00] via-[#ff8c00] to-[#ffb800] p-6 sm:p-8 text-white overflow-hidden shadow-lg shadow-orange-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/15 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full mb-2.5">
            {t.common.courseFullTitle}
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
            {t.courses.bannerHeading}
          </h2>
          <p className="text-xs sm:text-sm text-white/90 mt-1.5 max-w-2xl leading-relaxed font-normal">
            {t.courses.bannerDesc}
          </p>
        </div>

        {currentUser.role === 'teacher' && (
          <button
            onClick={onOpenAddPaperModal}
            className="relative z-10 flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white hover:bg-orange-50 text-[#ff6600] font-black text-xs sm:text-sm transition shrink-0 shadow-md cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.courses.addExamPaperBtn}</span>
          </button>
        )}
      </div>

      {/* Sidebar + Papers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Class Sections */}
        <aside className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden lg:sticky lg:top-24">
          <div className="p-4 sm:px-5 border-b border-slate-100 bg-[#fffaf4]/70 flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 flex items-center space-x-2.5">
              <span className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 text-[#ff6600] flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </span>
              <span>{t.sections.sidebarTitle}</span>
            </h3>
            <span className="text-[11px] font-black font-mono px-2.5 py-0.5 rounded-full bg-orange-50 text-[#ff6600] border border-orange-200/80">
              {PAPER_SECTIONS.length}
            </span>
          </div>

          <nav
            className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5"
            aria-label={t.sections.sidebarTitle}
          >
            {/* All Sections */}
            <button
              type="button"
              onClick={() => onSelectSection('ALL')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition border text-left col-span-2 sm:col-span-3 lg:col-span-1 cursor-pointer ${
                selectedSection === 'ALL'
                  ? 'bg-[#ff6600] text-white border-transparent shadow-md shadow-orange-500/20'
                  : 'text-slate-600 border-transparent hover:bg-orange-50/60 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center space-x-2.5 min-w-0">
                <LayoutGrid
                  className={`w-4 h-4 shrink-0 ${
                    selectedSection === 'ALL' ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{t.sections.allSections}</span>
              </span>
              <span
                className={`ml-2 px-2 py-0.5 rounded-full font-mono text-[11px] shrink-0 ${
                  selectedSection === 'ALL'
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {papers.length}
              </span>
            </button>

            <div className="hidden lg:block my-1.5 border-t border-slate-100" />

            {/* 6 Individual Sections */}
            {PAPER_SECTIONS.map((sec) => {
              const count = papers.filter((p) => getPaperSection(p) === sec).length;
              const isSelected = selectedSection === sec;
              const IconComp = SECTION_STYLES[sec]?.Icon || FileText;
              const label = t.sections.items[sec] || sec;

              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onSelectSection(sec)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition border text-left cursor-pointer ${
                    isSelected
                      ? 'bg-[#ff6600] text-white border-transparent shadow-md shadow-orange-500/20'
                      : 'text-slate-600 border-transparent hover:bg-orange-50/60 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center space-x-2.5 min-w-0">
                    <IconComp
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{label}</span>
                  </span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full font-mono text-[11px] shrink-0 ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : count > 0
                        ? 'bg-orange-50 text-[#ff6600]'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Content: Filtered Papers Table */}
        <section className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-slate-100 bg-[#fffaf4]/70 flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center space-x-2.5">
              <span className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 text-[#ff6600] flex items-center justify-center shrink-0">
                <ActiveHeaderIcon className="w-4 h-4" />
              </span>
              <span>{activeSectionLabel}</span>
            </h3>
            <span className="text-xs text-[#ff6600] font-black font-mono px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80">
              {t.courses.papersActive(filteredPapers.length)}
            </span>
          </div>

          {filteredPapers.length === 0 ? (
            <div className="p-12 md:p-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200/80 text-[#ff6600] mx-auto flex items-center justify-center shadow-xs">
                <ActiveHeaderIcon className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900">
                  {selectedSection === 'ALL'
                    ? t.courses.emptyTitle
                    : t.courses.emptyInSectionTitle(activeSectionLabel)}
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                  {selectedSection === 'ALL'
                    ? currentUser.role === 'teacher'
                      ? t.courses.emptyTeacherDesc
                      : t.courses.emptyStudentDesc
                    : currentUser.role === 'teacher'
                    ? t.courses.emptyInSectionTeacherDesc(activeSectionLabel)
                    : t.courses.emptyInSectionStudentDesc(activeSectionLabel)}
                </p>
              </div>
              {currentUser.role === 'teacher' && (
                <button
                  onClick={onOpenAddPaperModal}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold text-xs transition shadow-md shadow-orange-500/25 mt-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t.courses.addModelPaperBtn}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPapers.map((paper) => {
                const studentSub = submissions.find(
                  (s) => s.paperId === paper.id && s.studentIndex === currentUser.indexNo
                );
                const secKey = getPaperSection(paper);
                const secBadgeStyle =
                  SECTION_STYLES[secKey]?.badgeClass ||
                  'bg-slate-100 text-slate-700 border-slate-200';
                const secLabel = t.sections.items[secKey] || secKey;

                return (
                  <div
                    key={paper.id}
                    className="p-5 md:px-6 hover:bg-orange-50/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                  >
                    <div
                      className="flex items-start space-x-3.5 cursor-pointer flex-1 min-w-0"
                      onClick={() => onSelectPaper(paper.id)}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center shrink-0 text-[#ff6600] mt-0.5 group-hover:bg-[#ff6600] group-hover:text-white group-hover:scale-105 transition-all">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-[#ff6600] transition-colors flex items-center gap-2 flex-wrap">
                          <span>{paper.title}</span>
                          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {paper.code}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${secBadgeStyle}`}
                          >
                            {secLabel}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {paper.instructions}
                        </p>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-2 flex-wrap gap-y-1">
                          <span>
                            {t.courses.durationLabel}{' '}
                            <b className="text-slate-900 font-mono">
                              {t.common.minsUnit(paper.durationMinutes)}
                            </b>
                          </span>
                          <span className="text-slate-300">&bull;</span>
                          <span>
                            {t.courses.graceLabel}{' '}
                            <b className="text-slate-900 font-mono">
                              +{t.common.minsUnit(paper.gracePeriodMinutes)}
                            </b>
                          </span>
                          <span className="text-slate-300">&bull;</span>
                          <span>
                            {t.courses.dueLabel} <b className="text-slate-800">{paper.dueDate}</b>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 self-end md:self-center shrink-0">
                      {currentUser.role === 'student' ? (
                        studentSub ? (
                          <button
                            onClick={() => onSelectPaper(paper.id)}
                            className="text-xs font-bold px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition font-mono cursor-pointer"
                          >
                            {studentSub.marks !== null
                              ? t.courses.gradedBadge(studentSub.marks, paper.totalMarks)
                              : t.courses.submittedBadge}
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectPaper(paper.id)}
                            className="text-xs font-bold px-4 py-2 rounded-full bg-[#ff6600] hover:bg-[#e65c00] text-white transition shadow-md shadow-orange-500/20 flex items-center space-x-1.5 cursor-pointer"
                          >
                            <span>{t.courses.startExamBtn}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onOpenGrading(paper.id)}
                            className="text-xs font-bold text-[#ff6600] bg-orange-50 hover:bg-[#ff6600] hover:text-white px-4 py-2 rounded-full border border-orange-200 transition cursor-pointer"
                          >
                            {t.courses.submissionsAndGradeBtn}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePaper(paper.id);
                            }}
                            title={t.courses.deletePaperTitle}
                            className="p-2 rounded-full text-rose-500 hover:bg-rose-50 transition border border-transparent hover:border-rose-200 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------
// 3. MOODLE EXAM ASSIGNMENT VIEW (Strict Anti-Leak Timer + Unlocked Paper & Upload)
// ---------------------------------------------------------------------------------
function MoodleExamAssignmentView({ 
  paper, 
  currentUser, 
  submission, 
  activeSession, 
  t,
  onRequestStartExam, 
  onSubmitAnswer, 
  onCancelExam,
  onViewAllSubmissions, 
  onBack 
}) {
  // Live Timer States
  const [writingSecondsLeft, setWritingSecondsLeft] = useState(0);
  const [hardSecondsLeft, setHardSecondsLeft] = useState(0);
  const [isWritingOver, setIsWritingOver] = useState(false);
  const [isHardExpired, setIsHardExpired] = useState(false);

  // File Upload state (Single PDF vs Multi Photos)
  const [uploadMode, setUploadMode] = useState('PDF');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown Interval
  useEffect(() => {
    if (!activeSession) return;

    const tick = () => {
      const now = new Date().getTime();
      const writingDeadline = new Date(activeSession.writingEndsAt).getTime();
      const hardDeadline = new Date(activeSession.hardCutoffAt).getTime();

      const writeDiff = Math.max(0, Math.floor((writingDeadline - now) / 1000));
      const hardDiff = Math.max(0, Math.floor((hardDeadline - now) / 1000));

      setWritingSecondsLeft(writeDiff);
      setHardSecondsLeft(hardDiff);

      if (writeDiff <= 0) {
        setIsWritingOver(true);
      }
      if (hardDiff <= 0) {
        setIsHardExpired(true);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Upload Handlers
  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile({
        rawFile: file,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const formatted = files.map((f, idx) => ({
        id: 'img-' + Date.now() + '-' + idx,
        name: f.name,
        sizeMb: (f.size / (1024 * 1024)).toFixed(2)
      }));
      setSelectedImages(prev => [...prev, ...formatted]);
    }
  };

  const removeImage = (id) => {
    setSelectedImages(prev => prev.filter(img => img.id !== id));
  };

  const triggerSubmit = async () => {
    setIsSubmitting(true);
    let uploadedPath = '';
    try {
      if (uploadMode === 'PDF' && selectedFile?.rawFile) {
        const uploadRes = await api.uploadFile(selectedFile.rawFile, 'submissions');
        uploadedPath = uploadRes.fileUrl;
      }
    } catch (err) {
      console.warn('File upload fallback:', err);
    }

    if (uploadMode === 'PDF') {
      onSubmitAnswer({
        fileName: selectedFile.name,
        filePath: uploadedPath,
        fileSizeMb: selectedFile.size,
        filesCount: 1
      });
    } else {
      const totalMb = selectedImages.reduce((sum, img) => sum + parseFloat(img.sizeMb), 0).toFixed(1);
      onSubmitAnswer({
        fileName: `Answer_Sheets (${selectedImages.length} Pages)`,
        filePath: '',
        fileSizeMb: `${totalMb} MB`,
        filesCount: selectedImages.length
      });
    }
    setIsSubmitting(false);
  };

  const canSubmit = uploadMode === 'PDF' ? !!selectedFile : selectedImages.length > 0;

  return (
    <div className="space-y-5">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
        <div className="flex items-center space-x-2 flex-wrap">
          <button onClick={onBack} className="hover:text-[#ff6600] transition cursor-pointer">{t.common.courseFullTitle}</button>
          <span className="text-slate-300">&gt;</span>
          <button onClick={onBack} className="hover:text-[#ff6600] transition font-mono">{paper.code}</button>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-900 font-extrabold">{paper.title}</span>
        </div>

        <button onClick={onBack} className="text-[#ff6600] hover:underline flex items-center space-x-1 cursor-pointer">
          <span>&larr; {t.assignment.backToPapers}</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center space-x-3 pt-1">
        <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#ff6600] shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          {paper.title}
        </h1>
      </div>

      {/* ACTIVE EXAM RUNNING: Sticky Countdown Header */}
      {activeSession && (
        <div className={`p-4 md:p-5 rounded-3xl border transition-all shadow-lg ${
          isHardExpired
            ? 'bg-red-50 border-red-200 text-red-900'
            : isWritingOver
            ? 'bg-amber-50 border-amber-300 text-amber-950 animate-pulse shadow-amber-500/15'
            : 'bg-gradient-to-r from-[#111827] to-[#1e293b] border-[#ff6600]/60 text-white shadow-orange-500/10'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5 w-full sm:w-auto">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isHardExpired 
                  ? 'bg-red-100 border-red-200 text-red-600' 
                  : isWritingOver 
                  ? 'bg-amber-100 border-amber-300 text-amber-700' 
                  : 'bg-[#ff6600] border-[#ff6600] text-white shadow-md shadow-orange-500/30'
              }`}>
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                  isHardExpired ? 'text-red-600' : isWritingOver ? 'text-amber-700' : 'text-slate-300'
                }`}>
                  {isHardExpired 
                    ? t.assignment.statusTerminated
                    : isWritingOver 
                    ? t.assignment.statusGrace
                    : t.assignment.statusWriting}
                </span>
                <span className={`text-2xl md:text-3xl font-black font-mono tracking-tight ${
                  isHardExpired ? 'text-red-700' : isWritingOver ? 'text-amber-900' : 'text-white'
                }`}>
                  {isWritingOver ? formatTime(hardSecondsLeft) : formatTime(writingSecondsLeft)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className={`px-3 py-1 rounded-full font-mono font-bold text-xs ${
                activeSession.tabSwitches > 0 
                  ? 'bg-red-100 border border-red-200 text-red-700' 
                  : isHardExpired || isWritingOver
                  ? 'bg-white border border-slate-200 text-slate-700'
                  : 'bg-white/10 border border-white/15 text-slate-200'
              }`}>
                {t.assignment.tabSwitches(activeSession.tabSwitches || 0)}
              </span>

              <button
                onClick={onCancelExam}
                className={`hover:underline text-xs font-bold cursor-pointer ${
                  isHardExpired || isWritingOver ? 'text-red-600' : 'text-orange-300 hover:text-orange-200'
                }`}
              >
                {t.assignment.abandonExam}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6 md:p-8 space-y-6">
        
        {/* Meta Info */}
        <div className="text-xs text-slate-500 space-y-2 pb-5 border-b border-slate-100">
          <div>
            <b className="text-slate-700">{t.sections.sectionLabel}</b>{' '}
            <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              SECTION_STYLES[getPaperSection(paper)]?.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {t.sections.items[getPaperSection(paper)] || getPaperSection(paper)}
            </span>
          </div>
          <div><b className="text-slate-700">{t.assignment.openedLabel}</b> <span className="text-slate-900 font-medium">{paper.openedDate}</span></div>
          <div><b className="text-slate-700">{t.assignment.dueLabel}</b> <span className="text-slate-900 font-medium">{paper.dueDate}</span></div>
          <div className="text-[#ff6600]">
            <b>{t.assignment.strictTimeLabel}</b> <span className="font-mono font-bold text-slate-900">{t.assignment.strictTimeValue(paper.durationMinutes, paper.gracePeriodMinutes)}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-slate-700 leading-relaxed bg-[#f8f8f6] p-4 rounded-2xl border border-slate-200/70">
          {paper.instructions}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CASE 1: TEACHER VIEW -> Shows Grading Summary Block           */}
        {/* ------------------------------------------------------------- */}
        {currentUser.role === 'teacher' ? (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="font-black text-base text-slate-900 tracking-tight">{t.assignment.gradingSummaryTitle}</h3>
            
            <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
              <div className="grid grid-cols-2 p-3.5 bg-slate-50/80 border-b border-slate-100">
                <span className="font-bold text-slate-500">{t.assignment.participantsLabel}</span>
                <span className="font-bold text-slate-900">{t.assignment.participantsValue}</span>
              </div>
              <div className="grid grid-cols-2 p-3.5 bg-white border-b border-slate-100">
                <span className="font-bold text-slate-500">{t.assignment.submittedLabel}</span>
                <span className="font-bold text-emerald-600 font-mono">{t.assignment.submittedValue}</span>
              </div>
              <div className="grid grid-cols-2 p-3.5 bg-slate-50/80">
                <span className="font-bold text-slate-500">{t.assignment.questionPaperPdfLabel}</span>
                <span className="font-bold text-[#ff6600] font-mono">{paper.pdfFileName}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={onViewAllSubmissions}
                className="px-5 py-2.5 rounded-full bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold text-xs transition shadow-md shadow-orange-500/20 cursor-pointer"
              >
                {t.assignment.viewAllSubmissionsBtn}
              </button>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* CASE 2: STUDENT VIEW                                          */
          /* ------------------------------------------------------------- */
          <div className="space-y-6 pt-2">
            
            {/* 2A: STUDENT HAS NOT STARTED EXAM YET (Paper is LOCKED!) */}
            {!activeSession && !submission && (
              <div className="p-6 rounded-3xl border border-orange-200/90 bg-gradient-to-b from-[#fffaf4] to-orange-50/50 space-y-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#ff6600] text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/25">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-base text-slate-900">
                      {t.assignment.lockedTitle}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t.assignment.lockedDescBefore}
                      <b className="text-slate-900">{t.assignment.lockedDescBtnName}</b>
                      {t.assignment.lockedDescMiddle}
                      <b className="font-mono text-[#ff6600]">{t.assignment.lockedDescDuration(paper.durationMinutes)}</b>
                      {t.assignment.lockedDescAfter}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-orange-200/70 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs font-bold text-[#ff6600] font-mono bg-white px-3 py-1 rounded-full border border-orange-200/80">
                    {t.assignment.lockedDurationSummary(paper.durationMinutes, paper.gracePeriodMinutes)}
                  </span>

                  <button
                    onClick={onRequestStartExam}
                    className="px-6 py-2.5 rounded-full bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold text-xs shadow-md shadow-orange-500/25 flex items-center space-x-2 transition cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>{t.assignment.startExamViewPaperBtn}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2B: STUDENT IS ACTIVELY WRITING EXAM (Paper is UNLOCKED & Timer is Running) */}
            {activeSession && (
              <div className="space-y-6 border-t border-slate-100 pt-5">
                {/* Unlocked Paper Viewer Header */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#fffaf4] border border-orange-200/70 text-xs flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[#ff6600]" />
                    <span className="font-bold text-slate-900">
                      {t.assignment.unlockedPdfTitle}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => window.open(paper.pdfUrl, '_blank')}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#ff6600] hover:bg-[#e65c00] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t.assignment.openInNewTab}</span>
                    </button>
                    <a
                      href={`${paper.pdfUrl}${paper.pdfUrl?.includes('/api/files/') ? '?download=true' : ''}`}
                      download={paper.pdfFileName || 'question-paper.pdf'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-orange-50 border border-slate-200 text-slate-700 hover:text-[#ff6600] text-xs font-bold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t.common.download}</span>
                    </a>
                  </div>
                </div>

                {/* Embedded PDF Viewer */}
                <div className="w-full h-[580px] rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden shadow-inner">
                  <iframe
                    src={`${paper.pdfUrl}#toolbar=1`}
                    title="Question Paper PDF"
                    className="w-full h-full border-0"
                  />
                </div>

                {/* Answer Upload Box */}
                <div className="border border-slate-100 rounded-3xl p-5 md:p-6 bg-[#fffaf4]/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-slate-900 flex items-center space-x-2">
                      <UploadCloud className="w-4 h-4 text-[#ff6600]" />
                      <span>{t.assignment.answerSubmissionTitle}</span>
                    </h3>
                  </div>

                  {/* Mode Selector */}
                  <div className="inline-flex p-1 rounded-xl bg-slate-100 gap-1">
                    <button
                      type="button"
                      onClick={() => setUploadMode('PDF')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        uploadMode === 'PDF' 
                          ? 'bg-white text-[#ff6600] shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.assignment.modeSinglePdf}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('IMAGES')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        uploadMode === 'IMAGES' 
                          ? 'bg-white text-[#ff6600] shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.assignment.modeMultiplePhotos}
                    </button>
                  </div>

                  {uploadMode === 'PDF' ? (
                    /* PDF Dropzone */
                    <div className="border-2 border-dashed border-slate-300 hover:border-[#ff6600] rounded-2xl p-6 bg-white text-center transition">
                      <input
                        type="file"
                        id="student-answer-pdf"
                        accept=".pdf"
                        onChange={handlePdfChange}
                        className="hidden"
                      />
                      <label htmlFor="student-answer-pdf" className="cursor-pointer flex flex-col items-center justify-center space-y-2.5">
                        <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200/80 text-[#ff6600] flex items-center justify-center shadow-xs">
                          <ArrowDown className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        {selectedFile ? (
                          <div className="text-xs">
                            <span className="font-bold text-emerald-600 block font-mono">{selectedFile.name}</span>
                            <span className="text-slate-500">{selectedFile.size} &bull; {t.assignment.readyToSubmit}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-600">
                            <span className="font-bold block text-slate-900">{t.assignment.selectSinglePdfTitle}</span>
                            <span className="text-[11px] text-slate-400">{t.assignment.selectSinglePdfHint}</span>
                          </div>
                        )}
                      </label>
                    </div>
                  ) : (
                    /* Multi Photos Dropzone */
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-slate-300 hover:border-[#ff6600] rounded-2xl p-6 bg-white text-center transition">
                        <input
                          type="file"
                          id="student-answer-images"
                          multiple
                          accept="image/*"
                          onChange={handleImagesChange}
                          className="hidden"
                        />
                        <label htmlFor="student-answer-images" className="cursor-pointer flex flex-col items-center justify-center space-y-2 text-xs">
                          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200/80 text-[#ff6600] flex items-center justify-center">
                            <ArrowDown className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-slate-900">{t.assignment.selectMultiPhotosTitle}</span>
                          <span className="text-[11px] text-slate-400">{t.assignment.selectMultiPhotosHint}</span>
                        </label>
                      </div>

                      {selectedImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {selectedImages.map((img, idx) => (
                            <div key={img.id} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                              <span className="truncate max-w-[100px] text-slate-700 font-mono">{t.assignment.pagePrefix(idx + 1)} {img.name}</span>
                              <button onClick={() => removeImage(img.id)} className="text-rose-500 p-1 hover:text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      onClick={triggerSubmit}
                      disabled={!canSubmit || isHardExpired || isSubmitting}
                      className={`px-6 py-2.5 rounded-full font-bold text-xs transition flex items-center space-x-2 ${
                        !canSubmit || isHardExpired
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : isSubmitting
                          ? 'bg-[#e65c00] text-white'
                          : 'bg-[#ff9900] hover:bg-[#ff8800] text-white shadow-md shadow-orange-500/25 cursor-pointer'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{t.assignment.uploadingAnswer}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t.assignment.submitAnswerBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2C: SUBMISSION STATUS TABLE */}
            <div className="space-y-3.5 pt-3">
              <h3 className="font-black text-lg text-slate-900 tracking-tight">
                {t.assignment.submissionStatusTitle}
              </h3>

              <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="w-1/3 p-3.5 font-bold text-slate-500 bg-slate-50/80 border-r border-slate-100">
                        {t.assignment.rowSubmissionStatus}
                      </td>
                      <td className={`p-3.5 ${submission ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600'}`}>
                        {submission ? t.assignment.submittedForGrading : t.assignment.noSubmissionsYet}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-100">
                      <td className="w-1/3 p-3.5 font-bold text-slate-500 bg-slate-50/80 border-r border-slate-100">
                        {t.assignment.rowGradingStatus}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {submission && submission.marks !== null ? (
                          <span className="font-black text-emerald-600 font-mono">
                            {t.assignment.gradedValue(submission.marks, paper.totalMarks)}
                          </span>
                        ) : (
                          <span className="text-slate-400">{t.assignment.notGraded}</span>
                        )}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-100">
                      <td className="w-1/3 p-3.5 font-bold text-slate-500 bg-slate-50/80 border-r border-slate-100">
                        {t.assignment.rowTimeRemaining}
                      </td>
                      <td className="p-3.5 text-slate-700 font-mono">
                        {submission ? (
                          <span className="text-emerald-600 font-bold">{t.assignment.assignmentSubmitted}</span>
                        ) : activeSession ? (
                          <span className="text-[#ff6600] font-bold">{t.assignment.timeLeftSuffix(formatTime(hardSecondsLeft))}</span>
                        ) : (
                          <span className="text-slate-500">{t.assignment.availableByDueDate}</span>
                        )}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-100">
                      <td className="w-1/3 p-3.5 font-bold text-slate-500 bg-slate-50/80 border-r border-slate-100">
                        {t.assignment.rowLastModified}
                      </td>
                      <td className="p-3.5 text-slate-700 font-mono">
                        {submission ? submission.submittedAt : '-'}
                      </td>
                    </tr>

                    {submission && (
                      <tr className="border-b border-slate-100">
                        <td className="w-1/3 p-3.5 font-bold text-slate-500 bg-slate-50/80 border-r border-slate-100">
                          {t.assignment.rowFileSubmissions}
                        </td>
                        <td className="p-3.5 text-slate-800">
                          <div className="flex items-center space-x-2 text-[#ff6600] font-mono">
                            <FileText className="w-4 h-4 text-[#ff6600]" />
                            <span className="font-bold">
                              {submission.fileName}
                            </span>
                            <span className="text-xs text-slate-400">({submission.fileSizeMb})</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td className="w-1/3 p-3.5 font-bold text-slate-500 bg-slate-50/80 border-r border-slate-100">
                        {t.assignment.rowSubmissionComments}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        <details className="cursor-pointer">
                          <summary className="text-[#ff6600] hover:underline font-bold">
                            {t.assignment.commentsCount(submission && submission.feedback ? '1' : '0')}
                          </summary>
                          {submission && submission.feedback && (
                            <div className="p-3 mt-2 rounded-xl bg-orange-50/60 border border-orange-200/70 text-slate-700">
                              <b className="text-[#ff6600]">{t.assignment.teacherFeedbackPrefix}</b> {submission.feedback}
                            </div>
                          )}
                        </details>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------
// 4. TEACHER SUBMISSIONS WORKSHEET (Grading Table & CSV Export)
// ---------------------------------------------------------------------------------
function MoodleTeacherGradingView({ paper, papers, submissions, t, onSelectPaper, onGradeSubmission, onBack }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = submissions.filter(s => {
    const matchesSearch = s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.studentIndex.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = ['Student ID', 'Full Name', 'Status', 'Grade', 'Duration (Mins)', 'Submission File', 'Submitted At', 'Feedback'];
    const rows = filtered.map(s => [
      s.studentIndex,
      `"${s.studentName}"`,
      s.status,
      s.marks !== null ? s.marks : 'Not graded',
      s.durationTakenMins,
      `"${s.fileName}"`,
      `"${s.submittedAt}"`,
      `"${(s.feedback || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Grading_Sheet_${paper.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
        <div className="flex items-center space-x-2 flex-wrap">
          <button onClick={onBack} className="hover:text-[#ff6600] transition cursor-pointer">{t.common.courseFullTitle}</button>
          <span className="text-slate-300">&gt;</span>
          <button onClick={onBack} className="hover:text-[#ff6600] transition font-mono">{paper.code}</button>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-900 font-extrabold">{t.grading.breadcrumbTitle}</span>
        </div>

        <button onClick={onBack} className="text-[#ff6600] hover:underline flex items-center space-x-1 cursor-pointer">
          <span>&larr; {t.grading.backToAssignment}</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center space-x-2.5 tracking-tight">
            <span className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200/80 text-[#ff6600] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </span>
            <span>{t.grading.headingPrefix} {paper.title}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1.5">
            {t.grading.subtitle}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-500/20 cursor-pointer shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{t.grading.exportCsv}</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap gap-y-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder={t.grading.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200/70 rounded-full focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-orange-100 text-xs bg-[#f8f8f6] text-slate-900 placeholder:text-slate-400 shadow-inner transition"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-full text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-[#ff6600] cursor-pointer"
          >
            <option value="ALL">{t.grading.filterAll}</option>
            <option value="ON_TIME">{t.grading.filterOnTime}</option>
            <option value="LATE">{t.grading.filterLate}</option>
          </select>
        </div>

        <span className="text-xs text-[#ff6600] font-black font-mono px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80">
          {t.grading.showingCount(filtered.length)}
        </span>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">{t.grading.colStudentDetails}</th>
                <th className="p-4">{t.grading.colStatus}</th>
                <th className="p-4">{t.grading.colDuration}</th>
                <th className="p-4">{t.grading.colGrade}</th>
                <th className="p-4">{t.grading.colSubmittedAt}</th>
                <th className="p-4">{t.grading.colAnswerScript}</th>
                <th className="p-4 text-right">{t.grading.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-orange-50/20 transition-colors">
                  <td className="p-4">
                    <div className="font-extrabold text-slate-900">{sub.studentName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{sub.studentIndex}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      sub.status === 'ON_TIME'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : sub.status === 'DISQUALIFIED'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {sub.status === 'ON_TIME'
                        ? t.grading.statusOnTime
                        : sub.status === 'DISQUALIFIED'
                        ? t.grading.statusDisqualified
                        : t.grading.statusLate}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-semibold text-slate-700">
                    {t.common.minsUnit(sub.durationTakenMins)}
                  </td>
                  <td className="p-4 font-bold font-mono">
                    {sub.marks !== null ? (
                      <span className="text-emerald-600 font-black">{sub.marks} / {paper.totalMarks}</span>
                    ) : (
                      <span className="text-slate-400 italic font-normal">{t.grading.notGraded}</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-500 font-mono text-[11px]">
                    {sub.submittedAt}
                  </td>
                  <td className="p-4 font-bold text-[#ff6600] max-w-xs truncate font-mono">
                    {sub.filePath ? (
                      <a 
                        href={sub.filePath} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center space-x-1.5 hover:underline text-[#ff6600]"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#ff6600] shrink-0" />
                        <span className="truncate">{sub.fileName}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                      </a>
                    ) : (
                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <FileText className="w-3.5 h-3.5 text-[#ff6600]" />
                        <span>{sub.fileName}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onGradeSubmission(sub)}
                      className="px-4 py-1.5 rounded-full bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold text-xs transition shadow-sm shadow-orange-500/20 cursor-pointer"
                    >
                      {t.grading.gradeBtn}
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
}

// ---------------------------------------------------------------------------------
// 5. CREATE PAPER MODAL (Teacher Uploads Question Paper PDF)
// ---------------------------------------------------------------------------------
function MoodleCreatePaperModal({ t, defaultSection = 'Full Papers', onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [section, setSection] = useState(
    PAPER_SECTIONS.includes(defaultSection) ? defaultSection : 'Full Papers'
  );
  const [subject, setSubject] = useState('Pure Mathematics');
  const [durationMinutes, setDurationMinutes] = useState('180');
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState('15');
  const [dueDate, setDueDate] = useState('Wednesday, 11 November 2026, 11:59 PM');
  const [instructions, setInstructions] = useState(t.createPaperModal.defaultInstructions);
  const [pdfFile, setPdfFile] = useState(null);

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPdfFile({
        rawFile: file,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    let uploadedUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    let uploadedName = 'Question_Paper.pdf';

    if (pdfFile?.rawFile) {
      try {
        const uploadRes = await api.uploadFile(pdfFile.rawFile, 'papers');
        uploadedUrl = uploadRes.fileUrl;
        uploadedName = uploadRes.fileName;
      } catch (err) {
        console.warn('Paper upload fallback:', err);
      }
    }

    onSave({
      title,
      section,
      subject,
      durationMinutes,
      gracePeriodMinutes,
      dueDate,
      instructions,
      pdfUrl: uploadedUrl,
      pdfFileName: uploadedName
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-6 md:p-7 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            {t.createPaperModal.heading}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">{t.createPaperModal.paperTitleLabel}</label>
            <input
              type="text"
              required
              placeholder={t.createPaperModal.paperTitlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 text-xs bg-white text-slate-900 placeholder:text-slate-400 transition"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">{t.createPaperModal.sectionLabel}</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 text-xs bg-white text-slate-900 font-semibold transition"
            >
              {PAPER_SECTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  {t.sections.items[sec] || sec}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">{t.createPaperModal.subjectStreamLabel}</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 text-xs bg-white text-slate-800 transition"
              >
                <option value="Pure Mathematics">{t.createPaperModal.streamPure}</option>
                <option value="Applied Mathematics">{t.createPaperModal.streamApplied}</option>
                <option value="Combined Mathematics (Full)">{t.createPaperModal.streamCombined}</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">{t.createPaperModal.durationLabel}</label>
              <input
                type="number"
                required
                min="10"
                max="360"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 text-xs font-mono bg-white text-slate-900 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">{t.createPaperModal.graceBufferLabel}</label>
            <input
              type="number"
              required
              min="2"
              max="60"
              value={gracePeriodMinutes}
              onChange={(e) => setGracePeriodMinutes(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 text-xs font-mono bg-white text-slate-900 transition"
            />
          </div>

          <div className="p-3.5 bg-[#fffaf4] border border-orange-200/80 rounded-2xl space-y-2">
            <label className="block text-slate-900 font-bold">{t.createPaperModal.uploadPdfLabel}</label>
            <input
              type="file"
              accept=".pdf"
              id="teacher-new-pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
            <label
              htmlFor="teacher-new-pdf"
              className="border border-dashed border-orange-300 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-[#ff6600] bg-white transition"
            >
              <span className="text-xs text-slate-700 truncate font-medium">
                {pdfFile ? `${pdfFile.name} (${pdfFile.size})` : t.createPaperModal.selectPdfPrompt}
              </span>
              <UploadCloud className="w-4 h-4 text-[#ff6600] shrink-0" />
            </label>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">{t.createPaperModal.instructionsLabel}</label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 text-xs bg-white text-slate-900 placeholder:text-slate-400 transition"
            />
          </div>

          <div className="flex justify-end space-x-2.5 pt-3.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold text-xs shadow-md shadow-orange-500/25 transition cursor-pointer"
            >
              {t.createPaperModal.saveAndPublish}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------
// 6. GRADE MODAL
// ---------------------------------------------------------------------------------
function MoodleGradeModal({ submission, paper, t, onSave, onClose }) {
  const [marks, setMarks] = useState(submission.marks !== null ? submission.marks : '');
  const [feedback, setFeedback] = useState(submission.feedback || '');

  const handleSave = (e) => {
    e.preventDefault();
    onSave({
      ...submission,
      marks: marks === '' ? null : Number(marks),
      feedback: feedback
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-6 md:p-7 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">{t.gradeModal.heading}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t.gradeModal.studentLabel} <b className="text-[#ff6600]">{submission.studentName}</b> (<span className="font-mono text-slate-700">{submission.studentIndex}</span>)</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition cursor-pointer">✕</button>
        </div>

        <div className="p-4 bg-[#fffaf4] rounded-2xl border border-orange-200/70 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">{t.gradeModal.fileScriptLabel}</span>
            <span className="font-bold text-[#ff6600] font-mono">{submission.fileName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">{t.gradeModal.durationTakenLabel}</span>
            <span className="font-mono font-bold text-slate-800">{t.common.minsUnit(submission.durationTakenMins)}</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">{t.gradeModal.gradeOutOfLabel(paper.totalMarks)}</label>
            <input
              type="number"
              min="0"
              max={paper.totalMarks}
              required
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 font-mono text-base font-black bg-white text-emerald-600 transition"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">{t.gradeModal.feedbackLabel}</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t.gradeModal.feedbackPlaceholder}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 text-xs bg-white text-slate-900 placeholder:text-slate-400 transition"
            />
          </div>

          <div className="flex justify-end space-x-2.5 pt-3.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold text-xs shadow-md shadow-orange-500/25 transition cursor-pointer"
            >
              {t.gradeModal.saveChanges}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
