import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const BrandForm = ({ onClose, onSave, initialData = null }) => {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        logo: '',
        colors: { primary: '#3B82F6', secondary: '#10B981' },
        voice: '',
        products: []
    });

    const [newProduct, setNewProduct] = useState({ name: '', description: '' });

    const handleAddProduct = () => {
        if (newProduct.name) {
            setFormData({
                ...formData,
                products: [...formData.products, { ...newProduct, id: Date.now() }]
            });
            setNewProduct({ name: '', description: '' });
        }
    };

    const removeProduct = (id) => {
        setFormData({
            ...formData,
            products: formData.products.filter(p => p.id !== id)
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Edit Brand' : 'Add New Brand'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Acme Corp"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Voice/Tone</label>
                            <textarea
                                value={formData.voice}
                                onChange={e => setFormData({ ...formData, voice: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                rows="2"
                                placeholder="e.g. Professional, Friendly, Witty..."
                            />
                        </div>
                    </div>

                    {/* Colors */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Brand Colors</label>
                        <div className="flex gap-4">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Primary</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={formData.colors.primary}
                                        onChange={e => setFormData({ ...formData, colors: { ...formData.colors, primary: e.target.value } })}
                                        className="h-10 w-10 rounded cursor-pointer border-0"
                                    />
                                    <span className="text-sm text-gray-600 font-mono">{formData.colors.primary}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Secondary</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={formData.colors.secondary}
                                        onChange={e => setFormData({ ...formData, colors: { ...formData.colors, secondary: e.target.value } })}
                                        className="h-10 w-10 rounded cursor-pointer border-0"
                                    />
                                    <span className="text-sm text-gray-600 font-mono">{formData.colors.secondary}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Products</label>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                    placeholder="Product Name"
                                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <input
                                    type="text"
                                    value={newProduct.description}
                                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="Short Description"
                                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddProduct}
                                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            {formData.products.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    {formData.products.map(product => (
                                        <div key={product.id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                                            <div>
                                                <div className="font-medium text-sm">{product.name}</div>
                                                <div className="text-xs text-gray-500">{product.description}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeProduct(product.id)}
                                                className="text-red-500 hover:bg-red-50 p-1 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            Save Brand
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BrandForm;
