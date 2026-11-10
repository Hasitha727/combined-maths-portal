import React, { useState, useEffect } from 'react';
import { api } from './services/api';
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
  Unlock 
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

export default function App() {
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
    if (!window.confirm('මෙම ප්‍රශ්න පත්‍රය ස්ථිරවම මකා දැමීමට අවශ්‍ය බව සහතිකද? (Are you sure you want to delete this paper?)')) {
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
    showToast('ප්‍රශ්න පත්‍රය සාර්ථකව මකා දමන ලදී (Paper deleted).', 'info');
  };

  // Sync with LocalStorage
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
    showToast(`Logged in as ${user.name} (${user.role.toUpperCase()})`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveSession(null);
    setShowUserDropdown(false);
    setActiveView('courses');
    showToast('You have been logged out.', 'info');
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
    showToast('විභාගය ආරම්භ විය! ප්‍රශ්න පත්‍රය විවෘත වූ අතර කාලය ගණනය වීම ආරම්භ විය.', 'warning');
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
      showToast('🎉 පිළිතුරු පත්‍රය නියමිත වේලාවට සාර්ථකව භාර දෙන ලදී (Submitted On Time)!', 'success');
    } else if (newSub.status === 'LATE') {
      showToast('⚠️ Grace period එක තුළ පිළිතුරු පත්‍රය ලැබුණි (Submitted Late).', 'warning');
    } else {
      showToast('❌ නියමිත කාල සීමාව ඉක්මවා ගිය බැවින් Disqualified විය.', 'error');
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
      instructions: newPaperData.instructions || 'සියලුම ප්‍රශ්න වලට පිළිතුරු සපයන්න.',
      totalMarks: Number(newPaperData.totalMarks || 100)
    };

    setPapers([newPaper, ...papers]);
    setShowAddPaperModal(false);
    showToast('නව ප්‍රශ්න පත්‍රය සාර්ථකව එක් කරන ලදී!', 'success');
  };

  // If not logged in, show clean Moodle login
  if (!currentUser) {
    return <MoodleLoginPage onLogin={handleLogin} presetUsers={PRESET_USERS} />;
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
              <h3 className="text-base font-bold text-rose-300">අවවාදයයි: ඔබ විභාග පිටුවෙන් ඉවත් විය!</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                විභාගය අතරතුර වෙනත් Tabs හෝ Apps වලට මාරුවීම ගණනය කෙරේ. දැනට ඔබ <b className="text-rose-400 font-mono">{activeSession.tabSwitches || 1} වතාවක්</b> පිටුවෙන් ඉවත් වී ඇත. මෙම තොරතුර ගුරුවරයාට වාර්තා වේ.
              </p>
            </div>
            <button
              onClick={() => setTabSwitchAlert(false)}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition"
            >
              තේරුම් ගත්තා (ආපසු විභාගයට)
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 md:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div 
            onClick={() => setActiveView('courses')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-slate-900 border border-amber-400/30 shadow-md shadow-amber-500/10 shrink-0 group-hover:scale-105 transition">
              <GraduationCap className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-100 block leading-tight tracking-tight">
                Combined Mathematics
              </span>
              <span className="text-[11px] text-slate-400 font-medium">2026 A/L Testing Portal</span>
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
              ප්‍රශ්න පත්‍ර (Papers)
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
                ලකුණු ලබා දීම (Grading)
              </button>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2.5">
          {currentUser.role === 'teacher' && (
            <button
              onClick={() => setShowAddPaperModal(true)}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-md shadow-blue-600/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Model Paper</span>
            </button>
          )}

          {/* User Badge */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {currentUser.initials || 'ST'}
            </div>
            <div className="text-left">
              <span className="font-semibold text-slate-200 block leading-none">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentUser.role === 'student' ? (currentUser.indexNo || 'Student') : 'Teacher / Admin'}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-medium transition flex items-center space-x-1"
            title="Log out (පද්ධතියෙන් ඉවත් වන්න)"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Log out</span>
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
            onRequestStartExam={() => setShowConfirmStartModal(true)}
            onSubmitAnswer={handleSubmitAnswer}
            onCancelExam={() => {
              if (confirm('ඔබට සැබවින්ම විභාගයෙන් ඉවත් වීමට අවශ්‍යද?')) {
                setActiveSession(null);
                showToast('විභාග සැසිය අවලංගු කරන ලදී.', 'info');
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
            onSelectPaper={(id) => setSelectedPaperId(id)}
            onGradeSubmission={(sub) => setGradingSubmission(sub)}
            onBack={() => setActiveView('assignment')}
          />
        ) : (
          <MoodleCoursesView 
            papers={papers}
            currentUser={currentUser}
            submissions={submissions}
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
                <span>වැදගත් විභාග නිවේදනය (Exam Notice):</span>
              </div>
              <p>
                <b>"Start Exam & View Paper"</b> බොත්තම එබූ විගස පමණක් ප්‍රශ්න පත්‍රය විවෘත වන අතර ඔබගේ නියමිත ලිවීමේ කාලය <b className="font-mono">({currentPaper.durationMinutes} minutes)</b> ගණනය වීම ආරම්භ වේ.
              </p>
              <p>
                ලිවීම සඳහා විනාඩි {currentPaper.durationMinutes}ක් සහ පිළිතුරු upload කිරීමට අමතර <b>මිනිත්තු {currentPaper.gracePeriodMinutes}ක Grace Period</b> එකක් ලැබේ. Tab switches ගණනය වේ.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmStartModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition"
              >
                පසුබසින්න (Cancel)
              </button>
              <button
                onClick={handleStartExam}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 flex items-center space-x-1.5 transition"
              >
                <span>විභාගය අරඹා ප්‍රශ්න පත්‍රය බලන්න</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Paper Modal (Teacher) */}
      {showAddPaperModal && (
        <MoodleCreatePaperModal 
          onSave={handleCreatePaper}
          onClose={() => setShowAddPaperModal(false)}
        />
      )}

      {/* Grade Submission Modal (Teacher) */}
      {gradingSubmission && currentPaper && (
        <MoodleGradeModal 
          submission={gradingSubmission}
          paper={currentPaper}
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
            showToast('Marks & feedback saved successfully.', 'success');
          }}
          onClose={() => setGradingSubmission(null)}
        />
      )}

      {/* Clean Footer */}
      <footer className="bg-[#0b0f19] border-t border-slate-800/80 py-4 mt-auto text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Combined Mathematics 2026 (A/L) &bull; Online Examination Portal</span>
          <span>Logged in as <b className="text-slate-200">{currentUser.name}</b> {currentUser.indexNo ? <span className="font-mono text-slate-400">({currentUser.indexNo})</span> : ''}</span>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------------
// 1. MOODLE LOGIN & REGISTRATION PAGE
// ---------------------------------------------------------------------------------
function MoodleLoginPage({ onLogin, presetUsers }) {
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
        setLoginError(err.message || 'Invalid username or password. Please try again.');
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
      setRegError('Passwords do not match! (මුරපද එකිනෙකට නොගැළපේ)');
      return;
    }

    if (regPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
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
      setRegError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="max-w-md w-full bg-[#111827] rounded-2xl border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6">
        <div className="text-center space-y-2.5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 mx-auto flex items-center justify-center text-slate-950 border border-amber-400/40 shadow-lg shadow-amber-500/10">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Combined Mathematics LMS
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            A/L Combined Mathematics Online Testing & Examination Portal
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
            Log in (ඇතුල් වන්න)
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
            New Student Register (ලියාපදිංචිය)
          </button>
        </div>

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <div className="space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-950/70 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Email or Student Index No</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. cm26089@student.maths.lk or CM-26-089"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-100 placeholder-slate-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter password"
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Log in (ඇතුල් වන්න)</span>
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
                Course Lecturer / Admin Login (Click to fill)
              </button>
            </div>
          </div>
        )}

        {/* REGISTRATION FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            {regError && (
              <div className="p-3 bg-rose-950/70 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {regError}
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Student Full Name (සම්පූර්ණ නම) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kasun Chamara Bandara"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-100 placeholder-slate-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Index Number / ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CM-26-105"
                  value={regIndexNo}
                  onChange={(e) => setRegIndexNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-mono text-slate-100 placeholder-slate-500 transition"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">WhatsApp / Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="07x xxx xxxx"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-100 placeholder-slate-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                placeholder="student@gmail.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-100 placeholder-slate-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Create password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-100 placeholder-slate-500 transition"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Confirm Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Confirm password"
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
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register as Student (ලියාපදිංචි වන්න)</span>
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
function MoodleCoursesView({ papers, currentUser, submissions, onSelectPaper, onDeletePaper, onOpenGrading, onOpenAddPaperModal }) {
  return (
    <div className="space-y-6">
      {/* Course Banner */}
      <div className="bg-[#111827] rounded-2xl border border-slate-800 p-6 md:p-7 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
            Combined Mathematics 2026 (A/L)
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight mt-1">
            Examination Papers & Real-Time Test Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            ප්‍රශ්න පත්‍රය ආරම්භ කළ විගස නියමිත කාලය ගණනය වන අතර, නියමිත වේලාව තුළ පමණක් පිළිතුරු upload කළ යුතුය.
          </p>
        </div>

        {currentUser.role === 'teacher' && (
          <button
            onClick={onOpenAddPaperModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shrink-0 shadow-md shadow-blue-600/25"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add an exam paper (නව පත්‍රයක් එක් කරන්න)</span>
          </button>
        )}
      </div>

      {/* Papers Table */}
      <div className="bg-[#111827] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 md:px-6 border-b border-slate-800 bg-[#0c1222] flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-200 flex items-center space-x-2.5">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Assigned Examination Papers</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
            {papers.length} Papers Active
          </span>
        </div>

        {papers.length === 0 ? (
          <div className="p-12 md:p-16 text-center space-y-3.5">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-400 mx-auto flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-200">දැනට සක්‍රීය ප්‍රශ්න පත්‍ර නොමැත (No Active Exam Papers)</h4>
              <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                {currentUser.role === 'teacher' 
                  ? 'පන්තියේ සිසුන් සඳහා නව ප්‍රශ්න පත්‍රයක් (PDF) එක් කිරීමට පහත බොත්තම ඔබන්න.' 
                  : 'ගුරුවරයා විසින් නව ප්‍රශ්න පත්‍රයක් ප්‍රකාශයට පත් කළ පසු එය මෙහි දිස්වනු ඇත.'}
              </p>
            </div>
            {currentUser.role === 'teacher' && (
              <button
                onClick={onOpenAddPaperModal}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-md shadow-blue-600/25 mt-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>නව ප්‍රශ්න පත්‍රයක් එක් කරන්න (Add Model Paper)</span>
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
                        <span>Duration: <b className="text-slate-200 font-mono">{paper.durationMinutes} mins</b></span>
                        <span>&bull;</span>
                        <span>Grace: <b className="text-slate-200 font-mono">+{paper.gracePeriodMinutes} mins</b></span>
                        <span>&bull;</span>
                        <span>Due: <b className="text-slate-300">{paper.dueDate}</b></span>
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
                          {studentSub.marks !== null ? `Graded: ${studentSub.marks}/${paper.totalMarks}` : 'Submitted for Grading'}
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectPaper(paper.id)}
                          className="text-xs font-semibold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition shadow-md shadow-blue-600/20 flex items-center space-x-1.5"
                        >
                          <span>Start Exam</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onOpenGrading(paper.id)}
                          className="text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20 transition"
                        >
                          Submissions & Grade
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePaper(paper.id);
                          }}
                          title="Delete Paper"
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
          <button onClick={onBack} className="hover:text-blue-300 transition">Combined Mathematics 2026 (A/L)</button>
          <span className="text-slate-600">&gt;</span>
          <button onClick={onBack} className="hover:text-blue-300 transition font-mono">{paper.code}</button>
          <span className="text-slate-600">&gt;</span>
          <span className="text-slate-300 font-medium">{paper.title}</span>
        </div>

        <button onClick={onBack} className="text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-1">
          <span>&larr; Back to papers</span>
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
                    ? 'Exam Terminated' 
                    : isWritingOver 
                    ? 'Upload Grace Period Remaining' 
                    : 'Time Remaining to Write Paper'}
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
                Tab switches: {activeSession.tabSwitches || 0}
              </span>

              <button
                onClick={onCancelExam}
                className="text-rose-400 hover:text-rose-300 hover:underline text-xs"
              >
                Abandon Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-[#111827] rounded-2xl border border-slate-800 shadow-xl p-6 md:p-8 space-y-6">
        
        {/* Meta Info */}
        <div className="text-xs text-slate-400 space-y-1.5 pb-5 border-b border-slate-800">
          <div><b>Opened:</b> <span className="text-slate-300">{paper.openedDate}</span></div>
          <div><b>Due:</b> <span className="text-slate-300">{paper.dueDate}</span></div>
          <div className="text-blue-400">
            <b>Strict Examination Time:</b> <span className="font-mono text-blue-300">{paper.durationMinutes} minutes</span> (+{paper.gracePeriodMinutes} mins scan/upload grace buffer)
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
            <h3 className="font-bold text-base text-slate-100">Grading summary</h3>
            
            <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
              <div className="grid grid-cols-2 p-3 bg-[#0c1222] border-b border-slate-800">
                <span className="font-semibold text-slate-400">Participants</span>
                <span className="font-medium text-slate-200">Class Students</span>
              </div>
              <div className="grid grid-cols-2 p-3 bg-[#111827] border-b border-slate-800">
                <span className="font-semibold text-slate-400">Submitted</span>
                <span className="font-medium text-slate-200 font-mono">Active</span>
              </div>
              <div className="grid grid-cols-2 p-3 bg-[#0c1222] border-b border-slate-800">
                <span className="font-semibold text-slate-400">Question Paper PDF</span>
                <span className="font-medium text-blue-400 font-mono">{paper.pdfFileName}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={onViewAllSubmissions}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-md shadow-blue-600/20"
              >
                View all submissions & Grade
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
                      ප්‍රශ්න පත්‍රය ආරක්ෂිතව අගුළුලා ඇත (Paper Locked)
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      විභාගය ආරම්භ කිරීමට පෙර ප්‍රශ්න පත්‍රය බැලීමට හෝ download කිරීමට නොහැක. 
                      ඔබ පහත <b>"Start Exam & View Paper"</b> බොත්තම එබූ විගස පමණක් ප්‍රශ්න පත්‍රය විවෘත වන අතර ඔබගේ නියමිත කාලය <b className="font-mono text-amber-200">({paper.durationMinutes} minutes)</b> ගණනය වීම ආරම්භ වේ.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs font-semibold text-amber-300/90 font-mono">
                    කාලය: පැය {Math.floor(paper.durationMinutes / 60)} යි &bull; Grace buffer: විනාඩි {paper.gracePeriodMinutes} යි
                  </span>

                  <button
                    onClick={onRequestStartExam}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/25 flex items-center space-x-2 transition"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Start Exam & View Paper (විභාගය ආරම්භ කරන්න)</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2B: STUDENT IS ACTIVELY WRITING EXAM (Paper is UNLOCKED & Timer is Running) */}
            {activeSession && (
              <div className="space-y-6 border-t border-slate-800 pt-5">
                {/* Unlocked Paper Viewer Header */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0c1222] border border-slate-800 text-xs">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-blue-400">
                      මුල් ප්‍රශ්න පත්‍රය (Unlocked Question Paper PDF)
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => window.open(paper.pdfUrl, '_blank')}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in New Tab</span>
                    </button>
                    <a
                      href={`${paper.pdfUrl}${paper.pdfUrl?.includes('/api/files/') ? '?download=true' : ''}`}
                      download={paper.pdfFileName || 'question-paper.pdf'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
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
                      <span>පිළිතුරු පත්‍රය Upload කිරීම (Answer Submission)</span>
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
                      Single PDF File
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
                      Multiple Photos (Pages)
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
                            <span className="text-slate-400">{selectedFile.size} &bull; Ready to submit</span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-300">
                            <span className="font-medium block text-slate-200">Click to select Single Answer PDF</span>
                            <span className="text-[11px] text-slate-500">CamScanner / Adobe Scan PDF (Max 50 MB)</span>
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
                          <span className="font-medium text-slate-200">Click to select Multiple Page Photos</span>
                          <span className="text-[11px] text-slate-500">Select all written pages at once (JPG / PNG)</span>
                        </label>
                      </div>

                      {selectedImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {selectedImages.map((img, idx) => (
                            <div key={img.id} className="p-2.5 rounded-lg bg-[#090d16] border border-slate-800 flex items-center justify-between">
                              <span className="truncate max-w-[100px] text-slate-300 font-mono">P.{idx + 1}: {img.name}</span>
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
                          <span>Uploading Answer Script...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Submit Answer Script (පිළිතුරු භාරදෙන්න)</span>
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
                Submission status
              </h3>

              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-800">
                      <td className="w-1/3 p-3.5 font-semibold text-slate-400 bg-[#0c1222] border-r border-slate-800">
                        Submission status
                      </td>
                      <td className={`p-3.5 ${submission ? 'bg-emerald-500/10 text-emerald-400 font-semibold' : 'text-slate-300'}`}>
                        {submission ? 'Submitted for grading' : 'No submissions have been made yet'}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-800">
                      <td className="w-1/3 p-3.5 font-semibold text-slate-400 bg-[#0c1222] border-r border-slate-800">
                        Grading status
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {submission && submission.marks !== null ? (
                          <span className="font-bold text-emerald-400 font-mono">
                            Graded ({submission.marks} / {paper.totalMarks})
                          </span>
                        ) : (
                          <span className="text-slate-500">Not graded</span>
                        )}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-800">
                      <td className="w-1/3 p-3.5 font-semibold text-slate-400 bg-[#0c1222] border-r border-slate-800">
                        Time remaining
                      </td>
                      <td className="p-3.5 text-slate-300 font-mono">
                        {submission ? (
                          <span className="text-emerald-400 font-medium">Assignment was submitted</span>
                        ) : activeSession ? (
                          <span className="text-blue-400 font-semibold">{formatTime(hardSecondsLeft)} remaining</span>
                        ) : (
                          <span className="text-slate-400">Available according to due date</span>
                        )}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-800">
                      <td className="w-1/3 p-3.5 font-semibold text-slate-400 bg-[#0c1222] border-r border-slate-800">
                        Last modified
                      </td>
                      <td className="p-3.5 text-slate-300 font-mono">
                        {submission ? submission.submittedAt : '-'}
                      </td>
                    </tr>

                    {submission && (
                      <tr className="border-b border-slate-800">
                        <td className="w-1/3 p-3.5 font-semibold text-slate-400 bg-[#0c1222] border-r border-slate-800">
                          File submissions
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
                        Submission comments
                      </td>
                      <td className="p-3.5 text-slate-300">
                        <details className="cursor-pointer">
                          <summary className="text-blue-400 hover:underline font-medium">
                            Comments ({submission && submission.feedback ? '1' : '0'})
                          </summary>
                          {submission && submission.feedback && (
                            <div className="p-3 mt-2 rounded-lg bg-[#0c1222] border border-slate-800 text-slate-300">
                              <b className="text-blue-400">Teacher Feedback:</b> {submission.feedback}
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
function MoodleTeacherGradingView({ paper, papers, submissions, onSelectPaper, onGradeSubmission, onBack }) {
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
          <button onClick={onBack} className="hover:text-blue-300 transition">Combined Mathematics 2026 (A/L)</button>
          <span className="text-slate-600">&gt;</span>
          <button onClick={onBack} className="hover:text-blue-300 transition font-mono">{paper.code}</button>
          <span className="text-slate-600">&gt;</span>
          <span className="text-slate-300 font-medium">Submissions grading worksheet</span>
        </div>

        <button onClick={onBack} className="text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-1">
          <span>&larr; Back to assignment</span>
        </button>
      </div>

      <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 md:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-100 flex items-center space-x-2.5">
            <Layers className="w-5 h-5 text-blue-400" />
            <span>Grading Worksheet: {paper.title}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate student answer scripts, record marks /100 and export results.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-md shadow-emerald-600/25"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      <div className="bg-[#111827] rounded-xl border border-slate-800 p-3.5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search student or index..."
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
            <option value="ALL">All submission status</option>
            <option value="ON_TIME">On Time</option>
            <option value="LATE">Late</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filtered.length} submissions
        </span>
      </div>

      {/* Submissions Table */}
      <div className="bg-[#111827] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0c1222] border-b border-slate-800 text-slate-400 font-semibold tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Student details</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Grade</th>
                <th className="p-3.5">Submitted At</th>
                <th className="p-3.5">Answer Script</th>
                <th className="p-3.5 text-right">Action</th>
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
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}>
                      {sub.status === 'ON_TIME' ? 'Submitted On Time' : 'Submitted Late'}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">
                    {sub.durationTakenMins} mins
                  </td>
                  <td className="p-3.5 font-semibold font-mono">
                    {sub.marks !== null ? (
                      <span className="text-emerald-400">{sub.marks} / {paper.totalMarks}</span>
                    ) : (
                      <span className="text-slate-500 italic font-normal">Not graded</span>
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
                      Grade
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
function MoodleCreatePaperModal({ onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Pure Mathematics');
  const [durationMinutes, setDurationMinutes] = useState('180');
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState('15');
  const [dueDate, setDueDate] = useState('Wednesday, 11 November 2026, 11:59 PM');
  const [instructions, setInstructions] = useState('සියලුම ප්‍රශ්න වලට පිළිතුරු සපයන්න. පැහැදිලි පියවර සටහන් කරන්න.');
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
            Add a new Exam Paper / Test
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Paper Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Model Paper 03 - Pure Mathematics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs bg-[#090d16] text-slate-100 placeholder-slate-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Subject Stream</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 text-xs bg-[#090d16] text-slate-200 transition"
              >
                <option value="Pure Mathematics">Pure Mathematics</option>
                <option value="Applied Mathematics">Applied Mathematics</option>
                <option value="Combined Mathematics (Full)">Combined Mathematics (Full)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Exam Duration (Mins)</label>
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
            <label className="block text-slate-300 font-medium mb-1.5">Upload Grace Buffer (Mins)</label>
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
            <label className="block text-slate-300 font-semibold">Upload Question Paper PDF</label>
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
                {pdfFile ? `${pdfFile.name} (${pdfFile.size})` : 'Select Question Paper PDF from computer'}
              </span>
              <UploadCloud className="w-4 h-4 text-blue-400 shrink-0" />
            </label>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Instructions</label>
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
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/25 transition"
            >
              Save and Publish
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
function MoodleGradeModal({ submission, paper, onSave, onClose }) {
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
            <h3 className="text-base font-bold text-slate-100 tracking-tight">Grade Submission</h3>
            <p className="text-xs text-slate-400 mt-0.5">Student: <b className="text-blue-400">{submission.studentName}</b> (<span className="font-mono text-slate-300">{submission.studentIndex}</span>)</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition">✕</button>
        </div>

        <div className="p-3.5 bg-[#0c1222] rounded-xl border border-slate-800 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">File script:</span>
            <span className="font-semibold text-blue-400 font-mono">{submission.fileName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Duration taken:</span>
            <span className="font-mono text-slate-200">{submission.durationTakenMins} mins</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Grade out of {paper.totalMarks}</label>
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
            <label className="block text-slate-300 font-medium mb-1.5">Feedback comments</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter feedback comments for the student..."
              className="w-full px-3.5 py-2.5 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 text-xs bg-[#090d16] text-slate-100 placeholder-slate-500 transition"
            />
          </div>

          <div className="flex justify-end space-x-2.5 pt-3.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/25 transition"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
