import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { TRANSLATIONS, translateBackendError } from './translations';
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
  Globe
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

function LanguageToggle({ lang, setLang, fullLabels = false, title = 'Select Language' }) {
  return (
    <div
      className="inline-flex items-center p-0.5 rounded-lg bg-[#090d16] border border-slate-800 text-[11px] font-semibold shrink-0"
      role="group"
      aria-label={title}
      title={title}
    >
      <span className="pl-2 pr-1 text-slate-400 flex items-center">
        <Globe className="w-3.5 h-3.5" />
      </span>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2 py-1 rounded-md transition ${
          lang === 'en'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {fullLabels ? 'English' : 'EN'}
      </button>
      <button
        type="button"
        onClick={() => setLang('si')}
        className={`px-2 py-1 rounded-md transition ${
          lang === 'si'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-400 hover:text-slate-200'
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
    let savedPaper = null;
    try {
      savedPaper = await api.createPaper({
        title: newPaperData.title,
        subject: newPaperData.subject,
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

    setPapers([newPaper, ...papers]);
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
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-xl flex items-center space-x-2.5 border text-xs font-medium backdrop-blur-md ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/30 text-rose-300'
              : toastMessage.type === 'warning'
              ? 'bg-amber-950/90 border-amber-500/30 text-amber-300'
              : 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
          }`}>
            {toastMessage.type === 'error' && <XCircle className="w-4 h-4 shrink-0 text-rose-400" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />}
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Anti-Cheat Tab Switch Alert Modal */}
      {tabSwitchAlert && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#111827] rounded-xl border border-rose-500/40 max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-300">{t.tabSwitchModal.title}</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {t.tabSwitchModal.beforeCount}
                <b className="text-rose-400 font-mono">
                  {t.tabSwitchModal.countText(activeSession.tabSwitches || 1)}
                </b>
                {t.tabSwitchModal.afterCount}
              </p>
            </div>
            <button
              onClick={() => setTabSwitchAlert(false)}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition"
            >
              {t.tabSwitchModal.dismiss}
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 md:px-6 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
          <div 
            onClick={() => setActiveView('courses')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-slate-900 border border-amber-400/30 shadow-md shadow-amber-500/10 shrink-0 group-hover:scale-105 transition">
              <GraduationCap className="w-5 h-5 text-slate-950" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm text-slate-100 block leading-tight tracking-tight truncate">
                {t.common.courseTitle}
              </span>
              <span className="text-[11px] text-slate-400 font-medium block truncate">
                {t.common.portalSubtitle}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-1 pl-3 border-l border-slate-800">
            <button 
              onClick={() => setActiveView('courses')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeView === 'courses' 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {t.nav.papers}
            </button>
            {currentUser.role === 'teacher' && (
              <button 
                onClick={() => setActiveView('teacher_grading')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeView === 'teacher_grading' 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-md shadow-blue-600/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
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
          <div className="flex items-center space-x-2 px-2.5 sm:px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {currentUser.initials || 'ST'}
            </div>
            <div className="text-left hidden xs:block sm:block">
              <span className="font-semibold text-slate-200 block leading-none max-w-[110px] truncate">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentUser.role === 'student' ? (currentUser.indexNo || t.common.studentRole) : t.common.teacherRole}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-medium transition flex items-center space-x-1"
            title={t.nav.logoutTitle}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.nav.logout}</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5 md:py-6">
        {activeView === 'courses' ? (
          <MoodleCoursesView 
            papers={papers}
            currentUser={currentUser}
            submissions={submissions}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#111827] rounded-xl border border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">{currentPaper.subject}</span>
              <h3 className="text-base font-bold text-slate-100 mt-0.5">{currentPaper.title}</h3>
            </div>

            {/* Strict Exam Start Notice */}
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2 leading-relaxed">
              <div className="font-bold flex items-center space-x-1.5 text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t.startExamModal.heading}</span>
              </div>
              <p>
                {t.startExamModal.para1Before}
                <b>{t.startExamModal.para1ButtonName}</b>
                {t.startExamModal.para1Middle}
                <b className="font-mono">{t.startExamModal.para1Duration(currentPaper.durationMinutes)}</b>
                {t.startExamModal.para1After}
              </p>
              <p>
                {t.startExamModal.para2(currentPaper.durationMinutes, currentPaper.gracePeriodMinutes)}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmStartModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition"
              >
                {t.startExamModal.cancel}
              </button>
              <button
                onClick={handleStartExam}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 flex items-center space-x-1.5 transition"
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
      <footer className="bg-[#0b0f19] border-t border-slate-800/80 py-4 mt-auto text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{t.footer.portalInfo}</span>
          <span>{t.footer.loggedInAs} <b className="text-slate-200">{currentUser.name}</b> {currentUser.indexNo ? <span className="font-mono text-slate-400">({currentUser.indexNo})</span> : ''}</span>
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
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="max-w-md w-full bg-[#111827] rounded-2xl border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6">
        <div className="flex justify-end -mt-1 -mb-2">
          <LanguageToggle
            lang={lang}
            setLang={setLang}
            fullLabels
            title={t.nav.selectLanguage}
          />
        </div>

        <div className="text-center space-y-2.5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 mx-auto flex items-center justify-center text-slate-950 border border-amber-400/40 shadow-lg shadow-amber-500/10">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            {t.login.title}
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t.login.subtitle}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 pb-3 text-xs font-semibold text-center border-b-2 transition ${
              activeTab === 'login'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.login.loginTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 pb-3 text-xs font-semibold text-center border-b-2 transition ${
              activeTab === 'register'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.login.registerTab}
          </button>
        </div>

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <div className="space-y-4">
            {displayLoginError && (
              <div className="p-3 bg-rose-950/70 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {displayLoginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">{t.login.identifierLabel}</label>
                <input
                  type="text"
                  required
                  placeholder={t.login.identifierPlaceholder}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-100 placeholder-slate-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">{t.login.passwordLabel}</label>
                <input
                  type="password"
                  required
                  placeholder={t.login.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-100 placeholder-slate-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2"
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
            <div className="pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('teacher@maths.lk');
                  setPassword('admin');
                }}
                className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
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
              <div className="p-3 bg-rose-950/70 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {displayRegError}
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">{t.login.fullNameLabel}</label>
              <input
                type="text"
                required
                placeholder={t.login.fullNamePlaceholder}
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-100 placeholder-slate-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">{t.login.indexNoLabel}</label>
                <input
                  type="text"
                  required
                  placeholder={t.login.indexNoPlaceholder}
                  value={regIndexNo}
                  onChange={(e) => setRegIndexNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-mono text-slate-100 placeholder-slate-500 transition"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">{t.login.phoneLabel}</label>
                <input
                  type="tel"
                  required
                  placeholder={t.login.phonePlaceholder}
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-100 placeholder-slate-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">{t.login.emailLabel}</label>
              <input
                type="email"
                required
                placeholder={t.login.emailPlaceholder}
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-100 placeholder-slate-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">{t.login.regPasswordLabel}</label>
                <input
                  type="password"
                  required
                  placeholder={t.login.regPasswordPlaceholder}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-100 placeholder-slate-500 transition"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">{t.login.confirmPasswordLabel}</label>
                <input
                  type="password"
                  required
                  placeholder={t.login.confirmPasswordPlaceholder}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-100 placeholder-slate-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/25 flex items-center justify-center space-x-2"
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
// 2. COURSES / PAPERS LIST VIEW
// ---------------------------------------------------------------------------------
function MoodleCoursesView({ papers, currentUser, submissions, t, onSelectPaper, onDeletePaper, onOpenGrading, onOpenAddPaperModal }) {
  return (
    <div className="space-y-6">
      {/* Course Banner */}
      <div className="bg-[#111827] rounded-2xl border border-slate-800 p-6 md:p-7 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
            {t.common.courseFullTitle}
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight mt-1">
            {t.courses.bannerHeading}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            {t.courses.bannerDesc}
          </p>
        </div>

        {currentUser.role === 'teacher' && (
          <button
            onClick={onOpenAddPaperModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shrink-0 shadow-md shadow-blue-600/25"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.courses.addExamPaperBtn}</span>
          </button>
        )}
      </div>

      {/* Papers Table */}
      <div className="bg-[#111827] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 md:px-6 border-b border-slate-800 bg-[#0c1222] flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-200 flex items-center space-x-2.5">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>{t.courses.sectionTitle}</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
            {t.courses.papersActive(papers.length)}
          </span>
        </div>

        {papers.length === 0 ? (
          <div className="p-12 md:p-16 text-center space-y-3.5">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-400 mx-auto flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-200">{t.courses.emptyTitle}</h4>
              <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                {currentUser.role === 'teacher' 
                  ? t.courses.emptyTeacherDesc 
                  : t.courses.emptyStudentDesc}
              </p>
            </div>
            {currentUser.role === 'teacher' && (
              <button
                onClick={onOpenAddPaperModal}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-md shadow-blue-600/25 mt-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t.courses.addModelPaperBtn}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {papers.map((paper) => {
              const studentSub = submissions.find(
                s => s.paperId === paper.id && s.studentIndex === currentUser.indexNo
              );

              return (
                <div 
                  key={paper.id} 
                  className="p-5 md:px-6 hover:bg-[#161f38]/40 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                >
                  <div 
                    className="flex items-start space-x-3.5 cursor-pointer flex-1"
                    onClick={() => onSelectPaper(paper.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 mt-0.5 group-hover:scale-105 transition">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-blue-400 group-hover:text-blue-300 flex items-center gap-2">
                        <span>{paper.title}</span>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {paper.code}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{paper.instructions}</p>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-2 flex-wrap gap-y-1">
                        <span>{t.courses.durationLabel} <b className="text-slate-200 font-mono">{t.common.minsUnit(paper.durationMinutes)}</b></span>
                        <span>&bull;</span>
                        <span>{t.courses.graceLabel} <b className="text-slate-200 font-mono">+{t.common.minsUnit(paper.gracePeriodMinutes)}</b></span>
                        <span>&bull;</span>
                        <span>{t.courses.dueLabel} <b className="text-slate-300">{paper.dueDate}</b></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 self-end md:self-center shrink-0">
                    {currentUser.role === 'student' ? (
                      studentSub ? (
                        <button
                          onClick={() => onSelectPaper(paper.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition font-mono"
                        >
                          {studentSub.marks !== null ? t.courses.gradedBadge(studentSub.marks, paper.totalMarks) : t.courses.submittedBadge}
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectPaper(paper.id)}
                          className="text-xs font-semibold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition shadow-md shadow-blue-600/20 flex items-center space-x-1.5"
                        >
                          <span>{t.courses.startExamBtn}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onOpenGrading(paper.id)}
                          className="text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20 transition"
                        >
                          {t.courses.submissionsAndGradeBtn}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePaper(paper.id);
                          }}
                          title={t.courses.deletePaperTitle}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/20"
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
      <div className="flex items-center justify-between text-xs text-blue-400">
        <div className="flex items-center space-x-2 flex-wrap">
          <button onClick={onBack} className="hover:text-blue-300 transition">{t.common.courseFullTitle}</button>
          <span className="text-slate-600">&gt;</span>
          <button onClick={onBack} className="hover:text-blue-300 transition font-mono">{paper.code}</button>
          <span className="text-slate-600">&gt;</span>
          <span className="text-slate-300 font-medium">{paper.title}</span>
        </div>

        <button onClick={onBack} className="text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-1">
          <span>&larr; {t.assignment.backToPapers}</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center space-x-3 pt-1">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <FileText className="w-5 h-5" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight">
          {paper.title}
        </h1>
      </div>

      {/* ACTIVE EXAM RUNNING: Sticky Countdown Header */}
      {activeSession && (
        <div className={`p-4 md:p-5 rounded-2xl border transition-all shadow-xl ${
          isHardExpired
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            : isWritingOver
            ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 animate-pulse shadow-amber-950/20'
            : 'bg-gradient-to-r from-[#0c1322] to-[#111827] border-blue-500/30 text-blue-400 shadow-blue-950/30'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5 w-full sm:w-auto">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                isHardExpired 
                  ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' 
                  : isWritingOver 
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' 
                  : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
              }`}>
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider block text-slate-400">
                  {isHardExpired 
                    ? t.assignment.statusTerminated
                    : isWritingOver 
                    ? t.assignment.statusGrace
                    : t.assignment.statusWriting}
                </span>
                <span className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-white">
                  {isWritingOver ? formatTime(hardSecondsLeft) : formatTime(writingSecondsLeft)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className={`px-2.5 py-1 rounded-lg font-mono text-xs ${
                activeSession.tabSwitches > 0 
                  ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300' 
                  : 'bg-slate-800 border border-slate-700 text-slate-400'
              }`}>
                {t.assignment.tabSwitches(activeSession.tabSwitches || 0)}
              </span>

              <button
                onClick={onCancelExam}
                className="text-rose-400 hover:text-rose-300 hover:underline text-xs"
              >
                {t.assignment.abandonExam}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-[#111827] rounded-2xl border border-slate-800 shadow-xl p-6 md:p-8 space-y-6">
        
        {/* Meta Info */}
        <div className="text-xs text-slate-400 space-y-1.5 pb-5 border-b border-slate-800">
          <div><b>{t.assignment.openedLabel}</b> <span className="text-slate-300">{paper.openedDate}</span></div>
          <div><b>{t.assignment.dueLabel}</b> <span className="text-slate-300">{paper.dueDate}</span></div>
          <div className="text-blue-400">
            <b>{t.assignment.strictTimeLabel}</b> <span className="font-mono text-blue-300">{t.assignment.strictTimeValue(paper.durationMinutes, paper.gracePeriodMinutes)}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-slate-300 leading-relaxed bg-[#0c1222] p-4 rounded-xl border border-slate-800/80">
          {paper.instructions}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CASE 1: TEACHER VIEW -> Shows Moodle Grading Summary Block    */}
        {/* ------------------------------------------------------------- */}
        {currentUser.role === 'teacher' ? (
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-100">{t.assignment.gradingSummaryTitle}</h3>
            
            <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
              <div className="grid grid-cols-2 p-3 bg-[#0c1222] border-b border-slate-800">
                <span className="font-semibold text-slate-400">{t.assignment.participantsLabel}</span>
                <span className="font-medium text-slate-200">{t.assignment.participantsValue}</span>
              </div>
              <div className="grid grid-cols-2 p-3 bg-[#111827] border-b border-slate-800">
                <span className="font-semibold text-slate-400">{t.assignment.submittedLabel}</span>
                <span className="font-medium text-slate-200 font-mono">{t.assignment.submittedValue}</span>
              </div>
              <div className="grid grid-cols-2 p-3 bg-[#0c1222] border-b border-slate-800">
                <span className="font-semibold text-slate-400">{t.assignment.questionPaperPdfLabel}</span>
                <span className="font-medium text-blue-400 font-mono">{paper.pdfFileName}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={onViewAllSubmissions}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-md shadow-blue-600/20"
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
              <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-amber-300">
                      {t.assignment.lockedTitle}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {t.assignment.lockedDescBefore}
                      <b>{t.assignment.lockedDescBtnName}</b>
                      {t.assignment.lockedDescMiddle}
                      <b className="font-mono text-amber-200">{t.assignment.lockedDescDuration(paper.durationMinutes)}</b>
                      {t.assignment.lockedDescAfter}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs font-semibold text-amber-300/90 font-mono">
                    {t.assignment.lockedDurationSummary(paper.durationMinutes, paper.gracePeriodMinutes)}
                  </span>

                  <button
                    onClick={onRequestStartExam}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/25 flex items-center space-x-2 transition"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>{t.assignment.startExamViewPaperBtn}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2B: STUDENT IS ACTIVELY WRITING EXAM (Paper is UNLOCKED & Timer is Running) */}
            {activeSession && (
              <div className="space-y-6 border-t border-slate-800 pt-5">
                {/* Unlocked Paper Viewer Header */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0c1222] border border-slate-800 text-xs flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-blue-400">
                      {t.assignment.unlockedPdfTitle}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => window.open(paper.pdfUrl, '_blank')}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t.assignment.openInNewTab}</span>
                    </button>
                    <a
                      href={`${paper.pdfUrl}${paper.pdfUrl?.includes('/api/files/') ? '?download=true' : ''}`}
                      download={paper.pdfFileName || 'question-paper.pdf'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t.common.download}</span>
                    </a>
                  </div>
                </div>

                {/* Embedded PDF Viewer */}
                <div className="w-full h-[580px] rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
                  <iframe
                    src={`${paper.pdfUrl}#toolbar=1`}
                    title="Question Paper PDF"
                    className="w-full h-full border-0"
                  />
                </div>

                {/* Answer Upload Box */}
                <div className="border border-slate-800 rounded-xl p-5 md:p-6 bg-[#0c1222] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                      <UploadCloud className="w-4 h-4 text-blue-400" />
                      <span>{t.assignment.answerSubmissionTitle}</span>
                    </h3>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setUploadMode('PDF')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                        uploadMode === 'PDF' 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {t.assignment.modeSinglePdf}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('IMAGES')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                        uploadMode === 'IMAGES' 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {t.assignment.modeMultiplePhotos}
                    </button>
                  </div>

                  {uploadMode === 'PDF' ? (
                    /* PDF Dropzone */
                    <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-6 bg-[#090d16] text-center transition">
                      <input
                        type="file"
                        id="student-answer-pdf"
                        accept=".pdf"
                        onChange={handlePdfChange}
                        className="hidden"
                      />
                      <label htmlFor="student-answer-pdf" className="cursor-pointer flex flex-col items-center justify-center space-y-2.5">
                        <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-xs">
                          <ArrowDown className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        {selectedFile ? (
                          <div className="text-xs">
                            <span className="font-semibold text-emerald-400 block font-mono">{selectedFile.name}</span>
                            <span className="text-slate-400">{selectedFile.size} &bull; {t.assignment.readyToSubmit}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-300">
                            <span className="font-medium block text-slate-200">{t.assignment.selectSinglePdfTitle}</span>
                            <span className="text-[11px] text-slate-500">{t.assignment.selectSinglePdfHint}</span>
                          </div>
                        )}
                      </label>
                    </div>
                  ) : (
                    /* Multi Photos Dropzone */
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-6 bg-[#090d16] text-center transition">
                        <input
                          type="file"
                          id="student-answer-images"
                          multiple
                          accept="image/*"
                          onChange={handleImagesChange}
                          className="hidden"
                        />
                        <label htmlFor="student-answer-images" className="cursor-pointer flex flex-col items-center justify-center space-y-2 text-xs">
                          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                            <ArrowDown className="w-5 h-5" />
                          </div>
                          <span className="font-medium text-slate-200">{t.assignment.selectMultiPhotosTitle}</span>
                          <span className="text-[11px] text-slate-500">{t.assignment.selectMultiPhotosHint}</span>
                        </label>
                      </div>

                      {selectedImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {selectedImages.map((img, idx) => (
                            <div key={img.id} className="p-2.5 rounded-lg bg-[#090d16] border border-slate-800 flex items-center justify-between">
                              <span className="truncate max-w-[100px] text-slate-300 font-mono">{t.assignment.pagePrefix(idx + 1)} {img.name}</span>
                              <button onClick={() => removeImage(img.id)} className="text-rose-400 p-1 hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
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
                      className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition flex items-center space-x-2 ${
                        !canSubmit || isHardExpired
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          : isSubmitting
                          ? 'bg-blue-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25'
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
              <h3 className="font-bold text-lg text-slate-100 tracking-tight">
                {t.assignment.submissionStatusTitle}
              </h3>

              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-800">
                      <td className="w-1/3 p-3.5 font-semibold text-slate-400 bg-[#0c1222] border-r border-slate-800">
                        {t.assignment.rowSubmissionStatus}
                      </td>
                      <td className={`p-3.5 ${submission ? 'bg-emerald-500/10 text-emerald-400 font-semibold' : 'text-slate-300'}`}>
                        {submission ? t.assignment.submittedForGrading : t.assignment.noSubmissionsYet}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-800">
                      <td className="w-1/3 p-3.5 font-semibold text-slate-400 bg-[#0c1222] border-r border-slate-800">
                        {t.assignment.rowGradingStatus}
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {submission && submission.marks !== null ? (
                          <span className="font-bold text-emerald-400 font-mono">
                            {t.assignment.gradedValue(submission.marks, paper.totalMarks)}
                          </span>
                        ) : (
                          <span className="text-slate-500">{t.assignment.notGraded}</span>
                        )}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-800">
                      <td className="w-1/3 p-3.5 font-semibold text-slate-400 bg-[#0c1222] border-r border-slate-800">
                        {t.assignment.rowTimeRemaining}
                      </td>
                      <td className="p-3.5 text-slate-300 font-mono">
                        {submission ? (
                          <span className="text-emerald-400 font-medium">{t.assignment.assignmentSubmitted}</span>
                        ) : activeSession ? (
                          <span className="text-blue-400 font-semibold">{t.assignment.timeLeftSuffix(formatTime(hardSecondsLeft))}</span>
                        ) : (
                          <span className="text-slate-400">{t.assignment.availableByDueDate}</span>
                        )}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-800">
                      <td className="w-1/3 p-3.5 font-semibold text-slate-400 bg-[#0c1222] border-r border-slate-800">
                        {t.assignment.rowLastModified}
                      </td>
                      <td className="p-3.5 text-slate-300 font-mono">
                        {submission ? submission.submittedAt : '-'}
                      </td>
                    </tr>

                    {submission && (
                      <tr className="border-b border-slate-800">
                        <td className="w-1/3 p-3.5 font-semibold text-slate-400 bg-[#0c1222] border-r border-slate-800">
                          {t.assignment.rowFileSubmissions}
                        </td>
                        <td className="p-3.5 text-slate-300">
                          <div className="flex items-center space-x-2 text-blue-400 font-mono">
                            <FileText className="w-4 h-4 text-rose-400" />
                            <span className="hover:underline cursor-pointer font-medium">
                              {submission.fileName}
                            </span>
                            <span className="text-xs text-slate-500">({submission.fileSizeMb})</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td className="w-1/3 p-3.5 font-semibold text-slate-400 bg-[#0c1222] border-r border-slate-800">
                        {t.assignment.rowSubmissionComments}
                      </td>
                      <td className="p-3.5 text-slate-300">
                        <details className="cursor-pointer">
                          <summary className="text-blue-400 hover:underline font-medium">
                            {t.assignment.commentsCount(submission && submission.feedback ? '1' : '0')}
                          </summary>
                          {submission && submission.feedback && (
                            <div className="p-3 mt-2 rounded-lg bg-[#0c1222] border border-slate-800 text-slate-300">
                              <b className="text-blue-400">{t.assignment.teacherFeedbackPrefix}</b> {submission.feedback}
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
      <div className="flex items-center justify-between text-xs text-blue-400">
        <div className="flex items-center space-x-2 flex-wrap">
          <button onClick={onBack} className="hover:text-blue-300 transition">{t.common.courseFullTitle}</button>
          <span className="text-slate-600">&gt;</span>
          <button onClick={onBack} className="hover:text-blue-300 transition font-mono">{paper.code}</button>
          <span className="text-slate-600">&gt;</span>
          <span className="text-slate-300 font-medium">{t.grading.breadcrumbTitle}</span>
        </div>

        <button onClick={onBack} className="text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-1">
          <span>&larr; {t.grading.backToAssignment}</span>
        </button>
      </div>

      <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 md:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-100 flex items-center space-x-2.5">
            <Layers className="w-5 h-5 text-blue-400" />
            <span>{t.grading.headingPrefix} {paper.title}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.grading.subtitle}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-md shadow-emerald-600/25"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{t.grading.exportCsv}</span>
        </button>
      </div>

      <div className="bg-[#111827] rounded-xl border border-slate-800 p-3.5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t.grading.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs bg-[#090d16] text-slate-100 placeholder-slate-500 transition"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-700/80 rounded-xl text-xs text-slate-300 bg-[#090d16] focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">{t.grading.filterAll}</option>
            <option value="ON_TIME">{t.grading.filterOnTime}</option>
            <option value="LATE">{t.grading.filterLate}</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          {t.grading.showingCount(filtered.length)}
        </span>
      </div>

      {/* Submissions Table */}
      <div className="bg-[#111827] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0c1222] border-b border-slate-800 text-slate-400 font-semibold tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">{t.grading.colStudentDetails}</th>
                <th className="p-3.5">{t.grading.colStatus}</th>
                <th className="p-3.5">{t.grading.colDuration}</th>
                <th className="p-3.5">{t.grading.colGrade}</th>
                <th className="p-3.5">{t.grading.colSubmittedAt}</th>
                <th className="p-3.5">{t.grading.colAnswerScript}</th>
                <th className="p-3.5 text-right">{t.grading.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#161f38]/40 transition">
                  <td className="p-3.5">
                    <div className="font-semibold text-blue-400">{sub.studentName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{sub.studentIndex}</div>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold ${
                      sub.status === 'ON_TIME'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : sub.status === 'DISQUALIFIED'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}>
                      {sub.status === 'ON_TIME'
                        ? t.grading.statusOnTime
                        : sub.status === 'DISQUALIFIED'
                        ? t.grading.statusDisqualified
                        : t.grading.statusLate}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">
                    {t.common.minsUnit(sub.durationTakenMins)}
                  </td>
                  <td className="p-3.5 font-semibold font-mono">
                    {sub.marks !== null ? (
                      <span className="text-emerald-400">{sub.marks} / {paper.totalMarks}</span>
                    ) : (
                      <span className="text-slate-500 italic font-normal">{t.grading.notGraded}</span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                    {sub.submittedAt}
                  </td>
                  <td className="p-3.5 font-medium text-blue-400 max-w-xs truncate font-mono">
                    {sub.filePath ? (
                      <a 
                        href={sub.filePath} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center space-x-1.5 hover:underline text-blue-400"
                      >
                        <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate">{sub.fileName}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                      </a>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-rose-400" />
                        <span>{sub.fileName}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onGradeSubmission(sub)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-xs"
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
function MoodleCreatePaperModal({ t, onSave, onClose }) {
  const [title, setTitle] = useState('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#111827] rounded-2xl border border-slate-800 max-w-lg w-full p-6 md:p-7 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <h3 className="text-base font-bold text-slate-100 tracking-tight">
            {t.createPaperModal.heading}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">{t.createPaperModal.paperTitleLabel}</label>
            <input
              type="text"
              required
              placeholder={t.createPaperModal.paperTitlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs bg-[#090d16] text-slate-100 placeholder-slate-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">{t.createPaperModal.subjectStreamLabel}</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 text-xs bg-[#090d16] text-slate-200 transition"
              >
                <option value="Pure Mathematics">{t.createPaperModal.streamPure}</option>
                <option value="Applied Mathematics">{t.createPaperModal.streamApplied}</option>
                <option value="Combined Mathematics (Full)">{t.createPaperModal.streamCombined}</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">{t.createPaperModal.durationLabel}</label>
              <input
                type="number"
                required
                min="10"
                max="360"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-mono bg-[#090d16] text-slate-100 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">{t.createPaperModal.graceBufferLabel}</label>
            <input
              type="number"
              required
              min="2"
              max="60"
              value={gracePeriodMinutes}
              onChange={(e) => setGracePeriodMinutes(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-mono bg-[#090d16] text-slate-100 transition"
            />
          </div>

          <div className="p-3.5 bg-[#0c1222] border border-slate-800 rounded-xl space-y-2">
            <label className="block text-slate-300 font-semibold">{t.createPaperModal.uploadPdfLabel}</label>
            <input
              type="file"
              accept=".pdf"
              id="teacher-new-pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
            <label
              htmlFor="teacher-new-pdf"
              className="border border-dashed border-slate-700 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-blue-500/60 bg-[#090d16] transition"
            >
              <span className="text-xs text-slate-300 truncate">
                {pdfFile ? `${pdfFile.name} (${pdfFile.size})` : t.createPaperModal.selectPdfPrompt}
              </span>
              <UploadCloud className="w-4 h-4 text-blue-400 shrink-0" />
            </label>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">{t.createPaperModal.instructionsLabel}</label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 text-xs bg-[#090d16] text-slate-100 placeholder-slate-500 transition"
            />
          </div>

          <div className="flex justify-end space-x-2.5 pt-3.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/25 transition"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#111827] rounded-2xl border border-slate-800 max-w-lg w-full p-6 md:p-7 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div>
            <h3 className="text-base font-bold text-slate-100 tracking-tight">{t.gradeModal.heading}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t.gradeModal.studentLabel} <b className="text-blue-400">{submission.studentName}</b> (<span className="font-mono text-slate-300">{submission.studentIndex}</span>)</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition">✕</button>
        </div>

        <div className="p-3.5 bg-[#0c1222] rounded-xl border border-slate-800 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">{t.gradeModal.fileScriptLabel}</span>
            <span className="font-semibold text-blue-400 font-mono">{submission.fileName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{t.gradeModal.durationTakenLabel}</span>
            <span className="font-mono text-slate-200">{t.common.minsUnit(submission.durationTakenMins)}</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">{t.gradeModal.gradeOutOfLabel(paper.totalMarks)}</label>
            <input
              type="number"
              min="0"
              max={paper.totalMarks}
              required
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-base font-bold bg-[#090d16] text-emerald-400 transition"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">{t.gradeModal.feedbackLabel}</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t.gradeModal.feedbackPlaceholder}
              className="w-full px-3.5 py-2.5 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 text-xs bg-[#090d16] text-slate-100 placeholder-slate-500 transition"
            />
          </div>

          <div className="flex justify-end space-x-2.5 pt-3.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/25 transition"
            >
              {t.gradeModal.saveChanges}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
