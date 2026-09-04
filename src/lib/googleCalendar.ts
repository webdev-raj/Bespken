export type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  meetingUrl: string;
};

type GoogleEventDate = {
  dateTime?: string;
  date?: string;
};

type GoogleCalendarEvent = {
  id?: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  hangoutLink?: string;
  start?: GoogleEventDate;
  end?: GoogleEventDate;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
};

type GoogleEventsResponse = {
  items?: GoogleCalendarEvent[];
  error?: { message?: string };
};

const ZOOM_URL_RE = /https?:\/\/(?:[a-z0-9-]+\.)?zoom\.us\/[^\s<>"'\\)]+/i;
const MEET_URL_RE = /https?:\/\/meet\.google\.com\/[^\s<>"'\\)]+/i;

export function extractMeetingUrl(event: GoogleCalendarEvent): string | null {
  if (event.hangoutLink && isMeetingUrl(event.hangoutLink)) {
    return event.hangoutLink.trim();
  }

  const conferenceUris =
    event.conferenceData?.entryPoints
      ?.map((entry) => entry.uri)
      .filter((uri): uri is string => Boolean(uri)) ?? [];

  for (const uri of conferenceUris) {
    if (isMeetingUrl(uri)) {
      return uri.trim();
    }
  }

  const fromLocation = findMeetingUrlInText(event.location);
  if (fromLocation) {
    return fromLocation;
  }

  return findMeetingUrlInText(event.description);
}

function isMeetingUrl(value: string): boolean {
  return MEET_URL_RE.test(value) || ZOOM_URL_RE.test(value);
}

function findMeetingUrlInText(text: string | undefined): string | null {
  if (!text) {
    return null;
  }

  const meet = text.match(MEET_URL_RE)?.[0];
  if (meet) {
    return meet;
  }

  const zoom = text.match(ZOOM_URL_RE)?.[0];
  return zoom ?? null;
}

function eventDateTime(value: GoogleEventDate | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.dateTime ?? (value.date ? `${value.date}T00:00:00` : null);
}

export function simplifyCalendarEvents(payload: GoogleEventsResponse): CalendarEvent[] {
  const items = payload.items ?? [];
  const events: CalendarEvent[] = [];

  for (const item of items) {
    if (!item.id || item.status === "cancelled") {
      continue;
    }

    const meetingUrl = extractMeetingUrl(item);
    const start = eventDateTime(item.start);
    const end = eventDateTime(item.end);

    if (!meetingUrl || !start || !end) {
      continue;
    }

    events.push({
      id: item.id,
      summary: item.summary?.trim() || "Untitled meeting",
      start,
      end,
      meetingUrl,
    });
  }

  return events;
}

export async function fetchPrimaryCalendarEvents(
  accessToken: string,
): Promise<{ ok: true; events: CalendarEvent[] } | { ok: false; status: number; message: string }> {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
  );
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "50");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  let payload: GoogleEventsResponse = {};
  try {
    payload = (await response.json()) as GoogleEventsResponse;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: payload.error?.message ?? `Google Calendar request failed (${response.status})`,
    };
  }

  return { ok: true, events: simplifyCalendarEvents(payload) };
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
  refreshToken: string | null;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set to refresh Google access tokens.",
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ?? payload.error ?? "Google token refresh failed",
    );
  }

  return {
    accessToken: payload.access_token,
    expiresIn: payload.expires_in ?? 3600,
    refreshToken: payload.refresh_token ?? null,
  };
}
