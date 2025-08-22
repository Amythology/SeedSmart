from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Annotated
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")
        return field_schema

# User Models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    phone: str
    address: str
    user_type: str  # "farmer" or "buyer"

class UserResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Annotated[PyObjectId, Field(alias="_id")]
    username: str
    email: str
    full_name: str
    phone: str
    address: str
    user_type: str
    created_at: datetime

class UserLogin(BaseModel):
    username: str
    password: str

# Product Models
class ProductCreate(BaseModel):
    name: str
    description: str
    category: str
    price: float
    quantity: int
    unit: str  # kg, pieces, etc.
    image_url: Optional[str] = None

class ProductResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Annotated[PyObjectId, Field(alias="_id")]
    name: str
    description: str
    category: str
    price: float
    quantity: int
    unit: str
    image_url: Optional[str] = None
    farmer_id: str
    farmer_name: str
    created_at: datetime
    is_available: bool = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None

# Order Models
class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    total_price: float

class OrderCreate(BaseModel):
    items: List[OrderItem]
    delivery_address: str
    payment_method: str = "cash_on_delivery"

class OrderResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Annotated[PyObjectId, Field(alias="_id")]
    buyer_id: str
    buyer_name: str
    items: List[OrderItem]
    total_amount: float
    delivery_address: str
    payment_method: str
    status: str = "pending"  # pending, confirmed, delivered, cancelled
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    user_type: str
