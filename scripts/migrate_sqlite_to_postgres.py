import sqlite3
import json
import os
import sys
from datetime import datetime
from sqlalchemy import text
from dotenv import load_dotenv

# Load .env from project root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
load_dotenv(os.path.join(project_root, '.env'))

# Add backend to path so we can import app modules
sys.path.append(os.path.join(project_root, 'backend'))

from app.database import SessionLocal, engine
from app.models import (
    Brand, Product, CustomerProfile, brand_profiles,
    FacebookCampaign, FacebookAdSet, FacebookAd,
    WinningAd, GeneratedAd
)

# Path to source SQLite DB
SOURCE_DB_PATH = os.path.join(project_root, 'backend/video_ads.db')

def migrate():
    print(f"🚀 Starting migration from {SOURCE_DB_PATH} to PostgreSQL...")
    
    if not os.path.exists(SOURCE_DB_PATH):
        print(f"❌ Source database not found at {SOURCE_DB_PATH}")
        return

    # Connect to SQLite
    sqlite_conn = sqlite3.connect(SOURCE_DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    cursor = sqlite_conn.cursor()

    # Connect to PostgreSQL via SQLAlchemy
    db = SessionLocal()

    try:
        # 1. Migrate Brands
        print("\n📦 Migrating Brands...")
        cursor.execute("SELECT * FROM brands")
        brands = cursor.fetchall()
        
        for row in brands:
            if db.query(Brand).filter(Brand.id == row['id']).first():
                print(f"  Skipping existing brand: {row['name']}")
                continue

            brand = Brand(
                id=row['id'],
                name=row['name'],
                logo=row['logo'],
                voice=row['voice'],
                primary_color=row['primary_color'],
                secondary_color=row['secondary_color'],
                highlight_color=row['highlight_color'],
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None,
                updated_at=datetime.fromisoformat(row['updated_at']) if row['updated_at'] else None
            )
            db.add(brand)
        db.commit()
        print(f"✅ Processed {len(brands)} brands")

        # 2. Migrate Products
        print("\n📦 Migrating Products...")
        cursor.execute("SELECT * FROM products")
        products = cursor.fetchall()
        
        for row in products:
            if db.query(Product).filter(Product.id == row['id']).first():
                continue

            product = Product(
                id=row['id'],
                brand_id=row['brand_id'],
                name=row['name'],
                description=row['description'],
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None
            )
            db.add(product)
        db.commit()
        print(f"✅ Processed {len(products)} products")

        # 3. Migrate Customer Profiles
        print("\n📦 Migrating Customer Profiles...")
        cursor.execute("SELECT * FROM customer_profiles")
        profiles = cursor.fetchall()
        
        for row in profiles:
            if db.query(CustomerProfile).filter(CustomerProfile.id == row['id']).first():
                continue

            profile = CustomerProfile(
                id=row['id'],
                name=row['name'],
                demographics=row['demographics'],
                pain_points=row['pain_points'],
                goals=row['goals'],
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None
            )
            db.add(profile)
        db.commit()
        print(f"✅ Processed {len(profiles)} profiles")

        # 4. Migrate Brand-Profile Links
        print("\n📦 Migrating Brand Profiles...")
        cursor.execute("SELECT * FROM brand_profiles")
        links = cursor.fetchall()
        
        for row in links:
            exists = db.query(brand_profiles).filter(
                brand_profiles.c.brand_id == row['brand_id'],
                brand_profiles.c.profile_id == row['profile_id']
            ).first()
            
            if exists:
                continue

            stmt = brand_profiles.insert().values(
                brand_id=row['brand_id'],
                profile_id=row['profile_id'],
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None
            )
            db.execute(stmt)
        db.commit()
        print(f"✅ Processed {len(links)} brand-profile links")

        # 5. Migrate Facebook Campaigns
        print("\n📦 Migrating Facebook Campaigns...")
        cursor.execute("SELECT * FROM facebook_campaigns")
        campaigns = cursor.fetchall()
        
        for row in campaigns:
            if db.query(FacebookCampaign).filter(FacebookCampaign.id == row['id']).first():
                continue

            campaign = FacebookCampaign(
                id=row['id'],
                name=row['name'],
                objective=row['objective'],
                budget_type=row['budget_type'],
                daily_budget=row['daily_budget'],
                bid_strategy=row['bid_strategy'],
                status=row['status'],
                fb_campaign_id=row['fb_campaign_id'],
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None,
                updated_at=datetime.fromisoformat(row['updated_at']) if row['updated_at'] else None
            )
            db.add(campaign)
        db.commit()
        print(f"✅ Processed {len(campaigns)} campaigns")

        # 6. Migrate Facebook AdSets
        print("\n📦 Migrating Facebook AdSets...")
        cursor.execute("SELECT * FROM facebook_adsets")
        adsets = cursor.fetchall()
        
        for row in adsets:
            if db.query(FacebookAdSet).filter(FacebookAdSet.id == row['id']).first():
                continue

            targeting = row['targeting']
            if isinstance(targeting, str):
                try:
                    targeting = json.loads(targeting)
                except:
                    targeting = {}
            
            adset = FacebookAdSet(
                id=row['id'],
                campaign_id=row['campaign_id'],
                name=row['name'],
                optimization_goal=row['optimization_goal'],
                daily_budget=row['daily_budget'],
                bid_strategy=row['bid_strategy'],
                bid_amount=row['bid_amount'],
                targeting=targeting,
                pixel_id=row['pixel_id'],
                conversion_event=row['conversion_event'],
                status=row['status'],
                fb_adset_id=row['fb_adset_id'],
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None
            )
            db.add(adset)
        db.commit()
        print(f"✅ Processed {len(adsets)} adsets")

        # 7. Migrate Facebook Ads
        print("\n📦 Migrating Facebook Ads...")
        cursor.execute("SELECT * FROM facebook_ads")
        ads = cursor.fetchall()
        
        for row in ads:
            if db.query(FacebookAd).filter(FacebookAd.id == row['id']).first():
                continue

            bodies = json.loads(row['bodies']) if row['bodies'] else []
            headlines = json.loads(row['headlines']) if row['headlines'] else []

            ad = FacebookAd(
                id=row['id'],
                adset_id=row['adset_id'],
                name=row['name'],
                creative_name=row['creative_name'],
                image_url=row['image_url'],
                bodies=bodies,
                headlines=headlines,
                description=row['description'],
                cta=row['cta'],
                website_url=row['website_url'],
                status=row['status'],
                fb_ad_id=row['fb_ad_id'],
                fb_creative_id=row['fb_creative_id'],
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None
            )
            db.add(ad)
        db.commit()
        print(f"✅ Processed {len(ads)} ads")

        # 8. Migrate Winning Ads
        print("\n📦 Migrating Winning Ads...")
        cursor.execute("SELECT * FROM winning_ads")
        w_ads = cursor.fetchall()
        
        for row in w_ads:
            if db.query(WinningAd).filter(WinningAd.id == row['id']).first():
                continue

            def parse_json(val):
                if not val: return None
                if isinstance(val, str):
                    try: return json.loads(val)
                    except: return None
                return val

            w_ad = WinningAd(
                id=row['id'],
                name=row['name'],
                image_url=row['image_url'],
                notes=row['notes'],
                tags=row['tags'],
                analysis=row['analysis'],
                recreation_prompt=row['recreation_prompt'],
                topic=row['topic'],
                mood=row['mood'],
                subject_matter=row['subject_matter'],
                copy_analysis=row['copy_analysis'],
                product_name=row['product_name'],
                category=row['category'],
                design_style=row['design_style'],
                filename=row['filename'],
                structural_analysis=row['structural_analysis'],
                layering=row['layering'],
                template_structure=parse_json(row['template_structure']),
                color_palette=parse_json(row['color_palette']),
                typography_system=parse_json(row['typography_system']),
                copy_patterns=parse_json(row['copy_patterns']),
                visual_elements=parse_json(row['visual_elements']),
                template_category=row['template_category'],
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None
            )
            db.add(w_ad)
        db.commit()
        print(f"✅ Processed {len(w_ads)} winning ads")

        # 9. Migrate Generated Ads
        print("\n📦 Migrating Generated Ads...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='generated_ads'")
        if cursor.fetchone():
            cursor.execute("SELECT * FROM generated_ads")
            gen_ads = cursor.fetchall()
            
            for row in gen_ads:
                if db.query(GeneratedAd).filter(GeneratedAd.id == row['id']).first():
                    continue

                gen_ad = GeneratedAd(
                    id=row['id'],
                    brand_id=row['brand_id'],
                    product_id=row['product_id'],
                    template_id=row['template_id'],
                    image_url=row['image_url'],
                    headline=row['headline'],
                    body=row['body'],
                    cta=row['cta'],
                    size_name=row['size_name'],
                    dimensions=row['dimensions'],
                    prompt=row['prompt'],
                    ad_bundle_id=row['ad_bundle_id'] if 'ad_bundle_id' in row.keys() else None,
                    created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None
                )
                db.add(gen_ad)
            db.commit()
            print(f"✅ Processed {len(gen_ads)} generated ads")
        else:
            print("⚠️ generated_ads table not found in source DB, skipping.")

        print("\n✨ Migration completed successfully!")

    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        sqlite_conn.close()
        db.close()

if __name__ == "__main__":
    migrate()
