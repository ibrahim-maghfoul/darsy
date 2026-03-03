import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BatchUpload from './pages/BatchUpload';
import Lessons from './pages/Lessons';
import FirebaseUpload from './pages/FirebaseUpload';
import YouTubeConverter from './pages/YouTubeConverter';
import NewsManager from './pages/NewsManager';
import './index.css';
import MongoSync from './pages/MongoSync';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'upload':
        return <BatchUpload />;
      case 'content':
        return <Lessons setActiveTab={setActiveTab} />;
      case 'news':
        return <NewsManager setActiveTab={setActiveTab} />;
      case 'database':
        return <FirebaseUpload />;
      case 'mongo-sync':
        return <MongoSync />;
      case 'tools':
        return <YouTubeConverter />;
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
  return <MainApp />;
}

export default App;
