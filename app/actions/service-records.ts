"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createServiceRecordAction(
  pianoId: string,
  clientId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const amountChargedStr = formData.get("amount_charged") as string;
  const amountCharged = amountChargedStr ? parseFloat(amountChargedStr) : null;

  const { error } = await supabase.from("service_records").insert({
    piano_id: pianoId,
    date_serviced: formData.get("date_serviced") as string,
    service_type: formData.get("service_type") as string,
    technician_notes: (formData.get("technician_notes") as string) || null,
    amount_charged: isNaN(amountCharged as number) ? null : amountCharged,
    next_service_due: (formData.get("next_service_due") as string) || null,
  });

  if (error) throw error;
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
  redirect(`/clients/${clientId}`);
}

export async function updateServiceRecordAction(
  recordId: string,
  pianoId: string,
  clientId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const amountChargedStr = formData.get("amount_charged") as string;
  const amountCharged = amountChargedStr ? parseFloat(amountChargedStr) : null;

  const { error } = await supabase
    .from("service_records")
    .update({
      date_serviced: formData.get("date_serviced") as string,
      service_type: formData.get("service_type") as string,
      technician_notes: (formData.get("technician_notes") as string) || null,
      amount_charged: isNaN(amountCharged as number) ? null : amountCharged,
      next_service_due: (formData.get("next_service_due") as string) || null,
    })
    .eq("id", recordId);

  if (error) throw error;
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
  redirect(`/clients/${clientId}`);
}

export async function deleteServiceRecordAction(
  recordId: string,
  clientId: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_records")
    .delete()
    .eq("id", recordId);
  if (error) throw error;
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
  redirect(`/clients/${clientId}`);
}
