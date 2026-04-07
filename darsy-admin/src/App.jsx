import React, { useState, lazy, Suspense } from 'react';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

// Lazy-load all pages — only the active tab's code is downloaded
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const TeacherApplications = lazy(() => import('./pages/TeacherApplications'));
const TeacherVerifications = lazy(() => import('./pages/TeacherVerifications'));
const InstructorCourses = lazy(() => import('./pages/InstructorCourses'));
const Lessons = lazy(() => import('./pages/Lessons'));
const NewsManager = lazy(() => import('./pages/NewsManager'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ChatRoomsPage = lazy(() => import('./pages/ChatRoomsPage'));
const ContributionsPage = lazy(() => import('./pages/ContributionsPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const BatchUpload = lazy(() => import('./pages/BatchUpload'));
const FirebaseUpload = lazy(() => import('./pages/FirebaseUpload'));
const MongoSync = lazy(() => import('./pages/MongoSync'));
const YouTubeConverter = lazy(() => import('./pages/YouTubeConverter'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const PosterGenerator = lazy(() => import('./pages/PosterGenerator'));

const PageLoader = () => (
  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
    <div className="spin" style={{ width: 24, height: 24, border: '3px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', margin: '0 auto 8px' }} />
    Loading...
  </div>
);

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UsersPage />;
      case 'instructor-apps':
        return <TeacherApplications />;
      case 'teacher-verifications':
        return <TeacherVerifications />;
      case 'instructor-courses':
        return <InstructorCourses />;
      case 'content':
        return <Lessons setActiveTab={setActiveTab} />;
      case 'news':
        return <NewsManager setActiveTab={setActiveTab} />;
      case 'services':
        return <ServicesPage />;
      case 'chat-rooms':
        return <ChatRoomsPage />;
      case 'contributions':
        return <ContributionsPage />;
      case 'feedback':
        return <FeedbackPage />;
      case 'upload':
        return <BatchUpload />;
      case 'database':
        return <FirebaseUpload />;
      case 'mongo-sync':
        return <MongoSync />;
      case 'tools':
        return <YouTubeConverter />;
      case 'calendar':
        return <CalendarPage />;
      case 'poster-generator':
        return <PosterGenerator />;
      case 'settings':
        return (
          <div className="card">
            <h2>Settings</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
              Admin panel settings and API configurations are coming soon.
            </p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Suspense fallback={<PageLoader />}>
        {renderContent()}
      </Suspense>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainApp />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
