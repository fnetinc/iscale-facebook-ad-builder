import React from 'react';
import { LayoutDashboard, Image, Video, Star, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const stats = [
        { label: 'Total Campaigns', value: '0', icon: TrendingUp, color: 'bg-blue-500' },
        { label: 'Image Ads', value: '0', icon: Image, color: 'bg-purple-500' },
        { label: 'Video Ads', value: '0', icon: Video, color: 'bg-pink-500' },
        { label: 'Templates', value: '0', icon: Star, color: 'bg-yellow-500' },
    ];

    const quickActions = [
        {
            title: 'Create Image Ads',
            description: 'Generate AI-powered image ads using winning templates',
            icon: Image,
            link: '/image-ads',
            color: 'from-purple-600 to-pink-600'
        },
        {
            title: 'Create Video Ads',
            description: 'Build video ads with AI-generated content',
            icon: Video,
            link: '/video-ads',
            color: 'from-blue-600 to-cyan-600'
        },
        {
            title: 'Browse Templates',
            description: 'Explore winning ad templates and creatives',
            icon: Star,
            link: '/winning-ads',
            color: 'from-yellow-600 to-orange-600'
        },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <LayoutDashboard size={32} className="text-blue-600" />
                    Dashboard
                </h1>
                <p className="text-gray-600 mt-2">Welcome to your Ad Builder workspace</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                                    <Icon className="text-white" size={24} />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                            <div className="text-sm text-gray-600">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={index}
                                to={action.link}
                                className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all"
                            >
                                <div className={`bg-gradient-to-r ${action.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className="text-white" size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{action.title}</h3>
                                <p className="text-sm text-gray-600">{action.description}</p>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="text-center py-12 text-gray-500">
                    <Zap size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>No recent activity yet</p>
                    <p className="text-sm mt-2">Start creating ads to see your activity here</p>
                </div>
            </div>
        </div>
    );
}
