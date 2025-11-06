# Cube Painter 3D - Backend API

FastAPI backend for the Interactive 3D Cube Painter application.

## Features

- User authentication with JWT tokens
- Project CRUD operations
- MongoDB integration
- Password hashing with bcrypt
- CORS enabled for frontend integration

## Setup

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up MongoDB:
   - Install MongoDB locally or use MongoDB Atlas
   - Update the MONGODB_URL in `database.py` if needed

4. Run the server:
```bash
python main.py
# Or use uvicorn directly:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /register` - Register a new user
- `POST /token` - Login and get JWT token
- `GET /users/me` - Get current user info

### Projects
- `POST /projects/` - Create a new project (requires auth)
- `GET /projects/{project_id}` - Get project by ID (requires auth)
- `PUT /projects/{project_id}` - Update project (requires auth)
- `DELETE /projects/{project_id}` - Delete project (requires auth)
- `GET /projects/by_user/{username}` - Get all projects by user (requires auth)

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Security Notes

**IMPORTANT**: Change the `SECRET_KEY` in `auth.py` before deploying to production!
