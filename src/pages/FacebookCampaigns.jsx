import React, { useState } from 'react';
import { Check, Target, Users, Image as ImageIcon, Zap, CheckCircle, CreditCard } from 'lucide-react';
import { CampaignProvider } from '../context/CampaignContext';
import AdAccountStep from '../components/AdAccountStep';
import CampaignStep from '../components/CampaignStep';
import AdSetStep from '../components/AdSetStep';
import AdCreativeStep from '../components/AdCreativeStep';
import BulkAdCreation from '../components/BulkAdCreation';

const FacebookCampaignWizard = () => {
    const [step, setStep] = useState(0);

    const handleNext = () => {
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const steps = [
        { id: 0, name: 'Ad Account', icon: CreditCard },
        { id: 1, name: 'Campaign', icon: Target },
        { id: 2, name: 'Ad Set', icon: Users },
        { id: 3, name: 'Creative', icon: ImageIcon },
        { id: 4, name: 'Bulk Ads', icon: Zap },
        { id: 5, name: 'Complete', icon: CheckCircle },
    ];

    return (
        <CampaignProvider>
            <div className="max-w-5xl mx-auto">
                {/* Progress Bar */}
                <div className="mb-10">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                        {steps.map((s) => {
                            const Icon = s.icon;
                            const isActive = s.id === step;
                            const isCompleted = s.id < step;

                            return (
                                <div key={s.id} className="flex flex-col items-center bg-gray-50 px-4">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${isActive ? 'bg-blue-600 text-white' :
                                            isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                            }`}
                                    >
                                        {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                                    </div>
                                    <span className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                                        {s.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[500px]">
                    {step === 0 && <AdAccountStep onNext={handleNext} />}
                    {step === 1 && <CampaignStep onNext={handleNext} onBack={handleBack} />}
                    {step === 2 && <AdSetStep onNext={handleNext} onBack={handleBack} />}
                    {step === 3 && <AdCreativeStep onNext={handleNext} onBack={handleBack} />}
                    {step === 4 && <BulkAdCreation onNext={handleNext} onBack={handleBack} />}
                    {step === 5 && (
                        <div className="text-center py-12">
                            <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
                            <h2 className="text-3xl font-bold mb-4">Campaign Created Successfully!</h2>
                            <p className="text-gray-600 mb-8">
                                Your Facebook ad campaign has been created and saved. All ads are set to PAUSED status.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                                >
                                    Create Another Campaign
                                </button>
                                <a
                                    href="/video-ads"
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                                >
                                    View All Campaigns
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CampaignProvider>
    );
};

export default FacebookCampaignWizard;
