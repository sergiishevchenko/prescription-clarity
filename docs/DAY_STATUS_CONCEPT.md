# Day Status Concept

## Overview

This document outlines the concept for calculating, storing, and retrieving daily schedule statuses (AllTaken, Missed, Partial, Scheduled, None) for calendar views and statistics.

## Status Definitions

- **None**: No schedule entries exist for the day
- **Scheduled**: Has planned entries, typically for future dates (all entries are PLANNED)
- **AllTaken**: All planned entries have been taken (all entries are DONE)
- **Partial**: Some entries are taken, some are not (mix of PLANNED and DONE)
- **Missed**: Has planned entries but none were taken, typically for past dates (all entries are PLANNED but date has passed)

## Architecture Approach

### Option 1: Compute on Demand (Recommended for MVP)

**Pros:**

- Always accurate, no sync issues
- Simple implementation
- No storage overhead

**Cons:**

- Requires database query for each date range
- Can be slower for large date ranges

**Implementation:**

- Create utility function: `calculateDayStatus(userId, date, timezone)`
- Function queries schedule entries for that day
- Calculates status based on:
  - Total entries count
  - PLANNED vs DONE count
  - Date comparison (past/future)
- Used in calendar view and statistics APIs

### Option 2: Cached in Database (Recommended for Production)

**Pros:**

- Fast retrieval for calendar views
- Can be indexed for performance
- Supports historical queries efficiently

**Cons:**

- Requires cache invalidation when entries change
- Additional storage and maintenance

**Implementation:**

- Create `DayStatus` table with daily aggregates
- Update status when:
  - Schedule entries are created/deleted
  - Entry status changes (PLANNED ↔ DONE)
- Compute on-demand if cache miss occurs

### Option 3: Hybrid Approach (Best Balance)

**Pros:**

- Fast for frequently accessed dates
- Accurate for all dates
- Can compute on-demand as fallback

**Cons:**

- More complex implementation

**Implementation:**

- Cache statuses in database for recent dates (e.g., last 90 days + next 30 days)
- Compute on-demand for dates outside cache window
- Background job to maintain cache

## Recommended Implementation: Option 2 (Cached)

### 1. Database Schema Addition

```prisma
enum DayStatusType {
  NONE
  SCHEDULED
  ALL_TAKEN
  PARTIAL
  MISSED
}

model DayStatus {
  id          String        @id @default(cuid()) @db.VarChar(32)
  userId      String        @db.VarChar(32)
  date        DateTime      @db.Date
  status      DayStatusType
  totalCount  Int           @default(0)
  plannedCount Int          @default(0)
  takenCount  Int           @default(0)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([userId, date])
  @@index([userId, status])
}
```

### 2. Utility Functions

**Location:** `src/lib/day-status.ts`

