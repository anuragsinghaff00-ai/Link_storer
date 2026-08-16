from sqlalchemy import Column, String, ForeignKey
from app.core.database import Base

class ImageResource(Base):
    __tablename__ = "image_resources"
    image_id = Column(String, ForeignKey("images.id", ondelete="CASCADE"), primary_key=True)
    resource_id = Column(String, ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True)
