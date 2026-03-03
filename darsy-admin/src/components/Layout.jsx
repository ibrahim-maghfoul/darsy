import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children, activeTab, setActiveTab }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="layout">
            <Sidebar
                isOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <div className="main-container">
                <Header toggleSidebar={toggleSidebar} />
                <main className="content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
