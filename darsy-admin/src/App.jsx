import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BatchUpload from './pages/BatchUpload';
import Lessons from './pages/Lessons';
import FirebaseUpload from './pages/FirebaseUpload';
import YouTubeConverter from './pages/YouTubeConverter';
import NewsManager from './pages/NewsManager';
import MongoSync from './pages/MongoSync';
import TeacherApplications from './pages/TeacherApplications';
import TeacherVerifications from './pages/TeacherVerifications';
import UsersPage from './pages/UsersPage';
import InstructorCourses from './pages/InstructorCourses';
import ServicesPage from './pages/ServicesPage';
import ChatRoomsPage from './pages/ChatRoomsPage';
import ContributionsPage from './pages/ContributionsPage';
import FeedbackPage from './pages/FeedbackPage';
import CalendarPage from './pages/CalendarPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

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
      {renderContent()}
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
