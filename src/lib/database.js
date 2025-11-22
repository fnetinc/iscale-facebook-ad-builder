import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
const dbPath = path.join(__dirname, '../../video-ad-builder.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const initDB = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS brands (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            logo TEXT,
            primary_color TEXT DEFAULT '#3B82F6',
            secondary_color TEXT DEFAULT '#10B981',
            voice TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            brand_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS customer_profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            demographics TEXT,
            pain_points TEXT,
            goals TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS brand_profiles (
            brand_id TEXT NOT NULL,
            profile_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (brand_id, profile_id),
            FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
            FOREIGN KEY (profile_id) REFERENCES customer_profiles(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
        CREATE INDEX IF NOT EXISTS idx_brand_profiles_brand_id ON brand_profiles(brand_id);
        CREATE INDEX IF NOT EXISTS idx_brand_profiles_profile_id ON brand_profiles(profile_id);
    `);
};

// Initialize database on import
initDB();

// Brand operations
export const getAllBrands = () => {
    const brands = db.prepare('SELECT * FROM brands ORDER BY created_at DESC').all();

    return brands.map(brand => {
        const products = db.prepare('SELECT * FROM products WHERE brand_id = ?').all(brand.id);
        const profileIds = db.prepare('SELECT profile_id FROM brand_profiles WHERE brand_id = ?').all(brand.id);

        return {
            id: brand.id,
            name: brand.name,
            logo: brand.logo || '',
            colors: {
                primary: brand.primary_color,
                secondary: brand.secondary_color
            },
            voice: brand.voice || '',
            products: products.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description
            })),
            profileIds: profileIds.map(p => p.profile_id)
        };
    });
};

export const addBrand = (brand) => {
    const insert = db.prepare(`
        INSERT INTO brands (id, name, logo, primary_color, secondary_color, voice)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    insert.run(
        brand.id,
        brand.name,
        brand.logo,
        brand.colors.primary,
        brand.colors.secondary,
        brand.voice
    );

    // Add products
    if (brand.products && brand.products.length > 0) {
        const insertProduct = db.prepare(`
            INSERT INTO products (id, brand_id, name, description)
            VALUES (?, ?, ?, ?)
        `);

        for (const product of brand.products) {
            insertProduct.run(product.id, brand.id, product.name, product.description);
        }
    }

    // Link profiles
    if (brand.profileIds && brand.profileIds.length > 0) {
        const insertLink = db.prepare(`
            INSERT INTO brand_profiles (brand_id, profile_id)
            VALUES (?, ?)
        `);

        for (const profileId of brand.profileIds) {
            insertLink.run(brand.id, profileId);
        }
    }
};

export const updateBrand = (id, brand) => {
    const update = db.prepare(`
        UPDATE brands
        SET name = ?, logo = ?, primary_color = ?, secondary_color = ?, voice = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    update.run(
        brand.name,
        brand.logo,
        brand.colors.primary,
        brand.colors.secondary,
        brand.voice,
        id
    );

    // Delete and re-add products
    db.prepare('DELETE FROM products WHERE brand_id = ?').run(id);

    if (brand.products && brand.products.length > 0) {
        const insertProduct = db.prepare(`
            INSERT INTO products (id, brand_id, name, description)
            VALUES (?, ?, ?, ?)
        `);

        for (const product of brand.products) {
            insertProduct.run(product.id, id, product.name, product.description);
        }
    }

    // Delete and re-add profile links
    db.prepare('DELETE FROM brand_profiles WHERE brand_id = ?').run(id);

    if (brand.profileIds && brand.profileIds.length > 0) {
        const insertLink = db.prepare(`
            INSERT INTO brand_profiles (brand_id, profile_id)
            VALUES (?, ?)
        `);

        for (const profileId of brand.profileIds) {
            insertLink.run(id, profileId);
        }
    }
};

export const deleteBrand = (id) => {
    db.prepare('DELETE FROM brands WHERE id = ?').run(id);
};

// Customer Profile operations
export const getAllProfiles = () => {
    return db.prepare('SELECT * FROM customer_profiles ORDER BY created_at DESC').all().map(p => ({
        id: p.id,
        name: p.name,
        demographics: p.demographics || '',
        painPoints: p.pain_points || '',
        goals: p.goals || ''
    }));
};

export const addProfile = (profile) => {
    const insert = db.prepare(`
        INSERT INTO customer_profiles (id, name, demographics, pain_points, goals)
        VALUES (?, ?, ?, ?, ?)
    `);

    insert.run(profile.id, profile.name, profile.demographics, profile.painPoints, profile.goals);
};

export const updateProfile = (id, profile) => {
    const update = db.prepare(`
        UPDATE customer_profiles
        SET name = ?, demographics = ?, pain_points = ?, goals = ?
        WHERE id = ?
    `);

    update.run(profile.name, profile.demographics, profile.painPoints, profile.goals, id);
};

export const deleteProfile = (id) => {
    db.prepare('DELETE FROM customer_profiles WHERE id = ?').run(id);
};

export default db;
