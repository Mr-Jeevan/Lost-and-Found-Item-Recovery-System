from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, EmailStr, GetCoreSchemaHandler
from pydantic_core import core_schema
from typing import List, Optional
from datetime import datetime, timedelta
import os
import uuid
from bson import ObjectId
from pymongo import MongoClient
from dotenv import load_dotenv

# Import SocketManager for WebSocket support
from fastapi_socketio import SocketManager

# Security imports
from passlib.context import CryptContext
from jose import JWTError, jwt

# --- CONFIGURATION & INITIALIZATION ---

# Load environment variables from .env file
load_dotenv()

# FastAPI app initialization
app = FastAPI(title="Lost & Found Recovery System API")

# Initialize SocketManager for WebSocket support
sio = SocketManager(app=app)

# Serve static files for uploaded images
from fastapi.staticfiles import StaticFiles
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Security: Password Hashing Context
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

# Security: JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "a_super_secret_key_for_development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# CORS middleware setup 
client_url = os.getenv("CLIENT_URI")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
]

if client_url:
    origins.append(client_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable not set!")
client = MongoClient(MONGO_URI)

try:
    client.server_info()
    print("✅ Successfully connected to MongoDB!")
except Exception as e:
    print(f"🔥 Error connecting to MongoDB: {e}")
    raise

db = client.lfrs
item_collection = db.items
user_collection = db.users
helped_finding_collection = db.helped_finding
messages_collection = db.messages  # Add this line

# --- PYDANTIC MODELS & HELPERS ---

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler: GetCoreSchemaHandler):
        def validate(v):
            if not ObjectId.is_valid(v):
                raise ValueError("Invalid ObjectId")
            return ObjectId(v)
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema(
                [
                    core_schema.is_instance_schema(ObjectId),
                    core_schema.chain_schema([core_schema.str_schema(), core_schema.no_info_plain_validator_function(validate)]),
                ]
            ),
            serialization=core_schema.plain_serializer_function_ser_schema(lambda x: str(x)),
        )

