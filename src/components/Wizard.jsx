import React, { useState, useEffect } from 'react';
import { ChevronRight, Check, Wand2, Layout, Image as ImageIcon, Briefcase, LayoutGrid, List } from 'lucide-react';
import CopyBuilder from './CopyBuilder';
import TemplateSelector from './TemplateSelector';
import { useBrands } from '../context/BrandContext';

const Wizard = () => {
    const [step, setStep] = useState(1);
    const { brands, activeBrand, setActiveBrand } = useBrands();
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

    // Wizard State
    const [copyData, setCopyData] = useState({
        productName: '',
        targetAudience: '',
        generatedCopy: '',
        headline: '',
        cta: ''
    });

    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // Auto-fill from brand if selected
    useEffect(() => {
        if (activeBrand && activeBrand.products.length > 0) {
            const product = activeBrand.products[0];
            setCopyData(prev => ({
                ...prev,
                productName: product.name,
                // You could also map description to something if needed
            }));
        }
    }, [activeBrand]);

    const handleNext = () => {
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const steps = [
        { id: 1, name: 'Select Brand', icon: Briefcase },
        { id: 2, name: 'Copy Builder', icon: Wand2 },
        { id: 3, name: 'Choose Template', icon: Layout },
        { id: 4, name: 'Generate', icon: ImageIcon },
    ];

    return (
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

                {/* Step 1: Brand Selection */}
                {step === 1 && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Select a Brand</h2>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <List size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <LayoutGrid size={20} />
                                </button>
                            </div>
                        </div>

                        {brands.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 mb-4">No brands found. Create a brand to get started.</p>
                                <a href="/brands" className="text-blue-600 font-medium hover:underline">Go to Brand Management</a>
                            </div>
                        ) : (
                            <>
                                {viewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {brands.map(brand => (
                                            <div
                                                key={brand.id}
                                                onClick={() => setActiveBrand(brand)}
                                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${activeBrand?.id === brand.id
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                                        style={{ backgroundColor: brand.colors.primary }}
                                                    >
                                                        {brand.name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-gray-900">{brand.name}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {brand.products.length} Products • {brand.voice || 'No voice set'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {brands.map(brand => (
                                            <div
                                                key={brand.id}
                                                onClick={() => setActiveBrand(brand)}
                                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center justify-between ${activeBrand?.id === brand.id
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                                        style={{ backgroundColor: brand.colors.primary }}
                                                    >
                                                        {brand.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-900 block">{brand.name}</span>
                                                        <span className="text-xs text-gray-500">{brand.products.length} Products</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex gap-1">
                                                        <div className="w-4 h-4 rounded" style={{ backgroundColor: brand.colors.primary }}></div>
                                                        <div className="w-4 h-4 rounded" style={{ backgroundColor: brand.colors.secondary }}></div>
                                                    </div>
                                                    {activeBrand?.id === brand.id && <Check className="text-blue-600" size={20} />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleNext}
                                disabled={!activeBrand}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${activeBrand
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                Next Step <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Copy Builder */}
                {step === 2 && (
                    <CopyBuilder
                        data={copyData}
                        setData={setCopyData}
                        onNext={handleNext}
                        brandVoice={activeBrand?.voice}
                        activeBrand={activeBrand}
                    />
                )}

                {/* Step 3: Template Selection */}
                {step === 3 && (
                    <TemplateSelector
                        selectedTemplate={selectedTemplate}
                        onSelect={setSelectedTemplate}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}

                {/* Step 4: Generation (Placeholder) */}
                {step === 4 && (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Generating your Ad...</h2>
                        <p className="text-gray-600 mb-6">Using Nicky's Playhouse to combine your copy and style.</p>
                        {/* Placeholder for generation result */}
                        <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center mb-6">
                            <span className="text-gray-400">Ad Preview Will Appear Here</span>
                        </div>
                        <div className="flex justify-between">
                            <button onClick={handleBack} className="text-gray-500 hover:text-gray-700">Back</button>
                            <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Download</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wizard;
