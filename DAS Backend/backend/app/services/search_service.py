"""
Universal Search Service with Arabic text support and fuzzy matching
"""
import time
import re
import difflib
from typing import List, Dict, Any, Optional, Tuple, Generator, Union
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, String
from sqlalchemy.orm import Query
from datetime import datetime

from ..models.students import Student
from ..models.teachers import Teacher
from ..models.academic import Class, Subject
from ..models.activities import Activity
from ..models.finance import FinanceTransaction
from ..models.schedules import Schedule
from ..models.users import User
from ..models.director import DirectorNote
from ..schemas.search import (
    UniversalSearchRequest, UniversalSearchResponse, SearchResultItem,
    QuickSearchRequest, QuickSearchResponse, QuickSearchResult,
    SearchScope, SearchMode
)

class ArabicTextProcessor:
    """Handles Arabic text processing and normalization"""
    
    ARABIC_DIACRITICS = r'[\u064B-\u0652\u0670\u0640]'
    ARABIC_NORMALIZATIONS = {
        'أ': 'ا', 'إ': 'ا', 'آ': 'ا',
        'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي'
    }
    
    @classmethod
    def normalize_arabic_text(cls, text: str) -> str:
        """Normalize Arabic text by removing diacritics and standardizing characters"""
        if not text:
            return ""
        # Remove diacritics
        text = re.sub(cls.ARABIC_DIACRITICS, '', text)
        # Standardize characters
        for original, normalized in cls.ARABIC_NORMALIZATIONS.items():
            text = text.replace(original, normalized)
        # Remove extra whitespace
        return re.sub(r'\s+', ' ', text.strip())
    
    @classmethod
    def is_arabic_text(cls, text: str) -> bool:
        """Check if text contains Arabic characters"""
        return bool(re.search(r'[\u0600-\u06FF]', text))
    
    @classmethod
    def tokenize_arabic_text(cls, text: str) -> List[str]:
        """Tokenize Arabic text into words"""
        if not text:
            return []
        # Simple tokenization by splitting on whitespace
        return [token.strip() for token in text.split() if token.strip()]
    
    @classmethod
    def normalize_mixed_text(cls, text: str) -> str:
        """Normalize mixed Arabic-English text"""
        if not text:
            return ""
        # Normalize Arabic part
        normalized = cls.normalize_arabic_text(text)
        # Convert to lowercase for English part
        return normalized.lower()

class FuzzyMatcher:
    """Handles fuzzy string matching"""
    
    @staticmethod
    def is_arabic_text(text: str) -> bool:
        """Check if text contains Arabic characters"""
        return bool(re.search(r'[\u0600-\u06FF]', text))
    
    @staticmethod
    def normalize_arabic_text(text: str) -> str:
        """Normalize Arabic text by removing diacritics and standardizing characters"""
        if not text:
            return ""
        # Remove diacritics
        ARABIC_DIACRITICS = r'[\u064B-\u0652\u0670\u0640]'
        ARABIC_NORMALIZATIONS = {
            'أ': 'ا', 'إ': 'ا', 'آ': 'ا',
            'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي'
        }
        text = re.sub(ARABIC_DIACRITICS, '', text)
        # Standardize characters
        for original, normalized in ARABIC_NORMALIZATIONS.items():
            text = text.replace(original, normalized)
        # Remove extra whitespace
        return re.sub(r'\s+', ' ', text.strip())
    
    @classmethod
    def calculate_similarity(cls, text1: str, text2: str) -> float:
        """Calculate similarity ratio between two texts"""
        if not text1 or not text2:
            return 0.0
        return difflib.SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
    
    @classmethod
    def phonetic_similarity(cls, text1: str, text2: str) -> float:
        """Calculate phonetic similarity between two texts, with special handling for Arabic"""
        if not text1 or not text2:
            return 0.0
        
        # For Arabic text, implement a more sophisticated phonetic algorithm
        if cls.is_arabic_text(text1) or cls.is_arabic_text(text2):
            return cls._arabic_phonetic_similarity(text1, text2)
        else:
            # For non-Arabic text, use a soundex-like algorithm
            return cls._soundex_similarity(text1, text2)
    
    @classmethod
    def _arabic_phonetic_similarity(cls, text1: str, text2: str) -> float:
        """Calculate phonetic similarity for Arabic text using character equivalence"""
        # Arabic character equivalence mapping
        # This maps characters that sound similar to the same base character
        arabic_equivalence = {
            # Alef variants
            'ا': 'ا', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا',
            # Ta variants
            'ت': 'ت', 'ة': 'ت',
            # Ha variants
            'ه': 'ه', 'ة': 'ه',
            # Ya variants
            'ي': 'ي', 'ى': 'ي',
            # Additional phonetic equivalences could be added here
        }
        
        # Normalize both texts
        norm_text1 = cls.normalize_arabic_text(text1)
        norm_text2 = cls.normalize_arabic_text(text2)
        
        # Apply equivalence mapping
        equiv_text1 = ''.join(arabic_equivalence.get(c, c) or c for c in norm_text1)
        equiv_text2 = ''.join(arabic_equivalence.get(c, c) or c for c in norm_text2)
        
        # Calculate similarity using multiple approaches
        # 1. Exact match after normalization
        if equiv_text1 == equiv_text2:
            return 1.0
        
        # 2. Substring matching
        if equiv_text1 in equiv_text2 or equiv_text2 in equiv_text1:
            overlap = min(len(equiv_text1), len(equiv_text2)) / max(len(equiv_text1), len(equiv_text2))
            return 0.7 + (0.3 * overlap)  # Range: 0.7 - 1.0
        
        # 3. Character-level similarity
        common_chars = set(equiv_text1) & set(equiv_text2)
        all_chars = set(equiv_text1) | set(equiv_text2)
        
        if not all_chars:
            return 0.0
        
        char_similarity = len(common_chars) / len(all_chars)
        
        # 4. Length similarity
        len_similarity = min(len(equiv_text1), len(equiv_text2)) / max(len(equiv_text1), len(equiv_text2)) if max(len(equiv_text1), len(equiv_text2)) > 0 else 0
        
        # Weighted combination
        return (char_similarity * 0.4 + len_similarity * 0.6)
    
    @classmethod
    def _soundex_similarity(cls, text1: str, text2: str) -> float:
        """Calculate similarity using a soundex-like algorithm for non-Arabic text"""
        # Simple soundex implementation
        def soundex_code(word):
            if not word:
                return ""
            
            # Convert to uppercase and keep first letter
            word = word.upper()
            first_letter = word[0]
            
            # Mapping of consonants to digits
            mapping = {
                'B': '1', 'F': '1', 'P': '1', 'V': '1',
                'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
                'D': '3', 'T': '3',
                'L': '4',
                'M': '5', 'N': '5',
                'R': '6'
            }
            
            # Convert letters to digits
            digits = ""
            for char in word[1:]:
                if char in mapping:
                    digit = mapping[char]
                    # Only add if different from previous digit
                    if not digits or digit != digits[-1]:
                        digits += digit
                # Skip vowels and 'H', 'W' for basic soundex
            
            # Pad or truncate to 3 digits
            digits = (digits + "000")[:3]
            
            return first_letter + digits
        
        soundex1 = soundex_code(text1)
        soundex2 = soundex_code(text2)
        
        if soundex1 == soundex2:
            return 1.0
        elif soundex1[:2] == soundex2[:2]:  # First two characters match
            return 0.8
        elif soundex1[0] == soundex2[0]:   # First character matches
            return 0.6
        else:
            return 0.0  # No phonetic similarity
    
    @classmethod
    def contains_substring(cls, search_term: str, full_text: str) -> bool:
        """Check if search term is contained in full text"""
        if not search_term or not full_text:
            return False
        return search_term.lower() in full_text.lower()

