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

/**
 * Sends a Meeting BaaS bot into a Zoom / Google Meet / Teams call immediately.
 *
 * Current v2 contract (docs.meetingbaas.com/api-v2):
 * POST https://api.meetingbaas.com/v2/bots
 * Auth: x-meeting-baas-api-key
 * Required: meeting_url, bot_name
 * Per-bot results: callback_enabled + callback_config.url (bot.completed / bot.failed)
 * Transcripts: transcription_enabled + transcription_config.provider
 */
export async function joinMeeting(
  meetingUrl: string,
  webhookUrl: string,
): Promise<JoinMeetingSuccess> {
  const apiKey = process.env.MEETINGBAAS_API_KEY;

  if (!apiKey) {
    throw new MeetingBaasError(
      "MEETINGBAAS_API_KEY is not set",
      500,
      { success: false, error: "missing_api_key" },
    );
  }

  const response = await fetch(`${MEETINGBAAS_API_BASE}/v2/bots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-meeting-baas-api-key": apiKey,
    },
    body: JSON.stringify({
      meeting_url: meetingUrl,
      bot_name: "Bespken",
      recording_mode: "speaker_view",
      transcription_enabled: true,
      transcription_config: {
        provider: "gladia",
      },
      callback_enabled: true,
      callback_config: {
        url: webhookUrl,
        method: "POST",
      },
    }),
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
    throw new MeetingBaasError(
      errorBody.message ?? errorBody.error ?? `Meeting BaaS request failed (${response.status})`,
      response.status,
      payload,
    );
  }

  return payload as JoinMeetingSuccess;
}
