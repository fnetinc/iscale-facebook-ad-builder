import sys
import os
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

# Mock the request model
class ImageGenerationRequest(BaseModel):
    template: Optional[Dict[str, Any]] = None
    brand: Optional[Dict[str, Any]] = None
    product: Optional[Dict[str, Any]] = None
    copy: Optional[Dict[str, Any]] = None
    count: int = 1
    imageSizes: List[Dict[str, Any]] = []
    resolution: str = "1K"
    productShots: List[str] = []
    model: str = "nano-banana-pro"
    customPrompt: Optional[str] = None
    useProductImage: bool = False

# Copy the function to test (since we can't easily import from the app structure without setting up path)
def build_comprehensive_prompt(request: ImageGenerationRequest) -> str:
    """
    Build comprehensive prompt using old system's approach:
    - Product name + description
    - Brand name, voice, and primary color
    - Copy context (headline)
    - Template metadata (mood, lighting, composition, design_style)
    """
    
    # Custom prompt override
    if request.customPrompt:
        return request.customPrompt
    
    # Extract all context
    product_name = request.product.get('name', 'Product') if request.product else 'Product'
    product_desc = request.product.get('description', '') if request.product else ''
    brand_name = request.brand.get('name', '') if request.brand else ''
    brand_voice = request.brand.get('voice', 'Professional') if request.brand else 'Professional'
    brand_color = request.brand.get('colors', {}).get('primary', '') if request.brand else ''
    
    # Get template metadata
    template_type = request.template.get('type') if request.template else None
    
    if template_type == 'style':
        # Style archetype - has metadata fields
        mood = request.template.get('mood', 'Engaging')
        lighting = request.template.get('lighting', 'Professional lighting')
        composition = request.template.get('composition', 'Balanced')
        design_style = request.template.get('design_style', 'Modern')
    else:
        # Regular template - get from template data if available
        mood = request.template.get('mood', 'Engaging') if request.template else 'Engaging'
        lighting = request.template.get('lighting', 'Professional lighting') if request.template else 'Professional lighting'
        composition = request.template.get('composition', 'Balanced') if request.template else 'Balanced'
        design_style = request.template.get('design_style', 'Modern') if request.template else 'Modern'
    
    # Build comprehensive prompt (OLD SYSTEM STYLE)
    parts = [
        f"Product Photography of {product_name}",
        f"- {product_desc}" if product_desc else "",
        f"{brand_name} style: {brand_voice}" if brand_name else f"Style: {brand_voice}",
        f"Primary Color: {brand_color}" if brand_color else "",
    ]
    
    # Add copy context (headline)
    if request.copy and request.copy.get('headline'):
        parts.append(f"Context: Visual representation of \"{request.copy.get('headline')}\"")
    
    # Add template art direction
    parts.append(f"Art Direction: {mood}, {lighting}, {composition}, {design_style}")
    
    # Quality standards
    parts.append("High quality, photorealistic, 4k, advertising standard")
    
    # Join non-empty parts
    prompt = ". ".join([p for p in parts if p])
    
    return prompt

def test_prompt_builder():
    print("🧪 Testing Prompt Builder...")
    
    # Test Case 1: Full Context
    req1 = ImageGenerationRequest(
        product={
            "name": "Elite Dental Care", 
            "description": "Comprehensive dental services"
        },
        brand={
            "name": "SmilePro Dentistry",
            "voice": "Caring and professional",
            "colors": {"primary": "#2196F3"}
        },
        copy={
            "headline": "Your Family Deserves the Best"
        },
        template={
            "type": "style",
            "mood": "Professional and trustworthy",
            "lighting": "Natural lighting",
            "composition": "Split-screen",
            "design_style": "Clean corporate"
        }
    )
    
    prompt1 = build_comprehensive_prompt(req1)
    print(f"\nTest 1 (Full Context):\n{prompt1}")
    
    assert "Elite Dental Care" in prompt1
    assert "Comprehensive dental services" in prompt1
    assert "SmilePro Dentistry style: Caring and professional" in prompt1
    assert "Primary Color: #2196F3" in prompt1
    assert "Context: Visual representation of \"Your Family Deserves the Best\"" in prompt1
    assert "Art Direction: Professional and trustworthy, Natural lighting, Split-screen, Clean corporate" in prompt1
    
    # Test Case 2: Minimal Context
    req2 = ImageGenerationRequest(
        product={"name": "Simple Product"},
        template={"type": "regular"}
    )
    
    prompt2 = build_comprehensive_prompt(req2)
    print(f"\nTest 2 (Minimal Context):\n{prompt2}")
    
    assert "Product Photography of Simple Product" in prompt2
    assert "Style: Professional" in prompt2 # Default
    assert "Art Direction: Engaging, Professional lighting" in prompt2 # Defaults
    
    print("\n✅ All tests passed!")

if __name__ == "__main__":
    test_prompt_builder()
