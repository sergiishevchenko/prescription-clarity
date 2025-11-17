# PDF Export Endpoint Documentation

## What `/api/export/pdf` Returns

### HTTP Response

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="schedule-2025-11-04-to-2025-11-10.pdf"
Body: [PDF binary data]
```

**Note**: This is not JSON, but a binary PDF file.

---

## PDF Document Structure

### Page Header

- **Title**: "Medication Schedule"
- **Period**: "04.11.2025 - 10.11.2025" (from `from`/`to` parameters)
- **User Name**: `user.name` (if available) or `user.email`
- **PDF Generation Date**: Current date/time
- **Time Zone**: Specified in `tz` parameter (e.g., "Europe/Kyiv")

### Schedule Table

| Date       | Time  | Medication  | Dose   | Status     |
| ---------- | ----- | ----------- | ------ | ---------- |
| 04.11.2025 | 08:00 | Paracetamol | 500 mg | ✓ Done     |
| 04.11.2025 | 14:00 | Paracetamol | 500 mg | ⏳ Planned |
| 04.11.2025 | 20:00 | Paracetamol | 500 mg | ⏳ Planned |
| 05.11.2025 | 08:00 | Aspirin     | 100 mg | ⏳ Planned |

**Fields from data**:

- **Date**: `localDateTime` (formatted date from `dateTime` with `tz` applied)
- **Time**: `localDateTime` (time only)
- **Medication**: `medication.name`
- **Dose**: `medication.dose`
- **Status**: `status` (PLANNED → "Planned", DONE → "Done")

### Grouping (Optional)

Can be grouped by:

- **By dates** (all entries for a day together)
- **By medications** (all doses of one medication together)

### Summary Statistics (at bottom of page)

- **Total entries**: X
- **Done**: Y
- **Planned**: Z

### Page Footer

- **Page number**: "Page 1 of 2"
- **Generation date**: "Generated: 04.11.2025 15:30"

---

## Request Parameters (POST body)

```typescript
{
  from: "2025-11-04T00:00:00Z",  // Start of period
  to: "2025-11-10T23:59:59Z",     // End of period
  tz: "Europe/Kyiv",              // Timezone for display
  orientation?: "portrait" | "landscape",  // Page orientation (default: portrait)
  format?: "A4" | "Letter"        // Page size (default: A4)
}
```

---

## Usage Example

```typescript
// Request
POST /api/export/pdf
Body: {
  "from": "2025-11-04T00:00:00Z",
  "to": "2025-11-10T23:59:59Z",
  "tz": "Europe/Kyiv",
  "orientation": "portrait"
}

// Response
Response Headers:
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="schedule-2025-11-04-to-2025-11-10.pdf"
Response Body: [PDF binary data]
```

---

## Additional Fields (if needed)

- **Frequency**: `medication.frequency` (e.g., "every 6 hours")
- **Treatment period**: `medication.startDate` - `medication.endDate`
- **Notes**: Can add a column for notes

---

## Implementation Notes

### Data Source

The endpoint will:

1. Authenticate the user (via session cookie)
2. Fetch schedule entries from database using the same logic as `GET /api/schedule`
3. Include related medication data (name, dose)
4. Convert UTC dates to local timezone using the `tz` parameter
5. Generate HTML with print styles
6. Convert HTML to PDF using Puppeteer
7. Return PDF as binary response

### Print Styles

- A4 page size with margins (20mm top/bottom, 15mm left/right)
- Table headers repeat on each page (`thead { display: table-header-group; }`)
- Prevent row breaks (`tr { break-inside: avoid; }`)
- Proper page breaks for multi-page documents

### Performance Considerations

- Puppeteer browser instance should be reused (browser pool)
- Timeout handling for long-running PDF generation
- Error handling with fallback responses
- Optional caching for identical requests
