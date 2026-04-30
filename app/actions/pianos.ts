"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { PianoStyle } from "@/lib/supabase/types";

export async function createPianoAction(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("pianos").insert({
    client_id: clientId,
    style: (formData.get("style") as PianoStyle) || null,
    brand: (formData.get("brand") as string) || null,
    model: (formData.get("model") as string) || null,
    serial_number: (formData.get("serial_number") as string) || null,
    year_manufactured: formData.get("year_manufactured")
      ? parseInt(formData.get("year_manufactured") as string)
      : null,
    notes: (formData.get("notes") as string) || null,
  });

  if (error) throw error;
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function updatePianoAction(
  pianoId: string,
  clientId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("pianos")
    .update({
      style: (formData.get("style") as PianoStyle) || null,
      brand: (formData.get("brand") as string) || null,
      model: (formData.get("model") as string) || null,
      serial_number: (formData.get("serial_number") as string) || null,
      year_manufactured: formData.get("year_manufactured")
        ? parseInt(formData.get("year_manufactured") as string)
        : null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", pianoId);

  if (error) throw error;
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function deletePianoAction(pianoId: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pianos").delete().eq("id", pianoId);
  if (error) throw error;
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}