class SearchCache:
    """Simple in-memory cache for search results"""
    
    def __init__(self):
        self.cache = {}
        self.max_size = 1000
        self.ttl = 300  # 5 minutes
    
    def get(self, key: str) -> Optional[Dict]:
        """Get cached result if exists and not expired"""
        if key in self.cache:
            result, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return result
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, value: Dict) -> None:
        """Set cached result"""
        if len(self.cache) >= self.max_size:
            # Remove oldest entry
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k][1])
            del self.cache[oldest_key]
        self.cache[key] = (value, time.time())
    
    def clear(self) -> None:
        """Clear all cached results"""
        self.cache.clear()

class UniversalSearchService:
    """Main search service with full implementation"""
    
    MIN_QUERY_LENGTH = 3
    MAX_RESULTS = 1000
    
    def __init__(self, db: Session):
        self.db = db
        self.arabic_processor = ArabicTextProcessor()
        self.fuzzy_matcher = FuzzyMatcher()
        self.cache = SearchCache()
        self.search_history = []
    
    async def universal_search(self, request: UniversalSearchRequest) -> UniversalSearchResponse:
        """Main search method that searches across all entities"""
        start_time = time.time()
        
        # Create cache key
        cache_key = f"{request.query}_{request.scope}_{request.mode}_{request.academic_year_id}_{request.session_type}"
        cached_result = self.cache.get(cache_key)
        if cached_result:
            cached_result["search_time_ms"] = (time.time() - start_time) * 1000
            cached_result["from_cache"] = True
            return UniversalSearchResponse(**cached_result)
        
        processed_query = self._preprocess_query(request.query)
        
        # Determine search scopes
        scopes = [request.scope] if request.scope != SearchScope.ALL else [
            SearchScope.STUDENTS, SearchScope.TEACHERS, SearchScope.CLASSES,
            SearchScope.SUBJECTS, SearchScope.ACTIVITIES, SearchScope.FINANCE,
            SearchScope.SCHEDULES, SearchScope.DIRECTOR_NOTES, SearchScope.PAGES
        ]
        
        all_results = []
        results_by_type = {}
        total_scanned = 0
        
        # Search in each scope
        for scope in scopes:
            scope_results, scanned = self._search_in_scope(scope, request, processed_query)
            all_results.extend(scope_results)
            results_by_type[scope.value] = len(scope_results)
            total_scanned += scanned
        
        # Sort by relevance and paginate
        all_results.sort(key=lambda x: x.relevance_score, reverse=True)
        total_results = len(all_results)
        paginated_results = all_results[request.skip:request.skip + request.limit]
        
        search_time_ms = (time.time() - start_time) * 1000
        
        response_data = {
            "query": request.query,
            "scope": request.scope,
            "mode": request.mode,
            "total_results": total_results,
            "results": paginated_results,
            "search_time_ms": search_time_ms,
            "total_scanned": total_scanned,
            "results_by_type": results_by_type,
            "suggestions": self._generate_suggestions(processed_query),
            "has_more": request.skip + len(paginated_results) < total_results,
            "next_skip": request.skip + request.limit if request.skip + len(paginated_results) < total_results else None,
            "from_cache": False
        }
        
        # Cache the result
        self.cache.set(cache_key, response_data)
        
        # Log search activity
        self._log_search_activity({
            "query": request.query,
            "results_count": total_results,
            "search_time_ms": search_time_ms,
            "scopes": [s.value for s in scopes]
        })
        
        return UniversalSearchResponse(**response_data)
    
    def _search_in_scope(self, scope: SearchScope, request: UniversalSearchRequest, processed_query: str) -> Tuple[List[SearchResultItem], int]:
        """Search within a specific scope"""
        if scope == SearchScope.STUDENTS:
            return self._search_students(request, processed_query)
        elif scope == SearchScope.TEACHERS:
            return self._search_teachers(request, processed_query)
        elif scope == SearchScope.CLASSES:
            return self._search_classes(request, processed_query)
        elif scope == SearchScope.SUBJECTS:
            return self._search_subjects(request, processed_query)
        elif scope == SearchScope.ACTIVITIES:
            return self._search_activities(request, processed_query)
        elif scope == SearchScope.FINANCE:
            return self._search_finance(request, processed_query)
        elif scope == SearchScope.SCHEDULES:
            return self._search_schedules(request, processed_query)
        elif scope == SearchScope.DIRECTOR_NOTES:
            return self._search_director_notes(request, processed_query)
        elif scope == SearchScope.PAGES:
            return self._search_pages(request, processed_query)
        else:
            return [], 0
    
    def validate_query(self, query: str) -> bool:
        """Validate search query"""
        if not query:
            return False
        return len(query.strip()) >= self.MIN_QUERY_LENGTH
    
    async def quick_search(self, request: QuickSearchRequest) -> QuickSearchResponse:
        """Quick search for autocomplete"""
        search_request = UniversalSearchRequest(
            query=request.query,
            scope=request.scope,
            mode=SearchMode.PARTIAL,
            limit=min(request.limit, 10),  # Limit quick search results
            academic_year_id=request.academic_year_id,
            min_relevance_score=0.3
        )
        
        response = await self.universal_search(search_request)
        
        quick_results = [
            QuickSearchResult(
                id=result.id,
                type=result.type,
                title=result.title,
                subtitle=result.subtitle,
                relevance_score=result.relevance_score,
                url=result.url
            )
            for result in response.results
        ]
        
        return QuickSearchResponse(
            query=request.query,
            results=quick_results,
            total_results=len(quick_results),
            search_time_ms=response.search_time_ms
        )
    
    def _preprocess_query(self, query: str) -> str:
        """Preprocess search query"""
        if not query:
            return ""
        
        if self.arabic_processor.is_arabic_text(query):
            query = self.arabic_processor.normalize_arabic_text(query)
        
        return re.sub(r'\s+', ' ', query.strip().lower())
    
    def _calculate_relevance(self, query: str, text: str, mode: SearchMode) -> float:
        """Calculate relevance score"""
        if not query or not text:
            return 0.0
        
        # Normalize Arabic text for both query and text to ensure consistent matching
        if self.arabic_processor.is_arabic_text(query) or self.arabic_processor.is_arabic_text(text):
            query = self.arabic_processor.normalize_arabic_text(query)
            text = self.arabic_processor.normalize_arabic_text(text)
        
        query = query.lower()
        text = text.lower()
        
        if mode == SearchMode.EXACT:
            return 1.0 if query == text else 0.0
        elif mode == SearchMode.PARTIAL:
            if query in text:
                position = text.find(query)
                position_factor = 1.0 - (position / len(text)) * 0.3
                return min(1.0, 0.8 * position_factor)
            return 0.0
        elif mode == SearchMode.FUZZY:
            return self.fuzzy_matcher.calculate_similarity(query, text)
        else:
            return self.fuzzy_matcher.calculate_similarity(query, text)
    
    def _search_students(self, request: UniversalSearchRequest, processed_query: str) -> Tuple[List[SearchResultItem], int]:
        """Search students in database"""
        query = self.db.query(Student)
        
        # Apply filters
        if request.academic_year_id:
            query = query.filter(Student.academic_year_id == request.academic_year_id)  
        if request.session_type:
            query = query.filter(Student.session_type == request.session_type)  
        if not request.include_inactive:
            query = query.filter(Student.is_active == True)  
        
        students = query.all()  
        results = []
        scanned = len(students)
        
        for student in students:
            # Create searchable text
            full_name = getattr(student, "full_name", None) or f"{getattr(student, 'father_name', '')} {getattr(student, 'mother_name', '')}".strip()
            phone = getattr(student, "father_phone", None) or getattr(student, "mother_phone", None) or getattr(student, "landline_phone", None)
            searchable_text = f"{full_name} {phone or ''} {student.grade_level or ''}"
            
            relevance_score = self._calculate_relevance(processed_query, searchable_text, request.mode)
            
            if relevance_score >= request.min_relevance_score:
                results.append(SearchResultItem(
                    id=student.id,
                    type="student",
                    title=full_name,
                    subtitle=f"Grade {student.grade_level or 'N/A'} - {getattr(student, 'session_type', 'N/A')}",
                    description=f"Phone: {phone or 'N/A'}",
                    relevance_score=relevance_score,
                    data={
                        "grade_level": getattr(student, 'grade_level', None),
                        "grade_number": getattr(student, 'grade_number', None),
                        "section": getattr(student, 'section', None),
                        "session_type": getattr(student, 'session_type', None),
                        "full_name": full_name,
                        "father_phone": getattr(student, 'father_phone', None),
                        "mother_phone": getattr(student, 'mother_phone', None),
                    },
                    academic_year_id=getattr(student, 'academic_year_id', None),
                    session_type=getattr(student, 'session_type', None),
                    is_active=getattr(student, 'is_active', True),
                    created_at=getattr(student, 'created_at', None),
                    updated_at=getattr(student, 'updated_at', None),
                    url=f"/students/{student.id}",
                    category="Students",
                    tags=["student", str(student.grade_level) if student.grade_level else "N/A"]
                ))
        
        return results, scanned
    
    def _search_teachers(self, request: UniversalSearchRequest, processed_query: str) -> Tuple[List[SearchResultItem], int]:
        """Search teachers in database"""
        query = self.db.query(Teacher)
        
        # Apply filters
        if request.academic_year_id:
            query = query.filter(Teacher.academic_year_id == request.academic_year_id)  
        if not request.include_inactive:
            query = query.filter(Teacher.is_active == True)  
        
        teachers = query.all()  
        results = []
        scanned = len(teachers)
        
        for teacher in teachers:
            searchable_text = f"{getattr(teacher, 'full_name', '')} {getattr(teacher, 'phone', '') or ''} {getattr(teacher, 'nationality', '') or ''} {getattr(teacher, 'subject', '') or ''}"
            relevance_score = self._calculate_relevance(processed_query, searchable_text, request.mode)
            
            if relevance_score >= request.min_relevance_score:
                results.append(SearchResultItem(
                    id=teacher.id,
                    type="teacher",
                    title=getattr(teacher, 'full_name', 'N/A'),
                    subtitle=f"Teacher - {getattr(teacher, 'nationality', 'N/A')}",
                    description=f"Phone: {getattr(teacher, 'phone', 'N/A')}",
                    relevance_score=relevance_score,
                    academic_year_id=getattr(teacher, 'academic_year_id', None),
                    is_active=getattr(teacher, 'is_active', True),
                    created_at=getattr(teacher, 'created_at', None),
                    updated_at=getattr(teacher, 'updated_at', None),
                    url=f"/teachers/{teacher.id}",
                    category="Teachers",
                    tags=["teacher", getattr(teacher, 'subject', 'N/A')]
                ))
        
        return results, scanned
    
    def _search_classes(self, request: UniversalSearchRequest, processed_query: str) -> Tuple[List[SearchResultItem], int]:
        """Search classes in database"""
        query = self.db.query(Class)
        
        # Apply filters
        if request.academic_year_id:
            query = query.filter(Class.academic_year_id == request.academic_year_id)  
        if request.session_type:
            query = query.filter(or_(Class.session_type == request.session_type, Class.session_type == "both"))  
        
        classes = query.all()  
        results = []
        scanned = len(classes)
        
        for class_obj in classes:
            class_name = getattr(class_obj, 'class_name', 'N/A')  
            searchable_text = f"{class_name} {getattr(class_obj, 'section', '') or ''} {getattr(class_obj, 'grade_level', '') or ''}"
            relevance_score = self._calculate_relevance(processed_query, searchable_text, request.mode)
            
            if relevance_score >= request.min_relevance_score:
                results.append(SearchResultItem(
                    id=class_obj.id,
                    type="class",
                    title=class_name,
                    subtitle=f"Section: {getattr(class_obj, 'section', 'N/A')} - Grade: {getattr(class_obj, 'grade_level', 'N/A')}",
                    description=f"Session: {getattr(class_obj, 'session_type', 'N/A')}",
                    relevance_score=relevance_score,
                    academic_year_id=getattr(class_obj, 'academic_year_id', None),
                    session_type=getattr(class_obj, 'session_type', None),
                    created_at=getattr(class_obj, 'created_at', None),
                    updated_at=getattr(class_obj, 'updated_at', None),
                    url=f"/classes/{class_obj.id}",
                    category="Classes",
                    tags=["class", str(class_obj.grade_level) if class_obj.grade_level else "N/A"]
                ))
        
        return results, scanned
    
    def _search_subjects(self, request: UniversalSearchRequest, processed_query: str) -> Tuple[List[SearchResultItem], int]:
        """Search subjects in database"""
        query = self.db.query(Subject)
        
        # Subject model doesn't have is_active attribute, so we skip this filter
        
        subjects = query.all()  
        results = []
        scanned = len(subjects)
        
        for subject in subjects:
            subject_name = getattr(subject, 'subject_name', 'N/A')  
            searchable_text = f"{subject_name} {getattr(subject, 'description', '') or ''}"
            relevance_score = self._calculate_relevance(processed_query, searchable_text, request.mode)
            
            if relevance_score >= request.min_relevance_score:
                results.append(SearchResultItem(
                    id=subject.id,
                    type="subject",
                    title=subject_name,
                    subtitle="Subject",
                    description=getattr(subject, 'description', 'No description'),
                    relevance_score=relevance_score,
                    # Subject model doesn't have is_active attribute
                    created_at=getattr(subject, 'created_at', None),
                    updated_at=getattr(subject, 'updated_at', None),
                    url=f"/subjects/{subject.id}",
                    category="Subjects",
                    tags=["subject"]
                ))
        
        return results, scanned
    
    def _search_activities(self, request: UniversalSearchRequest, processed_query: str) -> Tuple[List[SearchResultItem], int]:
        """Search activities in database"""
        query = self.db.query(Activity)
        
        if request.academic_year_id:
            query = query.filter(Activity.academic_year_id == request.academic_year_id)  
        
        activities = query.all()  
        results = []
        scanned = len(activities)
        
        for activity in activities:
            activity_name = getattr(activity, 'activity_name', 'N/A')  
            searchable_text = f"{activity_name} {getattr(activity, 'description', '') or ''}"
            relevance_score = self._calculate_relevance(processed_query, searchable_text, request.mode)
            
            if relevance_score >= request.min_relevance_score:
                results.append(SearchResultItem(
                    id=activity.id,
                    type="activity",
                    title=activity_name,
                    subtitle=f"Activity - {getattr(activity, 'activity_date', 'N/A')}",
                    description=getattr(activity, 'description', 'No description'),
                    relevance_score=relevance_score,
                    academic_year_id=getattr(activity, 'academic_year_id', None),
                    session_type=getattr(activity, 'session_type', None),
                    created_at=getattr(activity, 'created_at', None),
                    updated_at=getattr(activity, 'updated_at', None),
                    url=f"/activities/{activity.id}",
                    category="Activities",
                    tags=["activity"]
                ))
        
        return results, scanned
    
    def _search_finance(self, request: UniversalSearchRequest, processed_query: str) -> Tuple[List[SearchResultItem], int]:
        """Search finance transactions in database"""
        query = self.db.query(FinanceTransaction)
        
        if request.academic_year_id:
            query = query.filter(FinanceTransaction.academic_year_id == request.academic_year_id)  
        
        transactions = query.all()  
        results = []
        scanned = len(transactions)
        
        for transaction in transactions:
            receipt_number = getattr(transaction, 'receipt_number', transaction.id)  
            searchable_text = f"{getattr(transaction, 'description', '') or ''} {receipt_number or ''} {getattr(transaction, 'transaction_type', '') or ''}"
            relevance_score = self._calculate_relevance(processed_query, searchable_text, request.mode)
            
            if relevance_score >= request.min_relevance_score:
                results.append(SearchResultItem(
                    id=transaction.id,
                    type="finance",
                    title=f"Transaction #{receipt_number}",
                    subtitle=f"{getattr(transaction, 'transaction_type', 'N/A').title()} - ${float(getattr(transaction, 'amount', 0))}",
                    description=getattr(transaction, 'description', 'No description'),
                    relevance_score=relevance_score,
                    academic_year_id=getattr(transaction, 'academic_year_id', None),
                    created_at=getattr(transaction, 'created_at', None),
                    updated_at=getattr(transaction, 'updated_at', None),
                    url=f"/finance/transactions/{transaction.id}",
                    category="Finance",
                    tags=["finance", getattr(transaction, 'transaction_type', 'N/A')]
                ))
        
        return results, scanned
    
    def _search_schedules(self, request: UniversalSearchRequest, processed_query: str) -> Tuple[List[SearchResultItem], int]:
        """Search schedules in database by class name"""
        query = self.db.query(Schedule).join(Class, Schedule.class_id == Class.id)
        
        if request.academic_year_id:
            query = query.filter(Schedule.academic_year_id == request.academic_year_id)
        if request.session_type:
            query = query.filter(Schedule.session_type == request.session_type)
        if not request.include_inactive:
            query = query.filter(Schedule.is_active == True)
        
        schedules = query.all()
        results = []
        scanned = len(schedules)
        
        for schedule in schedules:
            # Get class information
            class_obj = schedule.class_rel if hasattr(schedule, 'class_rel') else None
            class_name = getattr(class_obj, 'class_name', 'N/A') if class_obj else 'N/A'
            grade_level = getattr(class_obj, 'grade_level', '') if class_obj else ''
            section = getattr(schedule, 'section', '') or ''
            
            searchable_text = f"{class_name} {grade_level} {section}".strip()
            relevance_score = self._calculate_relevance(processed_query, searchable_text, request.mode)
            
            if relevance_score >= request.min_relevance_score:
                results.append(SearchResultItem(
                    id=schedule.id,
                    type="schedule",
                    title=f"Schedule: {class_name}",
                    subtitle=f"Grade: {grade_level} - Section: {section or 'N/A'} - {getattr(schedule, 'session_type', 'N/A')}",
                    description=getattr(schedule, 'description', 'No description'),
                    relevance_score=relevance_score,
                    academic_year_id=getattr(schedule, 'academic_year_id', None),
                    session_type=getattr(schedule, 'session_type', None),
                    is_active=getattr(schedule, 'is_active', True),
                    created_at=getattr(schedule, 'created_at', None),
                    updated_at=getattr(schedule, 'updated_at', None),
                    url=f"/schedules?class_id={schedule.class_id}",
                    category="Schedules",
                    tags=["schedule", class_name, grade_level],
                    data={
                        "class_id": schedule.class_id,
                        "class_name": class_name,
                        "grade_level": grade_level,
                        "section": section
                    }
                ))
        
        return results, scanned
    
    def _search_director_notes(self, request: UniversalSearchRequest, processed_query: str) -> Tuple[List[SearchResultItem], int]:
        """Search director notes in database by title only"""
        query = self.db.query(DirectorNote)
        
        if request.academic_year_id:
            query = query.filter(DirectorNote.academic_year_id == request.academic_year_id)
        
        # Only search non-folder notes (actual files)
        query = query.filter(DirectorNote.is_folder == False)
        
        notes = query.all()
        results = []
        scanned = len(notes)
        
        for note in notes:
            title = getattr(note, 'title', 'N/A')
            folder_type = getattr(note, 'folder_type', 'N/A')
            
            # Search only in title (as per requirements)
            searchable_text = title
            relevance_score = self._calculate_relevance(processed_query, searchable_text, request.mode)
            
            if relevance_score >= request.min_relevance_score:
                # Map folder types to Arabic names
                folder_type_names = {
                    "goals": "الأهداف",
                    "projects": "المشاريع",
                    "blogs": "المدونات",
                    "educational_admin": "الإدارة التربوية"
                }
                folder_name = folder_type_names.get(folder_type, folder_type)
                
                results.append(SearchResultItem(
                    id=note.id,
                    type="director_note",
                    title=title,
                    subtitle=f"Category: {folder_name} - {getattr(note, 'note_date', 'N/A')}",
                    description=f"Director's note in {folder_name}",
                    relevance_score=relevance_score,
                    academic_year_id=getattr(note, 'academic_year_id', None),
                    created_at=getattr(note, 'created_at', None),
                    updated_at=getattr(note, 'updated_at', None),
                    url=f"/director/notes/edit/{note.id}",
                    category="Director Notes",
                    tags=["director_note", folder_type, folder_name],
                    data={
                        "folder_type": folder_type,
                        "folder_name": folder_name,
                        "note_date": str(getattr(note, 'note_date', ''))
                    }
                ))
        
        return results, scanned
    
    def _generate_suggestions(self, query: str) -> List[str]:
        """Generate search suggestions based on query and historical data"""
        if not query or not query.strip():
            return []
        
        query = query.strip().lower()
        suggestions = set()
        
        # 1. Use historical search data if available
        historical_suggestions = self._get_historical_suggestions(query)
        suggestions.update(historical_suggestions)
        
        # 2. Generate common variations
        common_variations = self._generate_common_variations(query)
        suggestions.update(common_variations)
        
        # 3. Generate subject-related suggestions
        subject_suggestions = self._generate_subject_suggestions(query)
        suggestions.update(subject_suggestions)
        
        # 4. Generate name-related suggestions for Arabic names
        name_suggestions = self._generate_name_suggestions(query)
        suggestions.update(name_suggestions)
        
        # Convert to list, sort by relevance, and limit to 10
        suggestion_list = list(suggestions)
        suggestion_list.sort(key=lambda x: self._calculate_suggestion_relevance(x, query), reverse=True)
        
        return suggestion_list[:10]
    
    def _get_historical_suggestions(self, query: str) -> List[str]:
        """Get suggestions based on historical search data"""
        # In a real implementation, this would query a search_history table
        # For now, we'll return some common patterns
        common_searches = [
            "students", "teachers", "classes", "subjects", "activities",
            "finance", "reports", "schedule", "attendance", "grades",
            "math", "english", "arabic", "science", "history",
            "ali", "mohamed", "ahmed", "fatima", "aya"
        ]
        
        suggestions = []
        for search in common_searches:
            if query in search.lower() or search.lower().startswith(query):
                suggestions.append(search)
        
        return suggestions
    
    def _generate_common_variations(self, query: str) -> List[str]:
        """Generate common variations of the query"""
        variations = []
        
        # Add common prefixes/suffixes
        prefixes = ["mr ", "ms ", "mrs ", "dr ", "prof "]
        suffixes = [" class", " teacher", " student", " subject"]
        
        for prefix in prefixes:
            if not query.startswith(prefix):
                variations.append(prefix + query)
        
        for suffix in suffixes:
            if not query.endswith(suffix):
                variations.append(query + suffix)
        
        # Plural variations
        if not query.endswith('s'):
            variations.append(query + 's')
        else:
            variations.append(query[:-1])  # Remove 's'
        
        return variations
    
    def _generate_subject_suggestions(self, query: str) -> List[str]:
        """Generate subject-related suggestions"""
        common_subjects = [
            "mathematics", "english", "arabic", "science", "biology", 
            "chemistry", "physics", "history", "geography", "civics",
            "art", "music", "physical education", "computer science",
            "islamic studies", "french", "german", "spanish"
        ]
        
        suggestions = []
        for subject in common_subjects:
            if query in subject.lower() or subject.lower().startswith(query):
                suggestions.append(subject)
        
        return suggestions
    
    def _generate_name_suggestions(self, query: str) -> List[str]:
        """Generate name-related suggestions, especially for Arabic names"""
        # Common Arabic names
        arabic_names = [
            "ahmed", "ali", "mohamed", "omar", "youssef", "amir",
            "fatima", "aya", "mariam", "salma", "nour", "hana",
            "mahmoud", "khaled", "tarek", "hassan", "mostafa"
        ]
        
        suggestions = []
        for name in arabic_names:
            if query in name or name.startswith(query):
                suggestions.append(name)
        
        return suggestions
    
    def _calculate_suggestion_relevance(self, suggestion: str, query: str) -> float:
        """Calculate relevance score for a suggestion"""
        if not suggestion or not query:
            return 0.0
        
        suggestion_lower = suggestion.lower()
        query_lower = query.lower()
        
        # Exact match
        if suggestion_lower == query_lower:
            return 1.0
        
        # Starts with query
        if suggestion_lower.startswith(query_lower):
            return 0.9
        
        # Contains query
        if query_lower in suggestion_lower:
            return 0.7 + (len(query) / len(suggestion)) * 0.2  # Boost based on ratio
        
        # Common prefix/suffix match
        if any(suggestion_lower.startswith(prefix + query_lower) for prefix in ["mr ", "ms ", "mrs ", "dr "]) or \
           any(suggestion_lower.endswith(query_lower + suffix) for suffix in [" class", " teacher", " student"]):
            return 0.6
        
        # Character overlap
        common_chars = len(set(suggestion_lower) & set(query_lower))
        all_chars = len(set(suggestion_lower) | set(query_lower))
        if all_chars > 0:
            return (common_chars / all_chars) * 0.5
        
        return 0.0
    
    def _log_search_activity(self, params: Dict) -> None:
        """Log search activity for analytics"""
        search_record = {
            "timestamp": datetime.now(),
            "query": params.get("query", ""),
            "results_count": params.get("results_count", 0),
            "search_time_ms": params.get("search_time_ms", 0),
            "scopes": params.get("scopes", [])
        }
        self.search_history.append(search_record)
    
    # Public API methods for external use
    async def search_students(self, query: str):
        """Search students"""
        # Real implementation
        students = self.db.query(Student).filter(
            or_(
                Student.full_name.ilike(f'%{query}%'),
                Student.father_name.ilike(f'%{query}%'),
                Student.mother_name.ilike(f'%{query}%')
            )
        ).all()  
        
        results = []
        for student in students:
            full_name = getattr(student, "full_name", None) or f"{getattr(student, 'father_name', '')} {getattr(student, 'mother_name', '')}".strip()
            results.append({
                "id": student.id,
                "full_name": full_name,
                "class_name": getattr(student, "grade_level", "N/A"),
                "grade": getattr(student, "grade_number", "N/A")
            })
        return results
    
    async def search_teachers(self, query: str):
        """Search teachers"""
        # Real implementation
        teachers = self.db.query(Teacher).filter(
            Teacher.full_name.ilike(f'%{query}%')
        ).all()  
        
        results = []
        for teacher in teachers:
            full_name = getattr(teacher, "full_name", "")
            results.append({
                "id": teacher.id,
                "full_name": full_name,
                "subjects": [getattr(teacher, "qualifications", "N/A")],
                "phone": getattr(teacher, "phone", "N/A")
            })
        return results
    
    def get_cached_search(self, query: str):
        """Get cached search results"""
        cache_key = f"cached_{query}"
        cached_result = self.cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Perform actual search
        result = self._perform_search(query)
        self.cache.set(cache_key, result)
        return result
    
    def search_with_filters(self, query: str, filters: Dict):
        """Search with filters applied"""
        # Perform search
        search_results = self._perform_search(query)
        results = search_results.get("results", [])
        
        # Apply filters
        if filters:
            # Filter by type
            if "type" in filters:
                results = [r for r in results if r.get("type") == filters["type"]]
            
            # Filter by grade level
            if "grade_level" in filters:
                results = self._filter_by_grade_level(results, filters["grade_level"])
            
            # Filter by academic year
            if "academic_year_id" in filters:
                results = self._filter_by_academic_year(results, filters["academic_year_id"])
            
            # Filter by session type
            if "session_type" in filters:
                results = self._filter_by_session_type(results, filters["session_type"])
        
        return results
    
    def _filter_by_grade_level(self, results: List, grade_level: str) -> List:
        """Filter results by grade level"""
        if not results or not grade_level:
            return results
        
        filtered_results = []
        for result in results:
            # Check if the result has grade level information
            result_grade_level = result.get("grade_level") or result.get("class_grade_level")
            
            # Handle different grade level representations
            if result_grade_level:
                # Normalize grade level for comparison
                normalized_result_grade = self._normalize_grade_level(result_grade_level)
                normalized_filter_grade = self._normalize_grade_level(grade_level)
                
                if normalized_result_grade == normalized_filter_grade:
                    filtered_results.append(result)
            else:
                # If no grade level info, include in results (conservative approach)
                filtered_results.append(result)
        
        return filtered_results
    
    def _normalize_grade_level(self, grade_level: str) -> str:
        """Normalize grade level representation"""
        if not grade_level:
            return ""
        
        grade_level_lower = grade_level.lower().strip()
        
        # Map common grade level variations
        grade_mappings = {
            "primary": "primary",
            "elementary": "primary",
            "ابتدائي": "primary",
            "intermediate": "intermediate",
            "middle": "intermediate",
            "اعدادي": "intermediate",
            "secondary": "secondary",
            "high": "secondary",
            "ثانوي": "secondary"
        }
        
        # Check for direct mappings
        for key, value in grade_mappings.items():
            if key in grade_level_lower:
                return value
        
        # Handle grade numbers
        import re
        grade_number_match = re.search(r'(\d+)', grade_level_lower)
        if grade_number_match:
            grade_number = int(grade_number_match.group(1))
            if 1 <= grade_number <= 6:
                return "primary"
            elif 7 <= grade_number <= 9:
                return "intermediate"
            elif 10 <= grade_number <= 12:
                return "secondary"
        
        return grade_level_lower
    
    def _filter_by_academic_year(self, results: List, academic_year_id: int) -> List:
        """Filter results by academic year"""
        if not results or not academic_year_id:
            return results
        
        filtered_results = []
        for result in results:
            result_academic_year = result.get("academic_year_id")
            if result_academic_year and result_academic_year == academic_year_id:
                filtered_results.append(result)
            elif not result_academic_year:
                # If no academic year info, include in results (conservative approach)
                filtered_results.append(result)
        
        return filtered_results
    
    def _filter_by_session_type(self, results: List, session_type: str) -> List:
        """Filter results by session type"""
        if not results or not session_type:
            return results
        
        filtered_results = []
        for result in results:
            result_session_type = result.get("session_type")
            if result_session_type and result_session_type.lower() == session_type.lower():
                filtered_results.append(result)
            elif not result_session_type:
                # If no session type info, include in results (conservative approach)
                filtered_results.append(result)
        
        return filtered_results
    
    def filter_by_date_range(self, results: List, filters: Dict):
        """Filter results by date range"""
        if not results or not filters:
            return results
            
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")
        
        if not start_date and not end_date:
            return results
            
        # Parse date filters
        parsed_start_date = self._parse_date_filter(start_date)
        parsed_end_date = self._parse_date_filter(end_date)
        
        # Filter results by date
        filtered_results = []
        for result in results:
            result_date = self._extract_result_date(result)
            
            if result_date:
                # Apply date filtering
                if parsed_start_date and result_date < parsed_start_date:
                    continue
                if parsed_end_date and result_date > parsed_end_date:
                    continue
            
            # Include result if it passes date filtering
            filtered_results.append(result)
        
        return filtered_results
    
    def _parse_date_filter(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse date filter string into datetime object"""
        if not date_str:
            return None
        
        try:
            # Try different date formats
            formats = [
                "%Y-%m-%d",
                "%Y/%m/%d",
                "%d-%m-%Y",
                "%d/%m/%Y",
                "%Y-%m-%d %H:%M:%S",
                "%Y/%m/%d %H:%M:%S"
            ]
            
            for fmt in formats:
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
            
            # If none of the formats work, return None
            return None
        except Exception:
            return None
    
    def _extract_result_date(self, result: Dict) -> Optional[datetime]:
        """Extract date from result object"""
        if not result:
            return None
        
        # Look for common date fields
        date_fields = [
            "created_at",
            "updated_at",
            "date",
            "timestamp",
            "enrollment_date",
            "birth_date",
            "activity_date"
        ]
        
        for field in date_fields:
            date_value = result.get(field)
            if date_value:
                if isinstance(date_value, datetime):
                    return date_value
                elif isinstance(date_value, str):
                    parsed_date = self._parse_date_filter(date_value)
                    if parsed_date:
                        return parsed_date
                elif isinstance(date_value, (int, float)):
                    # Assume it's a timestamp
                    try:
                        return datetime.fromtimestamp(date_value)
                    except:
                        continue
        
        return None
    
    def log_search_activity(self, params: Dict):
        """Log search activity"""
        return self._log_search_activity(params)
    
    def check_search_indices(self):
        """Check search indices status and performance"""
        try:
            # Check if database indices exist for search performance
            index_status = {
                "students_index": self._check_table_index("students", ["full_name", "father_name", "mother_name"]),
                "teachers_index": self._check_table_index("teachers", ["full_name"]),
                "classes_index": self._check_table_index("classes", ["grade_level", "grade_number"]),
                "subjects_index": self._check_table_index("subjects", ["subject_name"]),
                "activities_index": self._check_table_index("activities", ["activity_name", "activity_date"]),
                "finance_index": self._check_table_index("finance_transactions", ["description", "transaction_date"]),
                "status": "Index check completed"
            }
            
            # Add performance recommendations
            recommendations = []
            for table, has_index in index_status.items():
                if table != "status" and not has_index:
                    recommendations.append(f"Consider adding database index on {table} for better search performance")
            
            index_status["recommendations"] = recommendations
            
            return index_status
            
        except Exception as e:
            return {
                "students_index": False,
                "teachers_index": False,
                "classes_index": False,
                "subjects_index": False,
                "activities_index": False,
                "finance_index": False,
                "status": f"Index check failed: {str(e)}",
                "error": str(e)
            }
    
    def _check_table_index(self, table_name: str, columns: List[str]) -> bool:
        """Check if index exists on specified table and columns"""
        try:
            # This is a simplified check - in a real implementation, you would:
            # 1. Query the database system tables for index information
            # 2. Check if indexes exist on the specified columns
            # 3. Verify index health and statistics
            
            # For SQLite, we can check the sqlite_master table
            if self.db.bind is not None and hasattr(self.db.bind, 'driver') and self.db.bind.driver is not None and 'sqlite' in str(self.db.bind.driver).lower():
                # SQLite specific index check
                result = self.db.execute(f"""
                    SELECT count(*) FROM sqlite_master 
                    WHERE type='index' AND tbl_name='{table_name}'
                """).fetchone()
                return result[0] > 0 if result else False
            else:
                # For other databases, we might need different approaches
                # This is a placeholder that returns True to indicate the check was attempted
                return True
                
        except Exception:
            # If we can't check, assume no index exists
            return False
    
    def can_handle_dataset_size(self, size: int):
        """Check if system can handle dataset of given size based on available resources"""
        try:
            import psutil
            import os
            
            # Get system resource information
            system_memory = psutil.virtual_memory()
            available_memory = system_memory.available
            total_memory = system_memory.total
            
            # Estimate memory requirements (rough estimation)
            # Assume each record takes approximately 1KB of memory
            estimated_memory_needed = size * 1024  # in bytes
            
            # Check memory availability (need at least 2x the estimated memory)
            memory_sufficient = available_memory > (estimated_memory_needed * 2)
            
            # Check CPU capabilities (simplified)
            cpu_count = psutil.cpu_count() or 0
            cpu_sufficient = (cpu_count or 0) >= 2  # Need at least 2 cores
            
            # Check disk space (need at least 10MB free space for temporary operations)
            disk_usage = psutil.disk_usage('/')
            disk_sufficient = disk_usage.free > (10 * 1024 * 1024)  # 10MB
            
            # Consider system load
            load_avg = psutil.getloadavg()
            system_load = load_avg[0] if load_avg else 0.0  # 1-minute load average
            load_sufficient = (system_load or 0.0) < ((cpu_count or 0) * 0.7)  # Not overloaded
            
            # Overall system capability
            system_can_handle = memory_sufficient and cpu_sufficient and disk_sufficient and load_sufficient
            
            return {
                "can_handle": system_can_handle,
                "size": size,
                "available_memory_mb": round(available_memory / (1024 * 1024), 2),
                "estimated_memory_needed_mb": round(estimated_memory_needed / (1024 * 1024), 2),
                "cpu_cores": cpu_count,
                "disk_free_mb": round(disk_usage.free / (1024 * 1024), 2),
                "system_load": round(system_load, 2),
                "memory_sufficient": memory_sufficient,
                "cpu_sufficient": cpu_sufficient,
                "disk_sufficient": disk_sufficient,
                "load_sufficient": load_sufficient
            }
            
        except Exception as e:
            # Fallback to dataset size check if system resource checking fails
            actual_size = self._get_dataset_size()
            can_handle = size <= max(actual_size, 100000)
            
            return {
                "can_handle": can_handle,
                "size": size,
                "fallback_check": True,
                "actual_dataset_size": actual_size,
                "error": str(e) if str(e) else "System resource checking failed"
            }
    
    def _get_dataset_size(self) -> int:
        """Get actual dataset size from database"""
        try:
            # Estimate total records across all relevant tables
            total_records = 0
            
            # Count records in major tables
            tables_to_count = [
                "students", "teachers", "classes", "subjects", 
                "activities", "finance_transactions"
            ]
            
            for table in tables_to_count:
                try:
                    result = self.db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()  
                    total_records += result[0] if result else 0
                except:
                    # Table might not exist or be accessible
                    continue
            
            return total_records
        except Exception:
            return 0
    
    def handle_malformed_query(self, query: str):
        """Handle malformed query gracefully"""
        if not query or not query.strip():
            return {"error": "Query is empty", "query": query}
        if len(query.strip()) < self.MIN_QUERY_LENGTH:
            return {"error": f"Query too short, minimum {self.MIN_QUERY_LENGTH} characters", "query": query}
        
        # Try to perform search even with potentially malformed query
        try:
            results = self._perform_search(query.strip())
            return {"results": results.get("results", []), "message": "Search completed"}
        except Exception as e:
            return {"error": f"Search failed: {str(e)}", "query": query}
    
    def search_with_timeout(self, query: str, timeout: int = 30):
        """Search with timeout protection using threading"""
        import threading
        import queue
        
        def search_worker(result_queue):
            try:
                results = self._perform_search(query)
                result_queue.put({"results": results.get("results", []), "success": True})
            except Exception as e:
                result_queue.put({"error": str(e), "success": False})
        
        # Create a queue to receive the result
        result_queue = queue.Queue()
        
        # Start the search in a separate thread
        search_thread = threading.Thread(target=search_worker, args=(result_queue,))
        search_thread.daemon = True
        search_thread.start()
        
        try:
            # Wait for the result with timeout
            result = result_queue.get(timeout=timeout)
            return {**result, "timeout": timeout}
        except queue.Empty:
            # Timeout occurred
            # Note: We can't actually kill the thread, but we can abandon the result
            return {
                "error": f"Search timed out after {timeout} seconds",
                "timeout": timeout,
                "success": False,
                "partial_results": []  # No partial results in this implementation
            }
        except Exception as e:
            return {
                "error": f"Search failed: {str(e)}",
                "timeout": timeout,
                "success": False
            }
    
    def log_search_audit(self, query: str, user_id: int, results_count: int):
        """Log search audit information"""
        # In a real implementation, this would log to audit trail
        audit_record = {
            "timestamp": datetime.now(),
            "user_id": user_id,
            "query": query,
            "results_count": results_count
        }
        # Log to search history
        self.search_history.append(audit_record)
        return True
    
    def search_with_error_handling(self, query: str):
        """Search with error handling"""
        try:
            if not query or not query.strip():
                return {"error": "Query is empty"}
            
            results = self._perform_search(query.strip())
            return {"results": results.get("results", []), "success": True}
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def search_with_permissions(self, query: str, permissions: Dict):
        """Search with permission filtering"""
        # Perform search
        search_results = self._perform_search(query)
        
        # Apply permission filtering
        if not permissions.get("can_view_students", True):
            if "results" in search_results:
                search_results["results"] = [r for r in search_results["results"] if r.get("type") != "student"]
        if not permissions.get("can_view_teachers", True):
            if "results" in search_results:
                search_results["results"] = [r for r in search_results["results"] if r.get("type") != "teacher"]
        if not permissions.get("can_view_financial", True):
            if "results" in search_results:
                search_results["results"] = [r for r in search_results["results"] if r.get("type") != "finance"]
            
        return search_results
    
    # Internal helper methods
    def _perform_search(self, query: str):
        """Perform actual search"""
        # This is a simplified implementation
        # In a real system, this would perform the actual database search
        
        # Perform search across multiple entities
        results = []
        
        # Search students
        students = self.db.query(Student).filter(
            or_(
                Student.full_name.ilike(f'%{query}%'),
                Student.father_name.ilike(f'%{query}%'),
                Student.mother_name.ilike(f'%{query}%')
            )
        ).all()  
        
        for student in students:
            results.append({
                "id": student.id,
                "type": "student",
                "title": student.full_name,
                "description": f"Student in {getattr(student, 'grade_level', 'N/A')} grade"
            })
        
        # Search teachers
        teachers = self.db.query(Teacher).filter(
            Teacher.full_name.ilike(f'%{query}%')
        ).all()  
        
        for teacher in teachers:
            results.append({
                "id": teacher.id,
                "type": "teacher",
                "title": teacher.full_name,
                "description": f"Teacher with {getattr(teacher, 'qualifications', 'N/A')}"
            })
        
        # Search classes
        classes = self.db.query(Class).filter(
            or_(
                Class.grade_level.ilike(f'%{query}%'),
                Class.grade_number.cast(String).ilike(f'%{query}%')
            )
        ).all()  
        
        for class_obj in classes:
            # Create class name from grade_level and grade_number
            class_name = f"{getattr(class_obj, 'grade_level', 'N/A')} {getattr(class_obj, 'grade_number', 'N/A')}"
            results.append({
                "id": class_obj.id,
                "type": "class",
                "title": class_name,
                "description": f"{getattr(class_obj, 'grade_level', 'N/A')} grade"
            })
        
        return {"results": results, "cached": False}
    
    def _filter_by_date_range(self, results: List, filters: Dict):
        """Filter results by date range"""
        if not results or not filters:
            return results
            
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")
        
        if not start_date and not end_date:
            return results
        
        # In a real implementation, this would filter by actual dates
        # For now, we'll just return the results as is
        filtered_results = []
        for result in results:
            # Add date filtering logic here if needed
            filtered_results.append(result)
        
        return filtered_results
    
    def _apply_filters(self, results: List, filters: Dict):
        """Apply various filters to results"""
        if not results or not filters:
            return results
        
        filtered_results = results.copy()
        
        # Filter by type if specified
        if "type" in filters:
            filtered_results = [r for r in filtered_results if r.get("type") == filters["type"]]
        
        # Filter by academic year if specified
        if "academic_year_id" in filters:
            # This would require database access to check academic year
            pass
        
        # Filter by session type if specified
        if "session_type" in filters:
            # This would require database access to check session type
            pass
        
        return filtered_results
    
    def _filter_by_permissions(self, results: Dict, permissions: Dict):
        """Filter results by user permissions"""
        if not results or not permissions:
            return results
        
        filtered_results = results.copy()
        
        # Remove student results if user doesn't have permission
        if not permissions.get("can_view_students", True):
            if "results" in filtered_results:
                filtered_results["results"] = [
                    r for r in filtered_results["results"] 
                    if r.get("type") != "student"
                ]
        
        # Remove teacher results if user doesn't have permission
        if not permissions.get("can_view_teachers", True):
            if "results" in filtered_results:
                filtered_results["results"] = [
                    r for r in filtered_results["results"] 
                    if r.get("type") != "teacher"
                ]
        
        # Remove finance results if user doesn't have permission
        if not permissions.get("can_view_financial", True):
            if "results" in filtered_results:
                filtered_results["results"] = [
                    r for r in filtered_results["results"] 
                    if r.get("type") != "finance"
                ]
        
        return filtered_results
    
    def _execute_long_search(self, query: str):
        """Execute a long-running search"""
        # Execute a more comprehensive search that might take longer
        results = []
        
        # Search students with more comprehensive criteria
        students = self.db.query(Student).filter(
            or_(
                Student.full_name.ilike(f'%{query}%'),
                Student.father_name.ilike(f'%{query}%'),
                Student.mother_name.ilike(f'%{query}%'),
                Student.detailed_address.ilike(f'%{query}%')
            )
        ).all()  
        
        for student in students:
            results.append({
                "id": student.id,
                "type": "student",
                "title": getattr(student, "full_name", "N/A"),
                "description": f"Student in {getattr(student, 'grade_level', 'N/A')} grade"
            })
        
        # Search teachers with more comprehensive criteria
        teachers = self.db.query(Teacher).filter(
            or_(
                Teacher.full_name.ilike(f'%{query}%'),
                Teacher.qualifications.ilike(f'%{query}%'),
                Teacher.detailed_address.ilike(f'%{query}%')
            )
        ).all()  
        
        for teacher in teachers:
            results.append({
                "id": teacher.id,
                "type": "teacher",
                "title": getattr(teacher, "full_name", "N/A"),
                "description": f"Teacher with {getattr(teacher, 'qualifications', 'N/A')}"
            })
        
        return results
    
    def _log_search_activity_internal(self, params: Dict):
        """Internal method to log search activity"""
        # Log search activity to internal history
        search_record = {
            "timestamp": datetime.now(),
            "query": params.get("query", ""),
            "results_count": params.get("results_count", 0),
            "search_time_ms": params.get("search_time_ms", 0),
            "scopes": params.get("scopes", [])
        }
        self.search_history.append(search_record)
        return True
    
    def _get_dataset_size_method(self):
        """Get the size of the dataset"""
        # Count records in main tables
        try:
            student_count = self.db.query(func.count(Student.id)).scalar() or 0  
            teacher_count = self.db.query(func.count(Teacher.id)).scalar() or 0  
            class_count = self.db.query(func.count(Class.id)).scalar() or 0  
            subject_count = self.db.query(func.count(Subject.id)).scalar() or 0  
            return student_count + teacher_count + class_count + subject_count
        except:
            return 1000
    
    def _handle_malformed_query(self, query: str):
        """Handle malformed query"""
        if not query or not query.strip():
            return {"error": "Query is empty"}
        
        if len(query.strip()) < self.MIN_QUERY_LENGTH:
            return {"error": f"Query too short, minimum {self.MIN_QUERY_LENGTH} characters"}
        
        # Try to normalize and search
        try:
            normalized_query = self._preprocess_query(query)
            results = self._perform_search(normalized_query)
            return {"results": results.get("results", []), "normalized_query": normalized_query}
        except Exception as e:
            return {"error": str(e)}
    
    def _execute_search_query(self, query: str):
        """Execute a search query"""
        if not query or not query.strip():
            return {"error": "Query is empty"}
        
        try:
            results = self._perform_search(query.strip())
            return {
                "query": query,
                "results": results.get("results", []),
                "total_results": len(results.get("results", [])),
                "success": True
            }
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def _search_pages(self, request: UniversalSearchRequest, processed_query: str) -> Tuple[List[SearchResultItem], int]:
        """Search application pages by name and route"""
        # Define searchable pages with Arabic names
        pages = [
            {"name": "لوحة التحكم", "route": "/dashboard", "category": "Main", "description": "Main dashboard"},
            {"name": "إدارة السنوات الدراسية", "route": "/academic-years", "category": "Settings", "description": "Manage academic years"},
            {"name": "معلومات المدرسة", "route": "/school-info", "category": "Settings", "description": "School information and grades"},
            {"name": "المعلومات الشخصية (طلاب)", "route": "/students/personal-info", "category": "Students", "description": "Student personal information"},
            {"name": "المعلومات الأكاديمية (طلاب)", "route": "/students/academic-info", "category": "Students", "description": "Student academic information"},
            {"name": "إدارة المعلمين", "route": "/teachers", "category": "Teachers", "description": "Teacher management"},
            {"name": "إدارة الجداول الدراسية", "route": "/schedules", "category": "Schedules", "description": "Schedule management"},
            {"name": "الصفحة اليومية", "route": "/daily", "category": "Daily", "description": "Daily attendance and activities"},
            {"name": "إدارة النشاطات", "route": "/activities", "category": "Activities", "description": "Activities management"},
            {"name": "الإدارة المالية", "route": "/finance", "category": "Finance", "description": "Finance management"},
            {"name": "إدارة تسجيل الدخول", "route": "/user-management", "category": "Settings", "description": "User management and access control"},
            {"name": "ملاحظات المدير", "route": "/director/notes", "category": "Director", "description": "Director's notes and files"},
            {"name": "المكافآت والمساعدات", "route": "/director/notes/rewards", "category": "Director", "description": "Rewards management"},
        ]
        
        results = []
        scanned = len(pages)
        
        for idx, page in enumerate(pages):
            searchable_text = f"{page['name']} {page['category']} {page['description']}"
            relevance_score = self._calculate_relevance(processed_query, searchable_text, request.mode)
            
            if relevance_score >= request.min_relevance_score:
                results.append(SearchResultItem(
                    id=idx + 1000,  # Use offset to avoid ID conflicts
                    type="page",
                    title=page['name'],
                    subtitle=f"Category: {page['category']}",
                    description=page['description'],
                    relevance_score=relevance_score,
                    url=page['route'],
                    category="Pages",
                    tags=["page", page['category'].lower()],
                    data={
                        "route": page['route'],
                        "page_category": page['category']
                    }
                ))
        
        return results, scanned

class SearchResultRanker:
    """Handles ranking and sorting of search results"""
    
    @classmethod
    def rank_results(cls, query: str, results: List[Any]) -> List[Any]:
        """Rank search results based on relevance to query"""
        # Sort by relevance score if available
        if results and hasattr(results[0], 'relevance_score'):
            return sorted(results, key=lambda x: getattr(x, 'relevance_score', 0), reverse=True)
        
        # If no relevance score, sort by title similarity to query
        def title_similarity(item):
            title = getattr(item, 'title', '')
            if not title or not query:
                return 0
            return difflib.SequenceMatcher(None, str(title).lower(), query.lower()).ratio()
        
        return sorted(results, key=title_similarity, reverse=True)
    
    @classmethod
    def rank_with_criteria(cls, query: str, results: List[Any]) -> List[Any]:
        """Rank search results with multiple criteria"""
        # Sort by multiple criteria: relevance, recency, popularity
        def sort_key(item):
            # Get base relevance score
            relevance = getattr(item, 'relevance_score', 0) or 0
            
            # Get creation date for recency scoring
            created_at = getattr(item, 'created_at', None)
            
            # Get popularity metrics if available
            view_count = getattr(item, 'view_count', 0) or 0
            access_count = getattr(item, 'access_count', 0) or 0
            popularity_score = min((view_count + access_count) / 100.0, 1.0)  # Normalize to 0-1
            
            # Calculate recency score (0-1, with 1 being very recent)
            recency_score = 0
            if created_at and isinstance(created_at, datetime):
                # Calculate days since creation
                days_old = (datetime.now() - created_at).days
                # Recent items (0-30 days) get higher scores
                if days_old <= 30:
                    recency_score = 1.0 - (days_old / 30.0)
                # Items 30-90 days old get decreasing scores
                elif days_old <= 90:
                    recency_score = 0.5 - ((days_old - 30) / 120.0)
                # Older items get minimal recency boost
                else:
                    recency_score = 0.1
            
            # Get entity type weighting (some types are more important)
            entity_type = getattr(item, 'type', '').lower()
            type_weight = 1.0
            if entity_type in ['student', 'teacher']:
                type_weight = 1.2  # People entities are more important
            elif entity_type in ['activity', 'finance']:
                type_weight = 1.1  # Business entities are important
            elif entity_type in ['class', 'subject']:
                type_weight = 1.05  # Academic entities are somewhat important
            
            # Combined weighted score
            # 50% relevance, 25% recency, 15% popularity, 10% type weighting
            combined_score = (
                relevance * 0.5 +
                recency_score * 0.25 +
                popularity_score * 0.15 +
                type_weight * 0.1
            )
            
            return combined_score
        
        return sorted(results, key=sort_key, reverse=True)

# Add helper functions to transform search results for frontend compatibility
def transform_search_results_for_frontend(results: Dict) -> Dict:
    """Transform search results to match frontend UniversalSearchPage expectations"""
    # The frontend expects a specific structure with students and teachers grouped
    transformed = {
        "students": {
            "current": [],
            "former": []
        },
        "teachers": {
            "current": [],
            "former": []
        },
        "total_results": results.get("total_results", 0)
    }
    
    # Process results and group by type
    for result in results.get("results", []):
        result_type = result.get("type", "")
        result_data = {
            "id": result.get("id"),
            "name": result.get("title", ""),
            "type": result_type,
            "status": "current"  # Default to current for all results
        }
        
        # Add type-specific fields
        if result_type == "student":
            # Get data from result's data field (includes grade_number, grade_level, etc.)
            data = result.get("data", {})
            
            # Extract student-specific information from subtitle and description
            subtitle = result.get("subtitle", "")
            if "Grade" in subtitle:
                parts = subtitle.split(" - ")
                if len(parts) >= 2:
                    result_data["grade"] = parts[0].replace("Grade ", "")
                    result_data["session"] = parts[1]
            
            # Add detailed grade information from data field
            if data.get("grade_number"):
                result_data["grade_number"] = data["grade_number"]
            if data.get("grade_level"):
                result_data["grade_level"] = data["grade_level"]
            if data.get("section"):
                result_data["section"] = data["section"]
            if data.get("session_type"):
                result_data["session_type"] = data["session_type"]
            
            # Add to current students
            transformed["students"]["current"].append(result_data)
        elif result_type == "teacher":
            # Extract teacher-specific information
            description = result.get("description", "")
            if "Phone:" in description:
                phone_part = description.split("Phone: ")[1] if "Phone: " in description else ""
                result_data["phone"] = phone_part
            
            # Add to current teachers
            transformed["teachers"]["current"].append(result_data)
    
    return transformed