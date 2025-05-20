export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_notes: {
        Row: {
          candidate_id: string
          content: string
          created_at: string
          id: string
          type: Database["public"]["Enums"]["note_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          candidate_id: string
          content: string
          created_at?: string
          id?: string
          type?: Database["public"]["Enums"]["note_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          candidate_id?: string
          content?: string
          created_at?: string
          id?: string
          type?: Database["public"]["Enums"]["note_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          assigned_to_clients: string[] | null
          created_at: string
          created_by: string | null
          education: Json | null
          email: string | null
          embedding: string | null
          experience: Json | null
          full_name: string | null
          id: string
          languages: string[] | null
          liked_by_clients: string[] | null
          linkedin_url: string | null
          modified_by: string | null
          objective: string | null
          other_links: string[] | null
          phone: string | null
          pipeline_stage: Database["public"]["Enums"]["pipeline_stage"] | null
          projects: Json | null
          publications: Json | null
          resume_id: string | null
          resume_summary: string | null
          resume_url: string | null
          skills: string[] | null
          social_media: Json | null
          status: Database["public"]["Enums"]["candidate_status"] | null
          updated_at: string
        }
        Insert: {
          assigned_to_clients?: string[] | null
          created_at?: string
          created_by?: string | null
          education?: Json | null
          email?: string | null
          embedding?: string | null
          experience?: Json | null
          full_name?: string | null
          id?: string
          languages?: string[] | null
          liked_by_clients?: string[] | null
          linkedin_url?: string | null
          modified_by?: string | null
          objective?: string | null
          other_links?: string[] | null
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          projects?: Json | null
          publications?: Json | null
          resume_id?: string | null
          resume_summary?: string | null
          resume_url?: string | null
          skills?: string[] | null
          social_media?: Json | null
          status?: Database["public"]["Enums"]["candidate_status"] | null
          updated_at?: string
        }
        Update: {
          assigned_to_clients?: string[] | null
          created_at?: string
          created_by?: string | null
          education?: Json | null
          email?: string | null
          embedding?: string | null
          experience?: Json | null
          full_name?: string | null
          id?: string
          languages?: string[] | null
          liked_by_clients?: string[] | null
          linkedin_url?: string | null
          modified_by?: string | null
          objective?: string | null
          other_links?: string[] | null
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          projects?: Json | null
          publications?: Json | null
          resume_id?: string | null
          resume_summary?: string | null
          resume_url?: string | null
          skills?: string[] | null
          social_media?: Json | null
          status?: Database["public"]["Enums"]["candidate_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_modified_by_fkey"
            columns: ["modified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          assigned_candidates: string[] | null
          company_name: string
          contact_person: string
          created_at: string
          created_by: string | null
          email: string
          id: string
          industry: string | null
          liked_candidates: string[] | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_candidates?: string[] | null
          company_name: string
          contact_person: string
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          industry?: string | null
          liked_candidates?: string[] | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_candidates?: string[] | null
          company_name?: string
          contact_person?: string
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          industry?: string | null
          liked_candidates?: string[] | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          candidate_id: string
          created_at: string
          duration: number
          id: string
          interview_type: string
          interviewer_id: string | null
          job_id: string
          notes: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          duration: number
          id?: string
          interview_type: string
          interviewer_id?: string | null
          job_id: string
          notes?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          duration?: number
          id?: string
          interview_type?: string
          interviewer_id?: string | null
          job_id?: string
          notes?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string
          embedding: string | null
          id: string
          job_type: Database["public"]["Enums"]["job_type"]
          location: string | null
          requirements: string[] | null
          responsibilities: string[] | null
          salary_range: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          embedding?: string | null
          id?: string
          job_type: Database["public"]["Enums"]["job_type"]
          location?: string | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_range?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          embedding?: string | null
          id?: string
          job_type?: Database["public"]["Enums"]["job_type"]
          location?: string | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_range?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_sign_in: string | null
          phone: string | null
          position: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          last_sign_in?: string | null
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_sign_in?: string | null
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      rejection_reasons: {
        Row: {
          candidate_id: string
          client_id: string
          created_at: string
          id: string
          reason: string
        }
        Insert: {
          candidate_id: string
          client_id: string
          created_at?: string
          id?: string
          reason: string
        }
        Update: {
          candidate_id?: string
          client_id?: string
          created_at?: string
          id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "rejection_reasons_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rejection_reasons_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      search_results: {
        Row: {
          candidate_ids: string[]
          created_at: string
          created_by: string | null
          id: string
          job_id: string
          scores: number[]
        }
        Insert: {
          candidate_ids: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          job_id: string
          scores: number[]
        }
        Update: {
          candidate_ids?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          job_id?: string
          scores?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "search_results_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_client: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      candidate_status: "active" | "inactive" | "blocked" | "unavailable"
      job_status: "draft" | "published" | "archived" | "closed" | "halted"
      job_type: "full-time" | "part-time" | "contract" | "freelance" | "remote"
      note_type: "general" | "interview" | "feedback" | "rejection" | "other"
      pipeline_stage:
        | "new_candidate"
        | "screening"
        | "interview"
        | "offer"
        | "hired"
        | "rejected"
      user_role: "admin" | "staff" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      candidate_status: ["active", "inactive", "blocked", "unavailable"],
      job_status: ["draft", "published", "archived", "closed", "halted"],
      job_type: ["full-time", "part-time", "contract", "freelance", "remote"],
      note_type: ["general", "interview", "feedback", "rejection", "other"],
      pipeline_stage: [
        "new_candidate",
        "screening",
        "interview",
        "offer",
        "hired",
        "rejected",
      ],
      user_role: ["admin", "staff", "client"],
    },
  },
} as const
