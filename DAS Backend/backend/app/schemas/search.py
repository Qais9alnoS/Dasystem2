from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date
from enum import Enum

# Search Configuration Enums
class SearchScope(str, Enum):
    ALL = "all"
    STUDENTS = "students"
    TEACHERS = "teachers"
    CLASSES = "classes"
    SUBJECTS = "subjects"
    ACTIVITIES = "activities"
    FINANCE = "finance"
    SCHEDULES = "schedules"
    USERS = "users"

class SearchMode(str, Enum):
    EXACT = "exact"
    FUZZY = "fuzzy"
    PARTIAL = "partial"
    FULL_TEXT = "full_text"
    PHONETIC = "phonetic"

class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"

class SortBy(str, Enum):
    RELEVANCE = "relevance"
    NAME = "name"
    DATE = "date"
    SCORE = "score"
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"

# Search Request Schema
class UniversalSearchRequest(BaseModel):
    query: str
    scope: SearchScope = SearchScope.ALL
    mode: SearchMode = SearchMode.FUZZY
    academic_year_id: Optional[int] = None
    session_type: Optional[str] = None
    
    # Pagination
    skip: int = 0
    limit: int = 50
    
    # Sorting
    sort_by: SortBy = SortBy.RELEVANCE
    sort_order: SortOrder = SortOrder.DESC
    
    # Advanced filters
    filters: Optional[Dict[str, Any]] = {}
    
    # Search options
    include_inactive: bool = False
    search_fields: Optional[List[str]] = None
    min_relevance_score: float = 0.1
    enable_highlighting: bool = True
    enable_suggestions: bool = True
    
    @validator('query')
    def validate_query(cls, v):
        if not v or len(v.strip()) < 1:
            raise ValueError('Query must be at least 1 character long')
        if len(v) > 500:
            raise ValueError('Query cannot exceed 500 characters')
        return v.strip()
    
    @validator('limit')
    def validate_limit(cls, v):
        if v < 1 or v > 200:
            raise ValueError('Limit must be between 1 and 200')
        return v
    
    @validator('min_relevance_score')
    def validate_min_relevance_score(cls, v):
        if v < 0.0 or v > 1.0:
            raise ValueError('Minimum relevance score must be between 0.0 and 1.0')
        return v

# Search Result Item Schema
class SearchResultItem(BaseModel):
    id: int
    type: str  # "student", "teacher", "class", etc.
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    relevance_score: float
    
    # Highlighted text (for showing matches)
    highlighted_text: Optional[str] = None
    
    # Additional data specific to the item type
    data: Dict[str, Any] = {}
    
    # Metadata
    academic_year_id: Optional[int] = None
    session_type: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Navigation helpers
    url: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []

# Search Response Schema
class UniversalSearchResponse(BaseModel):
    query: str
    scope: SearchScope
    mode: SearchMode
    
    # Results
    total_results: int
    results: List[SearchResultItem]
    
    # Performance metrics
    search_time_ms: float
    total_scanned: int
    
    # Result breakdown by type
    results_by_type: Dict[str, int] = {}
    
    # Search suggestions
    suggestions: List[str] = []
    
    # Facets for filtering
    facets: Dict[str, List[Dict[str, Union[str, int]]]] = {}
    
    # Pagination info
    has_more: bool
    next_skip: Optional[int] = None
    
    # Query corrections
    corrected_query: Optional[str] = None
    did_you_mean: Optional[str] = None

# Advanced Search Filters
class StudentSearchFilters(BaseModel):
    grade_level: Optional[str] = None
    grade_number: Optional[int] = None
    session_type: Optional[str] = None
    is_active: Optional[bool] = None
    enrollment_status: Optional[str] = None
    has_financial_issues: Optional[bool] = None

class TeacherSearchFilters(BaseModel):
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience_years_min: Optional[int] = None
    experience_years_max: Optional[int] = None
    session_type: Optional[str] = None
    is_active: Optional[bool] = None

class ActivitySearchFilters(BaseModel):
    activity_type: Optional[str] = None
    session_type: Optional[str] = None
    start_date_from: Optional[date] = None
    start_date_to: Optional[date] = None
    target_grades: Optional[List[str]] = None
    has_cost: Optional[bool] = None

class FinanceSearchFilters(BaseModel):
    transaction_type: Optional[str] = None
    amount_min: Optional[float] = None
    amount_max: Optional[float] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    category: Optional[str] = None

