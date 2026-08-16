from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ImageBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    purpose_id: Optional[str] = None
    category_id: Optional[str] = None
    favorite: bool = False
    pinned: bool = False
    archived: bool = False
    status: str = "NOT_STARTED"

class ImageCreate(ImageBase):
    pass

class ImageUpdate(ImageBase):
    pass

class ImageResponse(ImageBase):
    id: str
    user_id: str
    storage_path: str
    thumbnail_path: Optional[str] = None
    date_added: datetime
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    ocr_text: Optional[str] = None
    ai_description: Optional[str] = None
    
    class Config:
        from_attributes = True

class ImageSourceBase(BaseModel):
    url: str
    source_name: Optional[str] = None

class ImageSourceResponse(ImageSourceBase):
    id: str
    image_id: str

    class Config:
        from_attributes = True
