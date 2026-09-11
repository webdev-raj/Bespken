export function firstNameFromEmail(email: string | null): string {
  if (!email) {
    return "there";
  }
  const local = email.split("@")[0] ?? "";
  const token = local.split(/[._+\-]/)[0] || local;
  if (!token) {
    return "there";
  }
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatEventWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfEvent = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfEvent.getTime() - startOfToday.getTime()) / 86_400_000,
  );

  if (diffDays === 0) {
    return `Today, ${time}`;
  }
  if (diffDays === 1) {
    return `Tomorrow, ${time}`;
  }

  const day = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${day}, ${time}`;
}

export function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function statusLabel(status: string): string {
  if (status === "joining") return "Joining";
  if (status === "completed") return "Completed";
  if (status === "extracted") return "Extracted";
  if (status === "failed") return "Failed";
  return status;
}

export function statusBadgeClass(status: string): string {
  if (status === "joining") {
    return "bg-amber-500/15 text-amber-400 border-amber-500/25";
  }
  if (status === "completed") {
    return "bg-sky-500/12 text-sky-400 border-sky-400/25";
  }
  if (status === "extracted") {
    return "bg-emerald-500/12 text-emerald-400 border-emerald-500/25";
  }
  if (status === "failed") {
    return "bg-red-500/12 text-red-400 border-red-500/25";
  }
  return "bg-white/8 text-stone-300 border-white/12";
}

export function platformFromUrl(url: string): "meet" | "zoom" | "teams" | "other" {
  if (/meet\.google\.com/i.test(url)) return "meet";
  if (/zoom\.us/i.test(url)) return "zoom";
  if (/(?:teams\.microsoft\.com|teams\.live\.com|teams\.cloud\.microsoft)/i.test(url)) {
    return "teams";
  }
  return "other";
}

export function errorFromPayload(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }
  return fallback;
}