class Item(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    location_lost: str
    date_lost: str
    contact_info: str
    image_url: Optional[str] = None
    is_found: bool = False
    reported_by: Optional[str] = None  # Add field to track who reported the item
    class Config:
        arbitrary_types_allowed = True

class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    username: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    class Config:
        arbitrary_types_allowed = True

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- HELPED FINDING MODELS ---

class HelpedFindingItemCreate(BaseModel):
    item_id: str
    finder_name: str
    finder_contact: str
    found_location: str
    found_date: str
    status: str = "Pending"  # Pending, In Progress, Returned

class HelpedFindingItem(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    item_id: str
    finder_name: str
    finder_contact: str
    found_location: str
    found_date: str
    status: str = "Pending"  # Pending, In Progress, Returned
    helped_by: str
    created_at: datetime
    class Config:
        arbitrary_types_allowed = True

# Add Message model
class Message(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    from_user: Optional[str] = None
    to_user: str
    item_id: Optional[str] = None
    item_name: str
    message: str
    thread_id: Optional[str] = None  # Add thread_id for conversation grouping
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_read: bool = False
    class Config:
        arbitrary_types_allowed = True

# --- SECURITY & AUTHENTICATION HELPERS ---

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = user_collection.find_one({"username": token_data.username})
    if user is None:
        raise credentials_exception
    return UserInDB(**user)

async def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme)):
    """Get current user or return None if not authenticated."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            return None
        token_data = TokenData(username=username)
    except JWTError:
        return None
    user = user_collection.find_one({"username": token_data.username})
    if user is None:
        return None
    return UserInDB(**user)

# --- API ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "Welcome to the Lost & Found Recovery System API"}

# --- USER & AUTH ENDPOINTS ---

@app.post("/register/", response_model=User)
def register_user(user_data: UserCreate):
    if user_collection.find_one({"email": user_data.email}) or \
       user_collection.find_one({"username": user_data.username}):
        raise HTTPException(status_code=400, detail="Username or email already registered")

    password = user_data.password[:72]
    hashed_password = get_password_hash(password)
    user_object = {
        "username": user_data.username, 
        "email": user_data.email, 
        "hashed_password": hashed_password,
        "full_name": None,
        "phone": None,
        "location": None
    }
    result = user_collection.insert_one(user_object)
    new_user = user_collection.find_one({"_id": result.inserted_id})
    return User(**new_user) if new_user else None

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = user_collection.find_one({"email": form_data.username})
    password_to_check = form_data.password[:72]
    if not user or not verify_password(password_to_check, user["hashed_password"]):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user["username"]}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.put("/users/me/", response_model=User)
async def update_user_me(user_update: UserUpdate, current_user: User = Depends(get_current_user)):
    """Update the current user's profile information."""
    update_data = user_update.dict(exclude_unset=True)
    
    if update_data:
        user_collection.update_one(
            {"username": current_user.username},
            {"$set": update_data}
        )
    
    # Fetch the updated user
    updated_user = user_collection.find_one({"username": current_user.username})
    return User(**updated_user) if updated_user else current_user

# --- ITEMS ENDPOINTS ---

@app.get("/items/", response_model=List[Item])
def get_items():
    """Public endpoint to view all lost items."""
    items = []
    for item in item_collection.find():
        # Convert ObjectId to string for the id field
        if "_id" in item:
            item["id"] = str(item["_id"])
            del item["_id"]
        items.append(Item(**item))
    return items

@app.post("/items/", response_model=Item)
def create_item(item: Item, current_user: User = Depends(get_current_user)):
    """Protected endpoint to create a new lost item."""
    # Add the user who reported the item
    item.reported_by = current_user.username
    item_dict = item.dict(exclude_unset=True)
    item_dict.pop("id", None)
    result = item_collection.insert_one(item_dict)
    new_item = item_collection.find_one({"_id": result.inserted_id})
    # Convert ObjectId to string for the id field
    if new_item and "_id" in new_item:
        new_item["id"] = str(new_item["_id"])
        del new_item["_id"]
    return Item(**new_item) if new_item else None

@app.get("/items/{item_id}", response_model=Item)
def get_item(item_id: str):
    """Get a specific item by ID."""
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")
    item = item_collection.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    # Convert ObjectId to string for the id field
    if "_id" in item:
        item["id"] = str(item["_id"])
        del item["_id"]
    return Item(**item)

@app.put("/items/{item_id}", response_model=Item)
def update_item(item_id: str, item: Item, current_user: User = Depends(get_current_user)):
    """Update an item (only the reporter can update their item)."""
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")
    
    # Check if item exists
    existing_item = item_collection.find_one({"_id": ObjectId(item_id)})
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if current user is the reporter
    if existing_item.get("reported_by") != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized to update this item")
    
    item_dict = item.dict(exclude={"id"})
    # Preserve the reported_by field
    item_dict["reported_by"] = existing_item.get("reported_by")
    
    result = item_collection.update_one({"_id": ObjectId(item_id)}, {"$set": item_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    updated_item = item_collection.find_one({"_id": ObjectId(item_id)})
    # Convert ObjectId to string for the id field
    if updated_item and "_id" in updated_item:
        updated_item["id"] = str(updated_item["_id"])
        del updated_item["_id"]
    return Item(**updated_item) if updated_item else None

@app.get("/users/me/items/", response_model=List[Item])
def get_my_items(current_user: User = Depends(get_current_user)):
    """Get all items reported by the current user."""
    items = []
    for item in item_collection.find({"reported_by": current_user.username}):
        # Convert ObjectId to string for the id field
        if "_id" in item:
            item["id"] = str(item["_id"])
            del item["_id"]
        items.append(Item(**item))
    return items

# --- HELPED FINDING ITEMS ENDPOINTS ---

@app.post("/helped-finding/", response_model=HelpedFindingItem)
def create_helped_finding(helped_item: HelpedFindingItemCreate, current_user: Optional[User] = Depends(get_current_user_optional)):
    """Create a record of helped finding an item."""
    # Add the current user as the person who helped, or use anonymous if not authenticated
    helped_item_dict = helped_item.dict()
    if current_user and hasattr(current_user, 'username'):
        helped_item_dict["helped_by"] = current_user.username
    else:
        helped_item_dict["helped_by"] = helped_item.finder_name or "Anonymous"
    helped_item_dict["created_at"] = datetime.utcnow()
    
    # Check if item exists
    if not ObjectId.is_valid(helped_item.item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")
    
    item = item_collection.find_one({"_id": ObjectId(helped_item.item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Insert the helped finding record
    result = helped_finding_collection.insert_one(helped_item_dict)
    new_helped_item = helped_finding_collection.find_one({"_id": result.inserted_id})
    
    # Convert ObjectId to string for the id field
    if new_helped_item and "_id" in new_helped_item:
        new_helped_item["id"] = str(new_helped_item["_id"])
    
    # Send message to item owner
    if "reported_by" in item and item["reported_by"] != helped_item_dict["helped_by"]:
        message = Message(
            from_user=helped_item_dict["helped_by"],
            to_user=item["reported_by"],
            item_id=str(item["_id"]),
            item_name=item.get("name", "Unknown Item"),
            message=f"User {helped_item_dict['helped_by']} has reported finding your item: {item.get('name', 'Unknown Item')}. "
                   f"Contact them at {helped_item.finder_contact} for more details."
        )
        message_dict = message.dict()
        message_dict.pop("id", None)
        messages_collection.insert_one(message_dict)
    
    return HelpedFindingItem(**new_helped_item) if new_helped_item else None

@app.get("/helped-finding/", response_model=List[HelpedFindingItem])
def get_helped_finding_items(current_user: User = Depends(get_current_user)):
    """Get all helped finding items for the current user."""
    items = []
    for item in helped_finding_collection.find({"helped_by": current_user.username}):
        # Convert ObjectId to string for the id field
        if "_id" in item:
            item["id"] = str(item["_id"])
        items.append(HelpedFindingItem(**item))
    return items

@app.get("/users/me/helped-finding/", response_model=List[HelpedFindingItem])
def get_my_helped_finding_items(current_user: User = Depends(get_current_user)):
    """Get all helped finding items for the current user."""
    items = []
    for item in helped_finding_collection.find({"helped_by": current_user.username}):
        # Convert ObjectId to string for the id field
        if "_id" in item:
            item["id"] = str(item["_id"])
        items.append(HelpedFindingItem(**item))
    return items

@app.get("/helped-finding/all", response_model=List[HelpedFindingItem])
def get_all_helped_finding_items(current_user: User = Depends(get_current_user)):
    """Get all helped finding items (admin or public view)."""
    items = []
    for item in helped_finding_collection.find():
        # Convert ObjectId to string for the id field
        if "_id" in item:
            item["id"] = str(item["_id"])
        items.append(HelpedFindingItem(**item))
    return items

@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Upload an image and return the URL."""
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate a unique filename
    if file.filename:
        file_extension = os.path.splitext(file.filename)[1]
    else:
        file_extension = ".jpg"  # default extension
    
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save the file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Return the URL to access the file
    file_url = f"http://localhost:8000/{file_path.replace(os.sep, '/')}"
    return {"file_url": file_url}

# Add message endpoints after the helped finding endpoints
@app.post("/messages/", response_model=Message)
def create_message(message: Message, current_user: User = Depends(get_current_user)):
    """Create a new message."""
    message.from_user = current_user.username
    
    # Generate thread_id based on sorted user names to ensure consistency
    participants = sorted([current_user.username, message.to_user])
    message.thread_id = f"{participants[0]}_{participants[1]}"
    
    message_dict = message.dict()
    message_dict.pop("id", None)
    result = messages_collection.insert_one(message_dict)
    new_message = messages_collection.find_one({"_id": result.inserted_id})
    if new_message and "_id" in new_message:
        new_message["id"] = str(new_message["_id"])
    
    # Emit the message to the specific thread
    try:
        # Use the emit method directly on the SocketManager instance
        import asyncio
        asyncio.create_task(sio.emit('new_message', new_message))
    except Exception as e:
        print(f"Failed to emit WebSocket event: {e}")
    
    return Message(**new_message) if new_message else None

@app.get("/messages/", response_model=List[Message])
def get_messages(current_user: User = Depends(get_current_user)):
    """Get all messages for the current user."""
    messages = []
    for message in messages_collection.find({"to_user": current_user.username}).sort("created_at", -1):
        if "_id" in message:
            message["id"] = str(message["_id"])
        messages.append(Message(**message))
    return messages

@app.get("/messages/unread", response_model=List[Message])
def get_unread_messages(current_user: User = Depends(get_current_user)):
    """Get unread messages for the current user."""
    messages = []
    for message in messages_collection.find({"to_user": current_user.username, "is_read": False}).sort("created_at", -1):
        if "_id" in message:
            message["id"] = str(message["_id"])
        messages.append(Message(**message))
    return messages

@app.put("/messages/{message_id}/read")
def mark_message_as_read(message_id: str, current_user: User = Depends(get_current_user)):
    """Mark a message as read."""
    if not ObjectId.is_valid(message_id):
        raise HTTPException(status_code=400, detail="Invalid message ID")
    
    result = messages_collection.update_one(
        {"_id": ObjectId(message_id), "to_user": current_user.username},
        {"$set": {"is_read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return {"message": "Message marked as read"}

@app.get("/messages/thread/{other_user}", response_model=List[Message])
def get_thread_messages(other_user: str, current_user: User = Depends(get_current_user)):
    """Get all messages in a conversation thread between current user and another user."""
    # Generate thread_id based on sorted user names
    participants = sorted([current_user.username, other_user])
    thread_id = f"{participants[0]}_{participants[1]}"
    
    messages = []
    # Find messages in this thread where current user is either sender or receiver
    for message in messages_collection.find({
        "thread_id": thread_id,
        "$or": [
            {"from_user": current_user.username},
            {"to_user": current_user.username}
        ]
    }).sort("created_at", 1):  # Sort by creation time ascending
        if "_id" in message:
            message["id"] = str(message["_id"])
        messages.append(Message(**message))
    return messages

@app.get("/messages/threads", response_model=List[dict])
def get_message_threads(current_user: User = Depends(get_current_user)):
    """Get all unique conversation threads for the current user."""
    # Find all messages where current user is either sender or receiver
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"from_user": current_user.username},
                    {"to_user": current_user.username}
                ]
            }
        },
        {
            "$group": {
                "_id": "$thread_id",
                "other_user": {
                    "$first": {
                        "$cond": [
                            {"$eq": ["$from_user", current_user.username]},
                            "$to_user",
                            "$from_user"
                        ]
                    }
                },
                "last_message": {"$last": "$message"},
                "last_message_time": {"$last": "$created_at"},
                "unread_count": {
                    "$sum": {
                        "$cond": [
                            {
                                "$and": [
                                    {"$eq": ["$to_user", current_user.username]},
                                    {"$eq": ["$is_read", False]}
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            "$sort": {"last_message_time": -1}
        }
    ]
    
    threads = list(messages_collection.aggregate(pipeline))
    return threads

# Note: WebSocket event handlers are temporarily disabled due to compatibility issues
# Real-time messaging is implemented through direct emit calls in the create_message endpoint
