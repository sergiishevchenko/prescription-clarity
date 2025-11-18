export const normalizeTimeValue = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(trimmed)) {
    return null;
  }
  return trimmed;
};

export const sanitizeCustomTimes = (values?: string[]) => {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => normalizeTimeValue(value))
    .filter((value): value is string => Boolean(value));
};

export const formatTimeValue = (value?: string) => {
  if (!value) return "Set a time";
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const date = new Date();
  date.setHours(hours, minutes);
  return Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export const formatDateLabel = (value?: string) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};
