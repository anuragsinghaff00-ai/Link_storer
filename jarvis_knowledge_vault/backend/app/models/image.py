from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Image(Base):
    __tablename__ = "images"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    storage_path = Column(String, nullable=False)
    thumbnail_path = Column(String, nullable=True)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    
    purpose_id = Column(String, ForeignKey("purposes.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(String, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    
    date_added = Column(DateTime(timezone=True), server_default=func.now())
    favorite = Column(Boolean, default=False)
    pinned = Column(Boolean, default=False)
    archived = Column(Boolean, default=False)
    status = Column(String, default="NOT_STARTED") # NOT_STARTED, IN_PROGRESS, COMPLETED
    
    file_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    ocr_text = Column(Text, nullable=True)
    ai_description = Column(Text, nullable=True)

    user = relationship("User", back_populates="images")
    purpose = relationship("Purpose")
    category = relationship("Category")
    tags = relationship("Tag", secondary="image_tags")
    collections = relationship("Collection", secondary="image_collections")
    resources = relationship("Resource", secondary="image_resources", back_populates="images")
    sources = relationship("ImageSource", back_populates="image", cascade="all, delete-orphan")
    activities = relationship("ImageActivity", back_populates="image", cascade="all, delete-orphan")
    embeddings = relationship("Embedding", back_populates="image", cascade="all, delete-orphan")

class ImageSource(Base):
    __tablename__ = "image_sources"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    image_id = Column(String, ForeignKey("images.id", ondelete="CASCADE"), nullable=False)
    url = Column(String, nullable=False)
    source_name = Column(String, nullable=True) # e.g. "Instagram"
    
    image = relationship("Image", back_populates="sources")

class ImageTag(Base):
    __tablename__ = "image_tags"
    image_id = Column(String, ForeignKey("images.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(String, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

class ImageCollection(Base):
    __tablename__ = "image_collections"
    image_id = Column(String, ForeignKey("images.id", ondelete="CASCADE"), primary_key=True)
    collection_id = Column(String, ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True)

class ImageActivity(Base):
    __tablename__ = "image_activity"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    image_id = Column(String, ForeignKey("images.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    image = relationship("Image", back_populates="activities")
