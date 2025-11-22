import React, { useState } from 'react';
import { ChevronRight, Plus, Trash2, Loader } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { createCompleteAd, createFacebookCampaign, createFacebookAdSet } from '../lib/facebookApi';

const BulkAdCreation = ({ onNext, onBack }) => {
    const { campaignData, adsetData, creativeData, adsData, setAdsData, selectedAdAccount } = useCampaign();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
    const [errors, setErrors] = useState([]);

    // Initialize ads based on creatives - generate all permutations
    React.useEffect(() => {
        if (creativeData.creatives && creativeData.creatives.length > 0) {
            // Filter out empty headlines and bodies
            const validHeadlines = creativeData.headlines.filter(h => h && h.trim() !== '');
            const validBodies = creativeData.bodies.filter(b => b && b.trim() !== '');

            // Generate all permutations: images × headlines × bodies
            const permutations = [];
            creativeData.creatives.forEach((creative, creativeIndex) => {
                validHeadlines.forEach((headline, hIndex) => {
                    validBodies.forEach((body, bIndex) => {
                        permutations.push({
                            id: `ad_${Date.now()}_${creativeIndex}_${hIndex}_${bIndex}`,
                            name: `${creative.name || `Image ${creativeIndex + 1}`} - H${hIndex + 1}B${bIndex + 1}`,
                            creativeId: creative.id,
                            headlineIndex: hIndex,
                            bodyIndex: bIndex,
                            useDefaultCreative: true
                        });
                    });
                });
            });

            setAdsData(permutations);
            console.log(`Generated ${permutations.length} ad permutations (${creativeData.creatives.length} images × ${validHeadlines.length} headlines × ${validBodies.length} bodies)`);
        } else {
            // Fallback if no creatives (shouldn't happen due to validation)
            setAdsData([]);
        }
    }, []);

    const addAd = () => {
        setAdsData(prev => [
            ...prev,
            {
                id: `ad_${Date.now()}_${prev.length}`,
                name: `Ad ${prev.length + 1}`,
                useDefaultCreative: true
            }
        ]);
    };

    const removeAd = (index) => {
        setAdsData(prev => prev.filter((_, i) => i !== index));
    };

    const updateAdName = (index, name) => {
        setAdsData(prev => prev.map((ad, i) => i === index ? { ...ad, name } : ad));
    };

    const handleSubmit = async () => {
        if (adsData.length === 0) {
            alert('Please add at least one ad');
            return;
        }

        setLoading(true);
        setErrors([]);
        setProgress({ current: 0, total: adsData.length, status: 'Starting...' });

        try {
            // Step 1: Create Facebook Campaign (if new)
            let fbCampaignId = campaignData.fbCampaignId;
            if (!campaignData.isExisting) {
                setProgress(prev => ({ ...prev, status: 'Creating campaign on Facebook...' }));
                fbCampaignId = await createFacebookCampaign(campaignData, selectedAdAccount.accountId);

                // Note: We don't update the local database here because new campaigns
                // created in the wizard are not saved to the database - they're temporary.
                // Only existing campaigns (selected from the dropdown) have database records.
            }

            // Step 2: Create Facebook Ad Set (if new)
            let fbAdsetId = adsetData.fbAdsetId;
            if (!adsetData.isExisting) {
                setProgress(prev => ({ ...prev, status: 'Creating ad set on Facebook...' }));
                fbAdsetId = await createFacebookAdSet(adsetData, fbCampaignId, selectedAdAccount.accountId, campaignData.budgetType);

                // Note: We don't update the local database here because new ad sets
                // created in the wizard are not saved to the database - they're temporary.
                // Only existing ad sets (selected from the dropdown) have database records.
            }

            // Step 3: Create ads
            const createdAds = [];
            for (let i = 0; i < adsData.length; i++) {
                const ad = adsData[i];
                setProgress({
                    current: i + 1,
                    total: adsData.length,
                    status: `Creating ad ${i + 1} of ${adsData.length}...`
                });

                try {
                    // Find the specific creative for this ad
                    const specificCreative = creativeData.creatives?.find(c => c.id === ad.creativeId);

                    // Construct creative data for this specific ad with specific headline and body
                    const adSpecificCreativeData = {
                        ...creativeData,
                        imageUrl: specificCreative ? (specificCreative.imageUrl || specificCreative.previewUrl) : '',
                        imageFile: specificCreative ? specificCreative.file : null,
                        // Use specific headline and body for this ad permutation
                        headlines: [creativeData.headlines[ad.headlineIndex]],
                        bodies: [creativeData.bodies[ad.bodyIndex]]
                    };

                    if (!creativeData.pageId) {
                        throw new Error('Page ID is missing. Please go back to the Creative step and select a Facebook Page.');
                    }

                    console.log('Submitting Ad with Page ID:', creativeData.pageId);

                    // Create ad on Facebook
                    const result = await createCompleteAd(
                        fbCampaignId,
                        { ...adsetData, fbAdsetId },
                        adSpecificCreativeData,
                        ad,
                        creativeData.pageId,
                        selectedAdAccount.accountId,
                        campaignData.budgetType
                    );

                    // Save to local database
                    await fetch('http://localhost:3001/api/facebook/ads', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: ad.id,
                            adsetId: adsetData.id,
                            name: ad.name,
                            creativeName: creativeData.creativeName,
                            imageUrl: adSpecificCreativeData.imageUrl, // Use specific image
                            bodies: creativeData.bodies.filter(b => b.trim() !== ''),
                            headlines: creativeData.headlines.filter(h => h.trim() !== ''),
                            description: creativeData.description,
                            cta: creativeData.cta,
                            websiteUrl: creativeData.websiteUrl,
                            status: 'PAUSED',
                            fbAdId: result.adId,
                            fbCreativeId: result.creativeId
                        })
                    });

                    createdAds.push({
                        ...ad,
                        fbAdId: result.adId,
                        fbCreativeId: result.creativeId
                    });
                } catch (error) {
                    console.error(`Error creating ad ${ad.name}:`, error);
                    setErrors(prev => [...prev, `Failed to create ${ad.name}: ${error.message}`]);
                }
            }

            setProgress({
                current: adsData.length,
                total: adsData.length,
                status: 'Complete!'
            });

            // Wait a moment to show completion
            setTimeout(() => {
                onNext();
            }, 1500);

        } catch (error) {
            console.error('Error in bulk ad creation:', error);
            alert(`Error: ${error.message}`);
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Bulk Ad Creation</h2>
            <p className="text-gray-600 mb-6">
                Add multiple ads to be created with the same creative structure. Each ad will use the dynamic creative you configured.
            </p>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
                <div className="text-sm text-blue-800 space-y-1">
                    <div><strong>Campaign:</strong> {campaignData.name}</div>
                    {campaignData.budgetType === 'CBO' && (
                        <div><strong>Campaign Budget:</strong> ${Number(campaignData.dailyBudget).toFixed(2)} / day</div>
                    )}
                    <div><strong>Ad Set:</strong> {adsetData.name}</div>
                    {campaignData.budgetType === 'ABO' && (
                        <div><strong>Ad Set Budget:</strong> ${Number(adsetData.dailyBudget).toFixed(2)} / day</div>
                    )}
                    <div><strong>Creative Name:</strong> {creativeData.creativeName}</div>
                    <div><strong>Images:</strong> {creativeData.creatives?.length || 0} files</div>
                    <div><strong>Ad Copy:</strong> Standard (Single Body & Headline)</div>
                </div>
            </div>

            {!loading ? (
                <>
                    {/* Ads List */}
                    <div className="space-y-2 mb-4">
                        {adsData.map((ad, index) => (
                            <div key={ad.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                {/* Thumbnail */}
                                {creativeData.creatives?.find(c => c.id === ad.creativeId) && (
                                    <div className="w-12 h-12 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                                        <img
                                            src={creativeData.creatives.find(c => c.id === ad.creativeId).previewUrl}
                                            alt="Thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={ad.name}
                                        onChange={(e) => updateAdName(index, e.target.value)}
                                        placeholder={`Ad ${index + 1} name`}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <button
                                    onClick={() => removeAd(index)}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add Ad Button */}
                    <button
                        onClick={addAd}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        Add Another Ad
                    </button>

                    {/* Errors */}
                    {errors.length > 0 && (
                        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <h3 className="font-semibold text-red-900 mb-2">Errors</h3>
                            <ul className="text-sm text-red-800 space-y-1">
                                {errors.map((error, index) => (
                                    <li key={index}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="mt-8 flex justify-between">
                        <button
                            onClick={onBack}
                            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={adsData.length === 0}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Create {adsData.length} Ad{adsData.length !== 1 ? 's' : ''} on Facebook
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {/* Progress Indicator */}
                    <div className="text-center py-12">
                        <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
                        <h3 className="text-xl font-semibold mb-2">{progress.status}</h3>
                        <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-3 mb-2">
                            <div
                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            />
                        </div>
                        <p className="text-gray-600">
                            {progress.current} of {progress.total} ads created
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default BulkAdCreation;
