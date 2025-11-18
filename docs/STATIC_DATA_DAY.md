# Static Data for Today View

This file contains the static example data that was used in the today view before API integration.

## Active Schedule Items

```typescript
const activeSchedule: ScheduleItem[] = [
  {
    id: "omeprazole",
    name: "Omeprazole",
    dose: "20 mg",
    time: "07:30",
    context: "before",
  },
  {
    id: "aspirin",
    name: "Aspirin",
    dose: "75 mg",
    time: "08:00",
    context: "with",
  },
  {
    id: "lisinopril",
    name: "Lisinopril",
    dose: "10 mg",
    time: "08:00",
    context: "anytime",
  },
  {
    id: "metformin",
    name: "Metformin",
    dose: "500 mg",
    time: "08:00",
    context: "with",
  },
  {
    id: "calcium",
    name: "Calcium Carbonate",
    dose: "600 mg",
    time: "12:00",
    context: "with",
  },
  {
    id: "vitd3",
    name: "Vitamin D3",
    dose: "2000 IU",
    time: "12:00",
    context: "with",
  },
  {
    id: "amlodipine",
    name: "Amlodipine",
    dose: "5 mg",
    time: "16:00",
    context: "anytime",
  },
  {
    id: "atorvastatin",
    name: "Atorvastatin",
    dose: "20 mg",
    time: "19:00",
    context: "after",
  },
];
```

## Completed Schedule Items

```typescript
const completedSchedule: ScheduleItem[] = [
  {
    id: "simvastatin",
    name: "Simvastatin",
    dose: "20 mg",
    time: "20:00",
    context: "taken",
  },
  {
    id: "melatonin",
    name: "Melatonin",
    dose: "3 mg",
    time: "21:30",
    context: "taken",
  },
];
```

## Calendar Days Status

```typescript
const calendarDays: CalendarDay[] = Array.from({ length: 30 }, (_, index) => {
  const day = index + 1;
  const statusMap: Record<number, CalendarStatus> = {
    5: "Missed",
    6: "Missed",
    7: "Partial",
    8: "Partial",
    9: "Scheduled",
    10: "Scheduled",
    11: "AllTaken",
    12: "AllTaken",
    13: "AllTaken",
    14: "Partial",
    15: "AllTaken",
    16: "Scheduled",
    17: "Scheduled",
    18: "AllTaken",
  };
  return {
    value: day,
    status: statusMap[day] ?? "None",
    isToday: day === 13,
  };
});
```

## Type Definitions

```typescript
type ScheduleContext = "before" | "with" | "anytime" | "after" | "taken";

type ScheduleItem = {
  id: string;
  name: string;
  dose: string;
  time: string;
  context: ScheduleContext;
};

type CalendarStatus = "AllTaken" | "Partial" | "Scheduled" | "Missed" | "None";

type CalendarDay = {
  value: number;
  status: CalendarStatus;
  isToday?: boolean;
};
```
