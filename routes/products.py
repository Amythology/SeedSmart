from fastapi import APIRouter, HTTPException, status, Depends, Header
from typing import List, Optional
from models import ProductCreate, ProductResponse, ProductUpdate
from auth import verify_token
from database import get_database
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/products", tags=["Products"])

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = authorization.split(" ")[1]
    user_id = verify_token(token)
    
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

@router.post("/", response_model=ProductResponse)
async def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "farmer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only farmers can create products"
        )
    
    db = get_database()
    
    product_data = {
        **product.dict(),
        "farmer_id": str(current_user["_id"]),
        "farmer_name": current_user["full_name"],
        "created_at": datetime.utcnow(),
        "is_available": True
    }
    
    result = await db.products.insert_one(product_data)
    created_product = await db.products.find_one({"_id": result.inserted_id})
    
    return ProductResponse(**created_product)

@router.get("/", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = None,
    farmer_id: Optional[str] = None,
    available_only: bool = True
):
    db = get_database()
    
    filter_query = {}
    if category:
        filter_query["category"] = category
    if farmer_id:
        filter_query["farmer_id"] = farmer_id
    if available_only:
        filter_query["is_available"] = True
        filter_query["quantity"] = {"$gt": 0}
    
    products = await db.products.find(filter_query).sort("created_at", -1).to_list(100)
    
    return [ProductResponse(**product) for product in products]

@router.get("/my-products", response_model=List[ProductResponse])
async def get_my_products(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "farmer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only farmers can access this endpoint"
        )
    
    db = get_database()
    products = await db.products.find({
        "farmer_id": str(current_user["_id"])
    }).sort("created_at", -1).to_list(100)
    
    return [ProductResponse(**product) for product in products]

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    db = get_database()
    
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID"
        )
    
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return ProductResponse(**product)

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "farmer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only farmers can update products"
        )
    
    db = get_database()
    
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID"
        )
    
    # Check if product belongs to current user
    product = await db.products.find_one({
        "_id": ObjectId(product_id),
        "farmer_id": str(current_user["_id"])
    })
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or not owned by you"
        )
    
    # Update product
    update_data = {k: v for k, v in product_update.dict().items() if v is not None}
    
    if update_data:
        await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
    
    updated_product = await db.products.find_one({"_id": ObjectId(product_id)})
    return ProductResponse(**updated_product)

@router.delete("/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "farmer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only farmers can delete products"
        )
    
    db = get_database()
    
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product ID"
        )
    
    # Check if product belongs to current user
    result = await db.products.delete_one({
        "_id": ObjectId(product_id),
        "farmer_id": str(current_user["_id"])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or not owned by you"
        )
    
    return {"message": "Product deleted successfully"}
