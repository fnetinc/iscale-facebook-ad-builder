import React from 'react';

const AdCard = ({ ad, onSave }) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100">
            <div className="relative pb-[56.25%] bg-gray-200">
                {ad.video_url ? (
                    <video
                        src={ad.video_url}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        controls
                    />
                ) : (
                    <img
                        src={ad.image_url || 'https://via.placeholder.com/300x200'}
                        alt={ad.brand_name}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                )}
            </div>
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800 truncate">{ad.brand_name}</h3>
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full capitalize">
                        {ad.platform}
                    </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{ad.ad_copy}</p>

                {ad.analysis && (
                    <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-500">
                        <strong>Analysis:</strong> {JSON.stringify(ad.analysis)}
                    </div>
                )}

                <div className="flex justify-between items-center mt-4">
                    <a
                        href={ad.video_url || ad.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        View Original
                    </a>
                    {onSave && (
                        <button
                            onClick={() => onSave(ad)}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
                        >
                            Save Ad
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdCard;
