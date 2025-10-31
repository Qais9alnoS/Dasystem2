from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models.users import User
from ..core.dependencies import get_current_user, get_director_user
from ..services.search_service import UniversalSearchService, transform_search_results_for_frontend
from ..schemas.search import (
    UniversalSearchRequest, 
    UniversalSearchResponse,
    QuickSearchRequest,
    QuickSearchResponse,
    SearchScope,
    SearchMode,
    SortBy,
    SortOrder
)

router = APIRouter(tags=["search"])

@router.get("/universal")
async def universal_search(
    query: str = Query(..., description="Search query"),
    scope: SearchScope = Query(SearchScope.ALL, description="Search scope"),
    mode: SearchMode = Query(SearchMode.FUZZY, description="Search mode"),
    academic_year_id: Optional[int] = Query(None, description="Academic year filter"),
    session_type: Optional[str] = Query(None, description="Session type filter"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    sort_by: SortBy = Query(SortBy.RELEVANCE, description="Sort by field"),
    sort_order: SortOrder = Query(SortOrder.DESC, description="Sort order"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Universal search across all modules with advanced filtering and sorting.
    
    Supports searching across:
    - Students (name, student_id, phone, email)
    - Teachers (name, subject, phone, email)
    - Classes (name, grade, academic year)
    - Subjects (name, code, description)
    - Activities (name, type, description)
    - Finance (student payments, teacher salaries)
    """
    try:
        search_request = UniversalSearchRequest(
            query=query,
            scope=scope,
            mode=mode,
            academic_year_id=academic_year_id,
            session_type=session_type,
            skip=skip,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        search_service = UniversalSearchService(db)
        results = await search_service.universal_search(search_request)
        
        # Transform results to match frontend expectations
        transformed_results = transform_search_results_for_frontend(results.dict())
        
        return transformed_results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/quick", response_model=QuickSearchResponse)
async def quick_search(
    query: str = Query(..., min_length=1, description="Quick search query"),
    limit: int = Query(10, ge=1, le=20, description="Number of suggestions"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Quick search for autocomplete suggestions.
    
    Returns simplified results for real-time search suggestions.
    """
    try:
        search_request = QuickSearchRequest(
            query=query,
            limit=limit
        )
        
        search_service = UniversalSearchService(db)
        results = await search_service.quick_search(search_request)
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick search failed: {str(e)}")

@router.get("/students")
async def search_students(
    query: str = Query(..., description="Student search query"),
    academic_year_id: Optional[int] = Query(None, description="Academic year filter"),
    class_id: Optional[int] = Query(None, description="Class filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search specifically in students module."""
    search_request = UniversalSearchRequest(
        query=query,
        scope=SearchScope.STUDENTS,
        academic_year_id=academic_year_id,
        skip=skip,
        limit=limit
    )
    
    search_service = UniversalSearchService(db)
    results = await search_service.universal_search(search_request)
    
    # Transform results to match frontend expectations
    transformed_results = transform_search_results_for_frontend(results.dict())
    
    return transformed_results

@router.get("/teachers")
async def search_teachers(
    query: str = Query(..., description="Teacher search query"),
    subject_id: Optional[int] = Query(None, description="Subject filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search specifically in teachers module."""
    search_request = UniversalSearchRequest(
        query=query,
        scope=SearchScope.TEACHERS,
        skip=skip,
        limit=limit
    )
    
    search_service = UniversalSearchService(db)
    results = await search_service.universal_search(search_request)
    
    # Transform results to match frontend expectations
    transformed_results = transform_search_results_for_frontend(results.dict())
    
    return transformed_results

@router.get("/classes")
async def search_classes(
    query: str = Query(..., description="Class search query"),
    academic_year_id: Optional[int] = Query(None, description="Academic year filter"),
    grade: Optional[str] = Query(None, description="Grade filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search specifically in classes module."""
    search_request = UniversalSearchRequest(
        query=query,
        scope=SearchScope.CLASSES,
        academic_year_id=academic_year_id,
        skip=skip,
        limit=limit
    )
    
    search_service = UniversalSearchService(db)
    results = await search_service.universal_search(search_request)
    
    # Transform results to match frontend expectations
    transformed_results = transform_search_results_for_frontend(results.dict())
    
    return transformed_results

@router.get("/subjects")
async def search_subjects(
    query: str = Query(..., description="Subject search query"),
    grade: Optional[str] = Query(None, description="Grade filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search specifically in subjects module."""
    search_request = UniversalSearchRequest(
        query=query,
        scope=SearchScope.SUBJECTS,
        skip=skip,
        limit=limit
    )
    
    search_service = UniversalSearchService(db)
    results = await search_service.universal_search(search_request)
    
    # Transform results to match frontend expectations
    transformed_results = transform_search_results_for_frontend(results.dict())
    
    return transformed_results

@router.get("/activities")
async def search_activities(
    query: str = Query(..., description="Activity search query"),
    activity_type: Optional[str] = Query(None, description="Activity type filter"),
    academic_year_id: Optional[int] = Query(None, description="Academic year filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search specifically in activities module."""
    search_request = UniversalSearchRequest(
        query=query,
        scope=SearchScope.ACTIVITIES,
        academic_year_id=academic_year_id,
        skip=skip,
        limit=limit
    )
    
    search_service = UniversalSearchService(db)
    results = await search_service.universal_search(search_request)
    
    # Transform results to match frontend expectations
    transformed_results = transform_search_results_for_frontend(results.dict())
    
    return transformed_results

@router.get("/finance")
async def search_finance(
    query: str = Query(..., description="Finance search query"),
    payment_type: Optional[str] = Query(None, description="Payment type filter"),
    academic_year_id: Optional[int] = Query(None, description="Academic year filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)  # Finance requires admin access
):
    """Search specifically in finance module (admin only)."""
    search_request = UniversalSearchRequest(
        query=query,
        scope=SearchScope.FINANCE,
        academic_year_id=academic_year_id,
        skip=skip,
        limit=limit
    )
    
    search_service = UniversalSearchService(db)
    results = await search_service.universal_search(search_request)
    
    # Transform results to match frontend expectations
    transformed_results = transform_search_results_for_frontend(results.dict())
    
    return transformed_results

@router.get("/health")
async def search_health():
    """Health check endpoint for search service."""
    return {
        "status": "healthy",
        "service": "Universal Search API",
        "features": [
            "Universal search across all modules",
            "Arabic text processing",
            "Fuzzy string matching", 
            "Real-time quick search",
            "Advanced filtering and sorting"
        ]
    }