import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Image, Video, BarChart3, Menu, X, Settings, Briefcase } from 'lucide-react';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Image Ads', icon: Image },
        { path: '/video-ads', label: 'Video Ads', icon: Video },
        { path: '/brands', label: 'Brands', icon: Briefcase },
        { path: '/reporting', label: 'Reporting', icon: BarChart3 },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-64' : 'w-20'
                    } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-20`}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                    <div className={`font-bold text-xl text-gray-800 flex items-center gap-2 ${!isSidebarOpen && 'justify-center w-full'}`}>
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <span className="text-lg">N</span>
                        </div>
                        {isSidebarOpen && <span>Nicky's Playhouse</span>}
                    </div>
                    {isSidebarOpen && (
                        <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    } ${!isSidebarOpen && 'justify-center'}`}
                            >
                                <Icon size={20} />
                                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button className={`flex items-center gap-3 w-full px-3 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors ${!isSidebarOpen && 'justify-center'}`}>
                        <Settings size={20} />
                        {isSidebarOpen && <span className="font-medium">Settings</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'
                    }`}
            >
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
                    {!isSidebarOpen && (
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                            <Menu size={20} />
                        </button>
                    )}
                    <div className="flex items-center gap-4 ml-auto">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-white shadow-sm"></div>
                    </div>
                </header>

                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
