import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import './Header.css';

const Header = ({ toggleSidebar }) => {
    return (
        <header className="header glass">
            <div className="header-left">
                <button className="mobile-menu-toggle" onClick={toggleSidebar}>
                    <Menu size={24} />
                </button>
                <div className="search-bar">
                    <Search size={18} />
                    <input type="text" placeholder="Search resources, lessons..." />
                </div>
            </div>

            <div className="header-right">
                <button className="icon-btn">
                    <Bell size={20} />
                    <span className="badge"></span>
                </button>
                <div className="divider"></div>
                <div className="app-status">
                    <span className="status-dot online"></span>
                    <span className="status-text">Production</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
