export const DOCUMENT_TYPES = ["proposal"] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export type ProposalMeetingData = {
  meetingTitle: string | null;
  client: string | null;
  scope: string | null;
  price: string | null;
  timeline: string | null;
  notes: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function displayText(value: string | null, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }
  return escapeHtml(trimmed).replace(/\n/g, "<br />");
}

export function isDocumentType(value: unknown): value is DocumentType {
  return typeof value === "string" && DOCUMENT_TYPES.includes(value as DocumentType);
}

export function generateDocumentHtml(
  type: DocumentType,
  data: ProposalMeetingData,
): { title: string; html: string } {
  switch (type) {
    case "proposal":
      return {
        title: proposalTitle(data),
        html: generateProposalHtml(data),
      };
    default: {
      const exhaustive: never = type;
      throw new Error(`Unsupported document type: ${String(exhaustive)}`);
    }
  }
}

function proposalTitle(data: ProposalMeetingData): string {
  const client = data.client?.trim();
  if (client) {
    return `Proposal — ${client}`;
  }
  const meeting = data.meetingTitle?.trim();
  if (meeting) {
    return `Proposal — ${meeting}`;
  }
  return "Project Proposal";
}

/**
 * Self-contained proposal HTML with inline styles for later PDF conversion.
 * Add generateInvoiceHtml() and a new DOCUMENT_TYPES value when invoices ship.
 */
export function generateProposalHtml(meetingData: ProposalMeetingData): string {
  const title = proposalTitle(meetingData);
  const issued = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const client = displayText(meetingData.client, "Client name to be confirmed");
  const scope = displayText(
    meetingData.scope,
    "Scope of work to be confirmed with the client.",
  );
  const price = displayText(
    meetingData.price,
    "Pricing to be confirmed with the client.",
  );
  const timeline = displayText(
    meetingData.timeline,
    "Timeline to be confirmed with the client.",
  );
  const notes = meetingData.notes?.trim()
    ? `<section style="margin-bottom:32px;">
        <h2 style="margin:0 0 12px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#78716c;font-weight:normal;">Notes</h2>
        <p style="margin:0;font-size:15px;line-height:1.7;">${displayText(meetingData.notes, "")}</p>
      </section>`
    : "";

  const projectLabel = meetingData.meetingTitle?.trim()
    ? escapeHtml(meetingData.meetingTitle.trim())
    : "Project";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;color:#1c1917;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:720px;margin:0 auto;padding:56px 48px 64px;box-sizing:border-box;">
    <header style="border-bottom:2px solid #1c1917;padding-bottom:24px;margin-bottom:36px;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#78716c;">Proposal</p>
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:normal;line-height:1.25;">${escapeHtml(title)}</h1>
      <p style="margin:0;font-size:14px;color:#44403c;">Prepared by <strong>Your Name/Business</strong></p>
      <p style="margin:8px 0 0;font-size:13px;color:#78716c;">Issued ${escapeHtml(issued)} · Prepared for ${client}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#78716c;">Regarding: ${projectLabel}</p>
    </header>

    <section style="margin-bottom:32px;">
      <h2 style="margin:0 0 12px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#78716c;font-weight:normal;">Prepared for</h2>
      <p style="margin:0;font-size:16px;line-height:1.6;">${client}</p>
    </section>

    <section style="margin-bottom:32px;">
      <h2 style="margin:0 0 12px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#78716c;font-weight:normal;">Scope of Work</h2>
      <p style="margin:0;font-size:15px;line-height:1.7;">${scope}</p>
    </section>

    <section style="margin-bottom:32px;">
      <h2 style="margin:0 0 12px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#78716c;font-weight:normal;">Pricing</h2>
      <p style="margin:0;font-size:15px;line-height:1.7;">${price}</p>
    </section>

    <section style="margin-bottom:32px;">
      <h2 style="margin:0 0 12px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#78716c;font-weight:normal;">Timeline</h2>
      <p style="margin:0;font-size:15px;line-height:1.7;">${timeline}</p>
    </section>

    ${notes}

    <section style="margin-top:40px;padding-top:24px;border-top:1px solid #e7e5e4;">
      <h2 style="margin:0 0 12px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#78716c;font-weight:normal;">Terms</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#44403c;">
        This proposal is valid for 14 days. A 50% deposit is required to begin work.
        Remaining balance is due upon delivery of the agreed scope unless otherwise specified in writing.
      </p>
    </section>

    <footer style="margin-top:48px;font-size:12px;color:#a8a29e;">
      <p style="margin:0;">Generated with Bespken. Please confirm all details before sending to your client.</p>
    </footer>
  </div>
</body>
</html>`;
}
