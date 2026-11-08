import React, { useState, useEffect, useRef } from 'react';
import { api } from './services/api';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Layers, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  RefreshCw, 
  LogOut, 
  BookOpen, 
  ArrowRight, 
  PlusCircle, 
  Bell, 
  MessageSquare, 
  Folder, 
  FilePlus, 
  Grid, 
  List, 
  FolderTree, 
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
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  Image as ImageIcon 
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
    <div className="min-h-screen bg-[#f2f4f8] text-[#1d2125] flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2.5 border text-xs font-medium ${
            toastMessage.type === 'error'
              ? 'bg-[#f8d7da] border-[#f5c2c7] text-[#842029]'
              : toastMessage.type === 'warning'
              ? 'bg-[#fff3cd] border-[#ffecb5] text-[#664d03]'
              : 'bg-[#d1e7dd] border-[#badbcc] text-[#0f5132]'
          }`}>
            {toastMessage.type === 'error' && <XCircle className="w-4 h-4 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0" />}
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Anti-Cheat Tab Switch Alert Modal */}
      {tabSwitchAlert && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-[#f5c2c7] max-w-md w-full p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-[#f8d7da] text-[#842029] mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#842029]">අවවාදයයි: ඔබ විභාග පිටුවෙන් ඉවත් විය!</h3>
              <p className="text-xs text-[#495057] mt-1.5 leading-relaxed">
                විභාගය අතරතුර වෙනත් Tabs හෝ Apps වලට මාරුවීම ගණනය කෙරේ. දැනට ඔබ <b>{activeSession.tabSwitches || 1} වතාවක්</b> පිටුවෙන් ඉවත් වී ඇත. මෙම තොරතුර ගුරුවරයාට වාර්තා වේ.
              </p>
            </div>
            <button
              onClick={() => setTabSwitchAlert(false)}
              className="w-full py-2 rounded bg-[#0f6cbf] hover:bg-[#0b5190] text-white font-semibold text-xs"
            >
              තේරුම් ගත්තා (ආපසු විභාගයට)
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-white border-b border-[#dee2e6] sticky top-0 z-40 px-4 md:px-6 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div 
            onClick={() => setActiveView('courses')}
            className="flex items-center space-x-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#997300] to-[#cca300] flex items-center justify-center text-white border-2 border-[#806000] shadow-xs shrink-0">
              <GraduationCap className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <span className="font-bold text-sm text-[#1d2125] block leading-tight">
                Combined Mathematics
              </span>
              <span className="text-[11px] text-[#6c757d]">2026 A/L Testing Portal</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-1 pl-3 border-l border-slate-200">
            <button 
              onClick={() => setActiveView('courses')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                activeView === 'courses' 
                  ? 'bg-[#e7f1ff] text-[#0f6cbf]' 
                  : 'text-[#495057] hover:bg-slate-100'
              }`}
            >
              ප්‍රශ්න පත්‍ර (Papers)
            </button>
            {currentUser.role === 'teacher' && (
              <button 
                onClick={() => setActiveView('teacher_grading')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                  activeView === 'teacher_grading' 
                    ? 'bg-[#e7f1ff] text-[#0f6cbf]' 
                    : 'text-[#495057] hover:bg-slate-100'
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
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#0f6cbf] hover:bg-[#0b5190] text-white font-medium text-xs transition shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Model Paper</span>
            </button>
          )}

          {/* User Badge */}
          <div className="flex items-center space-x-2 px-2.5 py-1 bg-[#f8f9fa] border border-[#dee2e6] rounded-md text-xs">
            <div className="w-6 h-6 rounded-full bg-[#0f6cbf] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {currentUser.initials || 'ST'}
            </div>
            <div className="text-left">
              <span className="font-semibold text-[#1d2125] block leading-none">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-[#6c757d]">
                {currentUser.role === 'student' ? (currentUser.indexNo || 'Student') : 'Teacher / Admin'}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-rose-50 text-[#d9383a] hover:bg-rose-100 border border-rose-200 text-xs font-medium transition flex items-center space-x-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-[#dee2e6] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-[#e7f1ff] text-[#0f6cbf] flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#0f6cbf] uppercase tracking-wide">{currentPaper.subject}</span>
              <h3 className="text-base font-bold text-[#1d2125] mt-0.5">{currentPaper.title}</h3>
            </div>

            {/* Strict Exam Start Notice */}
            <div className="p-3.5 rounded bg-[#fff3cd] border border-[#ffecb5] text-[#664d03] text-xs space-y-2 leading-relaxed">
              <div className="font-bold flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>වැදගත් විභාග නිවේදනය (Exam Notice):</span>
              </div>
              <p>
                <b>"Start Exam & View Paper"</b> බොත්තම එබූ විගස පමණක් ප්‍රශ්න පත්‍රය විවෘත වන අතර ඔබගේ නියමිත ලිවීමේ කාලය <b>({currentPaper.durationMinutes} minutes)</b> ගණනය වීම ආරම්භ වේ.
              </p>
              <p>
                ලිවීම සඳහා විනාඩි {currentPaper.durationMinutes}ක් සහ පිළිතුරු upload කිරීමට අමතර <b>මිනිත්තු {currentPaper.gracePeriodMinutes}ක Grace Period</b> එකක් ලැබේ. Tab switches ගණනය වේ.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmStartModal(false)}
                className="px-4 py-2 rounded bg-[#f8f9fa] border border-[#ced4da] text-[#495057] hover:bg-slate-200 text-xs font-medium"
              >
                පසුබසින්න (Cancel)
              </button>
              <button
                onClick={handleStartExam}
                className="px-4 py-2 rounded bg-[#0f6cbf] hover:bg-[#0b5190] text-white font-semibold text-xs shadow-xs flex items-center space-x-1.5"
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
      <footer className="bg-white border-t border-[#dee2e6] py-3 mt-auto text-center text-xs text-[#6c757d]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Combined Mathematics 2026 (A/L) &bull; Online Examination Portal</span>
          <span>Logged in as <b>{currentUser.name}</b> {currentUser.indexNo ? `(${currentUser.indexNo})` : ''}</span>
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
    <div className="min-h-screen bg-[#f2f4f8] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg border border-[#dee2e6] shadow-sm p-6 md:p-8 space-y-5">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#997300] to-[#cca300] mx-auto flex items-center justify-center text-white border-2 border-[#806000] shadow-sm">
            <GraduationCap className="w-9 h-9 text-amber-100" />
          </div>
          <h1 className="text-xl font-bold text-[#1d2125]">
            Combined Mathematics LMS
          </h1>
          <p className="text-xs text-[#6c757d]">
            A/L Combined Mathematics Online Testing & Examination Portal
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#dee2e6]">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition ${
              activeTab === 'login'
                ? 'border-[#0f6cbf] text-[#0f6cbf]'
                : 'border-transparent text-[#6c757d] hover:text-[#1d2125]'
            }`}
          >
            Log in (ඇතුල් වන්න)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition ${
              activeTab === 'register'
                ? 'border-[#0f6cbf] text-[#0f6cbf]'
                : 'border-transparent text-[#6c757d] hover:text-[#1d2125]'
            }`}
          >
            New Student Register (ලියාපදිංචිය)
          </button>
        </div>

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <div className="space-y-4">
            {loginError && (
              <div className="p-2.5 bg-[#f8d7da] border border-[#f5c2c7] rounded text-xs text-[#842029]">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#495057] font-medium mb-1">Email or Student Index No</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. cm26089@student.maths.lk or CM-26-089"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] text-xs bg-white text-[#1d2125]"
                />
              </div>

              <div>
                <label className="block text-[#495057] font-medium mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] text-xs bg-white text-[#1d2125]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 px-4 rounded bg-[#0f6cbf] hover:bg-[#0b5190] text-white font-semibold text-xs transition shadow-xs flex items-center justify-center space-x-2"
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
            <div className="pt-2 border-t border-[#dee2e6] text-center">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('teacher@maths.lk');
                  setPassword('admin');
                }}
                className="text-[11px] text-[#0f6cbf] hover:underline"
              >
                Course Lecturer / Admin Login (Click to fill)
              </button>
            </div>
          </div>
        )}

        {/* REGISTRATION FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            {regError && (
              <div className="p-2.5 bg-[#f8d7da] border border-[#f5c2c7] rounded text-xs text-[#842029]">
                {regError}
              </div>
            )}

            <div>
              <label className="block text-[#495057] font-medium mb-1">Student Full Name (සම්පූර්ණ නම) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kasun Chamara Bandara"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-3 py-2 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] text-xs bg-white text-[#1d2125]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#495057] font-medium mb-1">Index Number / ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CM-26-105"
                  value={regIndexNo}
                  onChange={(e) => setRegIndexNo(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] text-xs bg-white text-[#1d2125]"
                />
              </div>
              <div>
                <label className="block text-[#495057] font-medium mb-1">WhatsApp / Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="07x xxx xxxx"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] text-xs bg-white text-[#1d2125]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#495057] font-medium mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="student@gmail.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] text-xs bg-white text-[#1d2125]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#495057] font-medium mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Create password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] text-xs bg-white text-[#1d2125]"
                />
              </div>
              <div>
                <label className="block text-[#495057] font-medium mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Confirm password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] text-xs bg-white text-[#1d2125]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-2.5 px-4 rounded bg-[#198754] hover:bg-[#146c43] text-white font-semibold text-xs transition shadow-xs flex items-center justify-center space-x-2"
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
    <div className="space-y-5">
      <div className="bg-white rounded-lg border border-[#dee2e6] p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-[#0f6cbf] uppercase tracking-wide">
            Combined Mathematics 2026 (A/L)
          </span>
          <h2 className="text-xl font-bold text-[#1d2125] mt-0.5">
            Examination Papers & Real-Time Test Portal
          </h2>
          <p className="text-xs text-[#6c757d] mt-1">
            ප්‍රශ්න පත්‍රය ආරම්භ කළ විගස නියමිත කාලය ගණනය වන අතර, නියමිත වේලාව තුළ පමණක් පිළිතුරු upload කළ යුතුය.
          </p>
        </div>

        {currentUser.role === 'teacher' && (
          <button
            onClick={onOpenAddPaperModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded bg-[#0f6cbf] hover:bg-[#0b5190] text-white font-medium text-xs transition shrink-0 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add an exam paper (නව පත්‍රයක් එක් කරන්න)</span>
          </button>
        )}
      </div>

      {/* Papers Table */}
      <div className="bg-white rounded-lg border border-[#dee2e6] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#dee2e6] bg-[#f8f9fa] flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#1d2125] flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-[#0f6cbf]" />
            <span>Assigned Examination Papers</span>
          </h3>
          <span className="text-xs text-[#6c757d] font-mono">{papers.length} Papers Active</span>
        </div>

        {papers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#f8f9fa] border border-[#dee2e6] text-[#6c757d] mx-auto flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#0f6cbf]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#1d2125]">දැනට සක්‍රීය ප්‍රශ්න පත්‍ර නොමැත (No Active Exam Papers)</h4>
              <p className="text-xs text-[#6c757d] mt-1 max-w-md mx-auto">
                {currentUser.role === 'teacher' 
                  ? 'පන්තියේ සිසුන් සඳහා නව ප්‍රශ්න පත්‍රයක් (PDF) එක් කිරීමට පහත බොත්තම ඔබන්න.' 
                  : 'ගුරුවරයා විසින් නව ප්‍රශ්න පත්‍රයක් ප්‍රකාශයට පත් කළ පසු එය මෙහි දිස්වනු ඇත.'}
              </p>
            </div>
            {currentUser.role === 'teacher' && (
              <button
                onClick={onOpenAddPaperModal}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded bg-[#0f6cbf] hover:bg-[#0b5190] text-white font-medium text-xs transition shadow-xs mt-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>නව ප්‍රශ්න පත්‍රයක් එක් කරන්න (Add Model Paper)</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#dee2e6]">
            {papers.map((paper) => {
              const studentSub = submissions.find(
                s => s.paperId === paper.id && s.studentIndex === currentUser.indexNo
              );

              return (
                <div 
                  key={paper.id} 
                  className="p-4 hover:bg-[#f8f9fa] transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div 
                    className="flex items-start space-x-3 cursor-pointer flex-1"
                    onClick={() => onSelectPaper(paper.id)}
                  >
                    <div className="w-9 h-9 rounded bg-[#e7f1ff] border border-[#b6d4fe] flex items-center justify-center shrink-0 text-[#0f6cbf] mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-[#0f6cbf] hover:underline flex items-center gap-2">
                        <span>{paper.title}</span>
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-[#495057] border border-slate-200">
                          {paper.code}
                        </span>
                      </h4>
                      <p className="text-xs text-[#6c757d] mt-1 line-clamp-1">{paper.instructions}</p>
                      <div className="flex items-center space-x-3 text-[11px] text-[#6c757d] mt-1.5">
                        <span>Duration: <b>{paper.durationMinutes} mins</b></span>
                        <span>&bull;</span>
                        <span>Grace: <b>+{paper.gracePeriodMinutes} mins</b></span>
                        <span>&bull;</span>
                        <span>Due: <b>{paper.dueDate}</b></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
                    {currentUser.role === 'student' ? (
                      studentSub ? (
                        <button
                          onClick={() => onSelectPaper(paper.id)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded bg-[#d1e7dd] text-[#0f5132] border border-[#badbcc] hover:bg-[#badbcc] transition"
                        >
                          {studentSub.marks !== null ? `Graded: ${studentSub.marks}/${paper.totalMarks}` : 'Submitted for Grading'}
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectPaper(paper.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded bg-[#0f6cbf] hover:bg-[#0b5190] text-white transition shadow-xs flex items-center space-x-1"
                        >
                          <span>Start Exam</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onOpenGrading(paper.id)}
                          className="text-xs font-medium text-[#0f6cbf] bg-[#e7f1ff] hover:bg-[#b6d4fe] px-2.5 py-1.5 rounded border border-[#b6d4fe] transition"
                        >
                          Submissions & Grade
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePaper(paper.id);
                          }}
                          title="Delete Paper"
                          className="p-1.5 rounded text-[#d9383a] hover:bg-[#f8d7da] transition border border-transparent hover:border-[#f5c2c7]"
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
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between text-xs text-[#0f6cbf]">
        <div className="flex items-center space-x-1.5 flex-wrap">
          <button onClick={onBack} className="hover:underline">Combined Mathematics 2026 (A/L)</button>
          <span>&gt;</span>
          <button onClick={onBack} className="hover:underline">{paper.code}</button>
          <span>&gt;</span>
          <span className="text-[#495057] font-medium">{paper.title}</span>
        </div>

        <button onClick={onBack} className="hover:underline">
          &larr; Back to courses
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center space-x-3 pt-1">
        <div className="w-8 h-8 rounded bg-[#fff0f6] border border-[#f783ac] flex items-center justify-center text-[#d6336c]">
          <FileText className="w-5 h-5" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-[#1d2125]">
          {paper.title}
        </h1>
      </div>

      {/* ACTIVE EXAM RUNNING: Sticky Moodle Countdown Header */}
      {activeSession && (
        <div className={`p-4 rounded-lg border transition-all shadow-sm ${
          isHardExpired
            ? 'bg-[#f8d7da] border-[#f5c2c7] text-[#842029]'
            : isWritingOver
            ? 'bg-[#fff3cd] border-[#ffecb5] text-[#664d03] animate-pulse'
            : 'bg-white border-[#0f6cbf] text-[#1d2125]'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isHardExpired ? 'bg-[#842029] text-white' : isWritingOver ? 'bg-[#ffecb5] text-[#664d03]' : 'bg-[#e7f1ff] text-[#0f6cbf]'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider block text-[#6c757d]">
                  {isHardExpired 
                    ? 'Exam Terminated' 
                    : isWritingOver 
                    ? 'Upload Grace Period Remaining' 
                    : 'Time Remaining to Write Paper'}
                </span>
                <span className="text-xl md:text-2xl font-bold font-mono">
                  {isWritingOver ? formatTime(hardSecondsLeft) : formatTime(writingSecondsLeft)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className={`px-2 py-0.5 rounded font-mono font-semibold ${
                activeSession.tabSwitches > 0 ? 'bg-[#f8d7da] text-[#842029]' : 'bg-[#f8f9fa] text-[#495057]'
              }`}>
                Tab switches: {activeSession.tabSwitches || 0}
              </span>

              <button
                onClick={onCancelExam}
                className="text-[#d9383a] hover:underline text-xs"
              >
                Abandon Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-lg border border-[#dee2e6] shadow-xs p-5 md:p-6 space-y-6">
        
        {/* Meta Info */}
        <div className="text-xs text-[#495057] space-y-1 pb-4 border-b border-[#dee2e6]">
          <div><b>Opened:</b> {paper.openedDate}</div>
          <div><b>Due:</b> {paper.dueDate}</div>
          <div className="text-[#0f6cbf]">
            <b>Strict Examination Time:</b> {paper.durationMinutes} minutes (+{paper.gracePeriodMinutes} mins scan/upload grace buffer)
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-[#212529] leading-relaxed">
          {paper.instructions}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CASE 1: TEACHER VIEW -> Shows Moodle Grading Summary Block    */}
        {/* ------------------------------------------------------------- */}
        {currentUser.role === 'teacher' ? (
          <div className="pt-4 border-t border-[#dee2e6] space-y-4">
            <h3 className="font-bold text-base text-[#1d2125]">Grading summary</h3>
            
            <div className="border border-[#dee2e6] rounded-md overflow-hidden text-xs">
              <div className="grid grid-cols-2 p-2.5 bg-white border-b border-[#dee2e6]">
                <span className="font-semibold text-[#495057]">Participants</span>
                <span className="font-medium text-[#212529]">42 Students</span>
              </div>
              <div className="grid grid-cols-2 p-2.5 bg-[#f8f9fa] border-b border-[#dee2e6]">
                <span className="font-semibold text-[#495057]">Submitted</span>
                <span className="font-medium text-[#212529]">1</span>
              </div>
              <div className="grid grid-cols-2 p-2.5 bg-white border-b border-[#dee2e6]">
                <span className="font-semibold text-[#495057]">Needs grading</span>
                <span className="font-medium text-[#d9383a] font-semibold">1</span>
              </div>
              <div className="grid grid-cols-2 p-2.5 bg-[#f8f9fa]">
                <span className="font-semibold text-[#495057]">Question Paper PDF</span>
                <span className="font-medium text-[#0f6cbf]">{paper.pdfFileName}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={onViewAllSubmissions}
                className="px-4 py-2 rounded bg-[#0f6cbf] hover:bg-[#0b5190] text-white font-medium text-xs transition"
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
              <div className="p-5 rounded-lg border border-[#ffecb5] bg-[#fff9db] space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#cca300] text-white flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-[#664d03]">
                      ප්‍රශ්න පත්‍රය ආරක්ෂිතව අගුළුලා ඇත (Paper Locked)
                    </h3>
                    <p className="text-xs text-[#664d03] leading-relaxed">
                      විභාගය ආරම්භ කිරීමට පෙර ප්‍රශ්න පත්‍රය බැලීමට හෝ download කිරීමට නොහැක. 
                      ඔබ පහත <b>"Start Exam & View Paper"</b> බොත්තම එබූ විගස පමණක් ප්‍රශ්න පත්‍රය විවෘත වන අතර ඔබගේ නියමිත කාලය <b>({paper.durationMinutes} minutes)</b> ගණනය වීම ආරම්භ වේ.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#ffecb5]/60 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-semibold text-[#664d03]">
                    කාලය: පැය {Math.floor(paper.durationMinutes / 60)} යි &bull; Grace buffer: විනාඩි {paper.gracePeriodMinutes} යි
                  </span>

                  <button
                    onClick={onRequestStartExam}
                    className="px-5 py-2.5 rounded bg-[#0f6cbf] hover:bg-[#0b5190] text-white font-semibold text-xs shadow-xs flex items-center space-x-1.5 transition"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Start Exam & View Paper (විභාගය ආරම්භ කරන්න)</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2B: STUDENT IS ACTIVELY WRITING EXAM (Paper is UNLOCKED & Timer is Running) */}
            {activeSession && (
              <div className="space-y-6 border-t border-[#dee2e6] pt-5">
                {/* Unlocked Paper Viewer Header */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#e7f1ff] border border-[#b6d4fe] text-xs">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[#0f6cbf]" />
                    <span className="font-semibold text-[#0f6cbf]">
                      මුල් ප්‍රශ්න පත්‍රය (Unlocked Question Paper PDF)
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => window.open(paper.pdfUrl, '_blank')}
                      className="flex items-center space-x-1 px-3 py-1 rounded bg-[#0f6cbf] hover:bg-[#0b5190] text-white text-xs font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in New Tab / Window</span>
                    </button>
                    <a
                      href={paper.pdfUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1 px-3 py-1 rounded bg-white border border-[#ced4da] hover:bg-slate-50 text-[#495057] text-xs font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>

                {/* Embedded PDF Viewer */}
                <div className="w-full h-[550px] rounded-lg border border-[#dee2e6] bg-slate-900 overflow-hidden shadow-inner">
                  <iframe
                    src={`${paper.pdfUrl}#toolbar=1`}
                    title="Question Paper PDF"
                    className="w-full h-full border-0"
                  />
                </div>

                {/* Answer Upload Box (Screenshot 1 Style) */}
                <div className="border border-[#dee2e6] rounded-lg p-5 bg-[#f8f9fa] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#1d2125] flex items-center space-x-2">
                      <UploadCloud className="w-4 h-4 text-[#0f6cbf]" />
                      <span>පිළිතුරු පත්‍රය Upload කිරීම (Answer Submission)</span>
                    </h3>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setUploadMode('PDF')}
                      className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
                        uploadMode === 'PDF' 
                          ? 'bg-[#0f6cbf] text-white border-[#0f6cbf]' 
                          : 'bg-white text-[#495057] border-[#ced4da]'
                      }`}
                    >
                      Single PDF File
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('IMAGES')}
                      className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
                        uploadMode === 'IMAGES' 
                          ? 'bg-[#0f6cbf] text-white border-[#0f6cbf]' 
                          : 'bg-white text-[#495057] border-[#ced4da]'
                      }`}
                    >
                      Multiple Photos (Pages)
                    </button>
                  </div>

                  {uploadMode === 'PDF' ? (
                    /* PDF Dropzone */
                    <div className="border-2 border-dashed border-[#ced4da] rounded-lg p-6 bg-white text-center">
                      <input
                        type="file"
                        id="student-answer-pdf"
                        accept=".pdf"
                        onChange={handlePdfChange}
                        className="hidden"
                      />
                      <label htmlFor="student-answer-pdf" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-[#0f6cbf] text-white flex items-center justify-center shadow-xs">
                          <ArrowDown className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        {selectedFile ? (
                          <div className="text-xs">
                            <span className="font-semibold text-[#0f5132] block">{selectedFile.name}</span>
                            <span className="text-[#6c757d]">{selectedFile.size} &bull; Ready to submit</span>
                          </div>
                        ) : (
                          <div className="text-xs text-[#495057]">
                            <span className="font-medium block">Click to select Single Answer PDF</span>
                            <span className="text-[11px] text-[#6c757d]">CamScanner / Adobe Scan PDF (Max 50 MB)</span>
                          </div>
                        )}
                      </label>
                    </div>
                  ) : (
                    /* Multi Photos Dropzone */
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-[#ced4da] rounded-lg p-5 bg-white text-center">
                        <input
                          type="file"
                          id="student-answer-images"
                          multiple
                          accept="image/*"
                          onChange={handleImagesChange}
                          className="hidden"
                        />
                        <label htmlFor="student-answer-images" className="cursor-pointer flex flex-col items-center justify-center space-y-1 text-xs">
                          <div className="w-9 h-9 rounded-full bg-[#0f6cbf] text-white flex items-center justify-center">
                            <ArrowDown className="w-5 h-5" />
                          </div>
                          <span className="font-medium text-[#495057]">Click to select Multiple Page Photos</span>
                          <span className="text-[11px] text-[#6c757d]">Select all written pages at once (JPG / PNG)</span>
                        </label>
                      </div>

                      {selectedImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {selectedImages.map((img, idx) => (
                            <div key={img.id} className="p-2 rounded bg-white border border-[#dee2e6] flex items-center justify-between">
                              <span className="truncate max-w-[100px]">P.{idx + 1}: {img.name}</span>
                              <button onClick={() => removeImage(img.id)} className="text-[#d9383a] p-1"><Trash2 className="w-3.5 h-3.5" /></button>
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
                      className={`px-5 py-2.5 rounded font-semibold text-xs transition flex items-center space-x-1.5 ${
                        !canSubmit || isHardExpired
                          ? 'bg-[#ced4da] text-[#6c757d] cursor-not-allowed'
                          : isSubmitting
                          ? 'bg-[#0b5190] text-white'
                          : 'bg-[#0f6cbf] hover:bg-[#0b5190] text-white shadow-xs'
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

            {/* 2C: SUBMISSION STATUS TABLE (Matches Screenshot 2) */}
            <div className="space-y-3 pt-3">
              <h3 className="font-bold text-lg text-[#1d2125]">
                Submission status
              </h3>

              <div className="border border-[#dee2e6] rounded-md overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-[#dee2e6]">
                      <td className="w-1/3 p-3 font-semibold text-[#495057] bg-[#f8f9fa] border-r border-[#dee2e6]">
                        Submission status
                      </td>
                      <td className={`p-3 ${submission ? 'bg-[#d1e7dd] text-[#0f5132] font-semibold' : 'text-[#212529]'}`}>
                        {submission ? 'Submitted for grading' : 'No submissions have been made yet'}
                      </td>
                    </tr>

                    <tr className="border-b border-[#dee2e6]">
                      <td className="w-1/3 p-3 font-semibold text-[#495057] bg-[#f8f9fa] border-r border-[#dee2e6]">
                        Grading status
                      </td>
                      <td className="p-3 text-[#212529]">
                        {submission && submission.marks !== null ? (
                          <span className="font-bold text-[#0f5132]">
                            Graded ({submission.marks} / {paper.totalMarks})
                          </span>
                        ) : (
                          'Not graded'
                        )}
                      </td>
                    </tr>

                    <tr className="border-b border-[#dee2e6]">
                      <td className="w-1/3 p-3 font-semibold text-[#495057] bg-[#f8f9fa] border-r border-[#dee2e6]">
                        Time remaining
                      </td>
                      <td className="p-3 text-[#212529]">
                        {submission ? (
                          <span className="text-[#0f5132] font-medium">Assignment was submitted</span>
                        ) : activeSession ? (
                          <span className="text-[#0f6cbf] font-semibold">{formatTime(hardSecondsLeft)} remaining</span>
                        ) : (
                          <span>11 days 21 hours remaining</span>
                        )}
                      </td>
                    </tr>

                    <tr className="border-b border-[#dee2e6]">
                      <td className="w-1/3 p-3 font-semibold text-[#495057] bg-[#f8f9fa] border-r border-[#dee2e6]">
                        Last modified
                      </td>
                      <td className="p-3 text-[#212529]">
                        {submission ? submission.submittedAt : '-'}
                      </td>
                    </tr>

                    {submission && (
                      <tr className="border-b border-[#dee2e6]">
                        <td className="w-1/3 p-3 font-semibold text-[#495057] bg-[#f8f9fa] border-r border-[#dee2e6]">
                          File submissions
                        </td>
                        <td className="p-3 text-[#212529]">
                          <div className="flex items-center space-x-2 text-[#0f6cbf]">
                            <FileText className="w-4 h-4 text-[#d9383a]" />
                            <span className="hover:underline cursor-pointer font-medium">
                              {submission.fileName}
                            </span>
                            <span className="text-xs text-[#6c757d]">({submission.fileSizeMb})</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td className="w-1/3 p-3 font-semibold text-[#495057] bg-[#f8f9fa] border-r border-[#dee2e6]">
                        Submission comments
                      </td>
                      <td className="p-3 text-[#212529]">
                        <details className="cursor-pointer">
                          <summary className="text-[#0f6cbf] hover:underline font-medium">
                            Comments ({submission && submission.feedback ? '1' : '0'})
                          </summary>
                          {submission && submission.feedback && (
                            <div className="p-2.5 mt-2 rounded bg-[#f8f9fa] border border-[#dee2e6] text-[#495057]">
                              <b>Teacher Feedback:</b> {submission.feedback}
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
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-[#0f6cbf]">
        <div className="flex items-center space-x-1.5 flex-wrap">
          <button onClick={onBack} className="hover:underline">Combined Mathematics 2026 (A/L)</button>
          <span>&gt;</span>
          <button onClick={onBack} className="hover:underline">{paper.code}</button>
          <span>&gt;</span>
          <span className="text-[#495057] font-medium">Submissions grading worksheet</span>
        </div>

        <button onClick={onBack} className="hover:underline">
          &larr; Back to assignment
        </button>
      </div>

      <div className="bg-white rounded-lg border border-[#dee2e6] p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1d2125] flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#0f6cbf]" />
            <span>Grading Worksheet: {paper.title}</span>
          </h2>
          <p className="text-xs text-[#6c757d] mt-0.5">
            Evaluate student answer scripts, record marks /100 and export results.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#198754] hover:bg-[#157347] text-white font-medium text-xs transition shadow-xs"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-[#dee2e6] p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-[#6c757d] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search student or index..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] text-xs bg-white text-[#1d2125]"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 border border-[#ced4da] rounded text-xs text-[#495057] bg-white focus:outline-none"
          >
            <option value="ALL">All submission status</option>
            <option value="ON_TIME">On Time</option>
            <option value="LATE">Late</option>
          </select>
        </div>

        <span className="text-xs text-[#6c757d]">
          Showing {filtered.length} submissions
        </span>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg border border-[#dee2e6] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8f9fa] border-b border-[#dee2e6] text-[#495057] font-semibold">
              <tr>
                <th className="p-3">Student details</th>
                <th className="p-3">Status</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Grade</th>
                <th className="p-3">Submitted At</th>
                <th className="p-3">Answer Script</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dee2e6] text-[#212529]">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#f8f9fa] transition">
                  <td className="p-3">
                    <div className="font-semibold text-[#0f6cbf]">{sub.studentName}</div>
                    <div className="text-[11px] font-mono text-[#6c757d]">{sub.studentIndex}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      sub.status === 'ON_TIME'
                        ? 'bg-[#d1e7dd] text-[#0f5132] border border-[#badbcc]'
                        : 'bg-[#fff3cd] text-[#664d03] border border-[#ffecb5]'
                    }`}>
                      {sub.status === 'ON_TIME' ? 'Submitted On Time' : 'Submitted Late'}
                    </span>
                  </td>
                  <td className="p-3 font-mono">
                    {sub.durationTakenMins} mins
                  </td>
                  <td className="p-3 font-semibold">
                    {sub.marks !== null ? (
                      <span className="text-[#0f5132]">{sub.marks} / {paper.totalMarks}</span>
                    ) : (
                      <span className="text-[#6c757d] italic font-normal">Not graded</span>
                    )}
                  </td>
                  <td className="p-3 text-[#495057] text-[11px]">
                    {sub.submittedAt}
                  </td>
                  <td className="p-3 font-medium text-[#0f6cbf] max-w-xs truncate">
                    {sub.filePath ? (
                      <a 
                        href={sub.filePath} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center space-x-1 hover:underline text-[#0f6cbf]"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#d9383a] shrink-0" />
                        <span className="truncate">{sub.fileName}</span>
                        <ExternalLink className="w-3 h-3 text-[#6c757d] shrink-0" />
                      </a>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5 text-[#d9383a]" />
                        <span>{sub.fileName}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onGradeSubmission(sub)}
                      className="px-3 py-1 rounded bg-[#0f6cbf] hover:bg-[#0b5190] text-white font-medium text-xs transition"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-[#dee2e6] max-w-lg w-full p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#dee2e6] pb-3">
          <h3 className="text-base font-bold text-[#1d2125]">
            Add a new Exam Paper / Test
          </h3>
          <button onClick={onClose} className="text-[#6c757d] hover:text-[#1d2125]">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#495057] font-medium mb-1">Paper Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Model Paper 03 - Pure Mathematics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] text-xs bg-white text-[#1d2125]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#495057] font-medium mb-1">Subject Stream</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] text-xs bg-white text-[#1d2125]"
              >
                <option value="Pure Mathematics">Pure Mathematics</option>
                <option value="Applied Mathematics">Applied Mathematics</option>
                <option value="Combined Mathematics (Full)">Combined Mathematics (Full)</option>
              </select>
            </div>
            <div>
              <label className="block text-[#495057] font-medium mb-1">Exam Duration (Mins)</label>
              <input
                type="number"
                required
                min="10"
                max="360"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] text-xs bg-white text-[#1d2125]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#495057] font-medium mb-1">Upload Grace Buffer (Mins)</label>
            <input
              type="number"
              required
              min="2"
              max="60"
              value={gracePeriodMinutes}
              onChange={(e) => setGracePeriodMinutes(e.target.value)}
              className="w-full px-3 py-2 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] text-xs bg-white text-[#1d2125]"
            />
          </div>

          <div className="p-3 bg-[#f8f9fa] border border-[#dee2e6] rounded space-y-2">
            <label className="block text-[#495057] font-semibold">Upload Question Paper PDF</label>
            <input
              type="file"
              accept=".pdf"
              id="teacher-new-pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
            <label
              htmlFor="teacher-new-pdf"
              className="border border-dashed border-[#ced4da] rounded p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-200 transition bg-white"
            >
              <span className="text-xs text-[#495057] truncate">
                {pdfFile ? `${pdfFile.name} (${pdfFile.size})` : 'Select Question Paper PDF from computer'}
              </span>
              <UploadCloud className="w-4 h-4 text-[#0f6cbf] shrink-0" />
            </label>
          </div>

          <div>
            <label className="block text-[#495057] font-medium mb-1">Instructions</label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] text-xs bg-white text-[#1d2125]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-[#dee2e6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-[#f8f9fa] border border-[#ced4da] text-[#495057] hover:bg-slate-200 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-[#0f6cbf] hover:bg-[#0b5190] text-white font-medium text-xs shadow-xs"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-[#dee2e6] max-w-lg w-full p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#dee2e6] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#1d2125]">Grade Submission</h3>
            <p className="text-xs text-[#6c757d]">Student: <b>{submission.studentName}</b> ({submission.studentIndex})</p>
          </div>
          <button onClick={onClose} className="text-[#6c757d] hover:text-[#1d2125]">✕</button>
        </div>

        <div className="p-3 bg-[#f8f9fa] rounded border border-[#dee2e6] text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-[#495057]">File script:</span>
            <span className="font-semibold text-[#0f6cbf]">{submission.fileName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#495057]">Duration taken:</span>
            <span>{submission.durationTakenMins} mins</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#495057] font-medium mb-1">Grade out of {paper.totalMarks}</label>
            <input
              type="number"
              min="0"
              max={paper.totalMarks}
              required
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-full px-3 py-2 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] font-mono text-sm bg-white text-[#1d2125]"
            />
          </div>

          <div>
            <label className="block text-[#495057] font-medium mb-1">Feedback comments</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter feedback comments for the student..."
              className="w-full px-3 py-2 border border-[#ced4da] rounded focus:outline-none focus:border-[#0f6cbf] text-xs bg-white text-[#1d2125]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-[#dee2e6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-[#f8f9fa] border border-[#ced4da] text-[#495057] hover:bg-slate-200 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-[#0f6cbf] hover:bg-[#0b5190] text-white font-medium text-xs"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
