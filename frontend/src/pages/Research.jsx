import { useToast } from '../context/ToastContext';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchAds, getResearchHistory, saveAd } from '../api/research';
import AdCard from '../components/AdCard';

const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'BR', name: 'Brazil' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
];

const BATCH_SIZE = 12; // Show 12 ads at a time
const INITIAL_FETCH = 50; // Fetch more upfront to reduce API calls

const Research = () => {
    const { showSuccess, showError, showInfo } = useToast();
    const [query, setQuery] = useState('');
    const [country, setCountry] = useState('US');
    const [allResults, setAllResults] = useState([]); // All fetched results
    const [displayedCount, setDisplayedCount] = useState(BATCH_SIZE); // How many to show
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState('search');
    const [hasSearched, setHasSearched] = useState(false);

    const loaderRef = useRef(null);
    const prefetchRef = useRef(null); // Trigger prefetch earlier
    const lastQuery = useRef('');
    const lastCountry = useRef('');
    const currentOffset = useRef(0); // Track pagination offset

    useEffect(() => {
        fetchHistory();
    }, []);

    // Prefetch more ads when we've exhausted the cache
    const prefetchMoreAds = useCallback(async () => {
        if (loadingMore || !lastQuery.current) return;

        setLoadingMore(true);
        try {
            currentOffset.current += 1;
            const existingIds = allResults.map(ad => ad.external_id).filter(Boolean);

            console.log(`Fetching more ads (page ${currentOffset.current}), have ${allResults.length} total`);

            const data = await searchAds(
                lastQuery.current,
                'facebook',
                INITIAL_FETCH,
                lastCountry.current,
                currentOffset.current,
                existingIds
            );

            if (data.length > 0) {
                setAllResults(prev => [...prev, ...data]);
                console.log(`Added ${data.length} new ads, total: ${allResults.length + data.length}`);
            }
        } catch (error) {
            console.error('Prefetch failed', error);
        } finally {
            setLoadingMore(false);
        }
    }, [allResults, loadingMore]);

    // Prefetch observer - triggers when halfway through visible ads
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading) {
                    prefetchMoreAds();
                }
            },
            { threshold: 0.1 }
        );

        if (prefetchRef.current) {
            observer.observe(prefetchRef.current);
        }

        return () => observer.disconnect();
    }, [loading, prefetchMoreAds]);

    // Show more ads observer - at bottom of list
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading && !loadingMore) {
                    if (displayedCount < allResults.length) {
                        // Show more from cache
                        setDisplayedCount(prev => Math.min(prev + BATCH_SIZE, allResults.length));
                    } else if (allResults.length > 0) {
                        // At end of cache - fetch more
                        prefetchMoreAds();
                    }
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();
    }, [loading, loadingMore, allResults.length, displayedCount, prefetchMoreAds]);

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
        if (!query.trim()) {
            showError('Please enter a search term');
            return;
        }

        setLoading(true);
        setHasSearched(true);
        setAllResults([]);
        setDisplayedCount(BATCH_SIZE);
        lastQuery.current = query;
        lastCountry.current = country;
        currentOffset.current = 0; // Reset pagination
        showInfo('Searching Facebook Ads Library...');

        try {
            // Fetch large batch upfront - reduces API calls during scrolling
            const data = await searchAds(query, 'facebook', INITIAL_FETCH, country);
            setAllResults(data);
            setActiveTab('search');

            if (data.length === 0) {
                showInfo('No ads found. Try a different search term or country.');
            } else {
                showSuccess(`Found ${data.length} ads`);
            }
        } catch (error) {
            console.error('Search failed', error);
            showError('Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (ad) => {
        try {
            await saveAd(ad);
            showSuccess('Ad saved to history!');
            fetchHistory();
        } catch (error) {
            console.error('Failed to save ad', error);
            showError('Failed to save ad.');
        }
    };

    const displayedResults = allResults.slice(0, displayedCount);
    const hasMore = displayedCount < allResults.length;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Ad Research</h1>
                <p className="text-gray-600 mt-2">
                    Search the Facebook Ads Library to find competitor ads and inspiration
                </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-8">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by brand name, keyword, or topic..."
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                    <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                    >
                        {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Searching...
                            </>
                        ) : (
                            'Search'
                        )}
                    </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    Tip: Try searching for brand names like "Nike", "Apple", or keywords like "fitness", "software"
                </p>
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
                    Search Results {allResults.length > 0 && `(${allResults.length})`}
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

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                    <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600">Searching Facebook Ads Library...</p>
                    <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
                </div>
            )}

            {/* Content */}
            {!loading && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeTab === 'search' ? (
                            displayedResults.length > 0 ? (
                                displayedResults.map((ad, index) => (
                                    <React.Fragment key={ad.external_id || ad.id || index}>
                                        {/* Prefetch trigger at halfway point */}
                                        {index === Math.floor(displayedResults.length / 2) && (
                                            <div ref={prefetchRef} className="hidden" />
                                        )}
                                        <AdCard ad={ad} onSave={handleSave} />
                                    </React.Fragment>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <p className="mt-4 text-gray-500">
                                        {hasSearched ? 'No ads found. Try a different search term.' : 'No results yet. Search for ads above.'}
                                    </p>
                                </div>
                            )
                        ) : (
                            history.length > 0 ? (
                                history.map((ad) => (
                                    <AdCard key={ad.id} ad={ad} />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                    <p className="mt-4 text-gray-500">No saved ads yet. Save ads from search results.</p>
                                </div>
                            )
                        )}
                    </div>

                    {/* Infinite scroll loader */}
                    {activeTab === 'search' && displayedResults.length > 0 && (
                        <div ref={loaderRef} className="flex justify-center py-8">
                            {loadingMore ? (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Loading more ads...
                                </div>
                            ) : hasMore ? (
                                <p className="text-gray-400 text-sm">Scroll for more</p>
                            ) : (
                                <p className="text-gray-400 text-sm">
                                    {allResults.length} ads loaded - scroll to load more
                                </p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Research;
