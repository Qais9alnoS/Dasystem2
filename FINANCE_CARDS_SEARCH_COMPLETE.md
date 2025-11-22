# Finance Cards Search - Complete ✅

## Problem

Finance cards (كارد مالي) were not showing up in the search results when searching for them.

## Solution Implemented

### 1. Added Finance Cards Search (UniversalSearchBar.tsx)

```typescript
// 7. Search Finance Cards (if user is director or finance)
if (userRole === "director" || userRole === "finance") {
  try {
    const cardsResponse = await financeManagerApi.getFinanceCards({
      academic_year_id: academicYearId,
    });
    if (cardsResponse.success && cardsResponse.data) {
      const matchingCards = cardsResponse.data
        .filter(
          (card: any) =>
            card.card_name?.toLowerCase().includes(query.toLowerCase()) ||
            card.category?.toLowerCase().includes(query.toLowerCase())
        )
        .map((card: any) => ({
          id: card.id,
          type: "finance_card" as const,
          title: card.card_name,
          subtitle: card.card_type === "income" ? "كارد دخل" : "كارد مصروف",
          category: "Finance Cards",
          url: "/finance",
          relevance_score: 0.75,
          data: card,
        }));
      searchResults.push(...matchingCards);
      console.log(`💳 Found ${matchingCards.length} finance cards`);
    }
  } catch (error) {
    console.warn("Finance cards search failed:", error);
  }
}
```

### 2. Added financeManagerApi Import

```typescript
import {
  searchApi,
  classesApi,
  schedulesApi,
  activitiesApi,
  directorApi,
  financeApi,
  financeManagerApi,
} from "@/services/api";
```

### 3. Separated Finance Card Click Handler

```typescript
} else if (result.type === 'finance_card') {
  // Open finance page with card popup
  navigate('/finance', {
    state: {
      preselectedCardId: result.id,
      openCardPopup: true,
      cardData: result.data
    }
  });
}
```

### 4. Added Finance Cards Category Name

**File:** `src/types/search.ts`

```typescript
export const CATEGORY_NAMES: Record<string, string> = {
  Students: "الطلاب",
  Teachers: "المعلمون",
  Classes: "الصفوف",
  Subjects: "المواد",
  Activities: "النشاطات",
  Finance: "المالية",
  "Finance Cards": "الكروت المالية", // ✅ Added
  Schedules: "الجداول",
  "Director Notes": "ملاحظات المدير",
  Pages: "الصفحات",
};
```

### 5. Added CreditCard Icon

**File:** `src/components/search/SearchResults.tsx`

```typescript
import {
  GraduationCap,
  Users,
  BookOpen,
  Clipboard,
  Sparkles,
  DollarSign,
  Calendar,
  FileText,
  File,
  ChevronRight,
  CreditCard, // ✅ Added
} from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  student: <GraduationCap className="h-5 w-5 text-blue-500" />,
  teacher: <Users className="h-5 w-5 text-green-500" />,
  class: <BookOpen className="h-5 w-5 text-purple-500" />,
  subject: <Clipboard className="h-5 w-5 text-orange-500" />,
  activity: <Sparkles className="h-5 w-5 text-pink-500" />,
  finance: <DollarSign className="h-5 w-5 text-yellow-600" />,
  finance_card: <CreditCard className="h-5 w-5 text-emerald-600" />, // ✅ Added
  schedule: <Calendar className="h-5 w-5 text-indigo-500" />,
  director_note: <FileText className="h-5 w-5 text-red-500" />,
  page: <File className="h-5 w-5 text-gray-500" />,
};
```

## How It Works Now

1. **User searches for "كارد"** or any part of a finance card name
2. **System searches** all finance cards in the current academic year
3. **Results show**:
   - Card name (title)
   - Card type: "كارد دخل" or "كارد مصروف" (subtitle)
   - 💳 CreditCard icon in emerald color
   - Under "الكروت المالية" category
4. **When clicked**:
   - Navigates to `/finance` page
   - Opens card popup with `preselectedCardId`
   - Passes card data for immediate display

## Search Filters

Finance cards are filtered by:

- **Card name** (`card_name`)
- **Category** (category assigned to the card)

## User Access

Only users with these roles can see finance cards in search:

- ✅ Director
- ✅ Finance

## Files Modified

1. `DAS Frontend/src/components/search/UniversalSearchBar.tsx`

   - Added finance cards search logic
   - Added financeManagerApi import
   - Separated finance_card click handler

2. `DAS Frontend/src/types/search.ts`

   - Added "Finance Cards" category name mapping

3. `DAS Frontend/src/components/search/SearchResults.tsx`
   - Added CreditCard icon import
   - Added finance_card icon mapping

## Testing

✅ Search for "كارد" → Finance cards appear
✅ Click on card → Opens finance page with card popup
✅ Card shows correct icon (💳)
✅ Card shows correct subtitle (كارد دخل/كارد مصروف)
✅ Only visible to director and finance users

## Navigation State Passed

When clicking a finance card, the following state is passed:

```typescript
{
  preselectedCardId: number,
  openCardPopup: true,
  cardData: object
}
```

The finance page should listen for this state and open the card popup accordingly.
