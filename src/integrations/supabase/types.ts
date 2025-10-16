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
      ai_logs: {
        Row: {
          at: string | null
          duration_ms: number | null
          error: string | null
          id: number
          mode: string
          request: Json | null
          route: string
        }
        Insert: {
          at?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: number
          mode: string
          request?: Json | null
          route: string
        }
        Update: {
          at?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: number
          mode?: string
          request?: Json | null
          route?: string
        }
        Relationships: []
      }
      ai_suggestions_cache: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          profile_id: string
          score: number | null
          suggestion_lang: string
          suggestion_md: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          profile_id: string
          score?: number | null
          suggestion_lang: string
          suggestion_md: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          profile_id?: string
          score?: number | null
          suggestion_lang?: string
          suggestion_md?: string
        }
        Relationships: []
      }
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
      bookings: {
        Row: {
          amount_cents: number
          booking_metadata: Json | null
          booking_notes: string | null
          booking_token: string
          cal_booking_id: string | null
          cal_event_type_id: string
          cal_uid: string | null
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          expires_at: string | null
          id: string
          meeting_url: string | null
          package_id: string
          paid_at: string | null
          payment_id: string | null
          payment_provider: string | null
          payment_status: string
          scheduled_end: string | null
          scheduled_start: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          booking_metadata?: Json | null
          booking_notes?: string | null
          booking_token: string
          cal_booking_id?: string | null
          cal_event_type_id: string
          cal_uid?: string | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          meeting_url?: string | null
          package_id: string
          paid_at?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          payment_status?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          booking_metadata?: Json | null
          booking_notes?: string | null
          booking_token?: string
          cal_booking_id?: string | null
          cal_event_type_id?: string
          cal_uid?: string | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          meeting_url?: string | null
          package_id?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          payment_status?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      cal_bookings: {
        Row: {
          attendee_email: string
          attendee_name: string
          attendee_timezone: string | null
          cal_booking_id: string
          cal_uid: string
          created_at: string | null
          end_time: string
          event_id: string | null
          event_slug: string | null
          event_type_id: string
          event_type_slug: string | null
          id: string
          location: string | null
          meeting_url: string | null
          metadata: Json | null
          start_time: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          attendee_email: string
          attendee_name: string
          attendee_timezone?: string | null
          cal_booking_id: string
          cal_uid: string
          created_at?: string | null
          end_time: string
          event_id?: string | null
          event_slug?: string | null
          event_type_id: string
          event_type_slug?: string | null
          id?: string
          location?: string | null
          meeting_url?: string | null
          metadata?: Json | null
          start_time: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          attendee_email?: string
          attendee_name?: string
          attendee_timezone?: string | null
          cal_booking_id?: string
          cal_uid?: string
          created_at?: string | null
          end_time?: string
          event_id?: string | null
          event_slug?: string | null
          event_type_id?: string
          event_type_slug?: string | null
          id?: string
          location?: string | null
          meeting_url?: string | null
          metadata?: Json | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cal_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      cal_event_types: {
        Row: {
          active: boolean | null
          cal_event_type_id: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          last_synced_at: string | null
          length: number
          metadata: Json | null
          price: number | null
          slug: string
          title: string
        }
        Insert: {
          active?: boolean | null
          cal_event_type_id: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          length: number
          metadata?: Json | null
          price?: number | null
          slug: string
          title: string
        }
        Update: {
          active?: boolean | null
          cal_event_type_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          length?: number
          metadata?: Json | null
          price?: number | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      coaching_offers: {
        Row: {
          active: boolean | null
          base_currency: string | null
          base_price_cents: number | null
          billing_type: string | null
          cal_event_type_slug: string
          created_at: string | null
          id: string
          slug: string
          sort: number | null
          summary_en: string | null
          summary_zh_cn: string | null
          summary_zh_tw: string | null
          tags: string[] | null
          title_en: string
          title_zh_cn: string | null
          title_zh_tw: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          base_currency?: string | null
          base_price_cents?: number | null
          billing_type?: string | null
          cal_event_type_slug: string
          created_at?: string | null
          id?: string
          slug: string
          sort?: number | null
          summary_en?: string | null
          summary_zh_cn?: string | null
          summary_zh_tw?: string | null
          tags?: string[] | null
          title_en: string
          title_zh_cn?: string | null
          title_zh_tw?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          base_currency?: string | null
          base_price_cents?: number | null
          billing_type?: string | null
          cal_event_type_slug?: string
          created_at?: string | null
          id?: string
          slug?: string
          sort?: number | null
          summary_en?: string | null
          summary_zh_cn?: string | null
          summary_zh_tw?: string | null
          tags?: string[] | null
          title_en?: string
          title_zh_cn?: string | null
          title_zh_tw?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coaching_pages: {
        Row: {
          body_html_en: string | null
          body_html_zh_cn: string | null
          body_html_zh_tw: string | null
          created_at: string | null
          faqs: Json | null
          hero_image: string | null
          offer_slug: string
          updated_at: string | null
        }
        Insert: {
          body_html_en?: string | null
          body_html_zh_cn?: string | null
          body_html_zh_tw?: string | null
          created_at?: string | null
          faqs?: Json | null
          hero_image?: string | null
          offer_slug: string
          updated_at?: string | null
        }
        Update: {
          body_html_en?: string | null
          body_html_zh_cn?: string | null
          body_html_zh_tw?: string | null
          created_at?: string | null
          faqs?: Json | null
          hero_image?: string | null
          offer_slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaching_pages_offer_slug_fkey"
            columns: ["offer_slug"]
            isOneToOne: true
            referencedRelation: "coaching_offers"
            referencedColumns: ["slug"]
          },
        ]
      }
      coaching_price_overrides: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          offer_slug: string | null
          price_cents: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency: string
          id?: string
          offer_slug?: string | null
          price_cents: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          offer_slug?: string | null
          price_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaching_price_overrides_offer_slug_fkey"
            columns: ["offer_slug"]
            isOneToOne: false
            referencedRelation: "coaching_offers"
            referencedColumns: ["slug"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          amount_cents: number
          coupon_code: string
          created_at: string | null
          email: string
          id: string
          offer_slug: string
        }
        Insert: {
          amount_cents: number
          coupon_code: string
          created_at?: string | null
          email: string
          id?: string
          offer_slug: string
        }
        Update: {
          amount_cents?: number
          coupon_code?: string
          created_at?: string | null
          email?: string
          id?: string
          offer_slug?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean | null
          amount_off_cents: number | null
          applies_to_slug: string | null
          code: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          max_redemptions: number | null
          per_user_limit: number | null
          percent_off: number | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          active?: boolean | null
          amount_off_cents?: number | null
          applies_to_slug?: string | null
          code: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          max_redemptions?: number | null
          per_user_limit?: number | null
          percent_off?: number | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          active?: boolean | null
          amount_off_cents?: number | null
          applies_to_slug?: string | null
          code?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          max_redemptions?: number | null
          per_user_limit?: number | null
          percent_off?: number | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      event_coupon_uses: {
        Row: {
          coupon_id: string | null
          email: string
          event_id: string | null
          id: number
          reg_id: string | null
          used_at: string | null
        }
        Insert: {
          coupon_id?: string | null
          email: string
          event_id?: string | null
          id?: number
          reg_id?: string | null
          used_at?: string | null
        }
        Update: {
          coupon_id?: string | null
          email?: string
          event_id?: string | null
          id?: number
          reg_id?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_coupon_uses_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "event_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_coupon_uses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_coupon_uses_reg_id_fkey"
            columns: ["reg_id"]
            isOneToOne: false
            referencedRelation: "event_regs"
            referencedColumns: ["id"]
          },
        ]
      }
      event_coupons: {
        Row: {
          active: boolean | null
          applies_to_all: boolean | null
          code: string
          created_at: string | null
          currency: string | null
          discount_type: string
          discount_value: number
          event_id: string | null
          expires_at: string | null
          id: string
          max_uses: number | null
          per_user_limit: number | null
          starts_at: string | null
          tickets: string[] | null
          used_count: number | null
        }
        Insert: {
          active?: boolean | null
          applies_to_all?: boolean | null
          code: string
          created_at?: string | null
          currency?: string | null
          discount_type: string
          discount_value: number
          event_id?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          per_user_limit?: number | null
          starts_at?: string | null
          tickets?: string[] | null
          used_count?: number | null
        }
        Update: {
          active?: boolean | null
          applies_to_all?: boolean | null
          code?: string
          created_at?: string | null
          currency?: string | null
          discount_type?: string
          discount_value?: number
          event_id?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          per_user_limit?: number | null
          starts_at?: string | null
          tickets?: string[] | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_coupons_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_price_assignments: {
        Row: {
          assigned_at: string
          country: string | null
          currency: string
          id: string
          price_cents: number
          test_id: string | null
          variant: string
          visitor_id: string
        }
        Insert: {
          assigned_at?: string
          country?: string | null
          currency: string
          id?: string
          price_cents: number
          test_id?: string | null
          variant: string
          visitor_id: string
        }
        Update: {
          assigned_at?: string
          country?: string | null
          currency?: string
          id?: string
          price_cents?: number
          test_id?: string | null
          variant?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_price_assignments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "event_price_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      event_price_tests: {
        Row: {
          currency: string
          ended_at: string | null
          event_id: string | null
          id: string
          is_active: boolean
          price_cents: number
          region: string
          started_at: string
          ticket_id: string | null
          variant: string
        }
        Insert: {
          currency: string
          ended_at?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean
          price_cents: number
          region: string
          started_at?: string
          ticket_id?: string | null
          variant: string
        }
        Update: {
          currency?: string
          ended_at?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean
          price_cents?: number
          region?: string
          started_at?: string
          ticket_id?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_price_tests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_price_tests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      event_regs: {
        Row: {
          airwallex_id: string | null
          airwallex_link: string | null
          amount_cents: number
          checked_in_at: string | null
          checkin_code: string | null
          country: string | null
          coupon_code: string | null
          created_at: string | null
          currency: string
          discount_cents: number | null
          email: string
          event_id: string | null
          id: string
          language: string | null
          name: string
          offer_expires_at: string | null
          offer_sent_at: string | null
          offer_token: string | null
          status: string
          ticket_id: string | null
        }
        Insert: {
          airwallex_id?: string | null
          airwallex_link?: string | null
          amount_cents?: number
          checked_in_at?: string | null
          checkin_code?: string | null
          country?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string
          discount_cents?: number | null
          email: string
          event_id?: string | null
          id?: string
          language?: string | null
          name: string
          offer_expires_at?: string | null
          offer_sent_at?: string | null
          offer_token?: string | null
          status?: string
          ticket_id?: string | null
        }
        Update: {
          airwallex_id?: string | null
          airwallex_link?: string | null
          amount_cents?: number
          checked_in_at?: string | null
          checkin_code?: string | null
          country?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string
          discount_cents?: number | null
          email?: string
          event_id?: string | null
          id?: string
          language?: string | null
          name?: string
          offer_expires_at?: string | null
          offer_sent_at?: string | null
          offer_token?: string | null
          status?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_regs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_regs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sessions: {
        Row: {
          end_at: string
          event_id: string | null
          id: string
          start_at: string
          title: string | null
        }
        Insert: {
          end_at: string
          event_id?: string | null
          id?: string
          start_at: string
          title?: string | null
        }
        Update: {
          end_at?: string
          event_id?: string | null
          id?: string
          start_at?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_ticket_fx_overrides: {
        Row: {
          currency: string
          id: string
          price_cents: number
          ticket_id: string | null
        }
        Insert: {
          currency: string
          id?: string
          price_cents: number
          ticket_id?: string | null
        }
        Update: {
          currency?: string
          id?: string
          price_cents?: number
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_ticket_fx_overrides_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tickets: {
        Row: {
          base_currency: string
          base_price_cents: number
          currency: string
          event_id: string | null
          id: string
          name: string
          one_per_user: boolean | null
          price_cents: number
          qty: number
        }
        Insert: {
          base_currency?: string
          base_price_cents?: number
          currency?: string
          event_id?: string | null
          id?: string
          name: string
          one_per_user?: boolean | null
          price_cents?: number
          qty?: number
        }
        Update: {
          base_currency?: string
          base_price_cents?: number
          currency?: string
          event_id?: string | null
          id?: string
          name?: string
          one_per_user?: boolean | null
          price_cents?: number
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cal_booking_url: string | null
          cal_event_type_slug: string | null
          cal_group: boolean | null
          capacity: number | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          end_at: string
          id: string
          is_paid: boolean | null
          location: string | null
          meeting_url: string | null
          slug: string
          start_at: string
          status: string | null
          summary: string | null
          title: string
          tz: string | null
        }
        Insert: {
          cal_booking_url?: string | null
          cal_event_type_slug?: string | null
          cal_group?: boolean | null
          capacity?: number | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          end_at: string
          id?: string
          is_paid?: boolean | null
          location?: string | null
          meeting_url?: string | null
          slug: string
          start_at: string
          status?: string | null
          summary?: string | null
          title: string
          tz?: string | null
        }
        Update: {
          cal_booking_url?: string | null
          cal_event_type_slug?: string | null
          cal_group?: boolean | null
          capacity?: number | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          end_at?: string
          id?: string
          is_paid?: boolean | null
          location?: string | null
          meeting_url?: string | null
          slug?: string
          start_at?: string
          status?: string | null
          summary?: string | null
          title?: string
          tz?: string | null
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
      express_offers: {
        Row: {
          active: boolean | null
          base_currency: string
          base_price_cents: number
          description: string | null
          id: string
          slug: string
          title: string
        }
        Insert: {
          active?: boolean | null
          base_currency?: string
          base_price_cents?: number
          description?: string | null
          id?: string
          slug: string
          title: string
        }
        Update: {
          active?: boolean | null
          base_currency?: string
          base_price_cents?: number
          description?: string | null
          id?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      express_orders: {
        Row: {
          airwallex_id: string | null
          airwallex_link: string | null
          amount_cents: number
          coupon: string | null
          created_at: string | null
          currency: string
          discount_cents: number | null
          email: string
          id: string
          language: string | null
          name: string
          notes: string | null
          offer_slug: string
          promo: string | null
          status: string
        }
        Insert: {
          airwallex_id?: string | null
          airwallex_link?: string | null
          amount_cents: number
          coupon?: string | null
          created_at?: string | null
          currency: string
          discount_cents?: number | null
          email: string
          id?: string
          language?: string | null
          name: string
          notes?: string | null
          offer_slug: string
          promo?: string | null
          status?: string
        }
        Update: {
          airwallex_id?: string | null
          airwallex_link?: string | null
          amount_cents?: number
          coupon?: string | null
          created_at?: string | null
          currency?: string
          discount_cents?: number | null
          email?: string
          id?: string
          language?: string | null
          name?: string
          notes?: string | null
          offer_slug?: string
          promo?: string | null
          status?: string
        }
        Relationships: []
      }
      express_price_overrides: {
        Row: {
          currency: string
          id: string
          offer_slug: string | null
          price_cents: number
        }
        Insert: {
          currency: string
          id?: string
          offer_slug?: string | null
          price_cents: number
        }
        Update: {
          currency?: string
          id?: string
          offer_slug?: string | null
          price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "express_price_overrides_offer_slug_fkey"
            columns: ["offer_slug"]
            isOneToOne: false
            referencedRelation: "express_offers"
            referencedColumns: ["slug"]
          },
        ]
      }
      fx_rates: {
        Row: {
          base: string
          rates: Json
          updated_at: string
        }
        Insert: {
          base: string
          rates: Json
          updated_at?: string
        }
        Update: {
          base?: string
          rates?: Json
          updated_at?: string
        }
        Relationships: []
      }
      i18n_translations: {
        Row: {
          id: string
          scope: string
          source_hash: string
          source_lang: string
          source_text: string
          target_lang: string
          translated_text: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          scope: string
          source_hash: string
          source_lang: string
          source_text: string
          target_lang: string
          translated_text: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          scope?: string
          source_hash?: string
          source_lang?: string
          source_text?: string
          target_lang?: string
          translated_text?: string
          updated_at?: string | null
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
      lesson_assignments: {
        Row: {
          id: string
          lesson_slug: string
          offer_slug: string | null
          order_index: number | null
          tag: string | null
        }
        Insert: {
          id?: string
          lesson_slug: string
          offer_slug?: string | null
          order_index?: number | null
          tag?: string | null
        }
        Update: {
          id?: string
          lesson_slug?: string
          offer_slug?: string | null
          order_index?: number | null
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_assignments_lesson_slug_fkey"
            columns: ["lesson_slug"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["slug"]
          },
        ]
      }
      lesson_events: {
        Row: {
          at_sec: number | null
          created_at: string | null
          ev: string
          id: string
          lesson_slug: string
          profile_id: string
        }
        Insert: {
          at_sec?: number | null
          created_at?: string | null
          ev: string
          id?: string
          lesson_slug: string
          profile_id: string
        }
        Update: {
          at_sec?: number | null
          created_at?: string | null
          ev?: string
          id?: string
          lesson_slug?: string
          profile_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          id: string
          last_position_sec: number | null
          last_watched_at: string | null
          lesson_slug: string
          profile_id: string
          watched_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          id?: string
          last_position_sec?: number | null
          last_watched_at?: string | null
          lesson_slug: string
          profile_id: string
          watched_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          id?: string
          last_position_sec?: number | null
          last_watched_at?: string | null
          lesson_slug?: string
          profile_id?: string
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_slug_fkey"
            columns: ["lesson_slug"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["slug"]
          },
        ]
      }
      lessons: {
        Row: {
          captions_vtt_url: string | null
          cn_alt_url: string | null
          created_at: string | null
          duration_sec: number | null
          id: string
          order_index: number | null
          poster_url: string | null
          published: boolean | null
          slug: string
          summary_en: string | null
          tags: string[] | null
          title_en: string
          updated_at: string | null
          yt_id: string | null
        }
        Insert: {
          captions_vtt_url?: string | null
          cn_alt_url?: string | null
          created_at?: string | null
          duration_sec?: number | null
          id?: string
          order_index?: number | null
          poster_url?: string | null
          published?: boolean | null
          slug: string
          summary_en?: string | null
          tags?: string[] | null
          title_en: string
          updated_at?: string | null
          yt_id?: string | null
        }
        Update: {
          captions_vtt_url?: string | null
          cn_alt_url?: string | null
          created_at?: string | null
          duration_sec?: number | null
          id?: string
          order_index?: number | null
          poster_url?: string | null
          published?: boolean | null
          slug?: string
          summary_en?: string | null
          tags?: string[] | null
          title_en?: string
          updated_at?: string | null
          yt_id?: string | null
        }
        Relationships: []
      }
      me_goals: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          profile_id: string | null
          progress: number
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          profile_id?: string | null
          progress?: number
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          profile_id?: string | null
          progress?: number
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "me_goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zg_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      me_notes: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          profile_id: string | null
          session_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          profile_id?: string | null
          session_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          profile_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "me_notes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zg_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "me_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "me_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      me_receipts: {
        Row: {
          amount_cents: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          order_id: string | null
          profile_id: string | null
          raw: Json | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          profile_id?: string | null
          raw?: Json | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          profile_id?: string | null
          raw?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "me_receipts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zg_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      me_sessions: {
        Row: {
          cal_event_id: string | null
          created_at: string | null
          end_at: string | null
          id: string
          join_url: string | null
          notes: string | null
          profile_id: string | null
          start_at: string | null
          title: string | null
        }
        Insert: {
          cal_event_id?: string | null
          created_at?: string | null
          end_at?: string | null
          id?: string
          join_url?: string | null
          notes?: string | null
          profile_id?: string | null
          start_at?: string | null
          title?: string | null
        }
        Update: {
          cal_event_id?: string | null
          created_at?: string | null
          end_at?: string | null
          id?: string
          join_url?: string | null
          notes?: string | null
          profile_id?: string | null
          start_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "me_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zg_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      pricing_settings: {
        Row: {
          buffer_bps: number
          cny_rounding: string
          id: boolean
          supported: string[]
          updated_at: string
        }
        Insert: {
          buffer_bps?: number
          cny_rounding?: string
          id?: boolean
          supported?: string[]
          updated_at?: string
        }
        Update: {
          buffer_bps?: number
          cny_rounding?: string
          id?: boolean
          supported?: string[]
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
      promotions: {
        Row: {
          active: boolean | null
          amount_off_cents: number | null
          applies_to_slug: string | null
          auto_apply: boolean | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          key: string
          percent_off: number | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          active?: boolean | null
          amount_off_cents?: number | null
          applies_to_slug?: string | null
          auto_apply?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          key: string
          percent_off?: number | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          active?: boolean | null
          amount_off_cents?: number | null
          applies_to_slug?: string | null
          auto_apply?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          key?: string
          percent_off?: number | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      registration_attempts: {
        Row: {
          attempted_at: string | null
          email: string
          event_id: string | null
          id: number
          ip_address: string
          success: boolean | null
        }
        Insert: {
          attempted_at?: string | null
          email: string
          event_id?: string | null
          id?: number
          ip_address: string
          success?: boolean | null
        }
        Update: {
          attempted_at?: string | null
          email?: string
          event_id?: string | null
          id?: number
          ip_address?: string
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_attempts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      remote_flags: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
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
      secure_kv: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      seo_alerts: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          resolution_note: string | null
          resolved_at: string | null
          severity: string
          source_key: string
          title: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          resolution_note?: string | null
          resolved_at?: string | null
          severity: string
          source_key: string
          title: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          resolution_note?: string | null
          resolved_at?: string | null
          severity?: string
          source_key?: string
          title?: string
        }
        Relationships: []
      }
      seo_notify_settings: {
        Row: {
          email: string | null
          id: string
          locale: string | null
          slack_webhook: string | null
        }
        Insert: {
          email?: string | null
          id?: string
          locale?: string | null
          slack_webhook?: string | null
        }
        Update: {
          email?: string | null
          id?: string
          locale?: string | null
          slack_webhook?: string | null
        }
        Relationships: []
      }
      seo_site_snapshots: {
        Row: {
          checklist: Json
          created_at: string | null
          id: string
        }
        Insert: {
          checklist: Json
          created_at?: string | null
          id?: string
        }
        Update: {
          checklist?: Json
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      seo_watch_sources: {
        Row: {
          enabled: boolean
          extra: Json | null
          id: string
          key: string
          label: string
          last_checked_at: string | null
        }
        Insert: {
          enabled?: boolean
          extra?: Json | null
          id?: string
          key: string
          label: string
          last_checked_at?: string | null
        }
        Update: {
          enabled?: boolean
          extra?: Json | null
          id?: string
          key?: string
          label?: string
          last_checked_at?: string | null
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          channel_name: string | null
          created_at: string | null
          external_id: string | null
          id: string
          platform: string
        }
        Insert: {
          channel_name?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          platform: string
        }
        Update: {
          channel_name?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          platform?: string
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
      social_metrics: {
        Row: {
          captured_at: string
          clicks: number | null
          comments: number | null
          followers: number | null
          id: number
          impressions: number | null
          likes: number | null
          platform: string
          platform_post_id: string
          saves: number | null
          shares: number | null
          video_views: number | null
        }
        Insert: {
          captured_at?: string
          clicks?: number | null
          comments?: number | null
          followers?: number | null
          id?: number
          impressions?: number | null
          likes?: number | null
          platform: string
          platform_post_id: string
          saves?: number | null
          shares?: number | null
          video_views?: number | null
        }
        Update: {
          captured_at?: string
          clicks?: number | null
          comments?: number | null
          followers?: number | null
          id?: number
          impressions?: number | null
          likes?: number | null
          platform?: string
          platform_post_id?: string
          saves?: number | null
          shares?: number | null
          video_views?: number | null
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          blog_slug: string
          created_at: string | null
          error: string | null
          id: string
          media: Json | null
          message: string | null
          platform: string
          platform_post_id: string | null
          posted_at: string | null
          primary_tag: string | null
          scheduled_at: string | null
          status: string
          tags: string[] | null
        }
        Insert: {
          blog_slug: string
          created_at?: string | null
          error?: string | null
          id?: string
          media?: Json | null
          message?: string | null
          platform: string
          platform_post_id?: string | null
          posted_at?: string | null
          primary_tag?: string | null
          scheduled_at?: string | null
          status?: string
          tags?: string[] | null
        }
        Update: {
          blog_slug?: string
          created_at?: string | null
          error?: string | null
          id?: string
          media?: Json | null
          message?: string | null
          platform?: string
          platform_post_id?: string | null
          posted_at?: string | null
          primary_tag?: string | null
          scheduled_at?: string | null
          status?: string
          tags?: string[] | null
        }
        Relationships: []
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
      zg_admins: {
        Row: {
          created_at: string | null
          email: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          user_id?: string
        }
        Relationships: []
      }
      zg_events: {
        Row: {
          created_at: string | null
          device_id: string | null
          event: string | null
          id: string
          payload: Json | null
          profile_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          event?: string | null
          id?: string
          payload?: Json | null
          profile_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          event?: string | null
          id?: string
          payload?: Json | null
          profile_id?: string | null
        }
        Relationships: []
      }
      zg_profiles: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string | null
          device_id: string | null
          email: string | null
          id: string
          interests: string[] | null
          is_admin: boolean | null
          locale: string | null
          name: string | null
          preferred_currency: string | null
          tz: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          device_id?: string | null
          email?: string | null
          id?: string
          interests?: string[] | null
          is_admin?: boolean | null
          locale?: string | null
          name?: string | null
          preferred_currency?: string | null
          tz?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          device_id?: string | null
          email?: string | null
          id?: string
          interests?: string[] | null
          is_admin?: boolean | null
          locale?: string | null
          name?: string | null
          preferred_currency?: string | null
          tz?: string | null
        }
        Relationships: []
      }
      zg_quiz_answers: {
        Row: {
          choice_value: string | null
          created_at: string | null
          device_id: string | null
          id: string
          profile_id: string | null
          question_key: string | null
        }
        Insert: {
          choice_value?: string | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          profile_id?: string | null
          question_key?: string | null
        }
        Update: {
          choice_value?: string | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          profile_id?: string | null
          question_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zg_quiz_answers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zg_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zg_quiz_choices: {
        Row: {
          id: string
          label_en: string | null
          label_zh_cn: string | null
          label_zh_tw: string | null
          question_key: string | null
          tag: string | null
          value: string | null
        }
        Insert: {
          id?: string
          label_en?: string | null
          label_zh_cn?: string | null
          label_zh_tw?: string | null
          question_key?: string | null
          tag?: string | null
          value?: string | null
        }
        Update: {
          id?: string
          label_en?: string | null
          label_zh_cn?: string | null
          label_zh_tw?: string | null
          question_key?: string | null
          tag?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zg_quiz_choices_question_key_fkey"
            columns: ["question_key"]
            isOneToOne: false
            referencedRelation: "zg_quiz_questions"
            referencedColumns: ["key"]
          },
        ]
      }
      zg_quiz_questions: {
        Row: {
          active: boolean | null
          id: string
          key: string | null
          order_no: number | null
          title_en: string | null
          title_zh_cn: string | null
          title_zh_tw: string | null
        }
        Insert: {
          active?: boolean | null
          id?: string
          key?: string | null
          order_no?: number | null
          title_en?: string | null
          title_zh_cn?: string | null
          title_zh_tw?: string | null
        }
        Update: {
          active?: boolean | null
          id?: string
          key?: string | null
          order_no?: number | null
          title_en?: string | null
          title_zh_cn?: string | null
          title_zh_tw?: string | null
        }
        Relationships: []
      }
      zg_referrals: {
        Row: {
          clicks: number | null
          conversions: number | null
          created_at: string | null
          id: string
          profile_id: string | null
          ref_code: string | null
        }
        Insert: {
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          profile_id?: string | null
          ref_code?: string | null
        }
        Update: {
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          profile_id?: string | null
          ref_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zg_referrals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zg_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zg_versions: {
        Row: {
          key: string
          updated_at: string | null
          v: number
        }
        Insert: {
          key: string
          updated_at?: string | null
          v?: number
        }
        Update: {
          key?: string
          updated_at?: string | null
          v?: number
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
      v_price_test_stats: {
        Row: {
          conv_rate_pct: number | null
          currency: string | null
          event_id: string | null
          purchases: number | null
          region: string | null
          revenue_cents: number | null
          ticket_id: string | null
          variant: string | null
          visitors: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_price_tests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_price_tests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      v_tag_performance: {
        Row: {
          clicks: number | null
          ctr_pct: number | null
          engagements: number | null
          er_pct: number | null
          impressions: number | null
          post_count: number | null
          tag: string | null
          video_views: number | null
          week_start: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_metrics_summary: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      bump_version_now: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      decrement_ticket_qty: {
        Args: { p_amount?: number; p_ticket_id: string }
        Returns: Json
      }
      get_user_streak: {
        Args: { p_profile_id: string }
        Returns: number
      }
      increment_coupon_uses: {
        Args: { coupon_uuid: string }
        Returns: undefined
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
