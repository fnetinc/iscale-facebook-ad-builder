import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Facebook Ad Automation App"
    API_V1_STR: str = "/api/v1"
    
    # Database - PostgreSQL Required
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # Validate DATABASE_URL is set
    if not DATABASE_URL:
        raise ValueError(
            "DATABASE_URL environment variable is required. "
            "Please set it to your PostgreSQL connection string.\n"
            "Example: postgresql://user:password@localhost:5432/video_ad_builder"
        )
    
    # Validate that it's PostgreSQL
    if not DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgres://"):
        raise ValueError(
            "DATABASE_URL must be a PostgreSQL connection string. "
            f"Got: {DATABASE_URL.split(':')[0]}://...\n"
            "SQLite is no longer supported. Please use PostgreSQL."
        )
    
    # External APIs
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    FAL_AI_API_KEY: str = os.getenv("FAL_AI_API_KEY", "")
    KIE_AI_API_KEY: str = os.getenv("KIE_AI_API_KEY", "")
    FACEBOOK_ACCESS_TOKEN: str = os.getenv("FACEBOOK_ACCESS_TOKEN", "")

    # Auth settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "365"))  # 1 year

    # Cloudflare R2 Storage (S3-compatible)
    R2_ACCOUNT_ID: str = os.getenv("R2_ACCOUNT_ID", "")
    R2_ACCESS_KEY_ID: str = os.getenv("R2_ACCESS_KEY_ID", "")
    R2_SECRET_ACCESS_KEY: str = os.getenv("R2_SECRET_ACCESS_KEY", "")
    R2_BUCKET_NAME: str = os.getenv("R2_BUCKET_NAME", "breadwinner")
    R2_PUBLIC_URL: str = os.getenv("R2_PUBLIC_URL", "https://pub-fb089822c800422ea1e06580d27b3751.r2.dev")

    @property
    def r2_enabled(self) -> bool:
        return bool(self.R2_ACCOUNT_ID and self.R2_ACCESS_KEY_ID and self.R2_SECRET_ACCESS_KEY)

    @property
    def r2_endpoint_url(self) -> str:
        return f"https://{self.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

settings = Settings()
