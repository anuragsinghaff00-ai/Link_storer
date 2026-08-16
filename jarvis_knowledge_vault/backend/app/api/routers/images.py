import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.image import Image
from app.models.user import User # Assuming auth is needed, but maybe mock for now
from app.schemas.image import ImageResponse, ImageUpdate, ImageCreate

router = APIRouter(prefix="/images", tags=["Images"])

base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(base_dir, "data", "uploads", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mock user for now since auth might not be fully implemented
MOCK_USER_ID = "mock_user_123"

@router.get("")
@router.get("/", response_model=List[ImageResponse])
def get_images(
    purpose_id: Optional[str] = None,
    favorite: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Image).filter(Image.user_id == MOCK_USER_ID)
    if purpose_id:
        query = query.filter(Image.purpose_id == purpose_id)
    if favorite is not None:
        query = query.filter(Image.favorite == favorite)
        
    return query.order_by(desc(Image.date_added)).all()

@router.post("")
@router.post("/", response_model=ImageResponse)
def upload_image(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    purpose_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    new_image = Image(
        user_id=MOCK_USER_ID,
        storage_path=f"/static/images/{unique_filename}", # To serve via static files
        title=title or file.filename,
        purpose_id=purpose_id,
        file_type=file.content_type,
        # We can add size/dimensions later with PIL
    )
    
    db.add(new_image)
    db.commit()
    db.refresh(new_image)
    
    # Optionally trigger AI analysis asynchronously here
    
    return new_image

@router.get("/{image_id}", response_model=ImageResponse)
def get_image(image_id: str, db: Session = Depends(get_db)):
    image = db.query(Image).filter(Image.id == image_id, Image.user_id == MOCK_USER_ID).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image

@router.put("/{image_id}", response_model=ImageResponse)
def update_image(image_id: str, image_update: ImageUpdate, db: Session = Depends(get_db)):
    image = db.query(Image).filter(Image.id == image_id, Image.user_id == MOCK_USER_ID).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    update_data = image_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(image, key, value)
        
    db.commit()
    db.refresh(image)
    return image

@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(image_id: str, db: Session = Depends(get_db)):
    image = db.query(Image).filter(Image.id == image_id, Image.user_id == MOCK_USER_ID).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    # Delete file from disk
    filename = os.path.basename(image.storage_path)
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        
    db.delete(image)
    db.commit()
