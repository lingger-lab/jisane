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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      client: {
        Row: {
          auth_user_id: string | null
          ceo_name: string | null
          company: string | null
          contact: string | null
          created_at: string
          email: string
          id: string
          industry: string | null
          provider: Database["public"]["Enums"]["auth_provider"] | null
          region: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          ceo_name?: string | null
          company?: string | null
          contact?: string | null
          created_at?: string
          email: string
          id?: string
          industry?: string | null
          provider?: Database["public"]["Enums"]["auth_provider"] | null
          region?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          ceo_name?: string | null
          company?: string | null
          contact?: string | null
          created_at?: string
          email?: string
          id?: string
          industry?: string | null
          provider?: Database["public"]["Enums"]["auth_provider"] | null
          region?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Relationships: []
      }
      deal: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          match_fee: number
          matching_id: string | null
          partner_id: string | null
          request_id: string | null
          scope: string | null
          status: Database["public"]["Enums"]["deal_status"]
          total_pay: number
          updated_at: string
          work_fee: number
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          match_fee: number
          matching_id?: string | null
          partner_id?: string | null
          request_id?: string | null
          scope?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          total_pay: number
          updated_at?: string
          work_fee: number
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          match_fee?: number
          matching_id?: string | null
          partner_id?: string | null
          request_id?: string | null
          scope?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          total_pay?: number
          updated_at?: string
          work_fee?: number
        }
        Relationships: [
          {
            foreignKeyName: "deal_matching_id_fkey"
            columns: ["matching_id"]
            isOneToOne: true
            referencedRelation: "matching"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_workflow: {
        Row: {
          created_at: string
          deal_id: string
          done_at: string | null
          id: string
          note: string | null
          status: Database["public"]["Enums"]["step_status"]
          step: Database["public"]["Enums"]["workflow_step"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          done_at?: string | null
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["step_status"]
          step: Database["public"]["Enums"]["workflow_step"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          done_at?: string | null
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["step_status"]
          step?: Database["public"]["Enums"]["workflow_step"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_workflow_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deal"
            referencedColumns: ["id"]
          },
        ]
      }
      guarantee_fund_ledger: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          entry_type: string
          id: string
          note: string | null
          settlement_id: string | null
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          entry_type: string
          id?: string
          note?: string | null
          settlement_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          entry_type?: string
          id?: string
          note?: string | null
          settlement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guarantee_fund_ledger_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "settlement"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry: {
        Row: {
          author_id: string | null
          author_type: Database["public"]["Enums"]["review_author"] | null
          category: string | null
          content: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["inquiry_status"]
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_type?: Database["public"]["Enums"]["review_author"] | null
          category?: string | null
          content: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_type?: Database["public"]["Enums"]["review_author"] | null
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Relationships: []
      }
      matching: {
        Row: {
          created_at: string
          id: string
          manager: Database["public"]["Enums"]["manager_name"] | null
          partner_id: string
          request_id: string
          status: Database["public"]["Enums"]["matching_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager?: Database["public"]["Enums"]["manager_name"] | null
          partner_id: string
          request_id: string
          status?: Database["public"]["Enums"]["matching_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          manager?: Database["public"]["Enums"]["manager_name"] | null
          partner_id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["matching_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matching_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matching_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
        ]
      }
      partner: {
        Row: {
          auth_user_id: string | null
          career_yrs: number | null
          contact: string | null
          created_at: string
          email: string
          field: string | null
          grade: Database["public"]["Enums"]["partner_grade"]
          id: string
          name: string | null
          provider: Database["public"]["Enums"]["auth_provider"] | null
          status: Database["public"]["Enums"]["partner_status"]
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          career_yrs?: number | null
          contact?: string | null
          created_at?: string
          email: string
          field?: string | null
          grade?: Database["public"]["Enums"]["partner_grade"]
          id?: string
          name?: string | null
          provider?: Database["public"]["Enums"]["auth_provider"] | null
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          career_yrs?: number | null
          contact?: string | null
          created_at?: string
          email?: string
          field?: string | null
          grade?: Database["public"]["Enums"]["partner_grade"]
          id?: string
          name?: string | null
          provider?: Database["public"]["Enums"]["auth_provider"] | null
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
        }
        Relationships: []
      }
      request: {
        Row: {
          budget_hope: number | null
          client_id: string
          created_at: string
          detail: string
          id: string
          req_type: string | null
          scope: string | null
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
        }
        Insert: {
          budget_hope?: number | null
          client_id: string
          created_at?: string
          detail: string
          id?: string
          req_type?: string | null
          scope?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
        }
        Update: {
          budget_hope?: number | null
          client_id?: string
          created_at?: string
          detail?: string
          id?: string
          req_type?: string | null
          scope?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
        ]
      }
      review: {
        Row: {
          author_type: Database["public"]["Enums"]["review_author"]
          comment: string | null
          created_at: string
          deal_id: string
          id: string
          internal_note: string | null
          rating: number | null
          updated_at: string
        }
        Insert: {
          author_type: Database["public"]["Enums"]["review_author"]
          comment?: string | null
          created_at?: string
          deal_id: string
          id?: string
          internal_note?: string | null
          rating?: number | null
          updated_at?: string
        }
        Update: {
          author_type?: Database["public"]["Enums"]["review_author"]
          comment?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          internal_note?: string | null
          rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deal"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement: {
        Row: {
          created_at: string
          deal_id: string
          deposited_at: string | null
          escrow_status: Database["public"]["Enums"]["escrow_status"]
          guarantee_fee: number
          id: string
          payment_key: string | null
          refund_reason: string | null
          refunded_amt: number
          refunded_at: string | null
          released_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          deposited_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          guarantee_fee?: number
          id?: string
          payment_key?: string | null
          refund_reason?: string | null
          refunded_amt?: number
          refunded_at?: string | null
          released_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          deposited_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          guarantee_fee?: number
          id?: string
          payment_key?: string | null
          refund_reason?: string | null
          refunded_amt?: number
          refunded_at?: string | null
          released_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deal"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_interest: {
        Row: {
          id: string
          request_id: string
          partner_id: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          partner_id: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          partner_id?: string
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_interest_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_interest_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_message: {
        Row: {
          id: string
          deal_id: string
          sender_type: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          sender_type: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          sender_type?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_message_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deal"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order: {
        Row: {
          id: string
          client_id: string | null
          partner_id: string | null
          category: Database["public"]["Enums"]["service_category"]
          package_slug: string
          package_name: string
          price: number
          status: Database["public"]["Enums"]["order_status"]
          detail: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          partner_id?: string | null
          category: Database["public"]["Enums"]["service_category"]
          package_slug: string
          package_name: string
          price: number
          status?: Database["public"]["Enums"]["order_status"]
          detail?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          partner_id?: string | null
          category?: Database["public"]["Enums"]["service_category"]
          package_slug?: string
          package_name?: string
          price?: number
          status?: Database["public"]["Enums"]["order_status"]
          detail?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner"
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
      auth_provider: "google" | "kakao" | "naver"
      client_status: "active" | "inactive"
      deal_status: "quoted" | "working" | "done"
      escrow_status:
        | "pending"
        | "deposited"
        | "reviewing"
        | "released"
        | "refunded"
      inquiry_status: "open" | "ai_answered" | "human_routed" | "closed"
      manager_name: "park" | "brad" | "kim"
      matching_status: "proposed" | "accepted" | "rejected"
      partner_grade: "veteran" | "standard" | "new"
      partner_status: "active" | "waiting" | "suspended"
      request_status: "open" | "matching" | "dealt" | "closed"
      review_author: "client" | "partner" | "gyeotae"
      step_status: "pending" | "in_progress" | "done"
      order_status: "pending" | "paid" | "processing" | "completed" | "cancelled"
      service_category: "ax_consulting" | "biz_consulting" | "education"
      workflow_step: "intake" | "structure" | "generate" | "verify" | "deliver"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      auth_provider: ["google", "kakao", "naver"],
      client_status: ["active", "inactive"],
      deal_status: ["quoted", "working", "done"],
      escrow_status: [
        "pending",
        "deposited",
        "reviewing",
        "released",
        "refunded",
      ],
      inquiry_status: ["open", "ai_answered", "human_routed", "closed"],
      manager_name: ["park", "brad", "kim"],
      matching_status: ["proposed", "accepted", "rejected"],
      partner_grade: ["veteran", "standard", "new"],
      partner_status: ["active", "waiting", "suspended"],
      request_status: ["open", "matching", "dealt", "closed"],
      review_author: ["client", "partner", "gyeotae"],
      step_status: ["pending", "in_progress", "done"],
      workflow_step: ["intake", "structure", "generate", "verify", "deliver"],
    },
  },
} as const
