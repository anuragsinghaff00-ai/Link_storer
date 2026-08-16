from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
# Removed pgvector for SQLite compatibility
from app.core.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    target_type = Column(String, nullable=False) # 'resource' or 'image'
    target_id = Column(String, nullable=False, index=True)
    raw_output = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    messages = relationship("ConversationMessage", back_populates="conversation", cascade="all, delete-orphan")

class ConversationMessage(Base):
    __tablename__ = "conversation_messages"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False) # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")

class AgentAction(Base):
    __tablename__ = "agent_actions"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    message_id = Column(String, ForeignKey("conversation_messages.id", ondelete="SET NULL"), nullable=True)
    action_type = Column(String, nullable=False) # e.g. "ADD_RESOURCE"
    parameters = Column(Text, nullable=True) # JSON stored as text
    status = Column(String, nullable=False) # "PENDING", "CONFIRMED", "EXECUTED", "REJECTED"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Embedding(Base):
    __tablename__ = "embeddings"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    resource_id = Column(String, ForeignKey("resources.id", ondelete="CASCADE"), nullable=True)
    image_id = Column(String, ForeignKey("images.id", ondelete="CASCADE"), nullable=True)
    embedding = Column(Text, nullable=False) # JSON string in SQLite mock
    content_chunk = Column(Text, nullable=True)
    
    resource = relationship("Resource", back_populates="embeddings")
    image = relationship("Image", back_populates="embeddings")
