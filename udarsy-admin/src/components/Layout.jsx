import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Bell } from 'lucide-react';

const PAGE_TITLES = {
    '/':                      'Dashboard',
    '/users':                 'Users',
    '/instructor-apps':       'Instructor Applications',
    '/teacher-verifications': 'Teacher Verifications',
    '/instructor-courses':    'Courses Review',
    '/content':               'Curriculum',
    '/news':                  'News',
    '/services':              'Services',
    '/chat-rooms':            'Chat Rooms',
    '/contributions':         'Contributions',
    '/feedback':              'Reports & Feedback',
    '/upload':                'Batch Upload',
    '/database':              'Firebase View',
    '/mongo-sync':            'Sync to Mongo',
    '/tools':                 'YouTube Tool',
    '/calendar':              'Global Events',
    '/content-creator':       'Content Creator',
    '/settings':              'Settings',
};

const Layout = ({ children }) => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarOpen(o => !o);
    const pageTitle = PAGE_TITLES[location.pathname] || 'Udarsy Admin';

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            <div style={{
                flex: 1,
                marginLeft: 'var(--sidebar-width)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                transition: 'margin 0.3s ease',
            }}>
                <header style={{
                    height: 'var(--header-height)',
                    background: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={toggleSidebar} className="mobile-menu-btn" style={{
                            display: 'none', background: 'none', border: 'none',
                            color: 'var(--text-primary)', cursor: 'pointer', padding: 4,
                        }}>
                            <Menu size={22} />
                        </button>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)' }}>
                            {pageTitle}
                        </h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 10,
                            background: 'var(--green-100)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--green)',
                        }}>
                            <Bell size={16} />
                        </div>
                        <div style={{
                            width: 34, height: 34, borderRadius: 10,
                            background: 'linear-gradient(135deg, #3aaa6a, #2d8a55)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '0.75rem', fontWeight: 800,
                        }}>
                            A
                        </div>
                    </div>
                </header>

                <main style={{ flex: 1, padding: 24, animation: 'fadeIn 0.3s ease-out' }}>
                    {children}
                </main>
            </div>

            <style>{`
                @media (max-width: 1023px) {
                    .mobile-menu-btn { display: block !important; }
                    div[style*="marginLeft: var(--sidebar-width)"] { margin-left: 0 !important; }
                }
            `}</style>
        </div>
    );
};

export default Layout;
