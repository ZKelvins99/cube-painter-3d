"""
FastAPI main application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
from typing import List
from bson import ObjectId
from bson.errors import InvalidId

from database import connect_to_mongo, close_mongo_connection, get_database
from models import (
    UserCreate, UserResponse, Token, Project, ProjectCreate, 
    ProjectUpdate, ProjectInDB
)
from auth import (
    get_password_hash, authenticate_user, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(title="Cube Painter 3D API", version="1.0.0", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to Cube Painter 3D API"}


# ===== User Authentication Endpoints =====

@app.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    """Register a new user"""
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "username": user.username,
        "hashed_password": hashed_password,
        "role": "free"
    }
    
    await db.users.insert_one(user_dict)
    
    return UserResponse(username=user.username, role="free")


@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login and get JWT token"""
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")


@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user = Depends(get_current_user)):
    """Get current user info"""
    return UserResponse(username=current_user.username, role=current_user.role)


# ===== Project CRUD Endpoints =====

@app.post("/projects/", response_model=ProjectInDB)
async def create_project(
    project: ProjectCreate,
    current_user = Depends(get_current_user)
):
    """Create a new project"""
    db = get_database()
    
    project_dict = {
        "name": project.name,
        "owner": current_user.username,
        "faces_data": project.faces_data or {
            "face1": {}, "face2": {}, "face3": {},
            "face4": {}, "face5": {}, "face6": {}
        }
    }
    
    result = await db.projects.insert_one(project_dict)
    created_project = await db.projects.find_one({"_id": result.inserted_id})
    created_project["_id"] = str(created_project["_id"])
    
    return ProjectInDB(**created_project)


@app.get("/projects/{project_id}", response_model=ProjectInDB)
async def get_project(
    project_id: str,
    current_user = Depends(get_current_user)
):
    """Get a project by ID"""
    db = get_database()
    
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if user owns the project
    if project["owner"] != current_user.username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project"
        )
    
    project["_id"] = str(project["_id"])
    return ProjectInDB(**project)


@app.put("/projects/{project_id}", response_model=ProjectInDB)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user = Depends(get_current_user)
):
    """Update a project"""
    db = get_database()
    
    try:
        existing_project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )
    
    if not existing_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if user owns the project
    if existing_project["owner"] != current_user.username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this project"
        )
    
    # Update fields
    update_data = {}
    if project_update.name is not None:
        update_data["name"] = project_update.name
    if project_update.faces_data is not None:
        update_data["faces_data"] = project_update.faces_data
    
    if update_data:
        await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": update_data}
        )
    
    updated_project = await db.projects.find_one({"_id": ObjectId(project_id)})
    updated_project["_id"] = str(updated_project["_id"])
    
    return ProjectInDB(**updated_project)


@app.get("/projects/by_user/{username}", response_model=List[ProjectInDB])
async def get_user_projects(
    username: str,
    current_user = Depends(get_current_user)
):
    """Get all projects by a user"""
    # Users can only get their own projects
    if username != current_user.username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access other users' projects"
        )
    
    db = get_database()
    projects = []
    
    async for project in db.projects.find({"owner": username}):
        project["_id"] = str(project["_id"])
        projects.append(ProjectInDB(**project))
    
    return projects


@app.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    current_user = Depends(get_current_user)
):
    """Delete a project"""
    db = get_database()
    
    try:
        existing_project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )
    
    if not existing_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if user owns the project
    if existing_project["owner"] != current_user.username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this project"
        )
    
    await db.projects.delete_one({"_id": ObjectId(project_id)})
    
    return {"message": "Project deleted successfully"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
