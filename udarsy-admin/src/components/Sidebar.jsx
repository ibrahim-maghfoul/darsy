import {
    BarChart2, Upload, Settings, Database, X, Wrench, Newspaper,
    GraduationCap, ShieldCheck, Users, MessageSquare, BookOpen, Calendar,
    Heart, Star, Video, Flag, LogOut, ImageIcon, FileText, Rocket, Sparkles, FlaskConical, Presentation
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SECTIONS = [
    { type: 'label', text: 'Overview' },
    { path: '/',       label: 'Dashboard',          icon: BarChart2 },
    { path: '/users',  label: 'Users',              icon: Users },

    { type: 'label', text: 'Applications' },
    { path: '/instructor-apps',       label: 'Instructor Apps',   icon: GraduationCap },
    { path: '/teacher-verifications', label: 'Teacher Verifs',    icon: ShieldCheck },
    { path: '/instructor-courses',    label: 'Courses Review',    icon: Video },

    { type: 'label', text: 'Content' },
    { path: '/content',   label: 'Curriculum', icon: BookOpen },
    { path: '/news',      label: 'News',        icon: Newspaper },
    { path: '/services',  label: 'Services',    icon: Star },

    { type: 'label', text: 'Community' },
    { path: '/chat-rooms',       label: 'Chat Rooms',         icon: MessageSquare },
    { path: '/contributions',    label: 'Contributions',      icon: Heart },
    { path: '/feedback',         label: 'Reports & Feedback', icon: Flag },
    { path: '/reward-requests',  label: 'Reward Requests',    icon: Star },
    { path: '/ai-explanations',  label: 'AI Explanations',    icon: Sparkles },

    { type: 'label', text: 'Content Creation' },
    { path: '/poster-generation',   label: 'Poster Generation',    icon: ImageIcon },
    { path: '/ghost-tester',        label: 'Ghost API Tester',     icon: FlaskConical },
    { path: '/dalle-tester',        label: 'OpenAI Image Gen',     icon: Sparkles },
    { path: '/launch-ideas',        label: 'Launch Ideas',         icon: Rocket },
    { path: '/slider-generator',    label: 'Slider Generator',     icon: Presentation },
    { path: '/content-management',  label: 'Content Management',   icon: FileText },
    { path: '/analytics',           label: 'Analytics',            icon: BarChart2 },
    { path: '/logo-generator',      label: 'Logo Generator',       icon: Sparkles },

    { type: 'label', text: 'Tools' },
    { path: '/upload',           label: 'Batch Upload',     icon: Upload },
    { path: '/database',         label: 'Firebase View',    icon: Database },
    { path: '/mongo-sync',       label: 'Sync to Mongo',    icon: Database },
    { path: '/tools',            label: 'YouTube Tool',     icon: Wrench },
    { path: '/calendar',         label: 'Global Events',    icon: Calendar },

    { type: 'label', text: 'System' },
    { path: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { logout } = useAuth();

    return (
        <>
            {isOpen && (
                <div
                    onClick={toggleSidebar}
                    className="sidebar-overlay-el"
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(26,46,53,0.4)',
                        backdropFilter: 'blur(4px)', zIndex: 998, display: 'none',
                    }}
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
                {/* Logo */}
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
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--dark)' }}>Udarsy</div>
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

                {/* Nav */}
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
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                onClick={() => { if (window.innerWidth < 1024) toggleSidebar(); }}
                                className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link--active' : ''}`}
                            >
                                <Icon size={17} />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-light)', flexShrink: 0 }}>
                    <button onClick={logout} className="sidebar-link sidebar-link--logout" style={{ width: '100%', background: 'none', border: 'none' }}>
                        <LogOut size={17} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <style>{`
                .sidebar-link {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 12px;
                    border-radius: 10px;
                    background: transparent;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 0.82rem;
                    font-weight: 500;
                    transition: all 0.15s ease;
                    margin-bottom: 2px;
                    text-decoration: none;
                }
                .sidebar-link:hover {
                    background: var(--green-50);
                    color: var(--text-primary);
                }
                .sidebar-link--active {
                    background: var(--green-100) !important;
                    color: var(--green) !important;
                    font-weight: 700;
                }
                .sidebar-link--logout:hover {
                    background: #fee2e2 !important;
                    color: #ef4444 !important;
                }
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