# Search History Schema
class SearchHistoryItem(BaseModel):
    id: int
    user_id: int
    query: str
    scope: SearchScope
    mode: SearchMode
    results_count: int
    search_time_ms: float
    clicked_result_id: Optional[int] = None
    clicked_result_type: Optional[str] = None
    search_date: datetime
    
    class Config:
        from_attributes = True

# Search Analytics Schema
class SearchAnalytics(BaseModel):
    total_searches: int
    unique_queries: int
    average_search_time_ms: float
    most_popular_queries: List[Dict[str, Union[str, int]]]
    most_searched_scopes: List[Dict[str, Union[str, int]]]
    no_results_queries: List[str]
    search_trends: Dict[str, List[Dict[str, Union[str, int]]]]
    user_search_patterns: Dict[str, Any]

# Saved Search Schema
class SavedSearchBase(BaseModel):
    name: str
    description: Optional[str] = None
    search_request: UniversalSearchRequest
    is_alert: bool = False  # If true, notify when new results match
    alert_frequency: Optional[str] = None  # "daily", "weekly", "monthly"

class SavedSearchCreate(SavedSearchBase):
    pass

class SavedSearchUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    search_request: Optional[UniversalSearchRequest] = None
    is_alert: Optional[bool] = None
    alert_frequency: Optional[str] = None
    is_active: Optional[bool] = None

class SavedSearchResponse(SavedSearchBase):
    id: int
    user_id: int
    is_active: bool
    last_run: Optional[datetime] = None
    last_results_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Search Index Schema (for managing search indexing)
class SearchIndexStatus(BaseModel):
    scope: SearchScope
    total_documents: int
    indexed_documents: int
    last_indexed: Optional[datetime] = None
    index_size_mb: float
    indexing_status: str  # "idle", "indexing", "error"
    error_message: Optional[str] = None

class SearchIndexOperation(BaseModel):
    operation: str  # "reindex", "update", "delete", "optimize"
    scope: Optional[SearchScope] = None
    document_ids: Optional[List[int]] = None
    force: bool = False
    background: bool = True

# Quick Search Schema (for autocomplete/suggestions)
class QuickSearchRequest(BaseModel):
    query: str
    scope: SearchScope = SearchScope.ALL
    limit: int = 10
    academic_year_id: Optional[int] = None
    
    @validator('query')
    def validate_query(cls, v):
        if len(v) < 1:
            raise ValueError('Query must be at least 1 character long')
        return v.strip()
    
    @validator('limit')
    def validate_limit(cls, v):
        if v < 1 or v > 50:
            raise ValueError('Limit must be between 1 and 50')
        return v

class QuickSearchResult(BaseModel):
    id: int
    type: str
    title: str
    subtitle: Optional[str] = None
    relevance_score: float
    url: Optional[str] = None

class QuickSearchResponse(BaseModel):
    query: str
    results: List[QuickSearchResult]
    total_results: int
    search_time_ms: float

# Search Configuration Schema
class SearchConfiguration(BaseModel):
    # Arabic text processing
    enable_arabic_stemming: bool = True
    enable_arabic_normalization: bool = True
    arabic_transliteration: bool = True
    
    # Fuzzy matching
    fuzzy_threshold: float = 0.6
    max_edit_distance: int = 2
    enable_phonetic_matching: bool = True
    
    # Performance settings
    max_results_per_scope: int = 100
    search_timeout_seconds: int = 30
    enable_result_caching: bool = True
    cache_ttl_minutes: int = 15
    
    # Indexing settings
    auto_index_updates: bool = True
    batch_size: int = 1000
    index_refresh_interval_minutes: int = 60
    
    # Search features
    enable_spell_correction: bool = True
    enable_auto_complete: bool = True
    enable_search_suggestions: bool = True
    min_query_length: int = 1
    max_query_length: int = 500
    
    # Result formatting
    snippet_length: int = 200
    highlight_tag_open: str = "<mark>"
    highlight_tag_close: str = "</mark>"
    
    # Analytics
    enable_search_analytics: bool = True
    store_search_history: bool = True
    analytics_retention_days: int = 365

# Search Export Schema
class SearchExportRequest(BaseModel):
    search_request: UniversalSearchRequest
    export_format: str = "excel"  # "excel", "csv", "json", "pdf"
    include_metadata: bool = True
    include_highlights: bool = False
    max_results: int = 10000

class SearchExportResponse(BaseModel):
    export_id: str
    status: str  # "processing", "completed", "failed"
    download_url: Optional[str] = None
    file_size_mb: Optional[float] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    error_message: Optional[str] = None