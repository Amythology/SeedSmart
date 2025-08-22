from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from dotenv import load_dotenv
import os
load_dotenv()

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database = None

db = Database()

async def connect_to_mongo():
    """Create database connection"""
    db.client = AsyncIOMotorClient(os.getenv("CONNSTRING"))
    db.database = db.client.farmers_market

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()

def get_database():
    return db.database
