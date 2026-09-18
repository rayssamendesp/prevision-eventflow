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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      events: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string | null
          event_date: string | null
          external_contact_email: string | null
          external_contact_name: string | null
          external_contact_phone: string | null
          id: string
          important_link: string | null
          investment_value: number | null
          location: string | null
          name: string
          notes: string | null
          prevision_attendees: string[]
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          event_date?: string | null
          external_contact_email?: string | null
          external_contact_name?: string | null
          external_contact_phone?: string | null
          id?: string
          important_link?: string | null
          investment_value?: number | null
          location?: string | null
          name: string
          notes?: string | null
          prevision_attendees?: string[]
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          event_date?: string | null
          external_contact_email?: string | null
          external_contact_name?: string | null
          external_contact_phone?: string | null
          id?: string
          important_link?: string | null
          investment_value?: number | null
          location?: string | null
          name?: string
          notes?: string | null
          prevision_attendees?: string[]
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Relationships: []
      }
      roi_events: {
        Row: {
          created_at: string
          event_date: string | null
          id: string
          kind: string
          mqls_evolved: number
          name: string
          notes: string | null
          sponsored_event_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_date?: string | null
          id?: string
          kind: string
          mqls_evolved?: number
          name: string
          notes?: string | null
          sponsored_event_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_date?: string | null
          id?: string
          kind?: string
          mqls_evolved?: number
          name?: string
          notes?: string | null
          sponsored_event_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roi_events_sponsored_event_id_fkey"
            columns: ["sponsored_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      roi_financial_entries: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          direction: string
          id: string
          roi_event_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          description?: string | null
          direction: string
          id?: string
          roi_event_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          direction?: string
          id?: string
          roi_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roi_financial_entries_roi_event_id_fkey"
            columns: ["roi_event_id"]
            isOneToOne: false
            referencedRelation: "roi_events"
            referencedColumns: ["id"]
          },
        ]
      }
      roi_sales: {
        Row: {
          client_count: number
          client_name: string | null
          close_date: string | null
          created_at: string
          id: string
          implementation: number
          mrr: number
          mrr_year_override: number | null
          roi_event_id: string
        }
        Insert: {
          client_count?: number
          client_name?: string | null
          close_date?: string | null
          created_at?: string
          id?: string
          implementation?: number
          mrr?: number
          mrr_year_override?: number | null
          roi_event_id: string
        }
        Update: {
          client_count?: number
          client_name?: string | null
          close_date?: string | null
          created_at?: string
          id?: string
          implementation?: number
          mrr?: number
          mrr_year_override?: number | null
          roi_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roi_sales_roi_event_id_fkey"
            columns: ["roi_event_id"]
            isOneToOne: false
            referencedRelation: "roi_events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean
          created_at: string
          event_id: string
          id: string
          parent_task_id: string | null
          responsible_user_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          event_id: string
          id?: string
          parent_task_id?: string | null
          responsible_user_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          event_id?: string
          id?: string
          parent_task_id?: string | null
          responsible_user_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
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
      [_ in never]: never
    }
    Enums: {
      event_status: "mapeado" | "em_negociacao" | "confirmado" | "realizado"
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
      event_status: ["mapeado", "em_negociacao", "confirmado", "realizado"],
    },
  },
} as const
