import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Checking database at: {DATABASE_URL}")

if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env")
    sys.exit(1)

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        print("\n--- Table Counts ---")
        tables = ["brands", "products", "customer_profiles", "facebook_campaigns", "facebook_adsets", "facebook_ads", "generated_ads", "winning_ads"]
        
        for table in tables:
            try:
                result = connection.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"{table}: {count}")
            except Exception as e:
                print(f"{table}: Error - {e}")
                
except Exception as e:
    print(f"Connection failed: {e}")
