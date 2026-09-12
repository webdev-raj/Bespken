export const EDIT_LOG_FIELDS = [
  "client",
  "scope",
  "price",
  "timeline",
  "notes",
] as const;

export type EditLogField = (typeof EDIT_LOG_FIELDS)[number];

export type EditLogEntry = {
  field: EditLogField;
  original: string | null;
  edited: string | null;
  edited_at: string;
};

export function normalizeExtractedValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export function parseEditLog(value: unknown): EditLogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is EditLogEntry => {
    if (typeof entry !== "object" || entry === null) {
      return false;
    }
    const record = entry as Record<string, unknown>;
    return (
      typeof record.field === "string" &&
      EDIT_LOG_FIELDS.includes(record.field as EditLogField)
    );
  });
}

function lastEditedValue(log: EditLogEntry[], field: EditLogField): string | null | undefined {
  for (let i = log.length - 1; i >= 0; i -= 1) {
    if (log[i].field === field) {
      return log[i].edited;
    }
  }
  return undefined;
}

export function buildEditLog({
  originals,
  current,
  previousSaved,
  existingLog,
  editedAt,
}: {
  originals: Record<EditLogField, string | null | undefined>;
  current: Record<EditLogField, string | null>;
  previousSaved: Record<EditLogField, string | null | undefined>;
  existingLog: unknown;
  editedAt: string;
}): EditLogEntry[] {
  const log = parseEditLog(existingLog);

  for (const field of EDIT_LOG_FIELDS) {
    const original = normalizeExtractedValue(originals[field]);
    const edited = current[field];
    const previouslySaved = normalizeExtractedValue(previousSaved[field]);

    if (edited === original) {
      continue;
    }

    if (edited === previouslySaved) {
      continue;
    }

    if (lastEditedValue(log, field) === edited) {
      continue;
    }

    log.push({
      field,
      original,
      edited,
      edited_at: editedAt,
    });
  }

  return log;
}
