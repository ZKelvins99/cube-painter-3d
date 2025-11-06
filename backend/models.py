"""
Pydantic models for data validation
"""
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime


class UserInDB(BaseModel):
    """User model for database"""
    username: str
    hashed_password: str
    role: str = "free"  # 'free' or 'vip'
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(BaseModel):
    """User creation model"""
    username: str
    password: str


class UserResponse(BaseModel):
    """User response model (without password)"""
    username: str
    role: str


class Token(BaseModel):
    """JWT token model"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token data model"""
    username: Optional[str] = None


class Project(BaseModel):
    """Project model"""
    name: str
    owner: str
    faces_data: Dict[str, Any] = Field(
        default_factory=lambda: {
            "face1": {},
            "face2": {},
            "face3": {},
            "face4": {},
            "face5": {},
            "face6": {}
        }
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ProjectCreate(BaseModel):
    """Project creation model"""
    name: str
    faces_data: Optional[Dict[str, Any]] = None


class ProjectUpdate(BaseModel):
    """Project update model"""
    name: Optional[str] = None
    faces_data: Optional[Dict[str, Any]] = None


class ProjectInDB(Project):
    """Project model in database"""
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True
