import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

const Dashboard         = lazy(() => import('./pages/Dashboard'));
const UsersPage         = lazy(() => import('./pages/UsersPage'));
const TeacherApplications  = lazy(() => import('./pages/TeacherApplications'));
const TeacherVerifications = lazy(() => import('./pages/TeacherVerifications'));
const InstructorCourses = lazy(() => import('./pages/InstructorCourses'));
const Lessons           = lazy(() => import('./pages/Lessons'));
const NewsManager       = lazy(() => import('./pages/NewsManager'));
const ServicesPage      = lazy(() => import('./pages/ServicesPage'));
const ChatRoomsPage     = lazy(() => import('./pages/ChatRoomsPage'));
const ContributionsPage = lazy(() => import('./pages/ContributionsPage'));
const FeedbackPage      = lazy(() => import('./pages/FeedbackPage'));
const BatchUpload       = lazy(() => import('./pages/BatchUpload'));
const FirebaseUpload    = lazy(() => import('./pages/FirebaseUpload'));
const MongoSync         = lazy(() => import('./pages/MongoSync'));
const YouTubeConverter  = lazy(() => import('./pages/YouTubeConverter'));
const CalendarPage        = lazy(() => import('./pages/CalendarPage'));
const PosterGeneration    = lazy(() => import('./pages/PosterGeneration'));
const LaunchIdeas         = lazy(() => import('./pages/LaunchIdeas'));
const ContentManagement   = lazy(() => import('./pages/ContentManagement'));
const ContentAnalytics    = lazy(() => import('./pages/ContentAnalytics'));
const LogoGenerator       = lazy(() => import('./pages/LogoGenerator'));

const TAB_ROUTES = {
  dashboard: '/', users: '/users', 'instructor-apps': '/instructor-apps',
  'teacher-verifications': '/teacher-verifications', 'instructor-courses': '/instructor-courses',
  content: '/content', news: '/news', services: '/services', 'chat-rooms': '/chat-rooms',
  contributions: '/contributions', feedback: '/feedback', upload: '/upload',
  database: '/database', 'mongo-sync': '/mongo-sync', tools: '/tools',
  calendar: '/calendar', 'poster-generation': '/poster-generation',
  'content-management': '/content-management', analytics: '/analytics',
  'logo-generator': '/logo-generator', settings: '/settings',
};

const PageLoader = () => (
  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
    <div className="spin" style={{ width: 24, height: 24, border: '3px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', margin: '0 auto 8px' }} />
    Loading...
  </div>
);

const SettingsPage = () => (
  <div className="card">
    <h2>Settings</h2>
    <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
      Admin panel settings and API configurations are coming soon.
    </p>
  </div>
);

// Compatibility shim — pages that still use setActiveTab prop
const LessonsWithNav = () => {
  const navigate = useNavigate();
  const setActiveTab = (id) => navigate(TAB_ROUTES[id] || '/');
  return <Lessons setActiveTab={setActiveTab} />;
};
const NewsWithNav = () => {
  const navigate = useNavigate();
  const setActiveTab = (id) => navigate(TAB_ROUTES[id] || '/');
  return <NewsManager setActiveTab={setActiveTab} />;
};

const MainApp = () => (
  <Layout>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/"                      element={<Dashboard />} />
        <Route path="/users"                 element={<UsersPage />} />
        <Route path="/instructor-apps"       element={<TeacherApplications />} />
        <Route path="/teacher-verifications" element={<TeacherVerifications />} />
        <Route path="/instructor-courses"    element={<InstructorCourses />} />
        <Route path="/content"              element={<LessonsWithNav />} />
        <Route path="/news"                 element={<NewsWithNav />} />
        <Route path="/services"             element={<ServicesPage />} />
        <Route path="/chat-rooms"           element={<ChatRoomsPage />} />
        <Route path="/contributions"        element={<ContributionsPage />} />
        <Route path="/feedback"             element={<FeedbackPage />} />
        <Route path="/upload"               element={<BatchUpload />} />
        <Route path="/database"             element={<FirebaseUpload />} />
        <Route path="/mongo-sync"           element={<MongoSync />} />
        <Route path="/tools"               element={<YouTubeConverter />} />
        <Route path="/calendar"             element={<CalendarPage />} />
        <Route path="/poster-generation"  element={<PosterGeneration />} />
        <Route path="/launch-ideas"       element={<LaunchIdeas />} />
        <Route path="/content-management" element={<ContentManagement />} />
        <Route path="/analytics"          element={<ContentAnalytics />} />
        <Route path="/logo-generator"     element={<LogoGenerator />} />
        <Route path="/settings"           element={<SettingsPage />} />
        <Route path="*"                    element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </Layout>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedRoute>
          <MainApp />
        </ProtectedRoute>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
