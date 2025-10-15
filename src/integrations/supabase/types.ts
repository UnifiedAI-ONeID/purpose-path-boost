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
      analytics_events: {
        Row: {
          created_at: string | null
          event_name: string
          id: string
          ip_address: string | null
          page_url: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_name: string
          id?: string
          ip_address?: string | null
          page_url?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string
          id?: string
          ip_address?: string | null
          page_url?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string | null
          excerpt: string
          id: string
          image_url: string | null
          meta_description: string | null
          meta_title: string | null
          published: boolean | null
          published_at: string | null
          read_time: number | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string
          category: string
          content: string
          created_at?: string | null
          excerpt: string
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean | null
          published_at?: string | null
          read_time?: number | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string | null
          excerpt?: string
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean | null
          published_at?: string | null
          read_time?: number | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      events_raw: {
        Row: {
          country: string | null
          device: string | null
          event: string
          id: number
          lang: string | null
          meta: Json | null
          referrer: string | null
          route: string | null
          session_id: string
          ts: string
          user_hash: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          country?: string | null
          device?: string | null
          event: string
          id?: number
          lang?: string | null
          meta?: Json | null
          referrer?: string | null
          route?: string | null
          session_id: string
          ts?: string
          user_hash?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          country?: string | null
          device?: string | null
          event?: string
          id?: number
          lang?: string | null
          meta?: Json | null
          referrer?: string | null
          route?: string | null
          session_id?: string
          ts?: string
          user_hash?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          booking_challenge: string | null
          booking_goal: string | null
          booking_timeline: string | null
          clarity_score: number | null
          country: string | null
          created_at: string | null
          email: string
          id: string
          language: string | null
          name: string
          notes: string | null
          quiz_answers: Json | null
          quiz_score: number | null
          source: string | null
          stage: string | null
          tags: string[] | null
          wechat: string | null
        }
        Insert: {
          booking_challenge?: string | null
          booking_goal?: string | null
          booking_timeline?: string | null
          clarity_score?: number | null
          country?: string | null
          created_at?: string | null
          email: string
          id?: string
          language?: string | null
          name: string
          notes?: string | null
          quiz_answers?: Json | null
          quiz_score?: number | null
          source?: string | null
          stage?: string | null
          tags?: string[] | null
          wechat?: string | null
        }
        Update: {
          booking_challenge?: string | null
          booking_goal?: string | null
          booking_timeline?: string | null
          clarity_score?: number | null
          country?: string | null
          created_at?: string | null
          email?: string
          id?: string
          language?: string | null
          name?: string
          notes?: string | null
          quiz_answers?: Json | null
          quiz_score?: number | null
          source?: string | null
          stage?: string | null
          tags?: string[] | null
          wechat?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          body_html: string
          body_json: Json
          canonical_url: string | null
          channels: string[]
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          publish_at: string
          slug: string
          social_overrides: Json | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          body_html: string
          body_json: Json
          canonical_url?: string | null
          channels?: string[]
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          publish_at?: string
          slug: string
          social_overrides?: Json | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          body_json?: Json
          canonical_url?: string | null
          channels?: string[]
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          publish_at?: string
          slug?: string
          social_overrides?: Json | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          is_admin: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          is_admin?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          is_admin?: boolean
          user_id?: string
        }
        Relationships: []
      }
      rollup_daily: {
        Row: {
          count: number
          day: string
          event: string
          id: number
          route: string
        }
        Insert: {
          count?: number
          day: string
          event: string
          id?: number
          route: string
        }
        Update: {
          count?: number
          day?: string
          event?: string
          id?: number
          route?: string
        }
        Relationships: []
      }
      secrets: {
        Row: {
          iv: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          iv: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          iv?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      social_config_logs: {
        Row: {
          action: string
          changed_by: string | null
          changes: Json | null
          created_at: string
          id: string
          platform: Database["public"]["Enums"]["social_platform"]
          version: number
        }
        Insert: {
          action: string
          changed_by?: string | null
          changes?: Json | null
          created_at?: string
          id?: string
          platform: Database["public"]["Enums"]["social_platform"]
          version: number
        }
        Update: {
          action?: string
          changed_by?: string | null
          changes?: Json | null
          created_at?: string
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          version?: number
        }
        Relationships: []
      }
      social_configs: {
        Row: {
          access_token_enc: string | null
          account_id_enc: string | null
          app_key_enc: string | null
          app_secret_enc: string | null
          created_at: string
          enabled: boolean
          id: string
          last_test_at: string | null
          last_test_status: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          posting_template: string | null
          refresh_token_enc: string | null
          updated_at: string
          updated_by: string | null
          version: number
          webhook_url_enc: string | null
        }
        Insert: {
          access_token_enc?: string | null
          account_id_enc?: string | null
          app_key_enc?: string | null
          app_secret_enc?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          last_test_at?: string | null
          last_test_status?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          posting_template?: string | null
          refresh_token_enc?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          webhook_url_enc?: string | null
        }
        Update: {
          access_token_enc?: string | null
          account_id_enc?: string | null
          app_key_enc?: string | null
          app_secret_enc?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          last_test_at?: string | null
          last_test_status?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          posting_template?: string | null
          refresh_token_enc?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          webhook_url_enc?: string | null
        }
        Relationships: []
      }
      social_media_posts: {
        Row: {
          blog_post_id: string
          created_at: string | null
          error_message: string | null
          id: string
          platform: string
          post_id: string | null
          post_url: string | null
          posted_at: string | null
          status: string
        }
        Insert: {
          blog_post_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          platform: string
          post_id?: string | null
          post_url?: string | null
          posted_at?: string | null
          status?: string
        }
        Update: {
          blog_post_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          platform?: string
          post_id?: string | null
          post_url?: string | null
          posted_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_posts_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_funnel_weekly: {
        Row: {
          booked: number | null
          cvr_booked_pct: number | null
          cvr_lead_to_client_pct: number | null
          cvr_won_pct: number | null
          leads: number | null
          week_start: string | null
          won: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_metrics_summary: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { _user_id: string }
        Returns: boolean
      }
      rollup_delete_day: {
        Args: { p_day: string }
        Returns: undefined
      }
      rollup_insert_day: {
        Args: { p_day: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      social_platform:
        | "twitter"
        | "linkedin"
        | "facebook"
        | "instagram"
        | "youtube_community"
        | "medium"
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
      social_platform: [
        "twitter",
        "linkedin",
        "facebook",
        "instagram",
        "youtube_community",
        "medium",
      ],
    },
  },
} as const
