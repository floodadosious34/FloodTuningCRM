"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createAppointmentAction(
  pianoId: string,
  clientId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const { error } = await supabase.from("appointments").insert({
    piano_id: pianoId,
    scheduled_date: formData.get("scheduled_date") as string,
    scheduled_time: (formData.get("scheduled_time") as string) || null,
    scheduled_end_time: (formData.get("scheduled_end_time") as string) || null,
    service_type: formData.get("service_type") as string,
    notes: (formData.get("notes") as string) || null,
  });

  if (error) throw error;
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
  redirect(`/clients/${clientId}`);
}

export async function deleteAppointmentAction(
  appointmentId: string,
  clientId: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId);
  if (error) throw error;
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
  redirect(`/clients/${clientId}`);
}
