from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text, JSON, Table, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# Many-to-Many relationship table for User <-> Role
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', String, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('role_id', String, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('created_at', DateTime(timezone=True), server_default=func.now())
)

# Many-to-Many relationship table for Role <-> Permission
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', String, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_id', String, ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True),
    Column('created_at', DateTime(timezone=True), server_default=func.now())
)

# Many-to-Many relationship table for Brand <-> CustomerProfile
brand_profiles = Table(
    'brand_profiles',
    Base.metadata,
    Column('brand_id', String, ForeignKey('brands.id', ondelete='CASCADE'), primary_key=True),
    Column('profile_id', String, ForeignKey('customer_profiles.id', ondelete='CASCADE'), primary_key=True),
    Column('created_at', DateTime(timezone=True), server_default=func.now())
)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    roles = relationship("Role", secondary=user_roles, back_populates="users")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

    def has_permission(self, permission_name: str) -> bool:
        """Check if user has a specific permission through any of their roles"""
        if self.is_superuser:
            return True
        for role in self.roles:
            for permission in role.permissions:
                if permission.name == permission_name:
                    return True
        return False

    def has_role(self, role_name: str) -> bool:
        """Check if user has a specific role"""
        if self.is_superuser:
            return True
        return any(role.name == role_name for role in self.roles)

class Role(Base):
    __tablename__ = "roles"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", secondary=user_roles, back_populates="roles")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, nullable=False)  # e.g., "brands:create", "ads:delete"
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="refresh_tokens")

