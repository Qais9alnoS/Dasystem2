"""
Test script for Universal Search System
Tests all search scopes including new additions (schedules, director notes, pages)
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.services.search_service import UniversalSearchService
from app.schemas.search import UniversalSearchRequest, SearchScope, SearchMode

def test_universal_search():
    """Test the universal search functionality"""
    print("=" * 80)
    print("UNIVERSAL SEARCH SYSTEM - TEST SUITE")
    print("=" * 80)
    
    # Create a database session
    db = SessionLocal()
    try:
        # Initialize the search service
        search_service = UniversalSearchService(db)
        
        # Test queries
        test_queries = [
            ("مازن", "Testing Arabic student name"),
            ("السادس", "Testing class search"),
            ("إدارة", "Testing page search"),
            ("teacher", "Testing English teacher search"),
            ("الأهداف", "Testing director notes search"),
        ]
        
        print("\n" + "=" * 80)
        print("TESTING ALL SEARCH SCOPES")
        print("=" * 80)
        
        for query, description in test_queries:
            print(f"\n{'-' * 80}")
            print(f"Test: {description}")
            print(f"Query: '{query}'")
            print(f"{'-' * 80}")
            
            # Create search request
            request = UniversalSearchRequest(
                query=query,
                scope=SearchScope.ALL,
                mode=SearchMode.FUZZY,
                limit=10,
                min_relevance_score=0.3
            )
            
            try:
                # Perform synchronous search (note: using sync method for testing)
                import asyncio
                results = asyncio.run(search_service.universal_search(request))
                
                print(f"\nResults found: {results.total_results}")
                print(f"Search time: {results.search_time_ms:.2f}ms")
                print(f"Records scanned: {results.total_scanned}")
                
                if results.results_by_type:
                    print(f"\nResults by type:")
                    for result_type, count in results.results_by_type.items():
                        if count > 0:
                            print(f"  - {result_type}: {count}")
                
                if results.results:
                    print(f"\nTop results:")
                    for i, result in enumerate(results.results[:5], 1):
                        print(f"  {i}. [{result.type}] {result.title}")
                        print(f"     Score: {result.relevance_score:.3f}")
                        print(f"     Category: {result.category}")
                        if result.subtitle:
                            print(f"     {result.subtitle}")
                        print()
                else:
                    print("\n  No results found.")
                
                if results.suggestions:
                    print(f"Suggestions: {', '.join(results.suggestions[:3])}")
                
            except Exception as e:
                print(f"ERROR: {str(e)}")
                import traceback
                traceback.print_exc()
        
        # Test individual scopes
        print("\n" + "=" * 80)
        print("TESTING INDIVIDUAL SCOPES")
        print("=" * 80)
        
        scopes_to_test = [
            (SearchScope.STUDENTS, "طالب"),
            (SearchScope.TEACHERS, "teacher"),
            (SearchScope.CLASSES, "السادس"),
            (SearchScope.SCHEDULES, "السادس"),
            (SearchScope.DIRECTOR_NOTES, "الأهداف"),
            (SearchScope.PAGES, "إدارة"),
        ]
        
        for scope, query in scopes_to_test:
            print(f"\n{'-' * 80}")
            print(f"Scope: {scope.value}")
            print(f"Query: '{query}'")
            print(f"{'-' * 80}")
            
            request = UniversalSearchRequest(
                query=query,
                scope=scope,
                mode=SearchMode.FUZZY,
                limit=5
            )
            
            try:
                import asyncio
                results = asyncio.run(search_service.universal_search(request))
                
                print(f"Results: {results.total_results}")
                if results.results:
                    for result in results.results[:3]:
                        print(f"  - {result.title} (score: {result.relevance_score:.3f})")
            except Exception as e:
                print(f"ERROR: {str(e)}")
        
        print("\n" + "=" * 80)
        print("SEARCH SYSTEM TEST COMPLETED")
        print("=" * 80)
        
    finally:
        db.close()

if __name__ == "__main__":
    test_universal_search()
