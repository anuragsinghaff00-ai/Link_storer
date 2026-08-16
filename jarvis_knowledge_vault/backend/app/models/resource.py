from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Resource(Base):
    __tablename__ = "resources"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    url = Column(String, nullable=False)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    website = Column(String, nullable=True)
    website_icon = Column(String, nullable=True)
    
    purpose_id = Column(String, ForeignKey("purposes.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(String, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    
    date_added = Column(DateTime(timezone=True), server_default=func.now())
    first_opened_at = Column(DateTime(timezone=True), nullable=True)
    last_opened_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    open_count = Column(Integer, default=0)
    
    favorite = Column(Boolean, default=False)
    pinned = Column(Boolean, default=False)
    archived = Column(Boolean, default=False)
    status = Column(String, default="NOT_STARTED") # NOT_STARTED, IN_PROGRESS, COMPLETED
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="resources")
    purpose = relationship("Purpose")
    category = relationship("Category")
    tags = relationship("Tag", secondary="resource_tags")
    collections = relationship("Collection", secondary="resource_collections")
    images = relationship("Image", secondary="image_resources", back_populates="resources")
    activities = relationship("ResourceActivity", back_populates="resource", cascade="all, delete-orphan")
    embeddings = relationship("Embedding", back_populates="resource", cascade="all, delete-orphan")

class ResourceTag(Base):
    __tablename__ = "resource_tags"
    resource_id = Column(String, ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(String, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

class ResourceCollection(Base):
    __tablename__ = "resource_collections"
    resource_id = Column(String, ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True)
    collection_id = Column(String, ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True)

class ResourceActivity(Base):
    __tablename__ = "resource_activity"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    resource_id = Column(String, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False) # e.g. "opened", "status_changed"
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    resource = relationship("Resource", back_populates="activities")
