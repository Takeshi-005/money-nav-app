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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_evaluations: {
        Row: {
          created_at: string | null
          error_type: string
          evaluator_model: string
          failing_quiz_indices: number[] | null
          feedback_for_retry: string | null
          generation_id: string
          id: string
          is_valid: boolean
          scores: Json
          thought: string | null
        }
        Insert: {
          created_at?: string | null
          error_type: string
          evaluator_model: string
          failing_quiz_indices?: number[] | null
          feedback_for_retry?: string | null
          generation_id: string
          id?: string
          is_valid: boolean
          scores: Json
          thought?: string | null
        }
        Update: {
          created_at?: string | null
          error_type?: string
          evaluator_model?: string
          failing_quiz_indices?: number[] | null
          feedback_for_retry?: string | null
          generation_id?: string
          id?: string
          is_valid?: boolean
          scores?: Json
          thought?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_evaluations_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "ai_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generations: {
        Row: {
          attempt_number: number
          content_type: string
          created_at: string | null
          difficulty: string
          duration_ms: number | null
          error_message: string | null
          generation_date: string
          id: string
          input_context: Json
          model: string
          output_content: Json | null
          prompt_version: string
          status: string
        }
        Insert: {
          attempt_number?: number
          content_type?: string
          created_at?: string | null
          difficulty?: string
          duration_ms?: number | null
          error_message?: string | null
          generation_date: string
          id?: string
          input_context: Json
          model: string
          output_content?: Json | null
          prompt_version: string
          status: string
        }
        Update: {
          attempt_number?: number
          content_type?: string
          created_at?: string | null
          difficulty?: string
          duration_ms?: number | null
          error_message?: string | null
          generation_date?: string
          id?: string
          input_context?: Json
          model?: string
          output_content?: Json | null
          prompt_version?: string
          status?: string
        }
        Relationships: []
      }
      comic_strips: {
        Row: {
          created_at: string | null
          educational_concept: string
          emotional_core: string
          episode_no: number
          id: string
          image_alt: string
          image_path: string
          is_published: boolean
          panels: Json
          pattern: string
          published_at: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          seo_updated_at: string | null
          seo_updated_by: string | null
          slug: string
          theme: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          educational_concept: string
          emotional_core: string
          episode_no: number
          id?: string
          image_alt: string
          image_path: string
          is_published?: boolean
          panels: Json
          pattern: string
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          seo_updated_at?: string | null
          seo_updated_by?: string | null
          slug: string
          theme: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          educational_concept?: string
          emotional_core?: string
          episode_no?: number
          id?: string
          image_alt?: string
          image_path?: string
          is_published?: boolean
          panels?: Json
          pattern?: string
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          seo_updated_at?: string | null
          seo_updated_by?: string | null
          slug?: string
          theme?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_quizzes: {
        Row: {
          content: Json
          created_at: string
          date: string
          is_published: boolean
        }
        Insert: {
          content: Json
          created_at?: string
          date: string
          is_published?: boolean
        }
        Update: {
          content?: Json
          created_at?: string
          date?: string
          is_published?: boolean
        }
        Relationships: []
      }
      diagnosis_cache: {
        Row: {
          ai_result: Json
          answer_key: string
          created_at: string | null
        }
        Insert: {
          ai_result: Json
          answer_key: string
          created_at?: string | null
        }
        Update: {
          ai_result?: Json
          answer_key?: string
          created_at?: string | null
        }
        Relationships: []
      }
      diagnostics: {
        Row: {
          ai_result: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_result: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_result?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disclosure_events: {
        Row: {
          company_name: string
          created_at: string
          disclosure_import_id: string
          disclosure_type: string
          id: string
          ticker_code: string
        }
        Insert: {
          company_name: string
          created_at?: string
          disclosure_import_id: string
          disclosure_type: string
          id?: string
          ticker_code: string
        }
        Update: {
          company_name?: string
          created_at?: string
          disclosure_import_id?: string
          disclosure_type?: string
          id?: string
          ticker_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "disclosure_events_disclosure_import_id_fkey"
            columns: ["disclosure_import_id"]
            isOneToOne: false
            referencedRelation: "disclosure_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      disclosure_imports: {
        Row: {
          article_date: string
          created_at: string
          id: string
          imported_by: string | null
          raw_json: string
          source: string
          source_url: string | null
          text_hash: string
        }
        Insert: {
          article_date: string
          created_at?: string
          id?: string
          imported_by?: string | null
          raw_json: string
          source: string
          source_url?: string | null
          text_hash: string
        }
        Update: {
          article_date?: string
          created_at?: string
          id?: string
          imported_by?: string | null
          raw_json?: string
          source?: string
          source_url?: string | null
          text_hash?: string
        }
        Relationships: []
      }
      glossary_terms: {
        Row: {
          category: string
          created_at: string | null
          definition: string
          difficulty: string | null
          example: string | null
          explanation: string
          id: string
          reading: string | null
          related_terms: string[] | null
          slug: string
          term: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          definition: string
          difficulty?: string | null
          example?: string | null
          explanation: string
          id?: string
          reading?: string | null
          related_terms?: string[] | null
          slug: string
          term: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          definition?: string
          difficulty?: string | null
          example?: string | null
          explanation?: string
          id?: string
          reading?: string | null
          related_terms?: string[] | null
          slug?: string
          term?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          article_content: Json
          created_at: string | null
          date: string
          is_published: boolean
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          seo_updated_at: string | null
          seo_updated_by: string | null
        }
        Insert: {
          article_content: Json
          created_at?: string | null
          date: string
          is_published?: boolean
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          seo_updated_at?: string | null
          seo_updated_by?: string | null
        }
        Update: {
          article_content?: Json
          created_at?: string | null
          date?: string
          is_published?: boolean
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          seo_updated_at?: string | null
          seo_updated_by?: string | null
        }
        Relationships: []
      }
      prediction_results: {
        Row: {
          actual_movement: string | null
          baseline_price: number | null
          close_price: number | null
          context_summary: string | null
          created_at: string
          date: string
          explanation: string | null
          id: string
          is_revealed: boolean
          price_change_pct: number | null
          question: string | null
        }
        Insert: {
          actual_movement?: string | null
          baseline_price?: number | null
          close_price?: number | null
          context_summary?: string | null
          created_at?: string
          date: string
          explanation?: string | null
          id?: string
          is_revealed?: boolean
          price_change_pct?: number | null
          question?: string | null
        }
        Update: {
          actual_movement?: string | null
          baseline_price?: number | null
          close_price?: number | null
          context_summary?: string | null
          created_at?: string
          date?: string
          explanation?: string | null
          id?: string
          is_revealed?: boolean
          price_change_pct?: number | null
          question?: string | null
        }
        Relationships: []
      }
      predictions: {
        Row: {
          created_at: string
          date: string
          id: string
          is_correct: boolean | null
          pnl: number | null
          prediction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_correct?: boolean | null
          pnl?: number | null
          prediction: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_correct?: boolean | null
          pnl?: number | null
          prediction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_date_fkey"
            columns: ["date"]
            isOneToOne: false
            referencedRelation: "prediction_results"
            referencedColumns: ["date"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_opened_at: string | null
          created_at: string
          display_name: string | null
          experience: number
          first_purchase_at: string | null
          id: string
          investment_style: string | null
          is_admin: boolean | null
          level: number
        }
        Insert: {
          account_opened_at?: string | null
          created_at?: string
          display_name?: string | null
          experience?: number
          first_purchase_at?: string | null
          id: string
          investment_style?: string | null
          is_admin?: boolean | null
          level?: number
        }
        Update: {
          account_opened_at?: string | null
          created_at?: string
          display_name?: string | null
          experience?: number
          first_purchase_at?: string | null
          id?: string
          investment_style?: string | null
          is_admin?: boolean | null
          level?: number
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          choice_selected: number
          created_at: string
          id: number
          is_correct: boolean
          quiz_date: string
          quiz_type: string
          user_id: string
        }
        Insert: {
          choice_selected: number
          created_at?: string
          id?: never
          is_correct: boolean
          quiz_date: string
          quiz_type?: string
          user_id: string
        }
        Update: {
          choice_selected?: number
          created_at?: string
          id?: never
          is_correct?: boolean
          quiz_date?: string
          quiz_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_date_fkey"
            columns: ["quiz_date"]
            isOneToOne: false
            referencedRelation: "daily_quizzes"
            referencedColumns: ["date"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_cache: {
        Row: {
          content: Json
          created_at: string | null
          date: string
          difficulty: string
          id: string
          is_published: boolean
        }
        Insert: {
          content: Json
          created_at?: string | null
          date: string
          difficulty: string
          id?: string
          is_published?: boolean
        }
        Update: {
          content?: Json
          created_at?: string | null
          date?: string
          difficulty?: string
          id?: string
          is_published?: boolean
        }
        Relationships: []
      }
      seo_insights: {
        Row: {
          action_completed_at: string | null
          action_taken: string | null
          baseline_metrics: Json | null
          collected_at: string
          created_at: string | null
          current_metrics: Json | null
          description: string
          followup_at: string | null
          followup_metrics: Json | null
          id: string
          improvement_summary: string | null
          insight_type: string
          priority: number
          status: string
          suggested_action: string | null
          target_page: string | null
          target_query: string | null
          title: string
        }
        Insert: {
          action_completed_at?: string | null
          action_taken?: string | null
          baseline_metrics?: Json | null
          collected_at: string
          created_at?: string | null
          current_metrics?: Json | null
          description: string
          followup_at?: string | null
          followup_metrics?: Json | null
          id?: string
          improvement_summary?: string | null
          insight_type: string
          priority?: number
          status?: string
          suggested_action?: string | null
          target_page?: string | null
          target_query?: string | null
          title: string
        }
        Update: {
          action_completed_at?: string | null
          action_taken?: string | null
          baseline_metrics?: Json | null
          collected_at?: string
          created_at?: string | null
          current_metrics?: Json | null
          description?: string
          followup_at?: string | null
          followup_metrics?: Json | null
          id?: string
          improvement_summary?: string | null
          insight_type?: string
          priority?: number
          status?: string
          suggested_action?: string | null
          target_page?: string | null
          target_query?: string | null
          title?: string
        }
        Relationships: []
      }
      seo_page_performance: {
        Row: {
          avg_engagement_time: number
          bounce_rate: number
          collected_at: string
          created_at: string | null
          date_range_end: string
          date_range_start: string
          id: string
          page_path: string
          page_views: number
          unique_users: number
        }
        Insert: {
          avg_engagement_time?: number
          bounce_rate?: number
          collected_at: string
          created_at?: string | null
          date_range_end: string
          date_range_start: string
          id?: string
          page_path: string
          page_views?: number
          unique_users?: number
        }
        Update: {
          avg_engagement_time?: number
          bounce_rate?: number
          collected_at?: string
          created_at?: string | null
          date_range_end?: string
          date_range_start?: string
          id?: string
          page_path?: string
          page_views?: number
          unique_users?: number
        }
        Relationships: []
      }
      seo_search_performance: {
        Row: {
          clicks: number
          collected_at: string
          created_at: string | null
          ctr: number
          date_range_end: string
          date_range_start: string
          id: string
          impressions: number
          page: string
          position: number
          query: string
        }
        Insert: {
          clicks?: number
          collected_at: string
          created_at?: string | null
          ctr?: number
          date_range_end: string
          date_range_start: string
          id?: string
          impressions?: number
          page: string
          position?: number
          query: string
        }
        Update: {
          clicks?: number
          collected_at?: string
          created_at?: string | null
          ctr?: number
          date_range_end?: string
          date_range_start?: string
          id?: string
          impressions?: number
          page?: string
          position?: number
          query?: string
        }
        Relationships: []
      }
      stock_impact_analyses: {
        Row: {
          created_at: string
          date: string
          disclosure_event_id: string | null
          educational_note: string | null
          id: string
          impact: string
          key_concept: string | null
          magnitude: string
          reason: string
          relevance_score: number | null
          social_summary: string | null
          source: string
          ticker_code: string
        }
        Insert: {
          created_at?: string
          date: string
          disclosure_event_id?: string | null
          educational_note?: string | null
          id?: string
          impact: string
          key_concept?: string | null
          magnitude: string
          reason: string
          relevance_score?: number | null
          social_summary?: string | null
          source?: string
          ticker_code: string
        }
        Update: {
          created_at?: string
          date?: string
          disclosure_event_id?: string | null
          educational_note?: string | null
          id?: string
          impact?: string
          key_concept?: string | null
          magnitude?: string
          reason?: string
          relevance_score?: number | null
          social_summary?: string | null
          source?: string
          ticker_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_impact_analyses_disclosure_event_id_fkey"
            columns: ["disclosure_event_id"]
            isOneToOne: false
            referencedRelation: "disclosure_events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_performance: {
        Row: {
          correct_predictions: number
          current_streak: number
          max_streak: number
          total_pnl: number
          total_predictions: number
          updated_at: string
          user_id: string
          win_rate: number
        }
        Insert: {
          correct_predictions?: number
          current_streak?: number
          max_streak?: number
          total_pnl?: number
          total_predictions?: number
          updated_at?: string
          user_id: string
          win_rate?: number
        }
        Update: {
          correct_predictions?: number
          current_streak?: number
          max_streak?: number
          total_pnl?: number
          total_predictions?: number
          updated_at?: string
          user_id?: string
          win_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_performance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watched_stocks: {
        Row: {
          company_name: string
          created_at: string
          id: string
          is_active: boolean
          next_earnings_date: string | null
          ticker_code: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          next_earnings_date?: string | null
          ticker_code: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          next_earnings_date?: string | null
          ticker_code?: string
        }
        Relationships: []
      }
      weekly_reviews: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          is_published: boolean
          nikkei_change_percent: number | null
          nikkei_end: number | null
          nikkei_start: number | null
          week_end: string
          week_start: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          is_published?: boolean
          nikkei_change_percent?: number | null
          nikkei_end?: number | null
          nikkei_start?: number | null
          week_end: string
          week_start: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          is_published?: boolean
          nikkei_change_percent?: number | null
          nikkei_end?: number | null
          nikkei_start?: number | null
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
