/**
 * Receives Meeting BaaS v2 per-bot callbacks (callback_config).
 * Events: bot.completed and bot.failed, same payload shape as account webhooks.
 *
 * On bot.completed, transcript data is not embedded — the payload includes
 * presigned URLs on data.transcription / data.raw_transcription.
 */
export async function POST(request: Request) {
  const headers = Object.fromEntries(request.headers.entries());
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  console.log(
    "[Meeting BaaS webhook]",
    JSON.stringify({ headers, payload }, null, 2),
  );

  return Response.json({ received: true }, { status: 200 });
}
