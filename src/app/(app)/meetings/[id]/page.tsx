import type { Metadata } from "next";
import MeetingReviewClient from "./MeetingReviewClient";

export const metadata: Metadata = {
  title: "Review Meeting Extraction — Bespken",
  description: "Review and edit AI-extracted client proposal details from your call.",
};

export default async function MeetingReviewPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return <MeetingReviewClient meetingId={id} />;
}
