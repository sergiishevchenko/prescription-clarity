# Static Data for Week View

This file contains the static example data that was used in the week view before API integration.

## Mock Week Data

```typescript
const MOCK_WEEK_DATA: Record<string, TimeSlot[]> = {
  "2025-11-10": [
    {
      time: "07:30",
      medications: [
        { id: "1", name: "Omeprazole", dose: "20mg", mealTiming: "before" },
      ],
    },
    {
      time: "08:00",
      medications: [
        { id: "2", name: "Aspirin", dose: "75mg", mealTiming: "with" },
        { id: "3", name: "Metformin", dose: "500mg", mealTiming: "with" },
        { id: "4", name: "Lisinopril", dose: "10mg", mealTiming: "any" },
      ],
    },
    {
      time: "12:00",
      medications: [
        {
          id: "5",
          name: "Calcium Carbonate",
          dose: "600mg",
          mealTiming: "with",
        },
        { id: "6", name: "Vitamin D3", dose: "2000 IU", mealTiming: "with" },
      ],
    },
    {
      time: "16:00",
      medications: [
        { id: "7", name: "Amlodipine", dose: "5mg", mealTiming: "any" },
      ],
    },
    {
      time: "19:00",
      medications: [
        {
          id: "8",
          name: "Calcium Carbonate",
          dose: "600mg",
          mealTiming: "with",
        },
        { id: "9", name: "Atorvastatin", dose: "20mg", mealTiming: "after" },
      ],
    },
    {
      time: "20:00",
      medications: [
        { id: "10", name: "Metformin", dose: "500mg", mealTiming: "with" },
        { id: "11", name: "Simvastatin", dose: "20mg", mealTiming: "with" },
      ],
    },
    {
      time: "21:30",
      medications: [
        { id: "12", name: "Melatonin", dose: "3mg", mealTiming: "any" },
      ],
    },
  ],
  "2025-11-11": [
    {
      time: "07:30",
      medications: [
        { id: "1", name: "Omeprazole", dose: "20mg", mealTiming: "before" },
      ],
    },
  ],
  "2025-11-12": [
    {
      time: "07:30",
      medications: [
        { id: "1", name: "Omeprazole", dose: "20mg", mealTiming: "before" },
      ],
    },
  ],
  "2025-11-13": [
    {
      time: "07:30",
      medications: [
        { id: "1", name: "Omeprazole", dose: "20mg", mealTiming: "before" },
      ],
    },
  ],
  "2025-11-14": [
    {
      time: "07:30",
      medications: [
        { id: "1", name: "Omeprazole", dose: "20mg", mealTiming: "before" },
      ],
    },
    {
      time: "16:00",
      medications: [
        { id: "7", name: "Amlodipine", dose: "5mg", mealTiming: "any" },
      ],
    },
  ],
  "2025-11-15": [
    {
      time: "07:30",
      medications: [
        { id: "1", name: "Omeprazole", dose: "20mg", mealTiming: "before" },
      ],
    },
  ],
  "2025-11-16": [
    {
      time: "07:30",
      medications: [
        { id: "1", name: "Omeprazole", dose: "20mg", mealTiming: "before" },
      ],
    },
  ],
};
```

## Type Definitions

```typescript
type MedicationItem = {
  id: string;
  name: string;
  dose: string;
  mealTiming: "before" | "with" | "after" | "any";
  isTaken?: boolean;
};

type TimeSlot = {
  time: string;
  medications: MedicationItem[];
};
```
