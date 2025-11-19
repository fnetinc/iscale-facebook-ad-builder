import React, { createContext, useContext, useState, useEffect } from 'react';

const BrandContext = createContext();

export const useBrands = () => {
    const context = useContext(BrandContext);
    if (!context) {
        throw new Error('useBrands must be used within a BrandProvider');
    }
    return context;
};

export const BrandProvider = ({ children }) => {
    const [brands, setBrands] = useState(() => {
        const saved = localStorage.getItem('brands');
        return saved ? JSON.parse(saved) : [];
    });

    const [activeBrand, setActiveBrand] = useState(null);

    useEffect(() => {
        localStorage.setItem('brands', JSON.stringify(brands));
    }, [brands]);

    const addBrand = (brand) => {
        const newBrand = { ...brand, id: Date.now().toString() };
        setBrands([...brands, newBrand]);
        return newBrand;
    };

    const updateBrand = (id, updatedBrand) => {
        setBrands(brands.map(b => b.id === id ? { ...b, ...updatedBrand } : b));
    };

    const deleteBrand = (id) => {
        setBrands(brands.filter(b => b.id !== id));
        if (activeBrand?.id === id) setActiveBrand(null);
    };

    return (
        <BrandContext.Provider value={{ brands, activeBrand, setActiveBrand, addBrand, updateBrand, deleteBrand }}>
            {children}
        </BrandContext.Provider>
    );
};
