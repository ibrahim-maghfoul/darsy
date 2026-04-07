import {
    BarChart2, Upload, FileText, Settings, Database, X, Wrench, Newspaper,
    GraduationCap, ShieldCheck, Users, MessageSquare, BookOpen, Calendar,
    Heart, Star, Video, Flag, Menu, LogOut, ChevronDown, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const SECTIONS = [
    { type: 'label', text: 'Overview' },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'users', label: 'Users', icon: Users },

    { type: 'label', text: 'Applications' },
    { id: 'instructor-apps', label: 'Instructor Apps', icon: GraduationCap },
    { id: 'teacher-verifications', label: 'Teacher Verifs', icon: ShieldCheck },
    { id: 'instructor-courses', label: 'Courses Review', icon: Video },

    { type: 'label', text: 'Content' },
    { id: 'content', label: 'Curriculum', icon: BookOpen },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'services', label: 'Services', icon: Star },

    { type: 'label', text: 'Community' },
    { id: 'chat-rooms', label: 'Chat Rooms', icon: MessageSquare },
    { id: 'contributions', label: 'Contributions', icon: Heart },
    { id: 'feedback', label: 'Reports & Feedback', icon: Flag },

    { type: 'label', text: 'Tools' },
    { id: 'upload', label: 'Batch Upload', icon: Upload },
    { id: 'database', label: 'Firebase View', icon: Database },
    { id: 'mongo-sync', label: 'Sync to Mongo', icon: Database },
    { id: 'tools', label: 'YouTube Tool', icon: Wrench },
    { id: 'poster-generator', label: 'Poster Generator', icon: ImageIcon },
    { id: 'calendar', label: 'Global Events', icon: Calendar },

    { type: 'label', text: 'System' },
    { id: 'settings', label: 'Settings', icon: Settings },
];

const Sidebar = ({ isOpen, toggleSidebar, activeTab, setActiveTab }) => {
    const { logout, user } = useAuth();

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    onClick={toggleSidebar}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(26,46,53,0.4)',
                        backdropFilter: 'blur(4px)', zIndex: 998,
                        display: 'none',
                    }}
                    className="sidebar-overlay-el"
                />
            )}

            <aside style={{
                width: 'var(--sidebar-width)',
                height: '100vh',
                position: 'fixed',
                top: 0, left: 0,
                background: 'white',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 999,
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isOpen ? 'translateX(0)' : undefined,
                overflowY: 'auto',
                overflowX: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 20px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-light)',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 12,
                            background: 'linear-gradient(135deg, #3aaa6a, #2d8a55)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(58,170,106,0.25)',
                        }}>
                            <span style={{ color: 'white', fontWeight: 900, fontSize: 15, fontStyle: 'italic' }}>D</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--dark)' }}>Darsy</div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Panel</div>
                        </div>
                    </div>
                    <button onClick={toggleSidebar} className="sidebar-mobile-close" style={{
                        display: 'none', background: 'none', border: 'none',
                        color: 'var(--text-secondary)', cursor: 'pointer',
                    }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
                    {SECTIONS.map((item, i) => {
                        if (item.type === 'label') {
                            return (
                                <div key={i} style={{
                                    fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)',
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                    padding: '16px 10px 6px', opacity: 0.7,
                                }}>
                                    {item.text}
                                </div>
                            );
                        }

                        const Icon = item.icon;
                        const active = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    if (window.innerWidth < 1024) toggleSidebar();
                                }}
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '9px 12px',
                                    borderRadius: 10,
                                    background: active ? 'var(--green-100)' : 'transparent',
                                    color: active ? 'var(--green)' : 'var(--text-secondary)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.82rem',
                                    fontWeight: active ? 700 : 500,
                                    transition: 'all 0.15s ease',
                                    marginBottom: 2,
                                    textAlign: 'left',
                                }}
                                onMouseEnter={e => {
                                    if (!active) {
                                        e.currentTarget.style.background = 'var(--green-50)';
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!active) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }
                                }}
                            >
                                <Icon size={17} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Footer / User */}
                <div style={{
                    padding: '12px 14px',
                    borderTop: '1px solid var(--border-light)',
                    flexShrink: 0,
                }}>
                    <button onClick={logout} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10,
                        background: 'none', border: 'none',
                        color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 500,
                        cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        <LogOut size={17} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <style>{`
                @media (max-width: 1023px) {
                    .sidebar-overlay-el { display: block !important; }
                    .sidebar-mobile-close { display: block !important; }
                    aside { transform: translateX(${isOpen ? '0' : '-100%'}) !important; width: 280px !important; }
                }
            `}</style>
        </>
    );
};

export default Sidebar;
