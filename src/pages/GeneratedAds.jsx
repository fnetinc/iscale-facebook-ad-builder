import React, { useState, useEffect, useMemo } from 'react';
import { Download, Trash2, Search, Filter, CheckSquare, Square, FileDown, ExternalLink, FileText, Image, LayoutGrid, List } from 'lucide-react';
import { useBrands } from '../context/BrandContext';

export default function GeneratedAds() {
    const { brands } = useBrands();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBundles, setSelectedBundles] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Modal state
    const [selectedBundleId, setSelectedBundleId] = useState(null);
    const [viewedImage, setViewedImage] = useState(null);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        fetchAds();
    }, [selectedBrand]);

    const fetchAds = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedBrand) params.append('brand_id', selectedBrand);

            const response = await fetch(`http://localhost:3001/api/generated-ads?${params}`);
            const data = await response.json();
            setAds(data);
        } catch (error) {
            console.error('Error fetching ads:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group ads by bundle
    const bundles = useMemo(() => {
        const groups = {};
        ads.forEach(ad => {
            const bundleId = ad.ad_bundle_id || `legacy_${ad.id}`;
            if (!groups[bundleId]) {
                groups[bundleId] = [];
            }
            groups[bundleId].push(ad);
        });

        // Convert to array and sort by created_at (newest first)
        return Object.values(groups).sort((a, b) => {
            const dateA = new Date(a[0].created_at);
            const dateB = new Date(b[0].created_at);
            return dateB - dateA;
        });
    }, [ads]);

    // Filter bundles
    const filteredBundles = useMemo(() => {
        return bundles.filter(bundle => {
            // Check if any ad in the bundle matches the search term
            const matchesSearch = bundle.some(ad =>
                (ad.headline?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (ad.body?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (ad.cta?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            );
            return searchTerm === '' || matchesSearch;
        });
    }, [bundles, searchTerm]);

    const toggleSelectBundle = (bundleId, e) => {
        e.stopPropagation();
        const newSelected = new Set(selectedBundles);
        if (newSelected.has(bundleId)) {
            newSelected.delete(bundleId);
        } else {
            newSelected.add(bundleId);
        }
        setSelectedBundles(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedBundles.size === filteredBundles.length) {
            setSelectedBundles(new Set());
        } else {
            const allBundleIds = filteredBundles.map(b => b[0].ad_bundle_id || `legacy_${b[0].id}`);
            setSelectedBundles(new Set(allBundleIds));
        }
    };

    const handleDelete = async (bundleId, e) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this ad bundle?')) return;

        // Find all ads in this bundle
        const bundleAds = ads.filter(ad => (ad.ad_bundle_id || `legacy_${ad.id}`) === bundleId);

        try {
            // Delete all ads in the bundle
            await Promise.all(bundleAds.map(ad =>
                fetch(`http://localhost:3001/api/generated-ads/${ad.id}`, {
                    method: 'DELETE'
                })
            ));

            fetchAds();
            setSelectedBundles(prev => {
                const newSet = new Set(prev);
                newSet.delete(bundleId);
                return newSet;
            });

            // Close modal if open
            if (selectedBundleId === bundleId) {
                setSelectedBundleId(null);
            }
        } catch (error) {
            console.error('Error deleting bundle:', error);
            alert('Failed to delete ad bundle');
        }
    };

    const handleExportCSV = async () => {
        if (selectedBundles.size === 0) {
            alert('Please select ads to export');
            return;
        }

        // Get all ad IDs from selected bundles
        const selectedAdIds = ads
            .filter(ad => selectedBundles.has(ad.ad_bundle_id || `legacy_${ad.id}`))
            .map(ad => ad.id);

        try {
            const response = await fetch('http://localhost:3001/api/generated-ads/export-csv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedAdIds })
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `generated-ads-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error exporting:', error);
            alert('Failed to export ads');
        }
    };

    // Modal Helpers
    const openModal = (bundle) => {
        const bundleId = bundle[0].ad_bundle_id || `legacy_${bundle[0].id}`;
        setSelectedBundleId(bundleId);
        // Default to square image or first image
        const squareImg = bundle.find(ad => ad.size_name?.includes('Square')) || bundle[0];
        setViewedImage(squareImg);
        setImgError(false);
    };

    const currentBundle = selectedBundleId
        ? bundles.find(b => (b[0].ad_bundle_id || `legacy_${b[0].id}`) === selectedBundleId)
        : null;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Generated Ads</h1>
                    <p className="text-gray-600 mt-1">View and manage all your AI-generated ad creatives</p>
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Grid View"
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="List View"
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search ads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        />
                    </div>

                    {/* Brand Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <select
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent appearance-none bg-white"
                        >
                            <option value="">All Brands</option>
                            {brands.map(brand => (
                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Batch Actions */}
                {selectedBundles.size > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <span className="text-sm font-medium text-purple-900">
                            {selectedBundles.size} bundle{selectedBundles.size > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex-1"></div>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                        >
                            <FileDown size={16} />
                            Export CSV
                        </button>
                        <button
                            onClick={() => setSelectedBundles(new Set())}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                        >
                            Clear Selection
                        </button>
                    </div>
                )}
            </div>

            {/* Ads Content */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading ads...</p>
                </div>
            ) : filteredBundles.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                    <p className="text-gray-600">No ads found. Generate some ads to get started!</p>
                </div>
            ) : viewMode === 'grid' ? (
                // GRID VIEW
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBundles.map(bundle => {
                        const mainAd = bundle.find(ad => ad.size_name?.includes('Square')) || bundle[0];
                        const bundleId = bundle[0].ad_bundle_id || `legacy_${bundle[0].id}`;
                        const isSelected = selectedBundles.has(bundleId);

                        return (
                            <div
                                key={bundleId}
                                onClick={() => openModal(bundle)}
                                className={`bg-white rounded-xl shadow-sm border-2 transition-all hover:shadow-md cursor-pointer ${isSelected ? 'border-purple-600 ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-300'
                                    }`}
                            >
                                {/* Image */}
                                <div className="relative">
                                    <img
                                        src={mainAd.image_url.startsWith('http') ? mainAd.image_url : `http://localhost:3001${mainAd.image_url}`}
                                        alt={mainAd.headline}
                                        className="w-full h-64 object-cover rounded-t-xl"
                                    />
                                    {/* Select Checkbox */}
                                    <button
                                        onClick={(e) => toggleSelectBundle(bundleId, e)}
                                        className="absolute top-3 left-3 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                                    >
                                        {isSelected ? (
                                            <CheckSquare className="text-purple-600" size={20} />
                                        ) : (
                                            <Square className="text-gray-400" size={20} />
                                        )}
                                    </button>

                                    {/* Size Badge */}
                                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
                                        {bundle.length} Size{bundle.length > 1 ? 's' : ''}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{mainAd.headline || 'Untitled Ad'}</h3>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{mainAd.body}</p>

                                    {mainAd.cta && (
                                        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium mb-3">
                                            {mainAd.cta}
                                        </span>
                                    )}

                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                        <span>{new Date(mainAd.created_at).toLocaleDateString()}</span>
                                        <span className="font-medium text-purple-600">View Details</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => handleDelete(bundleId, e)}
                                            className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={14} />
                                            Delete Bundle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // LIST VIEW
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 w-12">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        {selectedBundles.size === filteredBundles.length && filteredBundles.length > 0 ? (
                                            <CheckSquare size={20} className="text-purple-600" />
                                        ) : (
                                            <Square size={20} />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Creative</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Headline</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Body</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredBundles.map(bundle => {
                                const mainAd = bundle.find(ad => ad.size_name?.includes('Square')) || bundle[0];
                                const bundleId = bundle[0].ad_bundle_id || `legacy_${bundle[0].id}`;
                                const isSelected = selectedBundles.has(bundleId);

                                return (
                                    <tr
                                        key={bundleId}
                                        onClick={() => openModal(bundle)}
                                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-purple-50' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={(e) => toggleSelectBundle(bundleId, e)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                {isSelected ? (
                                                    <CheckSquare size={20} className="text-purple-600" />
                                                ) : (
                                                    <Square size={20} />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                                    <img
                                                        src={mainAd.image_url.startsWith('http') ? mainAd.image_url : `http://localhost:3001${mainAd.image_url}`}
                                                        alt="Thumbnail"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                    {bundle.length} Size{bundle.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{mainAd.headline || 'Untitled Ad'}</p>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="text-sm text-gray-500 line-clamp-1">{mainAd.body}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-500">{new Date(mainAd.created_at).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openModal(bundle);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <ExternalLink size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(bundleId, e)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Bundle"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Select All (if ads exist) */}
            {filteredBundles.length > 0 && (
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        {selectedBundles.size === filteredBundles.length ? (
                            <>
                                <CheckSquare className="text-purple-600" size={16} />
                                Deselect All
                            </>
                        ) : (
                            <>
                                <Square className="text-gray-400" size={16} />
                                Select All ({filteredBundles.length})
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Details Modal */}
            {selectedBundleId && currentBundle && viewedImage && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedBundleId(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                            <h3 className="text-xl font-bold text-gray-900">Ad Bundle Details</h3>
                            <button
                                onClick={() => setSelectedBundleId(null)}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                            >
                                <span className="text-2xl text-gray-500">×</span>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Image Preview Section */}
                                <div className="space-y-4">
                                    {/* Main Image */}
                                    <div className="bg-gray-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center">
                                        {imgError ? (
                                            <div className="p-8 text-center text-red-500 bg-red-50">
                                                <p className="font-bold mb-2">Failed to load image</p>
                                            </div>
                                        ) : (
                                            <img
                                                src={viewedImage.image_url.startsWith('http') ? viewedImage.image_url : `http://localhost:3001${viewedImage.image_url}`}
                                                alt="Selected Ad"
                                                className="w-full h-full object-contain"
                                                onError={() => setImgError(true)}
                                            />
                                        )}
                                    </div>

                                    {/* Bundle Thumbnails */}
                                    {currentBundle.length > 1 && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-2">Available Sizes:</p>
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {currentBundle.map((ad, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            setViewedImage(ad);
                                                            setImgError(false);
                                                        }}
                                                        className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${viewedImage.id === ad.id
                                                            ? 'border-purple-600 ring-2 ring-purple-200'
                                                            : 'border-gray-200 hover:border-purple-300'
                                                            }`}
                                                    >
                                                        <img
                                                            src={ad.image_url.startsWith('http') ? ad.image_url : `http://localhost:3001${ad.image_url}`}
                                                            alt={ad.size_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-0.5 text-center truncate px-1">
                                                            {(ad.size_name || '').split(' ')[0]}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Details Panel */}
                                <div className="space-y-6">
                                    {/* Ad Copy */}
                                    <div className="bg-purple-50 p-5 rounded-xl border border-purple-200">
                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <FileText size={20} className="text-purple-600" />
                                            Ad Copy
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-medium text-purple-700 uppercase">Headline</label>
                                                <p className="font-bold text-gray-900 mt-1">{viewedImage.headline}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-purple-700 uppercase">Body Text</label>
                                                <p className="text-gray-700 text-sm whitespace-pre-line mt-1">{viewedImage.body}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-purple-700 uppercase">Call to Action</label>
                                                <div className="mt-1">
                                                    <span className="inline-block px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-medium">
                                                        {viewedImage.cta}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Image Details */}
                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Image size={20} className="text-gray-600" />
                                            Image Details
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Size:</span>
                                                <span className="font-medium text-gray-900">{viewedImage.size_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Dimensions:</span>
                                                <span className="font-medium text-gray-900">{viewedImage.dimensions}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Created:</span>
                                                <span className="font-medium text-gray-900">{new Date(viewedImage.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Download Button */}
                                    <a
                                        href={viewedImage.image_url.startsWith('http') ? viewedImage.image_url : `http://localhost:3001${viewedImage.image_url}`}
                                        download={`ad-${viewedImage.size_name || 'image'}-${Date.now()}.png`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Download size={20} />
                                        Download Image
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
