from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from models import UserCreate, UserLogin, UserResponse, Token
from auth import get_password_hash, verify_password, create_access_token
from database import get_database
from datetime import datetime
from bson import ObjectId
import os
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({
        "$or": [
            {"username": user.username},
            {"email": user.email}
        ]
    })
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Hash password and create user
    user_data = {
        "username": user.username,
        "email": user.email,
        "password": get_password_hash(user.password),
        "full_name": user.full_name,
        "phone": user.phone,
        "address": user.address,
        "user_type": user.user_type,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_data)
    
    # Return user data without password
    created_user = await db.users.find_one({"_id": result.inserted_id})
    del created_user["password"]
    
    return UserResponse(**created_user)

@router.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin):
    db = get_database()
    
    # Find user
    user = await db.users.find_one({"username": user_credentials.username})
    
    if not user or not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")))
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=str(user["_id"]),
        user_type=user["user_type"]
    )
