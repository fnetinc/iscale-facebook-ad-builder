import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import multer from 'multer';
import AdmZip from 'adm-zip';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Global Request Logger (Debug)
app.use((req, res, next) => {
    try {
        fs.appendFileSync('server_debug.log', `[${new Date().toISOString()}] Incoming ${req.method} ${req.url}\n`);
    } catch (e) { console.error('Logger Error:', e); }
    next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure Multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Initialize database
const dbPath = path.join(__dirname, 'video-ad-builder.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        logo TEXT,
        primary_color TEXT DEFAULT '#3B82F6',
        secondary_color TEXT DEFAULT '#10B981',
        highlight_color TEXT DEFAULT '#F59E0B',
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

    CREATE TABLE IF NOT EXISTS facebook_campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        objective TEXT NOT NULL,
        budget_type TEXT NOT NULL,
        daily_budget INTEGER,
        bid_strategy TEXT,
        status TEXT DEFAULT 'PAUSED',
        fb_campaign_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS facebook_adsets (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        name TEXT NOT NULL,
        optimization_goal TEXT NOT NULL,
        daily_budget INTEGER,
        bid_strategy TEXT,
        bid_amount INTEGER,
        targeting TEXT,
        pixel_id TEXT,
        conversion_event TEXT,
        status TEXT DEFAULT 'PAUSED',
        fb_adset_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES facebook_campaigns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS facebook_ads (
        id TEXT PRIMARY KEY,
        adset_id TEXT NOT NULL,
        name TEXT NOT NULL,
        creative_name TEXT,
        image_url TEXT,
        bodies TEXT,
        headlines TEXT,
        description TEXT,
        cta TEXT,
        website_url TEXT,
        status TEXT DEFAULT 'PAUSED',
        fb_ad_id TEXT,
        fb_creative_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (adset_id) REFERENCES facebook_adsets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS winning_ads (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        image_url TEXT NOT NULL,
        notes TEXT,
        tags TEXT,
        analysis TEXT,
        recreation_prompt TEXT,
        topic TEXT,
        mood TEXT,
        subject_matter TEXT,
        copy_analysis TEXT,
        product_name TEXT,
        category TEXT,
        design_style TEXT,
        filename TEXT,
        structural_analysis TEXT,
        layering TEXT,
        template_structure TEXT,
        color_palette TEXT,
        typography_system TEXT,
        copy_patterns TEXT,
        visual_elements TEXT,
        template_category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS generated_ads (
        id TEXT PRIMARY KEY,
        brand_id TEXT,
        product_id TEXT,
        template_id TEXT,
        image_url TEXT NOT NULL,
        headline TEXT,
        body TEXT,
        cta TEXT,
        size_name TEXT,
        dimensions TEXT,
        prompt TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
        FOREIGN KEY (template_id) REFERENCES winning_ads(id) ON DELETE SET NULL
    );
`);

// Migration: Add missing columns if they don't exist
try {
    const tableInfo = db.pragma('table_info(winning_ads)');
    const columns = tableInfo.map(col => col.name);

    if (!columns.includes('analysis')) {
        console.log('Migrating database: Adding analysis and recreation_prompt columns...');
        db.exec('ALTER TABLE winning_ads ADD COLUMN analysis TEXT');
        db.exec('ALTER TABLE winning_ads ADD COLUMN recreation_prompt TEXT');
    }

    if (!columns.includes('topic')) {
        console.log('Migrating database: Adding topic, mood, subject_matter, and copy_analysis columns...');
        db.exec('ALTER TABLE winning_ads ADD COLUMN topic TEXT');
        db.exec('ALTER TABLE winning_ads ADD COLUMN mood TEXT');
        db.exec('ALTER TABLE winning_ads ADD COLUMN subject_matter TEXT');
        db.exec('ALTER TABLE winning_ads ADD COLUMN copy_analysis TEXT');
    }

    if (!columns.includes('product_name')) {
        console.log('Migrating database: Adding product_name, category, and design_style columns...');
        db.exec('ALTER TABLE winning_ads ADD COLUMN product_name TEXT');
        db.exec('ALTER TABLE winning_ads ADD COLUMN category TEXT');
        db.exec('ALTER TABLE winning_ads ADD COLUMN design_style TEXT');
    }

    if (!columns.includes('filename')) {
        console.log('Migrating database: Adding filename column...');
        db.exec('ALTER TABLE winning_ads ADD COLUMN filename TEXT');
    }

    if (!columns.includes('structural_analysis')) {
        console.log('Migrating database: Adding structural_analysis and layering columns...');
        db.exec('ALTER TABLE winning_ads ADD COLUMN structural_analysis TEXT');
        db.exec('ALTER TABLE winning_ads ADD COLUMN layering TEXT');
    }

    if (!columns.includes('template_structure')) {
        console.log('Migrating database: Adding template extraction columns...');
        db.exec('ALTER TABLE winning_ads ADD COLUMN template_structure TEXT');
        db.exec('ALTER TABLE winning_ads ADD COLUMN color_palette TEXT');
        db.exec('ALTER TABLE winning_ads ADD COLUMN typography_system TEXT');
        db.exec('ALTER TABLE winning_ads ADD COLUMN copy_patterns TEXT');
        db.exec('ALTER TABLE winning_ads ADD COLUMN visual_elements TEXT');
        db.exec('ALTER TABLE winning_ads ADD COLUMN template_category TEXT');
    }
    // Check generated_ads table for missing columns
    const genAdsTableInfo = db.pragma('table_info(generated_ads)');
    const genAdsColumns = genAdsTableInfo.map(col => col.name);

    if (!genAdsColumns.includes('ad_bundle_id')) {
        console.log('⚠️ ad_bundle_id column missing in generated_ads. Adding it...');
        db.prepare('ALTER TABLE generated_ads ADD COLUMN ad_bundle_id TEXT').run();
        console.log('✅ Added ad_bundle_id column to generated_ads table');
    }

} catch (error) {
    console.error('❌ Database migration error:', error);
}

// Helper function to get brands with relations
const getBrandsWithRelations = () => {
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
                secondary: brand.secondary_color,
                highlight: brand.highlight_color || '#F59E0B'
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

// API Routes

// Get all brands
app.get('/api/brands', (req, res) => {
    try {
        const brands = getBrandsWithRelations();
        res.json(brands);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add brand
app.post('/api/brands', (req, res) => {
    try {
        const { id, name, logo, colors, voice, products, profileIds } = req.body;

        db.prepare(`
            INSERT INTO brands (id, name, logo, primary_color, secondary_color, highlight_color, voice)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, name, logo, colors.primary, colors.secondary, colors.highlight || '#F59E0B', voice);

        // Add products
        if (products && products.length > 0) {
            const insertProduct = db.prepare(`
                INSERT INTO products (id, brand_id, name, description)
                VALUES (?, ?, ?, ?)
            `);
            for (const product of products) {
                insertProduct.run(product.id, id, product.name, product.description);
            }
        }

        // Link profiles
        if (profileIds && profileIds.length > 0) {
            const insertLink = db.prepare(`
                INSERT INTO brand_profiles (brand_id, profile_id)
                VALUES (?, ?)
            `);
            for (const profileId of profileIds) {
                insertLink.run(id, profileId);
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update brand
app.put('/api/brands/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, logo, colors, voice, products, profileIds } = req.body;

        db.prepare(`
            UPDATE brands
            SET name = ?, logo = ?, primary_color = ?, secondary_color = ?, highlight_color = ?, voice = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(name, logo, colors.primary, colors.secondary, colors.highlight || '#F59E0B', voice, id);

        // Delete and re-add products
        db.prepare('DELETE FROM products WHERE brand_id = ?').run(id);
        if (products && products.length > 0) {
            const insertProduct = db.prepare(`
                INSERT INTO products (id, brand_id, name, description)
                VALUES (?, ?, ?, ?)
            `);
            for (const product of products) {
                insertProduct.run(product.id, id, product.name, product.description);
            }
        }

        // Delete and re-add profile links
        db.prepare('DELETE FROM brand_profiles WHERE brand_id = ?').run(id);
        if (profileIds && profileIds.length > 0) {
            const insertLink = db.prepare(`
                INSERT INTO brand_profiles (brand_id, profile_id)
                VALUES (?, ?)
            `);
            for (const profileId of profileIds) {
                insertLink.run(id, profileId);
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete brand
app.delete('/api/brands/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM brands WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all profiles
app.get('/api/profiles', (req, res) => {
    try {
        const profiles = db.prepare('SELECT * FROM customer_profiles ORDER BY created_at DESC').all();
        res.json(profiles.map(p => ({
            id: p.id,
            name: p.name,
            demographics: p.demographics || '',
            painPoints: p.pain_points || '',
            goals: p.goals || ''
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add profile
app.post('/api/profiles', (req, res) => {
    try {
        const { id, name, demographics, painPoints, goals } = req.body;
        db.prepare(`
            INSERT INTO customer_profiles (id, name, demographics, pain_points, goals)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, name, demographics, painPoints, goals);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update profile
app.put('/api/profiles/:id', (req, res) => {
    try {
        const { name, demographics, painPoints, goals } = req.body;
        db.prepare(`
            UPDATE customer_profiles
            SET name = ?, demographics = ?, pain_points = ?, goals = ?
            WHERE id = ?
        `).run(name, demographics, painPoints, goals, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete profile
app.delete('/api/profiles/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM customer_profiles WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Facebook Campaign API Routes
// ============================================

// Get all campaigns
app.get('/api/facebook/campaigns', (req, res) => {
    try {
        const campaigns = db.prepare('SELECT * FROM facebook_campaigns ORDER BY created_at DESC').all();
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create campaign
app.post('/api/facebook/campaigns', (req, res) => {
    try {
        const { id, name, objective, budgetType, dailyBudget, bidStrategy, status, fbCampaignId } = req.body;
        db.prepare(`
            INSERT OR IGNORE INTO facebook_campaigns (id, name, objective, budget_type, daily_budget, bid_strategy, status, fb_campaign_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, name, objective, budgetType, dailyBudget || null, bidStrategy || null, status || 'PAUSED', fbCampaignId || null);
        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update campaign
app.put('/api/facebook/campaigns/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, objective, budgetType, dailyBudget, bidStrategy, status, fbCampaignId } = req.body;
        db.prepare(`
            UPDATE facebook_campaigns
            SET name = ?, objective = ?, budget_type = ?, daily_budget = ?, bid_strategy = ?, status = ?, fb_campaign_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(name, objective, budgetType, dailyBudget || null, bidStrategy || null, status, fbCampaignId || null, id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get ad sets for a campaign
app.get('/api/facebook/adsets/:campaignId', (req, res) => {
    try {
        const adsets = db.prepare('SELECT * FROM facebook_adsets WHERE campaign_id = ? ORDER BY created_at DESC').all(req.params.campaignId);
        res.json(adsets.map(adset => ({
            ...adset,
            targeting: adset.targeting ? JSON.parse(adset.targeting) : null
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all ad sets
app.get('/api/facebook/adsets', (req, res) => {
    try {
        const adsets = db.prepare('SELECT * FROM facebook_adsets ORDER BY created_at DESC').all();
        res.json(adsets.map(adset => ({
            ...adset,
            targeting: adset.targeting ? JSON.parse(adset.targeting) : null
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create ad set
app.post('/api/facebook/adsets', (req, res) => {
    try {
        const { id, campaignId, name, optimizationGoal, dailyBudget, bidStrategy, bidAmount, targeting, pixelId, conversionEvent, status, fbAdsetId } = req.body;
        db.prepare(`
            INSERT INTO facebook_adsets (id, campaign_id, name, optimization_goal, daily_budget, bid_strategy, bid_amount, targeting, pixel_id, conversion_event, status, fb_adset_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            campaignId,
            name,
            optimizationGoal,
            dailyBudget || null,
            bidStrategy || null,
            bidAmount || null,
            targeting ? JSON.stringify(targeting) : null,
            pixelId || null,
            conversionEvent || null,
            status || 'PAUSED',
            fbAdsetId || null
        );
        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update ad set
app.put('/api/facebook/adsets/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { campaignId, name, optimizationGoal, dailyBudget, bidStrategy, bidAmount, targeting, pixelId, conversionEvent, status, fbAdsetId } = req.body;
        db.prepare(`
            UPDATE facebook_adsets
            SET campaign_id = ?, name = ?, optimization_goal = ?, daily_budget = ?, bid_strategy = ?, bid_amount = ?, targeting = ?, pixel_id = ?, conversion_event = ?, status = ?, fb_adset_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            campaignId,
            name,
            optimizationGoal,
            dailyBudget || null,
            bidStrategy || null,
            bidAmount || null,
            targeting ? JSON.stringify(targeting) : null,
            pixelId || null,
            conversionEvent || null,
            status,
            fbAdsetId || null,
            id
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get ads for an ad set
app.get('/api/facebook/ads/:adsetId', (req, res) => {
    try {
        const ads = db.prepare('SELECT * FROM facebook_ads WHERE adset_id = ? ORDER BY created_at DESC').all(req.params.adsetId);
        res.json(ads.map(ad => ({
            ...ad,
            bodies: ad.bodies ? JSON.parse(ad.bodies) : [],
            headlines: ad.headlines ? JSON.parse(ad.headlines) : []
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all ads
app.get('/api/facebook/ads', (req, res) => {
    try {
        const ads = db.prepare('SELECT * FROM facebook_ads ORDER BY created_at DESC').all();
        res.json(ads.map(ad => ({
            ...ad,
            bodies: ad.bodies ? JSON.parse(ad.bodies) : [],
            headlines: ad.headlines ? JSON.parse(ad.headlines) : []
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create ad (supports bulk creation)
app.post('/api/facebook/ads', (req, res) => {
    try {
        const ads = Array.isArray(req.body) ? req.body : [req.body];
        const insertAd = db.prepare(`
            INSERT INTO facebook_ads (id, adset_id, name, creative_name, image_url, bodies, headlines, description, cta, website_url, status, fb_ad_id, fb_creative_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const results = [];
        for (const ad of ads) {
            const { id, adsetId, name, creativeName, imageUrl, bodies, headlines, description, cta, websiteUrl, status, fbAdId, fbCreativeId } = ad;
            insertAd.run(
                id,
                adsetId,
                name,
                creativeName || null,
                imageUrl || null,
                bodies ? JSON.stringify(bodies) : null,
                headlines ? JSON.stringify(headlines) : null,
                description || null,
                cta || null,
                websiteUrl || null,
                status || 'PAUSED',
                fbAdId || null,
                fbCreativeId || null
            );
            results.push({ success: true, id });
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Image Templates Library API Routes
// ============================================

// Get all winning ads (with optional search and filters)
app.get('/api/winning-ads', (req, res) => {
    try {
        const { search, category, style } = req.query;

        if (search) {
            const term = `%${search}%`;
            // Weighted relevance scoring
            // Name: 10, Key Metadata: 5, Descriptive Metadata: 3, Long Text: 1
            const sql = `
                SELECT *,
                (
                    (CASE WHEN name LIKE ? THEN 10 ELSE 0 END) +
                    (CASE WHEN tags LIKE ? THEN 5 ELSE 0 END) +
                    (CASE WHEN topic LIKE ? THEN 5 ELSE 0 END) +
                    (CASE WHEN product_name LIKE ? THEN 5 ELSE 0 END) +
                    (CASE WHEN category LIKE ? THEN 5 ELSE 0 END) +
                    (CASE WHEN mood LIKE ? THEN 3 ELSE 0 END) +
                    (CASE WHEN subject_matter LIKE ? THEN 3 ELSE 0 END) +
                    (CASE WHEN design_style LIKE ? THEN 3 ELSE 0 END) +
                    (CASE WHEN analysis LIKE ? THEN 1 ELSE 0 END) +
                    (CASE WHEN copy_analysis LIKE ? THEN 1 ELSE 0 END) +
                    (CASE WHEN recreation_prompt LIKE ? THEN 1 ELSE 0 END) +
                    (CASE WHEN notes LIKE ? THEN 1 ELSE 0 END)
                ) as relevance_score
                FROM winning_ads
                WHERE relevance_score > 0
                ORDER BY relevance_score DESC, created_at DESC
            `;

            // Pass the term for each placeholder (12 times)
            const ads = db.prepare(sql).all(term, term, term, term, term, term, term, term, term, term, term, term);
            res.json(ads);
        } else if (category || style) {
            // Filter by category and/or style
            let sql = 'SELECT * FROM winning_ads WHERE 1=1';
            const params = [];

            if (category) {
                sql += ' AND template_category = ?';
                params.push(category);
            }

            if (style) {
                sql += ' AND design_style = ?';
                params.push(style);
            }

            sql += ' ORDER BY created_at DESC';

            const ads = db.prepare(sql).all(...params);
            res.json(ads);
        } else {
            const ads = db.prepare('SELECT * FROM winning_ads ORDER BY created_at DESC').all();
            res.json(ads);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get available template filters (categories and styles)
app.get('/api/image-templates/filters', (req, res) => {
    try {
        const categories = db.prepare(`
            SELECT DISTINCT template_category 
            FROM winning_ads 
            WHERE template_category IS NOT NULL AND template_category != ''
            ORDER BY template_category
        `).all();

        const styles = db.prepare(`
            SELECT DISTINCT design_style 
            FROM winning_ads 
            WHERE design_style IS NOT NULL AND design_style != ''
            ORDER BY design_style
        `).all();

        res.json({
            categories: categories.map(c => c.template_category),
            styles: styles.map(s => s.design_style)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get template preview with full details
app.get('/api/image-templates/:id/preview', (req, res) => {
    try {
        const { id } = req.params;
        const template = db.prepare('SELECT * FROM winning_ads WHERE id = ?').get(id);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Parse JSON fields for easier frontend consumption
        const preview = {
            ...template,
            template_structure: template.template_structure ? JSON.parse(template.template_structure) : null,
            color_palette: template.color_palette ? JSON.parse(template.color_palette) : null,
            typography_system: template.typography_system ? JSON.parse(template.typography_system) : null,
            copy_patterns: template.copy_patterns ? JSON.parse(template.copy_patterns) : null,
            visual_elements: template.visual_elements ? JSON.parse(template.visual_elements) : null
        };

        res.json(preview);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




// Helper function to analyze image with Gemini
async function analyzeImageWithGemini(filePath, mimeType) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY is missing in environment variables');
            return null;
        }
        console.log('🤖 Starting Gemini analysis for:', filePath);

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const fileData = fs.readFileSync(filePath);
        const imagePart = {
            inlineData: {
                data: fileData.toString('base64'),
                mimeType
            }
        };

        const prompt = `Analyze this advertising image to extract both creative analysis AND reusable template structure. This will enable recreating the same design pattern for different products/verticals.

        Provide a detailed analysis with the following fields:

        1. witty_name: Create a HILARIOUS, unexpected, and clever name for this ad. Think like a comedy writer - use wordplay, puns, pop culture references, absurdist humor, or ironic observations. The name should make someone laugh out loud or at least smirk. Examples:
           - For a mattress ad: "Nap Trap Deluxe" or "The Horizontal Life Coach"
           - For a coffee brand: "Bean There, Done That" or "Existential Espresso"
           - For skincare: "Pore Decisions" or "Face Value Proposition"
           Be creative, unexpected, and genuinely funny!
        
        2. topic: The main topic or category of the ad.
        3. mood: The overall mood or tone of the image.
        4. subject_matter: A description of the main subject matter.
        5. copy_analysis: An analysis of any text or copy present in the image.
        6. product_name: The name of the product being promoted (if identifiable).
        7. category: The specific category of the product or ad (e.g., "Skincare", "Tech", "Apparel").
        8. design_style: The design style template or aesthetic (e.g., "Minimalist", "Vintage", "UGC-style", "Corporate").
        9. structural_analysis: Analyze the composition and structure - discuss the layout, visual hierarchy, focal points, use of whitespace, grid system, alignment, balance, and how elements are organized to guide the viewer's eye.
        10. layering: Describe the layering of visual elements - what's in the foreground, midground, and background? How are text, images, graphics, and other elements stacked?
        11. recreation_prompt: A specific prompt that could be used to recreate a similar image using an AI image generator.
        12. analysis: A general detailed description of the visual style, composition, and key elements.

        === TEMPLATE EXTRACTION (NEW) ===
        
        13. template_structure: Extract the reusable layout structure as JSON. Include:
            - template_name: Descriptive name for this layout pattern (e.g., "Before/After Comparison", "Product Hero", "Testimonial Card")
            - template_category: Type classification (e.g., "comparison", "testimonial", "product_focused", "lifestyle")
            - layout_type: Layout pattern (e.g., "split_panel", "single_column", "grid", "hero")
            - aspect_ratio: Image dimensions (e.g., "1:1", "16:9", "9:16", "4:5")
            - sections: Array of layout sections with type, position, height_percent, and elements
            Example: {"template_name": "Before/After Transformation", "template_category": "comparison", "layout_type": "split_panel", "aspect_ratio": "1:1", "sections": [{"type": "header", "position": "top", "height_percent": 15, "elements": [{"type": "headline", "alignment": "left"}, {"type": "price_callout", "alignment": "right"}]}, {"type": "main_content", "position": "middle", "height_percent": 70, "layout": "two_column", "elements": [{"type": "image_panel", "label": "before", "width_percent": 50}, {"type": "image_panel", "label": "after", "width_percent": 50}]}, {"type": "cta_section", "position": "bottom", "height_percent": 15}]}

        14. color_palette: Extract the color scheme as JSON. Include:
            - primary: Main color (hex code)
            - secondary: Secondary color (hex code)
            - accent: Accent color (hex code)
            - background: Background color (hex code)
            - text_color: Primary text color (hex code)
            - theme: Overall color theme description (e.g., "patriotic", "minimalist", "vibrant", "earthy")
            - color_count: Number of distinct colors used
            Example: {"primary": "#1e3a5f", "secondary": "#c41e3a", "accent": "#ffffff", "background": "#f5f5f5", "text_color": "#000000", "theme": "patriotic", "color_count": 3}

        15. typography_system: Extract the typography patterns as JSON. Include font specifications for different text types:
            - headline: {font_family, weight, transform, size_category}
            - subheadline: {font_family, weight, transform, size_category}
            - body_text: {font_family, weight, transform, size_category}
            - cta_text: {font_family, weight, transform, size_category}
            Use generic font families like "sans_serif", "serif", "condensed_sans_serif", "script", "monospace"
            Example: {"headline": {"font_family": "condensed_sans_serif", "weight": "extra_bold", "transform": "uppercase", "size_category": "large"}, "cta_text": {"font_family": "sans_serif", "weight": "bold", "transform": "uppercase", "size_category": "small"}}

        16. copy_patterns: Extract the PATTERN of copy, not the literal text. This enables applying the same structure to different products. Include:
            - headline: {pattern, tone, example}
            - subheadline: {pattern, tone, example} (if present)
            - body_copy: {pattern, tone, example} (if present)
            - ctas: Array of {pattern, tone, example}
            - footer: {pattern, tone, example} (if present)
            Pattern examples: "[ACTION VERB] [BENEFIT]!", "[PRODUCT] [TRANSFORMATION CLAIM]", "[BENEFIT] - [ACTION]"
            Example: {"headline": {"pattern": "[ACTION VERB] [BENEFIT]!", "tone": "urgent, patriotic", "example": "UNLEASH AMERICAN STRENGTH!"}, "ctas": [{"pattern": "[BENEFIT] - [ACTION]", "tone": "direct", "example": "RESTORE VITALITY - See How!"}]}

        17. visual_elements: Extract reusable visual element patterns as JSON. Include:
            - badges: Array of badge/logo elements with {type, position, theme, purpose}
            - icons: Array of icons with {type, position, purpose}
            - image_requirements: {count, type, style_notes} (e.g., "before/after photos", "product shot", "lifestyle image")
            - decorative_elements: Array of decorative elements
            - labels: Array of text labels/overlays
            Example: {"badges": [{"type": "circular_logo", "position": "top_left", "theme": "patriotic_flag", "purpose": "branding"}], "image_requirements": {"count": 2, "type": "before_after_photos", "style_notes": "before is desaturated, after is vibrant"}, "labels": [{"text": "BEFORE/AFTER", "style": "text_overlay", "position": "top_of_panel"}]}

        18. template_category: Single word classification of the template type. Choose from: "comparison", "testimonial", "product_hero", "lifestyle", "educational", "promotional", "ugc_style", "minimalist", "bold_statement"

        Return ONLY valid JSON with ALL fields:
        {
            "witty_name": "...",
            "topic": "...",
            "mood": "...",
            "subject_matter": "...",
            "copy_analysis": "...",
            "product_name": "...",
            "category": "...",
            "design_style": "...",
            "structural_analysis": "...",
            "layering": "...",
            "recreation_prompt": "...",
            "analysis": "...",
            "template_structure": {...},
            "color_palette": {...},
            "typography_system": {...},
            "copy_patterns": {...},
            "visual_elements": {...},
            "template_category": "..."
        }`;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        console.log('✅ Gemini response received');

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            console.log('✅ JSON parsed successfully');
            return JSON.parse(jsonMatch[0]);
        }
        console.warn('⚠️ No JSON found in Gemini response:', text);
        return null;
    } catch (error) {
        console.error('❌ Gemini analysis error:', error);
        return null;
    }
}

// Upload winning ad (supports multiple files and zip)
app.post('/api/winning-ads/upload', upload.array('images'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const processedFiles = [];

        for (const file of req.files) {
            // Check if it's a zip file
            if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.originalname.endsWith('.zip')) {
                try {
                    const zip = new AdmZip(file.path);
                    const zipEntries = zip.getEntries();

                    zipEntries.forEach((entry) => {
                        if (!entry.isDirectory && entry.entryName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                            const ext = path.extname(entry.entryName);
                            const newFilename = uniqueSuffix + ext;
                            const newPath = path.join(uploadDir, newFilename);

                            // Extract entry to uploads folder with new name
                            fs.writeFileSync(newPath, entry.getData());

                            processedFiles.push({
                                filename: newFilename,
                                originalName: path.basename(entry.entryName, ext),
                                path: newPath,
                                mimetype: 'image/' + ext.substring(1) // Approximate mime type
                            });
                        }
                    });

                    // Clean up the uploaded zip file
                    fs.unlinkSync(file.path);
                } catch (zipError) {
                    console.error('Error extracting zip:', zipError);
                }
            } else {
                // Regular image file
                processedFiles.push({
                    filename: file.filename,
                    originalName: file.originalname.split('.')[0],
                    path: file.path,
                    mimetype: file.mimetype
                });
            }
        }

        const insertStmt = db.prepare(`
            INSERT INTO winning_ads (
                id, name, filename, image_url, notes, tags, 
                analysis, recreation_prompt, topic, mood, subject_matter, copy_analysis, 
                product_name, category, design_style, structural_analysis, layering,
                template_structure, color_palette, typography_system, copy_patterns, visual_elements, template_category
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const results = [];
        for (const file of processedFiles) {
            const id = `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const imageUrl = `/uploads/${file.filename}`;
            const tempName = 'Analyzing...';

            // Insert immediately with temporary name
            insertStmt.run(
                id,
                tempName,
                file.originalName,
                imageUrl,
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                ''
            );

            results.push({ id, imageUrl, name: tempName });

            // Run Gemini analysis in background
            if (process.env.GEMINI_API_KEY) {
                (async () => {
                    try {
                        const geminiResult = await analyzeImageWithGemini(file.path, file.mimetype);
                        if (geminiResult) {
                            const updateStmt = db.prepare(`
                                UPDATE winning_ads 
                                SET name = ?,
                                    analysis = ?, 
                                    recreation_prompt = ?, 
                                    topic = ?, 
                                    mood = ?, 
                                    subject_matter = ?, 
                                    copy_analysis = ?,
                                    product_name = ?,
                                    category = ?,
                                    design_style = ?,
                                    structural_analysis = ?,
                                    layering = ?,
                                    template_structure = ?,
                                    color_palette = ?,
                                    typography_system = ?,
                                    copy_patterns = ?,
                                    visual_elements = ?,
                                    template_category = ?
                                WHERE id = ?
                            `);

                            updateStmt.run(
                                geminiResult.witty_name || 'Untitled Ad',
                                geminiResult.analysis || '',
                                geminiResult.recreation_prompt || '',
                                geminiResult.topic || '',
                                geminiResult.mood || '',
                                geminiResult.subject_matter || '',
                                geminiResult.copy_analysis || '',
                                geminiResult.product_name || '',
                                geminiResult.category || '',
                                geminiResult.design_style || '',
                                geminiResult.structural_analysis || '',
                                geminiResult.layering || '',
                                JSON.stringify(geminiResult.template_structure || {}),
                                JSON.stringify(geminiResult.color_palette || {}),
                                JSON.stringify(geminiResult.typography_system || {}),
                                JSON.stringify(geminiResult.copy_patterns || {}),
                                JSON.stringify(geminiResult.visual_elements || {}),
                                geminiResult.template_category || '',
                                id
                            );
                            console.log(`✅ Analysis updated for ad: ${id}`);
                        }
                    } catch (err) {
                        console.error(`❌ Background analysis failed for ${id}:`, err);
                    }
                })();
            }
        }

        res.json({ count: processedFiles.length, ads: results });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Delete winning ad
app.delete('/api/winning-ads/:id', (req, res) => {
    try {
        // First get the image URL to delete the file
        const ad = db.prepare('SELECT image_url FROM winning_ads WHERE id = ?').get(req.params.id);

        if (ad) {
            const filePath = path.join(__dirname, ad.image_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        db.prepare('DELETE FROM winning_ads WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bulk delete winning ads
app.post('/api/winning-ads/bulk-delete', (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Invalid or empty IDs array' });
        }

        const deleteStmt = db.prepare('DELETE FROM winning_ads WHERE id = ?');
        const selectStmt = db.prepare('SELECT image_url FROM winning_ads WHERE id = ?');

        const deleteTransaction = db.transaction((idsToDelete) => {
            for (const id of idsToDelete) {
                const ad = selectStmt.get(id);
                if (ad) {
                    const filePath = path.join(__dirname, ad.image_url);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
                deleteStmt.run(id);
            }
        });

        deleteTransaction(ids);
        res.json({ success: true, count: ids.length });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ error: error.message });
    }
});


// Update winning ad (tags, notes)
app.put('/api/winning-ads/:id', (req, res) => {
    try {
        const { tags, notes } = req.body;

        db.prepare(`
            UPDATE winning_ads 
            SET tags = ?, notes = ?
            WHERE id = ?
        `).run(tags || '', notes || '', req.params.id);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ============================================
// Generated Ads API Routes
// ============================================

// Get all generated ads
app.get('/api/generated-ads', (req, res) => {
    try {
        const { brand_id, search } = req.query;

        let sql = 'SELECT * FROM generated_ads WHERE 1=1';
        const params = [];

        if (brand_id) {
            sql += ' AND brand_id = ?';
            params.push(brand_id);
        }

        if (search) {
            sql += ' AND (headline LIKE ? OR body LIKE ? OR cta LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        sql += ' ORDER BY created_at DESC';

        const ads = db.prepare(sql).all(...params);
        res.json(ads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Batch save generated ads (MUST be before single save route)
app.post('/api/generated-ads/batch', (req, res) => {
    try {
        const { ads } = req.body;

        console.log('📦 Batch save request received:', { adsCount: ads?.length });

        if (!ads || !Array.isArray(ads)) {
            console.error('❌ Invalid ads array:', ads);
            return res.status(400).json({ error: 'Invalid ads array' });
        }

        console.log('📝 Sample ad data:', JSON.stringify(ads[0], null, 2));

        // Validate URLs
        ads.forEach((ad, i) => {
            if (!ad.imageUrl || typeof ad.imageUrl !== 'string') {
                console.error(`❌ Invalid URL for ad ${i}:`, ad.imageUrl);
            }
        });

        const insertStmt = db.prepare(`
            INSERT INTO generated_ads (id, brand_id, product_id, template_id, image_url, headline, body, cta, size_name, dimensions, prompt, ad_bundle_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((adsToInsert) => {
            for (const ad of adsToInsert) {
                insertStmt.run(
                    ad.id,
                    ad.brandId || null,
                    ad.productId || null,
                    ad.templateId || null,
                    ad.imageUrl,
                    ad.headline || '',
                    ad.body || '',
                    ad.cta || '',
                    ad.sizeName || '',
                    ad.dimensions || '',
                    ad.prompt || '',
                    ad.adBundleId || null
                );
            }
        });

        transaction(ads);
        console.log('✅ Successfully saved', ads.length, 'ads to database');
        res.json({ success: true, count: ads.length });
    } catch (error) {
        console.error('❌ Batch save error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save a single generated ad
app.post('/api/generated-ads', (req, res) => {
    try {
        const { id, brandId, productId, templateId, imageUrl, headline, body, cta, sizeName, dimensions, prompt } = req.body;

        db.prepare(`
            INSERT INTO generated_ads (id, brand_id, product_id, template_id, image_url, headline, body, cta, size_name, dimensions, prompt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, brandId || null, productId || null, templateId || null, imageUrl, headline || '', body || '', cta || '', sizeName || '', dimensions || '', prompt || '');

        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Delete generated ad
app.delete('/api/generated-ads/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM generated_ads WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export generated ads as CSV
app.post('/api/generated-ads/export-csv', (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No ads selected for export' });
        }

        const placeholders = ids.map(() => '?').join(',');
        const ads = db.prepare(`SELECT * FROM generated_ads WHERE id IN (${placeholders})`).all(...ids);

        if (ads.length === 0) {
            return res.status(404).json({ error: 'No ads found' });
        }

        // Create CSV content
        const headers = ['ID', 'Headline', 'Body', 'CTA', 'Image URL', 'Size', 'Dimensions', 'Created At'];
        const rows = ads.map(ad => [
            ad.id,
            ad.headline || '',
            ad.body || '',
            ad.cta || '',
            `http://localhost:3001${ad.image_url}`,
            ad.size_name || '',
            ad.dimensions || '',
            ad.created_at
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="generated-ads-${Date.now()}.csv"`);
        res.send(csvContent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ============================================
// Copy Generation API Route
// ============================================

// Generate ad copy variations using Gemini
app.post('/api/generate-copy', async (req, res) => {
    try {
        const { brand, product, profile, template, campaignDetails, variationCount } = req.body;

        // Validate required fields
        if (!brand || !product || !profile || !template || !campaignDetails) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }

        console.log('🤖 Starting copy generation for:', product.name);

        // Get template details from database
        const templateData = db.prepare('SELECT * FROM winning_ads WHERE id = ?').get(template.id);

        if (!templateData) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Parse template copy patterns
        let copyPatterns = {};
        try {
            copyPatterns = templateData.copy_patterns ? JSON.parse(templateData.copy_patterns) : {};
        } catch (e) {
            console.warn('Could not parse copy patterns, using defaults');
        }

        // Build Gemini prompt
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const count = variationCount || 3;

        const prompt = `You are an expert ad copywriter. Generate ${count} variations of ad copy for a Facebook/Instagram ad campaign.

TEMPLATE COPY PATTERNS:
${copyPatterns.headline ? `- Headline Pattern: "${copyPatterns.headline.pattern}" (Tone: ${copyPatterns.headline.tone})` : '- Headline: Create compelling, attention-grabbing headlines'}
${copyPatterns.ctas && copyPatterns.ctas[0] ? `- CTA Pattern: "${copyPatterns.ctas[0].pattern}" (Tone: ${copyPatterns.ctas[0].tone})` : '- CTA: Create clear, action-oriented CTAs'}
${copyPatterns.body_copy ? `- Body Copy Pattern: "${copyPatterns.body_copy.pattern}" (Tone: ${copyPatterns.body_copy.tone})` : '- Body: Create persuasive body copy'}
- Overall Mood: ${templateData.mood || 'engaging and persuasive'}
- Design Style: ${templateData.design_style || 'modern'}

BRAND NAME: ${brand.name}
BRAND VOICE: ${brand.voice || 'Professional and friendly'}

PRODUCT: ${product.name}
${product.description ? `Description: ${product.description}` : ''}

TARGET AUDIENCE:
- Demographics: ${profile.demographics || 'General audience'}
- Pain Points: ${profile.painPoints || profile.pain_points || 'Common challenges'}
- Goals: ${profile.goals || 'Desired outcomes'}

CAMPAIGN DETAILS:
- Offer: ${campaignDetails.offer}
${campaignDetails.urgency ? `- Urgency: ${campaignDetails.urgency}` : ''}
- Key Messaging: ${campaignDetails.messaging}

INSTRUCTIONS:
Generate ${count} distinct variations. Each variation should:
1. Follow the template's copy patterns and tone
2. Match the brand voice consistently
3. Address the audience's pain points and goals
4. Incorporate the campaign offer and key messaging
5. Be compelling, conversion-focused, and ad-appropriate
6. Keep headlines under 40 characters
7. Keep body copy under 125 characters (Facebook ad best practice)
8. Keep CTAs under 20 characters

Make each variation DIFFERENT from the others while maintaining consistency with the template style.

Return ONLY valid JSON in this exact format:
{
  "variations": [
    {
      "headline": "Short, punchy headline",
      "body": "Compelling body copy that addresses pain points",
      "cta": "Action CTA"
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Gemini response received');

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('No JSON found in response:', text);
            return res.status(500).json({ error: 'Failed to parse Gemini response' });
        }

        const generatedCopy = JSON.parse(jsonMatch[0]);

        if (!generatedCopy.variations || !Array.isArray(generatedCopy.variations)) {
            return res.status(500).json({ error: 'Invalid response format from Gemini' });
        }

        console.log(`✅ Generated ${generatedCopy.variations.length} copy variations`);

        res.json({
            success: true,
            variations: generatedCopy.variations,
            metadata: {
                template: templateData.name,
                brand: brand.name,
                product: product.name,
                profile: profile.name
            }
        });

    } catch (error) {
        console.error('❌ Copy generation error:', error);
        res.status(500).json({ error: 'Copy generation failed', details: error.message });
    }
});

// Generate ad image using Kie.ai Nano Banana Pro (Google Gemini 3 Pro Image)
app.post('/api/generate-image', async (req, res) => {
    // IMMEDIATE LOGGING
    try {
        fs.writeFileSync('server_debug.log', `[${new Date().toISOString()}] Hit /api/generate-image\n`);
    } catch (e) { console.error('FS Write Error:', e); }

    console.log('🎬 Starting image generation request (Fal.ai)...');
    try {
        const { template, brand, product, copy, count = 1, imageSizes = [], resolution = '1K', model = 'nano-banana-pro' } = req.body;

        console.log('📦 Request data:', {
            templateId: template?.id,
            brandName: brand?.name,
            productName: product?.name,
            count,
            imageSizesCount: imageSizes.length,
            resolution
        });

        if (!template || !brand || !product) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!process.env.FAL_AI_API_KEY) {
            console.log('❌ FAL_AI_API_KEY not configured');

            // Log missing key error
            try {
                const fs = require('fs');
                fs.appendFileSync('server_error.log', `[${new Date().toISOString()}] Error: FAL_AI_API_KEY is missing in process.env\n`);
            } catch (e) { }

            return res.status(500).json({ error: 'FAL_AI_API_KEY not configured' });
        }

        const sizes = imageSizes || [{ name: 'Square', width: 1080, height: 1080 }];
        console.log(`🎨 Generating ${count || 1} variations across ${sizes.length} size(s) for: ${product.name}`);

        // Get template details
        const templateData = db.prepare('SELECT * FROM winning_ads WHERE id = ?').get(template.id);
        if (!templateData) {
            console.log('❌ Template not found:', template.id);
            return res.status(404).json({ error: 'Template not found' });
        }

        // Construct Prompt - Prioritize Product/Brand/Copy over Template Content
        const headlineContext = copy?.headline ? `Context: Visual representation of "${copy.headline}"` : '';
        const brandColor = brand.colors?.primary || 'Brand Colors';

        const prompt = `Product Photography of ${product.name} - ${product.description || ''}.
        ${brand.name} style: ${brand.voice || 'Professional'}. Primary Color: ${brandColor}.
        ${headlineContext}
        Art Direction: ${templateData.mood || 'Engaging'}, ${templateData.lighting || 'Professional Lighting'}, ${templateData.composition || 'Balanced'}, ${templateData.design_style || 'Modern'}.
        High quality, photorealistic, 4k, advertising standard.`;

        console.log('📝 Generated prompt:', prompt.substring(0, 100) + '...');

        // Helper function to map dimensions to Fal.ai image_size
        const getFalImageSize = (width, height) => {
            const aspectRatio = width / height;
            if (Math.abs(aspectRatio - 1) < 0.1) return 'square_hd';
            if (Math.abs(aspectRatio - 0.8) < 0.1) return 'portrait_4_3';
            if (Math.abs(aspectRatio - 0.5625) < 0.1) return 'portrait_16_9';
            if (Math.abs(aspectRatio - 1.33) < 0.1) return 'landscape_4_3';
            if (Math.abs(aspectRatio - 1.78) < 0.1) return 'landscape_16_9';
            return 'square_hd'; // Default
        };

        // Helper function to poll Fal.ai request status
        const pollFalRequest = async (statusUrl, maxAttempts = 60, delayMs = 2000) => {
            console.log(`[Fal.ai] Polling status: ${statusUrl}`);

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                try {
                    const statusResponse = await fetch(statusUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Key ${process.env.FAL_AI_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!statusResponse.ok) {
                        const errorText = await statusResponse.text();
                        console.error(`[Fal.ai] Polling failed: ${statusResponse.status} ${statusResponse.statusText} - ${errorText}`);
                        throw new Error(`Fal.ai polling failed: ${statusResponse.status}`);
                    }

                    const statusData = await statusResponse.json();
                    console.log(`[Fal.ai] Status: ${statusData.status}`);

                    if (statusData.status === 'COMPLETED') {
                        if (statusData.images && statusData.images.length > 0) {
                            return statusData.images[0].url;
                        }
                        if (statusData.response_url) {
                            const resultResponse = await fetch(statusData.response_url, {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Key ${process.env.FAL_AI_API_KEY}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                            const resultData = await resultResponse.json();
                            if (resultData.images && resultData.images.length > 0) {
                                return resultData.images[0].url;
                            }
                        }
                        throw new Error('No images in Fal.ai response');
                    } else if (statusData.status === 'FAILED') {
                        throw new Error(`Fal.ai request failed: ${statusData.error || 'Unknown error'}`);
                    }

                    await new Promise(resolve => setTimeout(resolve, delayMs));
                } catch (error) {
                    console.error(`[Fal.ai] Polling error (attempt ${attempt + 1}):`, error);
                    if (attempt === maxAttempts - 1) throw error;
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
            throw new Error('Fal.ai request timed out');
        };

        // Helper to generate a single image
        const generateSingleImage = async (prompt, size, imageUrl = null) => {
            const falSize = getFalImageSize(size.width, size.height);
            console.log(`[Fal.ai] Requesting ${size.name} (${falSize})${imageUrl ? ' based on existing image' : ''}...`);

            let endpoint = 'https://queue.fal.run/fal-ai/nano-banana-pro';

            // If using Imagen4 for primary generation
            if (!imageUrl && model === 'imagen4') {
                endpoint = 'https://queue.fal.run/fal-ai/imagen4/preview';
                console.log(`[Fal.ai] Using Imagen4 for primary generation: ${endpoint}`);
            }

            let body = {
                prompt: prompt,
                num_images: 1,
                aspect_ratio: size.aspectRatio,
                output_format: 'png',
                resolution: resolution
            };

            // If we have a source image, use the EDIT endpoint for resizing/variation
            if (imageUrl) {
                endpoint = 'https://queue.fal.run/fal-ai/nano-banana-pro/edit';
                // Edit endpoint expects image_urls array and aspect_ratio enum
                body = {
                    prompt: prompt,
                    image_urls: [imageUrl],
                    aspect_ratio: size.aspectRatio, // e.g. "9:16", "4:5"
                    output_format: 'png'
                };
                console.log(`[Fal.ai] Using EDIT endpoint for resizing: ${endpoint} to ${size.aspectRatio}`);
            }

            const createResponse = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${process.env.FAL_AI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                throw new Error(`Fal.ai creation failed: ${createResponse.status} - ${errorText}`);
            }

            const createData = await createResponse.json();
            return await pollFalRequest(createData.status_url);
        };

        const generatedImages = [];
        const variationCount = count || 1;

        // Step 1: Generate Primary Square Images
        const squareSize = sizes.find(s => s.name.includes('Square')) || sizes[0];
        const otherSizes = sizes.filter(s => s.name !== squareSize.name);

        console.log(`🚀 Starting generation workflow. Count: ${variationCount}`);

        for (let i = 0; i < variationCount; i++) {
            try {
                // 1. Generate Primary Square Image
                console.log(`📸 Generating Primary Square Image ${i + 1}/${variationCount}...`);
                const squareUrl = await generateSingleImage(prompt, squareSize);

                generatedImages.push({
                    url: squareUrl,
                    size: squareSize.name,
                    dimensions: `${squareSize.width}x${squareSize.height}`,
                    prompt: prompt
                });

                // 2. Generate Variations based on Square Image
                for (const size of otherSizes) {
                    console.log(`🔄 Generating ${size.name} variation based on Square Image ${i + 1}...`);
                    const variationUrl = await generateSingleImage(prompt, size, squareUrl);

                    generatedImages.push({
                        url: variationUrl,
                        size: size.name,
                        dimensions: `${size.width}x${size.height}`,
                        prompt: prompt
                    });
                }

            } catch (err) {
                console.error(`❌ Failed to generate variation set ${i + 1}:`, err);
                // Continue with next variation set if one fails
            }
        }

        if (generatedImages.length === 0) {
            throw new Error('Failed to generate any images');
        }

        res.json({ success: true, images: generatedImages });

    } catch (error) {
        console.error('❌ Image generation error:', error);
        console.error('Stack trace:', error.stack);

        // Log to file for debugging
        try {
            const logMessage = `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\n\n`;
            fs.appendFileSync('server_error.log', logMessage);
        } catch (logError) {
            console.error('Failed to write to log file:', logError);
        }

        res.status(500).json({ error: 'Image generation failed', details: error.message });
    }
});



// Regenerate a single field of ad copy
app.post('/api/regenerate-field', async (req, res) => {
    try {
        const { field, currentValue, brand, product, profile, template, campaignDetails } = req.body;

        // Validate required fields
        if (!field || !brand || !product || !profile || !template || !campaignDetails) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }

        console.log(`🤖 Regenerating ${field} for:`, product.name);

        // Get template details from database
        const templateData = db.prepare('SELECT * FROM winning_ads WHERE id = ?').get(template.id);

        if (!templateData) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Parse template copy patterns
        let copyPatterns = {};
        try {
            copyPatterns = templateData.copy_patterns ? JSON.parse(templateData.copy_patterns) : {};
        } catch (e) {
            console.warn('Could not parse copy patterns, using defaults');
        }

        // Build Gemini prompt
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        let fieldInstruction = '';
        let maxLength = 100;

        switch (field) {
            case 'headline':
                fieldInstruction = copyPatterns.headline
                    ? `Headline Pattern: "${copyPatterns.headline.pattern}" (Tone: ${copyPatterns.headline.tone})`
                    : 'Create a compelling, attention-grabbing headline';
                maxLength = 40;
                break;
            case 'body':
                fieldInstruction = copyPatterns.body_copy
                    ? `Body Copy Pattern: "${copyPatterns.body_copy.pattern}" (Tone: ${copyPatterns.body_copy.tone})`
                    : 'Create persuasive body copy';
                maxLength = 125;
                break;
            case 'cta':
                fieldInstruction = copyPatterns.ctas && copyPatterns.ctas[0]
                    ? `CTA Pattern: "${copyPatterns.ctas[0].pattern}" (Tone: ${copyPatterns.ctas[0].tone})`
                    : 'Create a clear, action-oriented CTA';
                maxLength = 20;
                break;
            default:
                return res.status(400).json({ error: 'Invalid field type' });
        }

        const prompt = `You are an expert ad copywriter. Regenerate a SINGLE ${field} for a Facebook/Instagram ad.

CONTEXT:
- Current ${field}: "${currentValue}" (Generate something DIFFERENT from this)
- Template Style: ${fieldInstruction}
- Brand Voice: ${brand.voice || 'Professional and friendly'}
- Product: ${product.name}
- Audience: ${profile.demographics || 'General'}, Pain Points: ${profile.painPoints || 'Challenges'}
- Offer: ${campaignDetails.offer}
- Key Messaging: ${campaignDetails.messaging}

INSTRUCTIONS:
1. Generate ONE single alternative for the ${field}.
2. Make it distinct from the current version.
3. Keep it under ${maxLength} characters.
4. Return ONLY the raw text of the new ${field}, no JSON, no quotes, no labels.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim().replace(/^["']|["']$/g, ''); // Remove quotes if present

        console.log(`✅ Regenerated ${field}:`, text);

        res.json({ success: true, newValue: text });

    } catch (error) {
        console.error('❌ Field regeneration error:', error);
        res.status(500).json({ error: 'Regeneration failed', details: error.message });
    }
});


// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 Global Error:', err);
    try {
        fs.appendFileSync('server_error.log', `[${new Date().toISOString()}] Global Error: ${err.message}\nStack: ${err.stack}\n\n`);
    } catch (e) { }
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
});
