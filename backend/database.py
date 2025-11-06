"""
Database connection module for MongoDB
"""
import motor.motor_asyncio
from typing import Optional

# MongoDB connection settings
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "cube_painter_db"

# Global database client
client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
database: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None


async def connect_to_mongo():
    """Connect to MongoDB"""
    global client, database
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]
    print(f"Connected to MongoDB at {MONGODB_URL}")


async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("Closed MongoDB connection")


def get_database() -> motor.motor_asyncio.AsyncIOMotorDatabase:
    """Get database instance"""
    if database is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo first.")
    return database
