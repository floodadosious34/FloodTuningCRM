export type PianoStyle =
  | "upright"
  | "grand"
  | "baby_grand"
  | "spinet"
  | "console"
  | "studio"
  | "other";

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Piano {
  id: string;
  client_id: string;
  style: PianoStyle | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  year_manufactured: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceRecord {
  id: string;
  piano_id: string;
  date_serviced: string;
  service_type: string;
  technician_notes: string | null;
  amount_charged: number | null;
  next_service_due: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  client_id: string;
  reminded_at: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  piano_id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  scheduled_end_time: string | null;
  service_type: string;
  notes: string | null;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: Omit<Client, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Client, "id" | "user_id" | "created_at" | "updated_at">>;
      };
      pianos: {
        Row: Piano;
        Insert: Omit<Piano, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Piano, "id" | "client_id" | "created_at" | "updated_at">>;
      };
      service_records: {
        Row: ServiceRecord;
        Insert: Omit<ServiceRecord, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ServiceRecord, "id" | "piano_id" | "created_at" | "updated_at">>;
      };
      reminders: {
        Row: Reminder;
        Insert: Omit<Reminder, "id" | "created_at">;
        Update: Partial<Omit<Reminder, "id" | "created_at">>;
      };
      appointments: {
        Row: Appointment;
        Insert: Omit<Appointment, "id" | "created_at">;
        Update: Partial<Omit<Appointment, "id" | "piano_id" | "created_at">>;
      };
    };
  };
};