```typescript
/**
 * Calculate day status based on schedule entries for a specific date
 */
export async function calculateDayStatus(
  userId: string,
  date: Date,
  timezone: string = "UTC",
): Promise<DayStatusType> {
  // Get start and end of day in user's timezone
  const startOfDay = getStartOfDay(date, timezone);
  const endOfDay = getEndOfDay(date, timezone);

  // Query entries for this day
  const entries = await prisma.scheduleEntry.findMany({
    where: {
      userId,
      dateTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      status: true,
    },
  });

  // Calculate status
  const totalCount = entries.length;
  const plannedCount = entries.filter((e) => e.status === "PLANNED").length;
  const takenCount = entries.filter((e) => e.status === "DONE").length;
  const now = new Date();
  const isPastDate = date < getStartOfDay(now, timezone);

  if (totalCount === 0) {
    return "NONE";
  }

  if (takenCount === totalCount) {
    return "ALL_TAKEN";
  }

  if (takenCount === 0 && isPastDate) {
    return "MISSED";
  }

  if (plannedCount === totalCount && !isPastDate) {
    return "SCHEDULED";
  }

  // Some taken, some not
  return "PARTIAL";
}

/**
 * Get or compute day status (with caching)
 */
export async function getDayStatus(
  userId: string,
  date: Date,
  timezone: string = "UTC",
): Promise<DayStatusType> {
  // Try to get from cache first
  const dateOnly = getDateOnly(date);
  const cached = await prisma.dayStatus.findUnique({
    where: {
      userId_date: {
        userId,
        date: dateOnly,
      },
    },
  });

  if (cached) {
    return cached.status as DayStatusType;
  }

  // Compute and cache
  const status = await calculateDayStatus(userId, date, timezone);
  await upsertDayStatus(userId, dateOnly, status);

  return status;
}

/**
 * Update day status when entries change
 */
export async function updateDayStatusForDate(
  userId: string,
  date: Date,
  timezone: string = "UTC",
): Promise<void> {
  const dateOnly = getDateOnly(date);
  const status = await calculateDayStatus(userId, date, timezone);

  // Get counts for detailed stats
  const startOfDay = getStartOfDay(date, timezone);
  const endOfDay = getEndOfDay(date, timezone);

  const entries = await prisma.scheduleEntry.findMany({
    where: {
      userId,
      dateTime: { gte: startOfDay, lte: endOfDay },
    },
    select: { status: true },
  });

  const totalCount = entries.length;
  const plannedCount = entries.filter((e) => e.status === "PLANNED").length;
  const takenCount = entries.filter((e) => e.status === "DONE").length;

  await prisma.dayStatus.upsert({
    where: {
      userId_date: {
        userId,
        date: dateOnly,
      },
    },
    create: {
      userId,
      date: dateOnly,
      status,
      totalCount,
      plannedCount,
      takenCount,
    },
    update: {
      status,
      totalCount,
      plannedCount,
      takenCount,
    },
  });
}

/**
 * Get statuses for a date range (for calendar view)
 */
export async function getDayStatusesForRange(
  userId: string,
  startDate: Date,
  endDate: Date,
  timezone: string = "UTC",
): Promise<Map<string, DayStatusType>> {
  const start = getDateOnly(startDate);
  const end = getDateOnly(endDate);

  const cachedStatuses = await prisma.dayStatus.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lte: end,
      },
    },
    select: {
      date: true,
      status: true,
    },
  });

  const statusMap = new Map<string, DayStatusType>();

  // Add cached statuses
  cachedStatuses.forEach((s) => {
    const dateKey = formatDateForKey(s.date);
    statusMap.set(dateKey, s.status as DayStatusType);
  });

  // Compute missing dates on demand
  const allDates = getDatesBetween(start, end);
  for (const date of allDates) {
    const dateKey = formatDateForKey(date);
    if (!statusMap.has(dateKey)) {
      const status = await calculateDayStatus(userId, date, timezone);
      statusMap.set(dateKey, status);
      // Cache for future use
      await updateDayStatusForDate(userId, date, timezone);
    }
  }

  return statusMap;
}
```

### 3. Cache Invalidation Points

Update day status when:

1. **Schedule entry status changes** (in `PATCH /api/schedule/[id]`):
   - Recalculate status for the entry's date
   - Update cache

2. **Schedule entries created** (in `POST /api/schedule/generate`):
   - Recalculate status for all affected dates
   - Batch update cache

3. **Schedule entries deleted**:
   - Recalculate status for affected dates
   - Update cache

### 4. API Endpoint (Optional)

```typescript
// GET /api/schedule/status?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  // Returns map of date -> status for date range
  // Useful for calendar view
}
```

### 5. Usage in Calendar

```typescript
// In today/page.tsx or calendar component
const statuses = await getDayStatusesForRange(
  user.id,
  startOfMonth,
  endOfMonth,
  timezone,
);

// Use in generateCalendarDays
const dayStatus = statuses.get(formatDateForKey(currentDate)) || "NONE";
```

## Alternative: Compute on Demand (Simpler Start)

If you prefer to start simpler:

1. Skip the database table initially
2. Implement `calculateDayStatus()` utility
3. Compute statuses when rendering calendar
4. Add caching layer later if performance becomes an issue

## Migration Strategy

1. **Phase 1**: Implement compute-on-demand utility functions
2. **Phase 2**: Add database table and migration
3. **Phase 3**: Add cache invalidation hooks
4. **Phase 4**: Add background job for cache maintenance (optional)

## Performance Considerations

- **Cache window**: Consider caching only recent months (e.g., ±3 months from today)
- **Batch updates**: When generating schedule, batch update multiple dates at once
- **Indexing**: Ensure proper indexes on `DayStatus(userId, date)` for fast lookups
- **Lazy computation**: Compute missing statuses on-demand during calendar render
