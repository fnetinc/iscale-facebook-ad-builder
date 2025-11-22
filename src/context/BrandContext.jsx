import React, { createContext, useContext, useState, useEffect } from 'react';

const BrandContext = createContext();
const API_URL = 'http://localhost:3001/api';

export const useBrands = () => {
    const context = useContext(BrandContext);
    if (!context) {
        throw new Error('useBrands must be used within a BrandProvider');
    }
    return context;
};

export const BrandProvider = ({ children }) => {
    const [brands, setBrands] = useState([]);
    const [customerProfiles, setCustomerProfiles] = useState([]);
    const [activeBrand, setActiveBrand] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load data from API
    const loadData = async () => {
        try {
            const [brandsRes, profilesRes] = await Promise.all([
                fetch(`${API_URL}/brands`),
                fetch(`${API_URL}/profiles`)
            ]);

            const brandsData = await brandsRes.json();
            const profilesData = await profilesRes.json();

            setBrands(brandsData);
            setCustomerProfiles(profilesData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial data load
    useEffect(() => {
        loadData();
    }, []);

    // Brand Management
    const addBrand = async (brand) => {
        try {
            const newBrand = {
                ...brand,
                id: crypto.randomUUID()
            };

            await fetch(`${API_URL}/brands`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBrand)
            });

            await loadData();
        } catch (error) {
            console.error('Error adding brand:', error);
            throw error;
        }
    };

    const updateBrand = async (id, updatedBrand) => {
        try {
            await fetch(`${API_URL}/brands/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedBrand)
            });

            await loadData();
        } catch (error) {
            console.error('Error updating brand:', error);
            throw error;
        }
    };

    const deleteBrand = async (id) => {
        try {
            await fetch(`${API_URL}/brands/${id}`, {
                method: 'DELETE'
            });

            await loadData();
        } catch (error) {
            console.error('Error deleting brand:', error);
            throw error;
        }
    };

    // Product Management (standalone - kept for compatibility)
    const addProduct = async (brandId, product) => {
        try {
            const brand = brands.find(b => b.id === brandId);
            if (brand) {
                const newProduct = { ...product, id: crypto.randomUUID() };
                const updatedBrand = {
                    ...brand,
                    products: [...brand.products, newProduct]
                };
                await updateBrand(brandId, updatedBrand);
            }
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    };

    const updateProduct = async (brandId, productId, updatedProduct) => {
        try {
            const brand = brands.find(b => b.id === brandId);
            if (brand) {
                const updatedBrand = {
                    ...brand,
                    products: brand.products.map(p =>
                        p.id === productId ? { ...p, ...updatedProduct } : p
                    )
                };
                await updateBrand(brandId, updatedBrand);
            }
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    };

    const deleteProduct = async (brandId, productId) => {
        try {
            const brand = brands.find(b => b.id === brandId);
            if (brand) {
                const updatedBrand = {
                    ...brand,
                    products: brand.products.filter(p => p.id !== productId)
                };
                await updateBrand(brandId, updatedBrand);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    };

    // Customer Profile Management
    const addProfile = async (profile) => {
        try {
            const newProfile = {
                ...profile,
                id: crypto.randomUUID()
            };

            await fetch(`${API_URL}/profiles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProfile)
            });

            await loadData();
            return newProfile;
        } catch (error) {
            console.error('Error adding profile:', error);
            throw error;
        }
    };

    const updateProfile = async (id, updatedProfile) => {
        try {
            await fetch(`${API_URL}/profiles/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProfile)
            });

            await loadData();
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    const deleteProfile = async (id) => {
        try {
            await fetch(`${API_URL}/profiles/${id}`, {
                method: 'DELETE'
            });

            await loadData();
        } catch (error) {
            console.error('Error deleting profile:', error);
            throw error;
        }
    };

    // Profile-Brand linking (handled in brand update)
    const linkProfileToBrand = async (brandId, profileId) => {
        try {
            const brand = brands.find(b => b.id === brandId);
            if (brand && !brand.profileIds.includes(profileId)) {
                const updatedBrand = {
                    ...brand,
                    profileIds: [...brand.profileIds, profileId]
                };
                await updateBrand(brandId, updatedBrand);
            }
        } catch (error) {
            console.error('Error linking profile:', error);
            throw error;
        }
    };

    const unlinkProfileFromBrand = async (brandId, profileId) => {
        try {
            const brand = brands.find(b => b.id === brandId);
            if (brand) {
                const updatedBrand = {
                    ...brand,
                    profileIds: brand.profileIds.filter(id => id !== profileId)
                };
                await updateBrand(brandId, updatedBrand);
            }
        } catch (error) {
            console.error('Error unlinking profile:', error);
            throw error;
        }
    };

    return (
        <BrandContext.Provider value={{
            brands,
            customerProfiles,
            activeBrand,
            setActiveBrand,
            loading,
            addBrand,
            updateBrand,
            deleteBrand,
            addProduct,
            updateProduct,
            deleteProduct,
            addProfile,
            updateProfile,
            deleteProfile,
            linkProfileToBrand,
            unlinkProfileFromBrand
        }}>
            {children}
        </BrandContext.Provider>
    );
};
