export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          city: string | null
          created_at: string
          email: string
          id: string
          invite_token: string | null
          name: string
          reason: string | null
          role: string
          status: string
          token_expires_at: string | null
          token_used_at: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          created_at?: string
          email: string
          id?: string
          invite_token?: string | null
          name: string
          reason?: string | null
          role: string
          status?: string
          token_expires_at?: string | null
          token_used_at?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          invite_token?: string | null
          name?: string
          reason?: string | null
          role?: string
          status?: string
          token_expires_at?: string | null
          token_used_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          created_at: string
          function_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          doctor_id: string
          doctor_notes: string | null
          id: string
          patient_id: string
          patient_phone: string
          reason: string | null
          requested_date: string
          requested_time_slot: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          doctor_notes?: string | null
          id?: string
          patient_id: string
          patient_phone: string
          reason?: string | null
          requested_date: string
          requested_time_slot: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          doctor_notes?: string | null
          id?: string
          patient_id?: string
          patient_phone?: string
          reason?: string | null
          requested_date?: string
          requested_time_slot?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          audio_transcription: string
          created_at: string
          doctor_id: string
          fhir_data: string
          id: string
          is_archived: boolean
          patient_age: number
          patient_name: string
          patient_national_health_id: string
          updated_at: string
        }
        Insert: {
          audio_transcription: string
          created_at?: string
          doctor_id: string
          fhir_data: string
          id?: string
          is_archived?: boolean
          patient_age: number
          patient_name: string
          patient_national_health_id: string
          updated_at?: string
        }
        Update: {
          audio_transcription?: string
          created_at?: string
          doctor_id?: string
          fhir_data?: string
          id?: string
          is_archived?: boolean
          patient_age?: number
          patient_name?: string
          patient_national_health_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      doctor_profiles: {
        Row: {
          appointment_duration_minutes: number | null
          availability_days: string[] | null
          availability_end_time: string | null
          availability_start_time: string | null
          city: string | null
          clinic_address: string | null
          clinic_name: string | null
          created_at: string | null
          full_name: string
          id: string
          is_profile_complete: boolean | null
          latitude: number | null
          longitude: number | null
          max_appointments_per_day: number | null
          medical_license_number: string | null
          phone: string | null
          pincode: string | null
          qualification: string | null
          specialization: string | null
          updated_at: string | null
          user_id: string
          years_of_experience: number | null
        }
        Insert: {
          appointment_duration_minutes?: number | null
          availability_days?: string[] | null
          availability_end_time?: string | null
          availability_start_time?: string | null
          city?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          is_profile_complete?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_appointments_per_day?: number | null
          medical_license_number?: string | null
          phone?: string | null
          pincode?: string | null
          qualification?: string | null
          specialization?: string | null
          updated_at?: string | null
          user_id: string
          years_of_experience?: number | null
        }
        Update: {
          appointment_duration_minutes?: number | null
          availability_days?: string[] | null
          availability_end_time?: string | null
          availability_start_time?: string | null
          city?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_profile_complete?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_appointments_per_day?: number | null
          medical_license_number?: string | null
          phone?: string | null
          pincode?: string | null
          qualification?: string | null
          specialization?: string | null
          updated_at?: string | null
          user_id?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      doctor_ratings: {
        Row: {
          appointment_id: string
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
          rating: number
          review: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string
          doctor_id: string
          id?: string
          patient_id: string
          rating: number
          review?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
          rating?: number
          review?: string | null
        }
        Relationships: []
      }
      doctor_visit_prep: {
        Row: {
          created_at: string
          date_range_end: string | null
          date_range_start: string | null
          id: string
          patient_id: string
          questions_for_doctor: Json
          related_medications: Json
          related_symptoms: Json
          summary: string
        }
        Insert: {
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          id?: string
          patient_id: string
          questions_for_doctor?: Json
          related_medications?: Json
          related_symptoms?: Json
          summary: string
        }
        Update: {
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          id?: string
          patient_id?: string
          questions_for_doctor?: Json
          related_medications?: Json
          related_symptoms?: Json
          summary?: string
        }
        Relationships: []
      }
      early_access_signups: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          preferred_language: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          preferred_language: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          preferred_language?: string
          role?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      emergency_access_logs: {
        Row: {
          accessed_at: string
          emergency_contact_id: string
          id: string
          ip_address: string | null
          patient_id: string
        }
        Insert: {
          accessed_at?: string
          emergency_contact_id: string
          id?: string
          ip_address?: string | null
          patient_id: string
        }
        Update: {
          accessed_at?: string
          emergency_contact_id?: string
          id?: string
          ip_address?: string | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_access_logs_emergency_contact_id_fkey"
            columns: ["emergency_contact_id"]
            isOneToOne: false
            referencedRelation: "emergency_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_access_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          access_token: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          is_active: boolean
          patient_id: string
          relationship: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone: string
          created_at?: string
          id?: string
          is_active?: boolean
          patient_id: string
          relationship: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          is_active?: boolean
          patient_id?: string
          relationship?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_reminders: {
        Row: {
          consultation_id: string
          created_at: string
          doctor_id: string
          id: string
          is_sent: boolean | null
          patient_phone: string
          reminder_date: string
          reminder_message: string
        }
        Insert: {
          consultation_id: string
          created_at?: string
          doctor_id: string
          id?: string
          is_sent?: boolean | null
          patient_phone: string
          reminder_date: string
          reminder_message: string
        }
        Update: {
          consultation_id?: string
          created_at?: string
          doctor_id?: string
          id?: string
          is_sent?: boolean | null
          patient_phone?: string
          reminder_date?: string
          reminder_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_reminders_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          ai_confidence: string | null
          ai_summary: string | null
          allergies: Json
          category: string
          consent_shared_with: string[] | null
          diagnoses: Json
          document_type: string | null
          extracted_vitals: Json
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          important_findings: Json
          medications: Json
          patient_id: string
          radiology_body_part: string | null
          radiology_impression: Json
          radiology_modality: string | null
          radiology_provider: string | null
          radiology_recommendations: Json
          radiology_study_date: string | null
          radiology_upload_kind: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          ai_confidence?: string | null
          ai_summary?: string | null
          allergies?: Json
          category?: string
          consent_shared_with?: string[] | null
          diagnoses?: Json
          document_type?: string | null
          extracted_vitals?: Json
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          important_findings?: Json
          medications?: Json
          patient_id: string
          radiology_body_part?: string | null
          radiology_impression?: Json
          radiology_modality?: string | null
          radiology_provider?: string | null
          radiology_recommendations?: Json
          radiology_study_date?: string | null
          radiology_upload_kind?: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          ai_confidence?: string | null
          ai_summary?: string | null
          allergies?: Json
          category?: string
          consent_shared_with?: string[] | null
          diagnoses?: Json
          document_type?: string | null
          extracted_vitals?: Json
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          important_findings?: Json
          medications?: Json
          patient_id?: string
          radiology_body_part?: string | null
          radiology_impression?: Json
          radiology_modality?: string | null
          radiology_provider?: string | null
          radiology_recommendations?: Json
          radiology_study_date?: string | null
          radiology_upload_kind?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_preferences: {
        Row: {
          auto_cadence: boolean
          cadence: string
          created_at: string
          current_streak: number
          id: string
          last_logged_date: string | null
          last_nudged_at: string | null
          longest_streak: number
          patient_id: string
          preferred_hour: number
          updated_at: string
        }
        Insert: {
          auto_cadence?: boolean
          cadence?: string
          created_at?: string
          current_streak?: number
          id?: string
          last_logged_date?: string | null
          last_nudged_at?: string | null
          longest_streak?: number
          patient_id: string
          preferred_hour?: number
          updated_at?: string
        }
        Update: {
          auto_cadence?: boolean
          cadence?: string
          created_at?: string
          current_streak?: number
          id?: string
          last_logged_date?: string | null
          last_nudged_at?: string | null
          longest_streak?: number
          patient_id?: string
          preferred_hour?: number
          updated_at?: string
        }
        Relationships: []
      }
      medication_reminders: {
        Row: {
          created_at: string
          dosage: string | null
          frequency: string
          id: string
          is_active: boolean
          medication_name: string
          notes: string | null
          patient_id: string
          source_record_id: string | null
          time_slots: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          medication_name: string
          notes?: string | null
          patient_id: string
          source_record_id?: string | null
          time_slots?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          medication_name?: string
          notes?: string | null
          patient_id?: string
          source_record_id?: string | null
          time_slots?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_reminders_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "health_records"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          age: number | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          id: string
          last_app_open_at: string | null
          latitude: number | null
          longitude: number | null
          name: string
          national_health_id: string | null
          next_visit_date: string | null
          phone: string | null
          pincode: string | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          age?: number | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          last_app_open_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          national_health_id?: string | null
          next_visit_date?: string | null
          phone?: string | null
          pincode?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          age?: number | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          last_app_open_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          national_health_id?: string | null
          next_visit_date?: string | null
          phone?: string | null
          pincode?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      shared_record_links: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_used: boolean
          patient_id: string
          recipient_email: string | null
          recipient_name: string | null
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          patient_id: string
          recipient_email?: string | null
          recipient_name?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          patient_id?: string
          recipient_email?: string | null
          recipient_name?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_record_links_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          expires_at: string
          id: string
          message: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          expires_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          expires_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      symptom_logs: {
        Row: {
          associated_symptoms: Json
          body_location: string | null
          created_at: string
          custom_symptom_name: string | null
          duration: string | null
          id: string
          logged_at: string
          medications_taken: Json
          notes: string | null
          patient_id: string
          photo_path: string | null
          severity: number
          symptom_type: string
          triggers: Json
          updated_at: string
        }
        Insert: {
          associated_symptoms?: Json
          body_location?: string | null
          created_at?: string
          custom_symptom_name?: string | null
          duration?: string | null
          id?: string
          logged_at?: string
          medications_taken?: Json
          notes?: string | null
          patient_id: string
          photo_path?: string | null
          severity: number
          symptom_type: string
          triggers?: Json
          updated_at?: string
        }
        Update: {
          associated_symptoms?: Json
          body_location?: string | null
          created_at?: string
          custom_symptom_name?: string | null
          duration?: string | null
          id?: string
          logged_at?: string
          medications_taken?: Json
          notes?: string | null
          patient_id?: string
          photo_path?: string | null
          severity?: number
          symptom_type?: string
          triggers?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vital_history: {
        Row: {
          confidence: string
          created_at: string
          health_record_id: string
          id: string
          patient_id: string
          recorded_at: string
          source_file_name: string
          vitals: Json
        }
        Insert: {
          confidence?: string
          created_at?: string
          health_record_id: string
          id?: string
          patient_id: string
          recorded_at?: string
          source_file_name: string
          vitals?: Json
        }
        Update: {
          confidence?: string
          created_at?: string
          health_record_id?: string
          id?: string
          patient_id?: string
          recorded_at?: string
          source_file_name?: string
          vitals?: Json
        }
        Relationships: [
          {
            foreignKeyName: "vital_history_health_record_id_fkey"
            columns: ["health_record_id"]
            isOneToOne: false
            referencedRelation: "health_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vital_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_support_tickets: { Args: never; Returns: undefined }
      consume_invite_token: { Args: { _token: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "doctor" | "admin" | "patient"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["doctor", "admin", "patient"],
    },
  },
} as const
