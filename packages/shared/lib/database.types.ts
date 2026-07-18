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
      category: {
        Row: {
          created_at: string
          depth: number
          id: string
          label: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          depth?: number
          id?: string
          label: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          depth?: number
          id?: string
          label?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      deal: {
        Row: {
          auto_processed: boolean
          audit_sampled: boolean
          created_at: string
          due_date: string | null
          expert_id: string | null
          id: string
          invitation_id: string | null
          match_fee: number
          matching_id: string | null
          queue_status: Database["public"]["Enums"]["queue_status"]
          request_id: string | null
          scope: string | null
          status: Database["public"]["Enums"]["deal_status"]
          total_pay: number
          updated_at: string
          work_fee: number
        }
        Insert: {
          auto_processed?: boolean
          audit_sampled?: boolean
          created_at?: string
          due_date?: string | null
          expert_id?: string | null
          id?: string
          invitation_id?: string | null
          match_fee: number
          matching_id?: string | null
          queue_status?: Database["public"]["Enums"]["queue_status"]
          request_id?: string | null
          scope?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          total_pay: number
          updated_at?: string
          work_fee: number
        }
        Update: {
          auto_processed?: boolean
          audit_sampled?: boolean
          created_at?: string
          due_date?: string | null
          expert_id?: string | null
          id?: string
          invitation_id?: string | null
          match_fee?: number
          matching_id?: string | null
          queue_status?: Database["public"]["Enums"]["queue_status"]
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
            foreignKeyName: "deal_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_deal_invitation"
            columns: ["invitation_id"]
            isOneToOne: true
            referencedRelation: "invitation"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_message: {
        Row: {
          content: string
          created_at: string
          deal_id: string
          id: string
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
        }
        Insert: {
          content: string
          created_at?: string
          deal_id: string
          id?: string
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
        }
        Update: {
          content?: string
          created_at?: string
          deal_id?: string
          id?: string
          sender_id?: string
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
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
      dispute: {
        Row: {
          created_at: string
          id: string
          raised_by: Database["public"]["Enums"]["review_author"]
          reason: string
          status: Database["public"]["Enums"]["dispute_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["dispute_target_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          raised_by: Database["public"]["Enums"]["review_author"]
          reason: string
          status?: Database["public"]["Enums"]["dispute_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["dispute_target_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          raised_by?: Database["public"]["Enums"]["review_author"]
          reason?: string
          status?: Database["public"]["Enums"]["dispute_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["dispute_target_type"]
          updated_at?: string
        }
        Relationships: []
      }
      expert: {
        Row: {
          activity_points: number
          auth_user_id: string | null
          career_score: number
          career_years: number | null
          completion_score: number
          contact: string | null
          created_at: string
          email: string
          field: string | null
          grade: Database["public"]["Enums"]["expert_grade"]
          hourly_rate: number | null
          id: string
          is_newbie: boolean
          name: string | null
          provider: Database["public"]["Enums"]["auth_provider"] | null
          review_score: number
          status: Database["public"]["Enums"]["expert_status"]
          total_score: number
          updated_at: string
        }
        Insert: {
          activity_points?: number
          auth_user_id?: string | null
          career_score?: number
          career_years?: number | null
          completion_score?: number
          contact?: string | null
          created_at?: string
          email: string
          field?: string | null
          grade?: Database["public"]["Enums"]["expert_grade"]
          hourly_rate?: number | null
          id?: string
          is_newbie?: boolean
          name?: string | null
          provider?: Database["public"]["Enums"]["auth_provider"] | null
          review_score?: number
          status?: Database["public"]["Enums"]["expert_status"]
          updated_at?: string
        }
        Update: {
          activity_points?: number
          auth_user_id?: string | null
          career_score?: number
          career_years?: number | null
          completion_score?: number
          contact?: string | null
          created_at?: string
          email?: string
          field?: string | null
          grade?: Database["public"]["Enums"]["expert_grade"]
          hourly_rate?: number | null
          id?: string
          is_newbie?: boolean
          name?: string | null
          provider?: Database["public"]["Enums"]["auth_provider"] | null
          review_score?: number
          status?: Database["public"]["Enums"]["expert_status"]
          updated_at?: string
        }
        Relationships: []
      }
      expert_activity: {
        Row: {
          approved_by: Database["public"]["Enums"]["admin_name"] | null
          created_at: string
          expert_id: string
          expires_at: string | null
          id: string
          points: number
          type: Database["public"]["Enums"]["expert_activity_type"]
        }
        Insert: {
          approved_by?: Database["public"]["Enums"]["admin_name"] | null
          created_at?: string
          expert_id: string
          expires_at?: string | null
          id?: string
          points?: number
          type: Database["public"]["Enums"]["expert_activity_type"]
        }
        Update: {
          approved_by?: Database["public"]["Enums"]["admin_name"] | null
          created_at?: string
          expert_id?: string
          expires_at?: string | null
          id?: string
          points?: number
          type?: Database["public"]["Enums"]["expert_activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "expert_activity_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_category: {
        Row: {
          category_id: string
          expert_id: string
        }
        Insert: {
          category_id: string
          expert_id: string
        }
        Update: {
          category_id?: string
          expert_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_category_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_category_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_interest: {
        Row: {
          created_at: string
          expert_id: string
          id: string
          note: string | null
          request_id: string
        }
        Insert: {
          created_at?: string
          expert_id: string
          id?: string
          note?: string | null
          request_id: string
        }
        Update: {
          created_at?: string
          expert_id?: string
          id?: string
          note?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_interest_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_interest_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert"
            referencedColumns: ["id"]
          },
        ]
      }
      guarantee_fund_ledger: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          entry_type: Database["public"]["Enums"]["guarantee_entry_type"]
          id: string
          note: string | null
          settlement_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          entry_type: Database["public"]["Enums"]["guarantee_entry_type"]
          id?: string
          note?: string | null
          settlement_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          entry_type?: Database["public"]["Enums"]["guarantee_entry_type"]
          id?: string
          note?: string | null
          settlement_id?: string | null
          updated_at?: string
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
      invitation: {
        Row: {
          cap_amount: number | null
          created_at: string
          est_amount: number | null
          est_hours: number | null
          expert_id: string
          id: string
          owner_id: string
          request_id: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          updated_at: string
        }
        Insert: {
          cap_amount?: number | null
          created_at?: string
          est_amount?: number | null
          est_hours?: number | null
          expert_id: string
          id?: string
          owner_id: string
          request_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
        }
        Update: {
          cap_amount?: number | null
          created_at?: string
          est_amount?: number | null
          est_hours?: number | null
          expert_id?: string
          id?: string
          owner_id?: string
          request_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
        ]
      }
      matching: {
        Row: {
          created_at: string
          expert_id: string
          id: string
          manager: Database["public"]["Enums"]["admin_name"] | null
          request_id: string
          status: Database["public"]["Enums"]["matching_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          expert_id: string
          id?: string
          manager?: Database["public"]["Enums"]["admin_name"] | null
          request_id: string
          status?: Database["public"]["Enums"]["matching_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          expert_id?: string
          id?: string
          manager?: Database["public"]["Enums"]["admin_name"] | null
          request_id?: string
          status?: Database["public"]["Enums"]["matching_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matching_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert"
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
      matching_candidate: {
        Row: {
          auto_assign_at: string | null
          created_at: string
          expert_id: string
          id: string
          rank: number
          request_id: string
          score: number
          score_detail: Json | null
          status: Database["public"]["Enums"]["matching_candidate_status"]
          updated_at: string
        }
        Insert: {
          auto_assign_at?: string | null
          created_at?: string
          expert_id: string
          id?: string
          rank: number
          request_id: string
          score?: number
          score_detail?: Json | null
          status?: Database["public"]["Enums"]["matching_candidate_status"]
          updated_at?: string
        }
        Update: {
          auto_assign_at?: string | null
          created_at?: string
          expert_id?: string
          id?: string
          rank?: number
          request_id?: string
          score?: number
          score_detail?: Json | null
          status?: Database["public"]["Enums"]["matching_candidate_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matching_candidate_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matching_candidate_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert"
            referencedColumns: ["id"]
          },
        ]
      }
      owner: {
        Row: {
          auth_user_id: string | null
          ceo_name: string | null
          company: string | null
          completed_deals: number
          contact: string | null
          created_at: string
          email: string
          id: string
          industry: string | null
          provider: Database["public"]["Enums"]["auth_provider"] | null
          region: string | null
          status: Database["public"]["Enums"]["owner_status"]
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          ceo_name?: string | null
          company?: string | null
          completed_deals?: number
          contact?: string | null
          created_at?: string
          email: string
          id?: string
          industry?: string | null
          provider?: Database["public"]["Enums"]["auth_provider"] | null
          region?: string | null
          status?: Database["public"]["Enums"]["owner_status"]
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          ceo_name?: string | null
          company?: string | null
          completed_deals?: number
          contact?: string | null
          created_at?: string
          email?: string
          id?: string
          industry?: string | null
          provider?: Database["public"]["Enums"]["auth_provider"] | null
          region?: string | null
          status?: Database["public"]["Enums"]["owner_status"]
          updated_at?: string
        }
        Relationships: []
      }
      platform_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      provider: {
        Row: {
          created_at: string
          id: string
          logo: string | null
          name: string
          type: Database["public"]["Enums"]["provider_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo?: string | null
          name: string
          type: Database["public"]["Enums"]["provider_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo?: string | null
          name?: string
          type?: Database["public"]["Enums"]["provider_type"]
          updated_at?: string
        }
        Relationships: []
      }
      request: {
        Row: {
          budget_hope: number | null
          category_id: string | null
          created_at: string
          detail: string
          id: string
          owner_id: string
          req_type: string | null
          scope: string | null
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
        }
        Insert: {
          budget_hope?: number | null
          category_id?: string | null
          created_at?: string
          detail: string
          id?: string
          owner_id: string
          req_type?: string | null
          scope?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
        }
        Update: {
          budget_hope?: number | null
          category_id?: string | null
          created_at?: string
          detail?: string
          id?: string
          owner_id?: string
          req_type?: string | null
          scope?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      review: {
        Row: {
          audit_sampled: boolean
          auto_processed: boolean
          author_type: Database["public"]["Enums"]["review_author"]
          comment: string | null
          created_at: string
          deal_id: string
          expert_id: string | null
          id: string
          internal_note: string | null
          process_rating: number | null
          queue_status: Database["public"]["Enums"]["queue_status"]
          rating: number | null
          response_rating: number | null
          result_rating: number | null
          updated_at: string
        }
        Insert: {
          audit_sampled?: boolean
          auto_processed?: boolean
          author_type: Database["public"]["Enums"]["review_author"]
          comment?: string | null
          created_at?: string
          deal_id: string
          expert_id?: string | null
          id?: string
          internal_note?: string | null
          process_rating?: number | null
          queue_status?: Database["public"]["Enums"]["queue_status"]
          rating?: number | null
          response_rating?: number | null
          result_rating?: number | null
          updated_at?: string
        }
        Update: {
          audit_sampled?: boolean
          auto_processed?: boolean
          author_type?: Database["public"]["Enums"]["review_author"]
          comment?: string | null
          created_at?: string
          deal_id?: string
          expert_id?: string | null
          id?: string
          internal_note?: string | null
          process_rating?: number | null
          queue_status?: Database["public"]["Enums"]["queue_status"]
          rating?: number | null
          response_rating?: number | null
          result_rating?: number | null
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
          {
            foreignKeyName: "review_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert"
            referencedColumns: ["id"]
          },
        ]
      }
      review_ai_suggestion: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          overall_rating: number
          process_rating: number
          reasoning: string | null
          response_rating: number
          result_rating: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          overall_rating: number
          process_rating: number
          reasoning?: string | null
          response_rating: number
          result_rating: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          overall_rating?: number
          process_rating?: number
          reasoning?: string | null
          response_rating?: number
          result_rating?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_ai_suggestion_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deal"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          created_at: string
          detail: string | null
          expert_id: string | null
          id: string
          is_free: boolean
          owner_id: string | null
          package_name: string
          package_slug: string
          price: number
          provider_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          created_at?: string
          detail?: string | null
          expert_id?: string | null
          id?: string
          is_free?: boolean
          owner_id?: string | null
          package_name: string
          package_slug: string
          price: number
          provider_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string
          detail?: string | null
          expert_id?: string | null
          id?: string
          is_free?: boolean
          owner_id?: string | null
          package_name?: string
          package_slug?: string
          price?: number
          provider_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement: {
        Row: {
          audit_sampled: boolean
          auto_processed: boolean
          created_at: string
          deal_id: string
          deposited_at: string | null
          escrow_status: Database["public"]["Enums"]["escrow_status"]
          guarantee_fee: number
          id: string
          payment_key: string | null
          queue_status: Database["public"]["Enums"]["queue_status"]
          refund_reason: string | null
          refunded_amt: number
          refunded_at: string | null
          released_at: string | null
          updated_at: string
        }
        Insert: {
          audit_sampled?: boolean
          auto_processed?: boolean
          created_at?: string
          deal_id: string
          deposited_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          guarantee_fee?: number
          id?: string
          payment_key?: string | null
          queue_status?: Database["public"]["Enums"]["queue_status"]
          refund_reason?: string | null
          refunded_amt?: number
          refunded_at?: string | null
          released_at?: string | null
          updated_at?: string
        }
        Update: {
          audit_sampled?: boolean
          auto_processed?: boolean
          created_at?: string
          deal_id?: string
          deposited_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          guarantee_fee?: number
          id?: string
          payment_key?: string | null
          queue_status?: Database["public"]["Enums"]["queue_status"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      admin_name: "park" | "brad" | "kim"
      auth_provider: "google" | "kakao" | "naver"
      deal_status: "quoted" | "working" | "done"
      dispute_status: "open" | "resolved"
      dispute_target_type: "review" | "settlement"
      escrow_status:
        | "pending"
        | "deposited"
        | "reviewing"
        | "released"
        | "refunded"
      expert_activity_type: "band_join" | "post"
      expert_grade: "veteran" | "standard" | "new"
      expert_status: "active" | "waiting" | "suspended"
      guarantee_entry_type: "accrual" | "release" | "refund" | "newbie_guarantee"
      inquiry_status: "open" | "ai_answered" | "human_routed" | "closed"
      invitation_status: "invited" | "accepted" | "declined"
      matching_candidate_status: "pending" | "selected" | "skipped"
      matching_status: "proposed" | "accepted" | "rejected"
      message_sender_type: "owner" | "expert" | "admin"
      order_status: "pending" | "paid" | "processing" | "completed" | "cancelled"
      owner_status: "active" | "inactive"
      provider_type: "consulting" | "legal" | "tax" | "accounting" | "insurance"
      queue_status: "auto_passed" | "pending_review" | "audited"
      request_status: "open" | "matching" | "dealt" | "closed"
      review_author: "owner" | "expert" | "admin"
      service_category: "ax_consulting" | "biz_consulting" | "education"
      step_status: "pending" | "in_progress" | "done"
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
      admin_name: ["park", "brad", "kim"],
      auth_provider: ["google", "kakao", "naver"],
      deal_status: ["quoted", "working", "done"],
      dispute_status: ["open", "resolved"],
      dispute_target_type: ["review", "settlement"],
      escrow_status: [
        "pending",
        "deposited",
        "reviewing",
        "released",
        "refunded",
      ],
      expert_activity_type: ["band_join", "post"],
      expert_grade: ["veteran", "standard", "new"],
      expert_status: ["active", "waiting", "suspended"],
      guarantee_entry_type: ["accrual", "release", "refund", "newbie_guarantee"],
      inquiry_status: ["open", "ai_answered", "human_routed", "closed"],
      invitation_status: ["invited", "accepted", "declined"],
      matching_candidate_status: ["pending", "selected", "skipped"],
      matching_status: ["proposed", "accepted", "rejected"],
      message_sender_type: ["owner", "expert", "admin"],
      order_status: ["pending", "paid", "processing", "completed", "cancelled"],
      owner_status: ["active", "inactive"],
      provider_type: ["consulting", "legal", "tax", "accounting", "insurance"],
      queue_status: ["auto_passed", "pending_review", "audited"],
      request_status: ["open", "matching", "dealt", "closed"],
      review_author: ["owner", "expert", "admin"],
      service_category: ["ax_consulting", "biz_consulting", "education"],
      step_status: ["pending", "in_progress", "done"],
      workflow_step: ["intake", "structure", "generate", "verify", "deliver"],
    },
  },
} as const
