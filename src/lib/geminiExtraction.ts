export type ExtractedMeetingData = {
  client: string | null;
  scope: string | null;
  price: string | null;
  timeline: string | null;
  notes: string | null;
};

/**
 * Extracts structured proposal/meeting info from a transcript using Gemini.
 */
export async function runExtraction(
  transcriptText: string,
): Promise<ExtractedMeetingData> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("[geminiExtraction] GEMINI_API_KEY is not set.");
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const prompt = `From this call transcript between a freelancer and a client, extract: 1) the client's name or business name if mentioned, 2) a short description of the project scope/deliverables discussed, 3) any price or budget figures mentioned (list all of them with context, since multiple numbers may appear), 4) any timeline or deadline mentioned, 5) any other important notes. Respond as JSON with keys: client, scope, price, timeline, notes. If something wasn't mentioned, use null for that field. Transcript: ${transcriptText}`;

  // Use Gemini 2.5 Flash with fallback to 1.5 Flash
  const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
  let lastError: unknown = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(
          `[geminiExtraction] Gemini model ${model} failed with ${response.status}: ${errorText}`,
        );
        lastError = new Error(`Gemini API error (${response.status}): ${errorText}`);
        continue;
      }

      const payload = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const rawText =
        payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

      if (!rawText) {
        throw new Error("Empty response received from Gemini API");
      }

      const parsed = parseExtractionJson(rawText);
      return parsed;
    } catch (err) {
      console.warn(`[geminiExtraction] Error with model ${model}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to extract data using Gemini API");
}

function parseExtractionJson(raw: string): ExtractedMeetingData {
  // Strip markdown code block wrappers if present (e.g. ```json ... ```)
  let clean = raw.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  try {
    const obj = JSON.parse(clean) as Record<string, unknown>;

    const toStringOrNull = (val: unknown): string | null => {
      if (val === null || val === undefined) return null;
      if (typeof val === "string") {
        const trimmed = val.trim();
        return trimmed.length > 0 ? trimmed : null;
      }
      if (Array.isArray(val)) {
        return val.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join("\n");
      }
      if (typeof val === "object") {
        return JSON.stringify(val, null, 2);
      }
      return String(val);
    };

    return {
      client: toStringOrNull(obj.client),
      scope: toStringOrNull(obj.scope),
      price: toStringOrNull(obj.price),
      timeline: toStringOrNull(obj.timeline),
      notes: toStringOrNull(obj.notes),
    };
  } catch (error) {
    console.error("[geminiExtraction] JSON parse error on output:", raw, error);
    return {
      client: null,
      scope: null,
      price: null,
      timeline: null,
      notes: raw,
    };
  }
}
