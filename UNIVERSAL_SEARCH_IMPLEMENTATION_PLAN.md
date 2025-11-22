# Universal Search System - Implementation Plan

## Overview

Implementing a comprehensive universal search system that searches across all content in the DAS application with YouTube-style expansion, filters, and smart navigation.

## Features Included

✅ Search across all content types: Students, Teachers, Classes, Subjects, Activities, Finance, Schedules, Director Notes, Pages
✅ YouTube-style search bar expansion in titlebar
✅ Filter panel with overlay behavior
✅ Organized results by category
✅ Keyboard shortcuts (Ctrl+K / Cmd+K)
✅ Smart navigation (pages vs content with pre-selected filters)
✅ Advanced filters (date ranges, academic year, session type, active/inactive)
✅ Smart suggestions with auto-complete
✅ Export results to Excel/PDF

## Backend Implementation

### 1. Database Models ✅

- Students, Teachers, Classes, Subjects (existing)
- Activities, Finance Transactions (existing)
- Schedules (existing)
- Director Notes (existing)

### 2. Search Service Extensions ✅

**File**: `DAS Backend/backend/app/services/search_service.py`

Added search methods:

- `_search_schedules()` - Search schedules by class name
- `_search_director_notes()` - Search director notes by title
- `_search_pages()` - Search application pages by Arabic name

### 3. Search Schemas ✅

**File**: `DAS Backend/backend/app/schemas/search.py`

Added scopes:

- `SCHEDULES`
- `DIRECTOR_NOTES`
- `PAGES`

### 4. API Endpoints ✅

**File**: `DAS Backend/backend/app/api/search.py`

Endpoints already generic enough to handle all search types via the `/universal` endpoint.

## Frontend Implementation

### 1. Types & Interfaces

**File**: `DAS Frontend/src/types/search.ts` (NEW)

```typescript
export interface UniversalSearchResult {
  id: number;
  type:
    | "student"
    | "teacher"
    | "class"
    | "subject"
    | "activity"
    | "finance"
    | "schedule"
    | "director_note"
    | "page";
  title: string;
  subtitle?: string;
  description?: string;
  relevance_score: float;
  url: string;
  category: string;
  tags: string[];
  data?: Record<string, any>;
}

export interface SearchFilters {
  academic_year_id?: number;
  session_type?: "morning" | "evening";
  date_from?: string;
  date_to?: string;
  scope?: string[];
  include_inactive?: boolean;
}
```

### 2. UniversalSearchBar Component

**File**: `DAS Frontend/src/components/search/UniversalSearchBar.tsx` (NEW)

Features:

- YouTube-style expansion
- Real-time search with debounce
- Organized results by category
- Filter button integration
- Keyboard navigation
- Smart navigation to pages/content

### 3. FilterPanel Component

**File**: `DAS Frontend/src/components/search/FilterPanel.tsx` (NEW)

Features:

- Overlay behavior
- Academic year filter
- Session type filter
- Date range filter
- Active/Inactive toggle
- Scope selection

### 4. SearchResults Component

**File**: `DAS Frontend/src/components/search/SearchResults.tsx` (NEW)

Features:

- Grouped by category
- Click handlers for navigation
- Highlight matching text
- Show more button

### 5. Integration

- Replace QuickSearch in CustomTitleBar with UniversalSearchBar
- Add keyboard shortcut handler (Ctrl+K / Cmd+K)
- Implement smart navigation logic

## Todo List

### Backend ✅

- [x] Add DirectorNote model import
- [x] Add \_search_schedules() method
- [x] Add \_search_director_notes() method
- [x] Add \_search_pages() method
- [x] Update SearchScope enum (SCHEDULES, DIRECTOR_NOTES, PAGES)
- [x] Update scope handler in universal_search()

### Frontend

- [ ] Create search types file
- [ ] Create UniversalSearchBar component
- [ ] Create FilterPanel component
- [ ] Create SearchResults component
- [ ] Update API service for universal search
- [ ] Add keyboard shortcut handler
- [ ] Implement smart navigation logic
- [ ] Integrate into CustomTitleBar
- [ ] Add export functionality

### Testing

- [ ] Test search for each content type
- [ ] Test filters
- [ ] Test navigation
- [ ] Test keyboard shortcuts
- [ ] Clean up test files

## Navigation Logic

### Pages

When searching for a page (e.g., "إدارة تسجيل الدخول"):

- Click result → Navigate directly to the page route

### Students

When searching for a student (e.g., "مازن"):

- Click result → Navigate to `/students/personal-info` with:
  - Grade pre-selected
  - Section (شعبة) pre-selected
  - Student popup automatically opens

### Schedules

When searching for a schedule (e.g., "السادس أ"):

- Shows in two categories:
  1. **School Info** → Navigates to class page
  2. **Schedules** → Navigates to schedule page with class pre-selected

## Export Formats

- Excel
- PDF (optional based on implementation time)

## API Usage

```typescript
// Universal search
const results = await searchApi.universal(query, {
  scope: "all",
  filters: {
    academic_year_id: 1,
    session_type: "morning",
  },
});

// Quick search for autocomplete
const suggestions = await searchApi.quick(query, 10);
```

## Notes

- No search history needed (as per user request)
- Smart suggestions based on content, not history
- Minimum query length: 1 character
- Results shown: 10 initially, then "Show More"
