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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      academy_content: {
        Row: {
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          category: string
          created_at: string
          currency_pairs: string[] | null
          description: string | null
          event_date: string
          event_time: string | null
          external_url: string | null
          id: string
          impact: string
          is_featured: boolean
          is_recurring: boolean
          recurrence_pattern: string | null
          timezone: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          currency_pairs?: string[] | null
          description?: string | null
          event_date: string
          event_time?: string | null
          external_url?: string | null
          id?: string
          impact?: string
          is_featured?: boolean
          is_recurring?: boolean
          recurrence_pattern?: string | null
          timezone?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          currency_pairs?: string[] | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          external_url?: string | null
          id?: string
          impact?: string
          is_featured?: boolean
          is_recurring?: boolean
          recurrence_pattern?: string | null
          timezone?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          status: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      forecast_comments: {
        Row: {
          content: string
          created_at: string
          forecast_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          forecast_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          forecast_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecast_comments_forecast_id_fkey"
            columns: ["forecast_id"]
            isOneToOne: false
            referencedRelation: "forecasts"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_likes: {
        Row: {
          created_at: string
          forecast_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          forecast_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          forecast_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecast_likes_forecast_id_fkey"
            columns: ["forecast_id"]
            isOneToOne: false
            referencedRelation: "forecasts"
            referencedColumns: ["id"]
          },
        ]
      }
      forecasts: {
        Row: {
          commentary: string | null
          comments_count: number | null
          created_at: string
          currency_pair: string | null
          description: string | null
          forecast_type: string
          id: string
          image_url: string
          likes_count: number | null
          tags: string[] | null
          title: string | null
          trade_bias: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          commentary?: string | null
          comments_count?: number | null
          created_at?: string
          currency_pair?: string | null
          description?: string | null
          forecast_type: string
          id?: string
          image_url: string
          likes_count?: number | null
          tags?: string[] | null
          title?: string | null
          trade_bias?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          commentary?: string | null
          comments_count?: number | null
          created_at?: string
          currency_pair?: string | null
          description?: string | null
          forecast_type?: string
          id?: string
          image_url?: string
          likes_count?: number | null
          tags?: string[] | null
          title?: string | null
          trade_bias?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          auto_review_enabled: boolean | null
          chart_screenshot_url: string | null
          chart_screenshot_urls: string[] | null
          commission: number | null
          confidence_level: number | null
          created_at: string
          direction: string | null
          emotional_state: string | null
          emotions: string | null
          entry_date: string
          entry_price: number | null
          entry_time: string | null
          execution_method: string | null
          exit_price: number | null
          external_id: string | null
          hold_time_minutes: number | null
          id: string
          instrument: string | null
          is_draft: boolean
          is_shared: boolean
          lessons_learned: string | null
          market_analysis: string | null
          market_volatility: string | null
          outcome: string | null
          pnl: number | null
          post_screenshots_urls: string[] | null
          quantity: number | null
          related_entry_ids: string[] | null
          review_date: string | null
          risk_reward_ratio: number | null
          session: string | null
          setup_description: string | null
          setup_type: string | null
          stop_loss: number | null
          stress_level: string | null
          swap: number | null
          tags: string[] | null
          take_profit: number | null
          title: string
          trade_rating: number | null
          trade_rationale: string | null
          updated_at: string
          user_id: string
          webhook_data: Json | null
          what_to_improve: string | null
          what_went_well: string | null
          win_rate: number | null
        }
        Insert: {
          auto_review_enabled?: boolean | null
          chart_screenshot_url?: string | null
          chart_screenshot_urls?: string[] | null
          commission?: number | null
          confidence_level?: number | null
          created_at?: string
          direction?: string | null
          emotional_state?: string | null
          emotions?: string | null
          entry_date?: string
          entry_price?: number | null
          entry_time?: string | null
          execution_method?: string | null
          exit_price?: number | null
          external_id?: string | null
          hold_time_minutes?: number | null
          id?: string
          instrument?: string | null
          is_draft?: boolean
          is_shared?: boolean
          lessons_learned?: string | null
          market_analysis?: string | null
          market_volatility?: string | null
          outcome?: string | null
          pnl?: number | null
          post_screenshots_urls?: string[] | null
          quantity?: number | null
          related_entry_ids?: string[] | null
          review_date?: string | null
          risk_reward_ratio?: number | null
          session?: string | null
          setup_description?: string | null
          setup_type?: string | null
          stop_loss?: number | null
          stress_level?: string | null
          swap?: number | null
          tags?: string[] | null
          take_profit?: number | null
          title: string
          trade_rating?: number | null
          trade_rationale?: string | null
          updated_at?: string
          user_id: string
          webhook_data?: Json | null
          what_to_improve?: string | null
          what_went_well?: string | null
          win_rate?: number | null
        }
        Update: {
          auto_review_enabled?: boolean | null
          chart_screenshot_url?: string | null
          chart_screenshot_urls?: string[] | null
          commission?: number | null
          confidence_level?: number | null
          created_at?: string
          direction?: string | null
          emotional_state?: string | null
          emotions?: string | null
          entry_date?: string
          entry_price?: number | null
          entry_time?: string | null
          execution_method?: string | null
          exit_price?: number | null
          external_id?: string | null
          hold_time_minutes?: number | null
          id?: string
          instrument?: string | null
          is_draft?: boolean
          is_shared?: boolean
          lessons_learned?: string | null
          market_analysis?: string | null
          market_volatility?: string | null
          outcome?: string | null
          pnl?: number | null
          post_screenshots_urls?: string[] | null
          quantity?: number | null
          related_entry_ids?: string[] | null
          review_date?: string | null
          risk_reward_ratio?: number | null
          session?: string | null
          setup_description?: string | null
          setup_type?: string | null
          stop_loss?: number | null
          stress_level?: string | null
          swap?: number | null
          tags?: string[] | null
          take_profit?: number | null
          title?: string
          trade_rating?: number | null
          trade_rationale?: string | null
          updated_at?: string
          user_id?: string
          webhook_data?: Json | null
          what_to_improve?: string | null
          what_went_well?: string | null
          win_rate?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          email: string | null
          email_notifications_enabled: boolean
          full_name: string | null
          id: string
          is_suspended: boolean
          notify_announcement: boolean
          notify_bookmark: boolean
          notify_comment: boolean
          notify_like: boolean
          notify_system: boolean
          phone_number: string | null
          push_notifications_enabled: boolean
          telegram_handle: string | null
          updated_at: string
          user_id: string
          whatsapp_handle: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          email?: string | null
          email_notifications_enabled?: boolean
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          notify_announcement?: boolean
          notify_bookmark?: boolean
          notify_comment?: boolean
          notify_like?: boolean
          notify_system?: boolean
          phone_number?: string | null
          push_notifications_enabled?: boolean
          telegram_handle?: string | null
          updated_at?: string
          user_id: string
          whatsapp_handle?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string | null
          email_notifications_enabled?: boolean
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          notify_announcement?: boolean
          notify_bookmark?: boolean
          notify_comment?: boolean
          notify_like?: boolean
          notify_system?: boolean
          phone_number?: string | null
          push_notifications_enabled?: boolean
          telegram_handle?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_handle?: string | null
        }
        Relationships: []
      }
      user_bookmarks: {
        Row: {
          bookmarked_at: string
          forecast_id: string
          id: string
          user_id: string
        }
        Insert: {
          bookmarked_at?: string
          forecast_id: string
          id?: string
          user_id: string
        }
        Update: {
          bookmarked_at?: string
          forecast_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bookmarks_forecast_id_fkey"
            columns: ["forecast_id"]
            isOneToOne: false
            referencedRelation: "forecasts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      broadcast_notification: {
        Args: {
          p_content: string
          p_link?: string
          p_type: string
          p_user_ids?: string[]
        }
        Returns: number
      }
      create_notification: {
        Args: {
          p_content: string
          p_link?: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
