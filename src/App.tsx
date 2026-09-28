/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { Dashboard } from './pages/Dashboard';
import { SubjectsPage } from './pages/SubjectsPage';
import { LiveExamsPage } from './pages/LiveExamsPage';
import { WaitingRoomPage } from './pages/WaitingRoomPage';
import { LiveExamScreen } from './pages/LiveExamScreen';
import { ExamResultPage } from './pages/ExamResultPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAuthPortal } from './pages/admin/AdminAuthPortal';
import { Exam, ExamSubmission } from './types';

function AppContent() {
  const { user, isAdmin, isAuthenticated, refreshUser } = useAuth();

  // Route state
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    return window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#/admin');
  });

  // Student Navigation tab
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Auth modal state for students
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login',
  });

  // Active exam session
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [serverStartTime, setServerStartTime] = useState<number>(0);
  const [serverEndTime, setServerEndTime] = useState<number>(0);

  // Result state
  const [lastSubmission, setLastSubmission] = useState<ExamSubmission | null>(null);
  const [lastScore, setLastScore] = useState<number>(0);
  const [lastTotal, setLastTotal] = useState<number>(0);

  // URL synchronization
  useEffect(() => {
    const handleLocationChange = () => {
      const isAdm = window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#/admin');
      setIsAdminRoute(isAdm);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateToStudentHome = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
    setCurrentTab('dashboard');
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModal({ isOpen: true, mode });
  };

  const handleJoinExam = (examId: string) => {
    if (!isAuthenticated) {
      handleOpenAuth('login');
      return;
    }
    setActiveExamId(examId);
    window.history.pushState({ tab: 'waiting-room' }, '', `/?exam=${examId}`);
    setCurrentTab('waiting-room');
  };

  const handleStartExam = (exam: Exam, startTime: number, endTime: number) => {
    setActiveExam(exam);
    setServerStartTime(startTime);
    setServerEndTime(endTime);
    setCurrentTab('exam-live');
  };

  const handleExamFinished = (submission: ExamSubmission, score: number, total: number) => {
    setLastSubmission(submission);
    setLastScore(score);
    setLastTotal(total);
    refreshUser(); // update user points & rank
    setCurrentTab('exam-result');
  };

  // 1. ADMIN ROUTE (/admin) — Completely isolated from student interface
  if (isAdminRoute) {
    if (isAdmin && user) {
      return <AdminDashboard onGoHome={navigateToStudentHome} />;
    }

    return (
      <AdminAuthPortal
        onSuccess={() => {
          refreshUser();
        }}
        onGoHome={navigateToStudentHome}
      />
    );
  }

  // 2. STUDENT INTERFACE — Pure educational & competitive platform (no admin links)
  const isExamActive = currentTab === 'exam-live';

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#F8FAFC] flex flex-col justify-between selection:bg-[#7C3AED] selection:text-white">
      {/* Student Navbar: hidden during live exam for focused anti-distraction testing */}
      {!isExamActive && (
        <Navbar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            window.history.pushState({ tab }, '', `/#${tab}`);
            setCurrentTab(tab);
          }}
          onOpenAuth={handleOpenAuth}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <Dashboard
            onSelectTab={(tab) => {
              window.history.pushState({ tab }, '', `/#${tab}`);
              setCurrentTab(tab);
            }}
            onJoinExam={handleJoinExam}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === 'subjects' && (
          <SubjectsPage
            onSelectExam={handleJoinExam}
            onOpenAuth={() => handleOpenAuth('login')}
            isAuthenticated={isAuthenticated}
          />
        )}

        {currentTab === 'live-exams' && (
          <LiveExamsPage
            onJoinExam={handleJoinExam}
            onOpenAuth={() => handleOpenAuth('login')}
            isAuthenticated={isAuthenticated}
          />
        )}

        {currentTab === 'waiting-room' && activeExamId && (
          <WaitingRoomPage
            examId={activeExamId}
            onStartExam={handleStartExam}
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                setCurrentTab('live-exams');
              }
            }}
          />
        )}

        {currentTab === 'exam-live' && activeExam && (
          <LiveExamScreen
            exam={activeExam}
            serverStartTime={serverStartTime}
            serverEndTime={serverEndTime}
            onFinished={handleExamFinished}
            onExit={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                setCurrentTab('live-exams');
              }
            }}
          />
        )}

        {currentTab === 'exam-result' && lastSubmission && (
          <ExamResultPage
            submission={lastSubmission}
            score={lastScore}
            totalQuestions={lastTotal}
            onGoToLeaderboard={() => {
              window.history.pushState({ tab: 'leaderboard' }, '', '/#leaderboard');
              setCurrentTab('leaderboard');
            }}
            onGoToDashboard={() => {
              window.history.pushState({ tab: 'dashboard' }, '', '/#dashboard');
              setCurrentTab('dashboard');
            }}
          />
        )}

        {currentTab === 'leaderboard' && <LeaderboardPage />}

        {currentTab === 'profile' && <ProfilePage />}
      </main>

      {/* Student Footer: also hidden during live exam */}
      {!isExamActive && (
        <Footer
          onSelectTab={(tab) => {
            window.history.pushState({ tab }, '', `/#${tab}`);
            setCurrentTab(tab);
          }}
        />
      )}

      {/* Authentication Modal: Strictly for students */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={() => setAuthModal({ isOpen: false, mode: 'login' })}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
