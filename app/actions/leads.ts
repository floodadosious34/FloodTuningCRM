"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Lead } from "@/lib/supabase/types";

export async function getLeadsAction(): Promise<Lead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("institution");
  if (error) throw error;
  return (data ?? []) as Lead[];
}

export async function markLeadEmailedAction(leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ emailed_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) throw error;
  revalidatePath("/marketing");
}

export async function updateLeadContactAction(
  leadId: string,
  email: string | null,
  phone: string | null
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ email: email || null, phone: phone || null })
    .eq("id", leadId);
  if (error) throw error;
  revalidatePath("/marketing");
}

export async function markLeadConvertedAction(leadId: string, convert: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ converted_at: convert ? new Date().toISOString() : null })
    .eq("id", leadId);
  if (error) throw error;
  revalidatePath("/marketing");
  revalidatePath("/marketing/dashboard");
}

export async function deleteLeadsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { error } = await supabase.from("leads").delete().eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/marketing");
}
