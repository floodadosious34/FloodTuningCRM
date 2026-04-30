"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markRemindedAction(clientId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("reminders").insert({
    client_id: clientId,
    reminded_at: new Date().toISOString(),
  });

  if (error) throw error;
  revalidatePath("/reminders");
  revalidatePath("/");
}
