<!-- 97d2d3d1-ad73-4a3f-9813-c299cc731aa0 ba517b94-200f-41ba-8455-aa3ac30169e2 -->
# Director Notes & File Management System

## Overview

Create a director-only note-taking page with hierarchical folder/file management, custom markdown editor, and integration with existing rewards/assistance features.

## Architecture

### Storage Strategy

- **Filesystem**: Actual .md files stored in `DAS Backend/director_notes/{academic_year_id}/{category}/{path}/`
- **Database**: Metadata (title, date, path, category) in `director_notes` table
- **Categories**: 4 main root folders (Goals, Projects, Blogs, Educational/Admin)

### Database Schema Updates

**Extend DirectorNote model**:

- Add `file_path` field (relative path from category root)
- Add `parent_folder_id` field (for folder hierarchy)
- Add `is_folder` boolean field
- Modify `folder_type` to match categories: `goals`, `projects`, `blogs`, `educational_admin`
- Keep existing fields: `title`, `content`, `note_date`, `academic_year_id`

## Backend Implementation

### 1. File System Service (`app/services/director_notes_service.py`)

- Create base directory structure on startup
- CRUD operations for folders and files
- Read/write .md files from filesystem
- Ensure atomic operations for file safety
- Validate file paths to prevent directory traversal

### 2. API Endpoints (`app/api/director.py`)

**Folder Operations**:

- `GET /api/director/notes/folders?category={category}&parent_id={id}` - List folders/files
- `POST /api/director/notes/folders` - Create new folder
- `PUT /api/director/notes/folders/{id}` - Rename folder
- `DELETE /api/director/notes/folders/{id}` - Delete folder (recursive)

**File Operations**:

- `GET /api/director/notes/files/{id}` - Get file content
- `POST /api/director/notes/files` - Create new note file
- `PUT /api/director/notes/files/{id}` - Update note content (auto-save support)
- `DELETE /api/director/notes/files/{id}` - Delete note file

**Category Operations**:

- `GET /api/director/notes/categories` - List all categories with counts

**Search**:

- `GET /api/director/notes/search?q={query}` - Search across all notes

### 3. Existing Endpoints (Already Implemented)

- Rewards and Assistance endpoints are complete, just need frontend integration

## Frontend Implementation

### 1. Main Notes Page (`DirectorNotesPage.tsx`)

**Layout**:

- iOS-style navigation bar with "ملاحظات" title
- Accordion/collapsible sections for each category
- Each section shows:
  - الاهداف (Goals) - folder icon + count
  - المشاريع (Projects) - folder icon + count  
  - مدونات (Blogs) - folder icon + count
  - الأمور التعليمية والإدارية (Educational/Admin) - folder icon + count
- Separate sections for:
  - المكافئات (Rewards) - with special form interface
  - المساعدات (Assistance) - with special form interface
- Access to dashboard statistics

### 2. Folder Browser Component (`NoteFolderBrowser.tsx`)

**Features**:

- Breadcrumb navigation showing current path
- Grid/List view toggle
- Folder and file items with icons
- Context menu for operations (rename, delete, move)
- New folder button
- New note button
- Search bar at top
- iOS-style animations for navigation

### 3. Markdown Editor Component (`MarkdownNoteEditor.tsx`)

**Custom Editor Features**:

- iOS-style toolbar with markdown tools:
  - Bold, Italic, Strikethrough
  - Headings (H1-H6)
  - Bullet list
  - Numbered list
  - Table insertion (جدول)
  - Code block
  - Quote
  - Link
  - Horizontal rule
- Split view: Edit | Preview | Side-by-side
- Auto-save with visual indicator
- Last saved timestamp
- Title input at top
- Date picker
- Full-screen mode option
- Character/word count

**Editor Implementation**:

- Use `textarea` with custom toolbar for markdown insertion
- Live preview using `react-markdown` with `remark-gfm` for tables
- Syntax highlighting with `react-syntax-highlighter`
- Custom CSS matching iOS aesthetic

### 4. Rewards & Assistance Components

**RewardsManager.tsx**:

