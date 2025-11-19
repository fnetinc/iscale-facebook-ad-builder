import React from 'react';

const VideoAds = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Video Ads</h1>
                <p className="text-gray-600 mt-2">Create engaging video content for your brand.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h2>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                    We're working on bringing powerful video creation tools to Nicky's Playhouse.
                    Stay tuned for AI-driven video generation.
                </p>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Notify Me
                </button>
            </div>
        </div>
    );
};

export default VideoAds;
