import { Home, Upload, FileText, Settings, Database, Menu, X, BarChart2, Wrench, Newspaper } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar, activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
        { id: 'upload', label: 'Batch Upload', icon: Upload },
        { id: 'content', label: 'Content Manager', icon: FileText },
        { id: 'news', label: 'News Manager', icon: Newspaper },
        { id: 'database', label: 'Database View', icon: Database },
        { id: 'mongo-sync', label: 'Sync to MongoDB', icon: Database },
        { id: 'tools', label: 'Tools', icon: Wrench },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">9</div>
                        <h1>Darsy Admin</h1>
                    </div>
                    <button className="mobile-close" onClick={toggleSidebar}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (window.innerWidth < 1024) toggleSidebar();
                            }}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">AD</div>
                        <div className="user-details">
                            <p className="user-name">Admin User</p>
                            <p className="user-role">Super Admin</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
