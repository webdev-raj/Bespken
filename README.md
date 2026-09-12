# Bespken

**Your next proposal writes itself.**

Bespken joins your scheduled client video calls, transcribes what matters, and drafts a ready-to-send proposal or invoice — scope, pricing, timeline — before you've even opened a new document.

🔗 **Landing page & waitlist:** [bespken.com](https://bespken.vercel.app)

---

## Status: Pre-Validation

**No product has been built yet.** This repository currently contains only the marketing landing page and waitlist. Before writing any product code (meeting bot integration, transcription, AI extraction), the plan is:

1. Get the landing page live and gauge organic interest ✅ done
2. Post publicly (dev.to, daily.dev) explicitly asking freelancers/consultants how they currently handle this problem, not just collecting waitlist signups ✅ in progress
3. Have direct conversations with real freelancers/consultants about their actual post-call workflow
4. Only proceed to building the meeting-bot product if there's a real, specific, unprompted pain point confirmed, not just polite interest

This sequencing exists because of a lesson learned on a previous project (Screenshot Vault), where weeks were spent building before real user testing revealed the core feature already existed for free in Google Photos/Files. See [Lessons Carried Over](#lessons-carried-over) below.

---

## The Problem

Freelancers, consultants, and agencies have a client call, verbally agree on scope and rough pricing, then have to manually reconstruct that conversation into a formal proposal or invoice, usually hours or days later, from memory and scattered notes. This is repetitive, easy to procrastinate on, and error-prone (misremembering a quoted price is a real, costly mistake).

Existing tools (Otter, Fireflies, Fathom) solve *transcription and summarization* — they tell you what was said. None of them produce the actual client-facing business document (a proposal, a scope of work, an invoice) as an output. That gap is what Bespken targets.

## How It Would Work

1. Connect your calendar (Google Calendar, later Outlook)
2. Bespken joins your scheduled video call as a visible, consenting participant, same transparency model as Otter/Fireflies bots, never a hidden recorder
3. The call is transcribed and passed through an AI extraction step that pulls out: client name, scope/deliverables discussed, pricing mentioned, timeline/deadlines
4. A draft proposal or invoice is generated from that structured data using the user's saved branding/template
5. The user reviews, edits, and sends, turning a 30-45 minute post-call chore into a few minutes of review

**Why video calls only, not phone or in-person:** Phone call recording carries serious per-region consent-law risk (many jurisdictions require all-party consent) and app store restrictions. In-person conversations have the same consent problems plus no clean technical entry point. Scheduled video calls (Zoom, Google Meet, Teams) have established, provider-sanctioned ways to join as a bot with visible presence, the only version of this idea that's both technically tractable and legally sound for a solo-built product.

---

## Planned Tech Stack

| Layer | Likely choice | Notes |
|---|---|---|
| Meeting bot / call joining | [Meeting BaaS](https://meetingbaas.com) or [MeetStream.ai](https://meetstream.ai) | Simple REST API, avoids building Zoom/Meet/Teams integration from scratch. Meeting BaaS supports 100+ languages, relevant given likely Hindi/English code-switching in calls. |
| Transcription | Whisper API or AssemblyAI | Often bundled with the meeting bot service's output |
| AI extraction & document drafting | Gemini or GPT API | Structured JSON extraction from a call transcript, same pattern used in Screenshot Vault |
| Frontend | Next.js + Tailwind CSS | Web-first, this is desk-based work, not a mobile use case |
| Backend / waitlist storage | Supabase | Dedicated project, separate from any other product's waitlist |
| Hosting | Vercel | |

**Not yet decided:** document export format/library (PDF generation), calendar integration approach, proposal template system, pricing model.

---

## Landing Page

The current repo/deployment is the marketing site only:

- Hero section with waitlist signup (Supabase-backed, duplicate-email handling, localStorage persistence so returning visitors see "already on the list" instead of a blank form)
- Problem/solution framing
- Comparison section against Otter/Fireflies-style tools
- Fully responsive (mobile-first fixes applied to comparison table and page container width)

### Waitlist Table Schema

```sql
create table waitlist (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  created_at timestamp with time zone default now()
);
```

---

## Estimated Costs (Pre-Build)

| Item | Estimated cost |
|---|---|
| Domain (bespken.com) | Promotional first-year rate; standard renewal after |
| Meeting bot API | Free tier for testing; per-meeting-minute cost at scale |
| Transcription | Roughly $0.006/minute (Whisper) or provider-dependent |
| AI generation calls | Similar order of magnitude to prior project's Gemini usage |
| Hosting (Vercel) | Free tier sufficient for landing page + early testing |

Unlike a fully on-device product, this has real per-use marginal cost from day one (meeting bot + transcription minutes). Pricing to end users must cover this cost with margin before scaling past free testing.

---

## Key Risks / Open Questions

- **Differentiation risk:** Otter/Fireflies/Fathom could add "generate a proposal" as a feature extension of their existing transcript pipeline at any time. The gap this relies on may be thin, not permanent.
- **Trust risk:** an AI-misextracted price or scope item sent to a client without review is a real, costly failure mode. Manual review before send must never be optional.
- **Language/accuracy risk:** target market likely includes Hindi/English code-switching during calls. Transcription and extraction accuracy under these conditions is untested and should be validated early with a real recorded call before further build investment.
- **Validation risk (the important one):** as of writing, outreach is in progress but no product has been built. Do not proceed past landing page and outreach without direct, specific, unprompted confirmation of the pain point from actual freelancers/consultants.

---

## Lessons Carried Over From Screenshot Vault

- Do not build extensively before showing the idea to real, specific target users
- One AI session (or the builder's own hunch) agreeing an idea is good is not validation
- A landing page + waitlist is a legitimate low-cost validation tool, use it as one, not as a formality before building anyway
- Watch for "productive procrastination": polishing, tooling, and setup work that feels like progress but avoids the harder step of talking to real people
- Public posts asking for direct replies/conversation are worth more signal than passive waitlist click-throughs

---

## License

MIT (or TBD)