import { useToast } from '../context/ToastContext';
import React, { useState, useEffect } from 'react';
import { searchAds, getResearchHistory, saveAd } from '../api/research';
import AdCard from '../components/AdCard';

const Research = () => {
    const { showSuccess, showError } = useToast();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('search'); // 'search' or 'history'

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await getResearchHistory();
            setHistory(data);
        } catch (error) {
            console.error('Failed to load history', error);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const data = await searchAds(query);
            setResults(data);
            setActiveTab('search');
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (ad) => {
        try {
            await saveAd(ad);
            showSuccess('Ad saved to history!');
            fetchHistory(); // Refresh history
        } catch (error) {
            console.error('Failed to save ad', error);
            showError('Failed to save ad.');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Ad Research</h1>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-8">
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search keywords, brands, or domains..."
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </form>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'search'
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('search')}
                >
                    Search Results
                </button>
                <button
                    className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'history'
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('history')}
                >
                    Saved Ads ({history.length})
                </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === 'search' ? (
                    results.length > 0 ? (
                        results.map((ad) => (
                            <AdCard key={ad.id} ad={ad} onSave={handleSave} />
                        ))
                    ) : (
                        !loading && <p className="text-gray-500 col-span-full text-center py-8">No results found. Try searching for something.</p>
                    )
                ) : (
                    history.length > 0 ? (
                        history.map((ad) => (
                            <AdCard key={ad.id} ad={ad} /> // No save button for history items
                        ))
                    ) : (
                        <p className="text-gray-500 col-span-full text-center py-8">No saved ads yet.</p>
                    )
                )}
            </div>
        </div>
    );
};

export default Research;