- List view of all rewards
- Add/Edit form with fields:
  - Title
  - Date
  - Recipient name
  - Recipient type (student/teacher/other)
  - Amount (integrated with finance system)
  - Description
- Filter by date range, recipient type
- Total rewards summary

**AssistanceManager.tsx**:

- List view of all assistance records
- Add/Edit form with fields:
  - Title
  - Date
  - Organization
  - Amount (integrated with finance system)
  - Description
- Filter by date range, organization
- Total assistance summary

### 5. API Service (`services/directorNotesApi.ts`)

Implement all API calls for:

- Folder operations (CRUD)
- File operations (CRUD with content)
- Category listing
- Search functionality
- Rewards CRUD
- Assistance CRUD

### 6. State Management

Use React Query for:

- Caching folder/file structure
- Optimistic updates
- Auto-refetch on mutations
- Infinite scroll for large folders

### 7. Route Protection

Add route in `App.tsx`:

```tsx
<Route path="director/notes/*" element={
  <ProtectedRoute allowedRoles={['director']}>
    <DirectorNotesPage />
  </ProtectedRoute>
} />
```

## UI/UX Design (Following iOS Style)

### Colors & Styling

- Use existing iOS components from `IOS-Style-example.tsx`
- Rounded corners (rounded-2xl)
- Subtle shadows
- Smooth animations
- System font stack
- Light/dark mode support

### Navigation Flow

1. Main Notes page → Category selection
2. Category → Folder browser with breadcrumbs
3. Folder → Can create subfolder or note
4. Note → Opens markdown editor with auto-save
5. Back navigation with iOS-style slide animations

### Key Features

- Drag-and-drop file organization (future enhancement)
- Keyboard shortcuts for markdown
- Mobile-responsive design
- Offline support with sync (future enhancement)
- Export notes to PDF (future enhancement)

## Implementation Order

1. **Backend Foundation**

   - Extend database schema
   - Create file system service
   - Implement folder/file API endpoints

2. **Frontend Core**

   - Create main notes page with category sections
   - Build folder browser component
   - Implement navigation and breadcrumbs

3. **Markdown Editor**

   - Build custom editor component
   - Implement toolbar with markdown tools
   - Add live preview
   - Integrate auto-save

4. **Rewards & Assistance**

   - Create manager components
   - Connect to existing backend APIs
   - Add finance integration

5. **Polish & Testing**

   - Add search functionality
   - Implement animations
   - Test all file operations
   - Add error handling
   - Test director role protection

## Security Considerations

- Validate all file paths to prevent directory traversal
- Ensure only directors can access notes
- Sanitize markdown content on display
- Implement rate limiting for file operations
- Validate file size limits
- Backup notes during academic year transitions

## File Structure

```
DAS Backend/
├── director_notes/
│   ├── {academic_year_id}/
│   │   ├── goals/
│   │   ├── projects/
│   │   ├── blogs/
│   │   └── educational_admin/
│   
DAS Frontend/
├── src/
│   ├── pages/
│   │   └── DirectorNotesPage.tsx (main entry)
│   ├── components/
│   │   ├── director-notes/
│   │   │   ├── NoteFolderBrowser.tsx
│   │   │   ├── MarkdownNoteEditor.tsx
│   │   │   ├── RewardsManager.tsx
│   │   │   └── AssistanceManager.tsx
│   ├── services/
│   │   └── directorNotesApi.ts
```

### To-dos

- [x] Extend DirectorNote model with file_path, parent_folder_id, is_folder fields
- [x] Create director_notes_service.py for file system operations
- [x] Implement folder and file CRUD endpoints in director.py API
- [x] Create directorNotesApi.ts service with all API calls
- [x] Create DirectorNotesPage.tsx with category sections and navigation
- [x] Build NoteFolderBrowser.tsx component with breadcrumbs and file listing
- [x] Create custom MarkdownNoteEditor.tsx with toolbar and live preview
- [x] Build RewardsManager.tsx and AssistanceManager.tsx components
- [x] Add protected route for director notes in App.tsx
- [x] Test all features, add error handling, implement search functionality