class Brand(Base):
    __tablename__ = "brands"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    logo = Column(String, nullable=True)
    primary_color = Column(String, default='#3B82F6')
    secondary_color = Column(String, default='#10B981')
    highlight_color = Column(String, default='#F59E0B')
    voice = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    products = relationship("Product", back_populates="brand", cascade="all, delete-orphan")
    profiles = relationship("CustomerProfile", secondary=brand_profiles, back_populates="brands")
    generated_ads = relationship("GeneratedAd", back_populates="brand")

    @property
    def colors(self):
        return {
            "primary": self.primary_color,
            "secondary": self.secondary_color,
            "highlight": self.highlight_color
        }
    
    @property
    def profileIds(self):
        return [p.id for p in self.profiles]

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=generate_uuid)
    brand_id = Column(String, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    product_shots = Column(JSON, nullable=True)
    default_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    brand = relationship("Brand", back_populates="products")

class CustomerProfile(Base):
    __tablename__ = "customer_profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    demographics = Column(Text, nullable=True)
    pain_points = Column(Text, nullable=True)
    goals = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    brands = relationship("Brand", secondary=brand_profiles, back_populates="profiles")

class FacebookCampaign(Base):
    __tablename__ = "facebook_campaigns"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    objective = Column(String, nullable=False)
    budget_type = Column(String, nullable=False)
    daily_budget = Column(Integer, nullable=True)
    bid_strategy = Column(String, nullable=True)
    status = Column(String, default='PAUSED')
    fb_campaign_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    adsets = relationship("FacebookAdSet", back_populates="campaign", cascade="all, delete-orphan")

class FacebookAdSet(Base):
    __tablename__ = "facebook_adsets"

    id = Column(String, primary_key=True, default=generate_uuid)
    campaign_id = Column(String, ForeignKey("facebook_campaigns.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    optimization_goal = Column(String, nullable=False)
    daily_budget = Column(Integer, nullable=True)
    bid_strategy = Column(String, nullable=True)
    bid_amount = Column(Integer, nullable=True)
    targeting = Column(JSON, nullable=True)
    pixel_id = Column(String, nullable=True)
    conversion_event = Column(String, nullable=True)
    status = Column(String, default='PAUSED')
    fb_adset_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    campaign = relationship("FacebookCampaign", back_populates="adsets")
    ads = relationship("FacebookAd", back_populates="adset", cascade="all, delete-orphan")

class FacebookAd(Base):
    __tablename__ = "facebook_ads"

    id = Column(String, primary_key=True, default=generate_uuid)
    adset_id = Column(String, ForeignKey("facebook_adsets.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    creative_name = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    # Video support fields
    media_type = Column(String, default='image')  # 'image' or 'video'
    video_url = Column(String, nullable=True)
    video_id = Column(String, nullable=True)  # Facebook video ID
    thumbnail_url = Column(String, nullable=True)
    bodies = Column(JSON, nullable=True)
    headlines = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    cta = Column(String, nullable=True)
    website_url = Column(String, nullable=True)
    status = Column(String, default='PAUSED')
    fb_ad_id = Column(String, nullable=True)
    fb_creative_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    adset = relationship("FacebookAdSet", back_populates="ads")

class WinningAd(Base):
    __tablename__ = "winning_ads"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    image_url = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)
    analysis = Column(Text, nullable=True)
    recreation_prompt = Column(Text, nullable=True)
    topic = Column(String, nullable=True)
    mood = Column(String, nullable=True)
    subject_matter = Column(String, nullable=True)
    copy_analysis = Column(Text, nullable=True)
    product_name = Column(String, nullable=True)
    category = Column(String, nullable=True)
    design_style = Column(String, nullable=True)
    filename = Column(String, nullable=True)
    structural_analysis = Column(Text, nullable=True)
    layering = Column(Text, nullable=True)
    template_structure = Column(JSON, nullable=True)
    color_palette = Column(JSON, nullable=True)
    typography_system = Column(JSON, nullable=True)
    copy_patterns = Column(JSON, nullable=True)
    visual_elements = Column(JSON, nullable=True)
    template_category = Column(String, nullable=True)
    
    # Ad Remix Engine fields
    blueprint_json = Column(JSON, nullable=True)  # Stores the deconstructed blueprint
    blueprint_analyzed_at = Column(DateTime(timezone=True), nullable=True)  # When blueprint was created
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    generated_ads = relationship("GeneratedAd", back_populates="template")

class GeneratedAd(Base):
    __tablename__ = "generated_ads"

    id = Column(String, primary_key=True, default=generate_uuid)
    brand_id = Column(String, ForeignKey("brands.id", ondelete="SET NULL"), nullable=True)
    product_id = Column(String, ForeignKey("products.id", ondelete="SET NULL"), nullable=True) # Assuming product_id is also FK, though not explicit in original schema it makes sense
    template_id = Column(String, ForeignKey("winning_ads.id", ondelete="SET NULL"), nullable=True)
    image_url = Column(String, nullable=True)  # Changed to nullable for video ads
    headline = Column(String, nullable=True)
    body = Column(Text, nullable=True)
    cta = Column(String, nullable=True)
    size_name = Column(String, nullable=True)
    dimensions = Column(String, nullable=True)
    prompt = Column(Text, nullable=True)
    ad_bundle_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Video support fields
    media_type = Column(String, default='image')  # 'image' or 'video'
    video_url = Column(String, nullable=True)
    video_id = Column(String, nullable=True)  # Facebook video ID
    thumbnail_url = Column(String, nullable=True)

    brand = relationship("Brand", back_populates="generated_ads")
    template = relationship("WinningAd", back_populates="generated_ads")

class ScrapedAd(Base):
    __tablename__ = "scraped_ads"

    id = Column(String, primary_key=True, default=generate_uuid)
    brand_name = Column(String, nullable=True)
    ad_copy = Column(Text, nullable=True)
    video_url = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    cta_text = Column(String, nullable=True)
    platform = Column(String, default='facebook')
    external_id = Column(String, nullable=True) # ID from the platform
    analysis = Column(JSON, nullable=True) # AI analysis result
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    variables = Column(JSON, nullable=True)  # List of variable names
    template = Column(Text, nullable=False)  # The actual prompt template
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AdStyle(Base):
    __tablename__ = "ad_styles"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    best_for = Column(JSON, nullable=True)  # List of industries
    visual_layout = Column(String, nullable=True)
    psychology = Column(Text, nullable=True)
    mood = Column(String, nullable=True)
    lighting = Column(String, nullable=True)
    composition = Column(String, nullable=True)
    design_style = Column(String, nullable=True)
    prompt = Column(Text, nullable=True)  # Image generation prompt
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
