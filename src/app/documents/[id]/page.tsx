import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import DocumentPreviewClient from "./DocumentPreviewClient";

export const metadata: Metadata = {
  title: "Proposal — Bespken",
};

export default async function DocumentPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/dashboard");
  }

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, meeting_id, type, title, content_html")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !document) {
    notFound();
  }

  return <DocumentPreviewClient document={document} />;
}
