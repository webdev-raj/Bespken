const MEETINGBAAS_API_BASE = "https://api.meetingbaas.com";

export class MeetingBaasError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "MeetingBaasError";
    this.status = status;
    this.body = body;
  }
}

export type JoinMeetingSuccess = {
  success: true;
  data: {
    bot_id: string;
  };
};

type MeetingBaasErrorBody = {
  success?: false;
  code?: string;
  error?: string;
  message?: string;
  details?: string;
  statusCode?: number;
  retryAfter?: number;
};

export type JoinMeetingOptions = {
  extra?: Record<string, string>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return null;
}

function firstUuidString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

/** Parse bot_id from POST /v2/bots — documented field is data.bot_id. */
export function parseCreatedBotId(payload: unknown): string | null {
  const root = asRecord(payload);
  if (!root) {
    return null;
  }

  const data = asRecord(root.data) ?? root;
  const nestedBot = asRecord(data.bot);

  const botId = firstUuidString(
    data.bot_id,
    data.botId,
    nestedBot?.id,
    nestedBot?.bot_id,
    root.bot_id,
    root.botId,
  );

  const genericId = firstUuidString(data.id, root.id);
  if (botId && genericId && botId !== genericId) {
    console.warn("[meetingBaas] create-bot response has both bot_id and id", {
      bot_id: botId,
      id: genericId,
    });
  }

  return botId ?? genericId;
}

export type WebhookIdentifiers = {
  eventType: string;
  botId: string | null;
  genericId: string | null;
  bespkenMeetingId: string | null;
  calendarEventId: string | null;
  extra: Record<string, unknown> | null;
};

export function parseWebhookIdentifiers(payload: unknown): WebhookIdentifiers {
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;
  // Meeting BaaS v2 puts `extra` on the payload root, not inside `data`.
  const extra = {
    ...(asRecord(data.extra) ?? {}),
    ...(asRecord(root.extra) ?? {}),
  };
  const extraRecord = Object.keys(extra).length > 0 ? extra : null;
  const nestedBot = asRecord(data.bot);

  const eventType = String(root.event || data.event || root.type || data.type || "");

  const botId = firstUuidString(
    data.bot_id,
    data.botId,
    nestedBot?.id,
    nestedBot?.bot_id,
    root.bot_id,
    root.botId,
  );

  const genericId = firstUuidString(data.id, root.id, data.event_uuid, root.event_uuid);

  const bespkenMeetingId = firstUuidString(
    extra.bespken_meeting_id,
    extra.bespkenMeetingId,
  );

  const calendarEventId = firstUuidString(
    extra.calendar_event_id,
    extra.calendarEventId,
  );

  return {
    eventType,
    botId,
    genericId,
    bespkenMeetingId,
    calendarEventId,
    extra: extraRecord,
  };
}

/**
 * Sends a Meeting BaaS bot into a Zoom / Google Meet / Teams call immediately.
 *
 * POST https://api.meetingbaas.com/v2/bots
 * Auth: x-meeting-baas-api-key
 */
export async function joinMeeting(
  meetingUrl: string,
  webhookUrl: string,
  options: JoinMeetingOptions = {},
): Promise<JoinMeetingSuccess> {
  const apiKey = process.env.MEETINGBAAS_API_KEY;

  if (!apiKey) {
    throw new MeetingBaasError(
      "MEETINGBAAS_API_KEY is not set",
      500,
      { success: false, error: "missing_api_key" },
    );
  }

  const requestBody = {
    meeting_url: meetingUrl,
    bot_name: "Bespken",
    recording_mode: "speaker_view",
    transcription_enabled: true,
    transcription_config: {
      provider: "gladia",
    },
    allow_multiple_bots: false,
    callback_enabled: true,
    callback_config: {
      url: webhookUrl,
      method: "POST",
    },
    extra: options.extra ?? {},
  };

  console.log("[meetingBaas] Creating bot", {
    meeting_url: meetingUrl,
    extra: requestBody.extra,
  });

  const response = await fetch(`${MEETINGBAAS_API_BASE}/v2/bots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-meeting-baas-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new MeetingBaasError(
      "Meeting BaaS returned a non-JSON response",
      response.status,
      null,
    );
  }

  if (!response.ok) {
    const errorBody = payload as MeetingBaasErrorBody;
    console.error("[meetingBaas] Create bot failed", {
      status: response.status,
      payload,
    });
    throw new MeetingBaasError(
      errorBody.message ?? errorBody.error ?? `Meeting BaaS request failed (${response.status})`,
      response.status,
      payload,
    );
  }

  const botId = parseCreatedBotId(payload);
  if (!botId) {
    console.error("[meetingBaas] Create bot succeeded but no bot_id in payload", payload);
    throw new MeetingBaasError(
      "Meeting BaaS did not return a bot_id",
      502,
      payload,
    );
  }

  console.log("[meetingBaas] Bot created", {
    bot_id: botId,
    extra: options.extra ?? {},
    raw_payload: payload,
  });

  return {
    success: true,
    data: { bot_id: botId },
  };
}
