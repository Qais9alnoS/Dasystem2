from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

# Director Note Schemas
class DirectorNoteBase(BaseModel):
    academic_year_id: int
    folder_type: str  # goals, projects, blogs, educational_admin
    title: str
    note_date: date
    content: Optional[str] = None
    file_path: Optional[str] = None
    parent_folder_id: Optional[int] = None
    is_folder: bool = False

class DirectorNoteCreate(BaseModel):
    academic_year_id: int
    folder_type: str
    title: str
    note_date: date
    content: Optional[str] = None
    parent_folder_id: Optional[int] = None
    is_folder: bool = False

class DirectorNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    note_date: Optional[date] = None
    parent_folder_id: Optional[int] = None

class DirectorNoteResponse(DirectorNoteBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class DirectorNoteListItem(BaseModel):
    """Simplified response for folder listing"""
    id: int
    title: str
    is_folder: bool
    note_date: date
    file_path: Optional[str] = None
    parent_folder_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CategorySummary(BaseModel):
    """Summary for each category"""
    category: str
    display_name: str
    total_files: int
    total_folders: int

# Reward Schemas
class RewardBase(BaseModel):
    academic_year_id: int
    title: str
    reward_date: date
    recipient_name: str
    recipient_type: str  # student, teacher, other
    amount: float
    description: Optional[str] = None

class RewardCreate(RewardBase):
    pass

class RewardUpdate(BaseModel):
    title: Optional[str] = None
    reward_date: Optional[date] = None
    recipient_name: Optional[str] = None
    recipient_type: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None

class RewardResponse(RewardBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Assistance Record Schemas
class AssistanceRecordBase(BaseModel):
    academic_year_id: int
    title: str
    assistance_date: date
    organization: str
    amount: float
    description: Optional[str] = None

class AssistanceRecordCreate(AssistanceRecordBase):
    pass

class AssistanceRecordUpdate(BaseModel):
    title: Optional[str] = None
    assistance_date: Optional[date] = None
    organization: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None

class AssistanceRecordResponse(AssistanceRecordBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Search Request/Response
class NoteSearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    academic_year_id: Optional[int] = None

class NoteSearchResult(BaseModel):
    id: int
    title: str
    folder_type: str
    note_date: date
    snippet: Optional[str] = None  # Content snippet with search highlight
    file_path: Optional[str] = None
    is_folder: bool
    
    class Config:
        from_attributes = True

