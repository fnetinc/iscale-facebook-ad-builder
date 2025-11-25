from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid
from typing import Dict
from pathlib import Path

router = APIRouter()

# Security: Define allowed file types and size limits
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Security: Use absolute path and ensure directory exists with proper permissions
UPLOAD_DIR = Path(__file__).parent.parent.parent.parent / "uploads"
UPLOAD_DIR = UPLOAD_DIR.resolve()  # Convert to absolute path
os.makedirs(UPLOAD_DIR, mode=0o755, exist_ok=True)

@router.post("/", response_model=Dict[str, str])
async def upload_file(file: UploadFile = File(...)):
    try:
        # Security: Sanitize filename to prevent path traversal
        safe_filename = os.path.basename(file.filename)
        file_extension = os.path.splitext(safe_filename)[1].lower()
        
        # Security: Validate file extension
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Security: Validate file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024 * 1024)}MB"
            )
        
        # Generate a unique filename
        filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / filename

        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Return the relative URL
        return {"url": f"/uploads/{filename}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not upload file: {str(e)}")
