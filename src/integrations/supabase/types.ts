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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      attractions: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["attraction_category"]
          contact_phone: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          destination_id: string
          gallery_urls: string[]
          geofence_radius_meters: number
          history: string | null
          id: string
          instagram: string | null
          is_passport_active: boolean
          latitude: number
          longitude: number
          name: string
          opening_hours: string | null
          order_sequence: number
          partner_code: string
          points_reward: number
          qr_code_token: string
          requires_photo: boolean
          slug: string
          validation_mode: Database["public"]["Enums"]["validation_mode"]
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: Database["public"]["Enums"]["attraction_category"]
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          destination_id: string
          gallery_urls?: string[]
          geofence_radius_meters?: number
          history?: string | null
          id?: string
          instagram?: string | null
          is_passport_active?: boolean
          latitude: number
          longitude: number
          name: string
          opening_hours?: string | null
          order_sequence?: number
          partner_code?: string
          points_reward?: number
          qr_code_token?: string
          requires_photo?: boolean
          slug: string
          validation_mode?: Database["public"]["Enums"]["validation_mode"]
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: Database["public"]["Enums"]["attraction_category"]
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          destination_id?: string
          gallery_urls?: string[]
          geofence_radius_meters?: number
          history?: string | null
          id?: string
          instagram?: string | null
          is_passport_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          opening_hours?: string | null
          order_sequence?: number
          partner_code?: string
          points_reward?: number
          qr_code_token?: string
          requires_photo?: boolean
          slug?: string
          validation_mode?: Database["public"]["Enums"]["validation_mode"]
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attractions_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_partners: {
        Row: {
          address: string | null
          business_name: string
          category: string | null
          created_at: string
          destination_id: string
          email: string | null
          facade_url: string | null
          id: string
          logo_url: string | null
          owner_id: string | null
          phone: string | null
          status: Database["public"]["Enums"]["partner_status"]
          trade_name: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          category?: string | null
          created_at?: string
          destination_id: string
          email?: string | null
          facade_url?: string | null
          id?: string
          logo_url?: string | null
          owner_id?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          trade_name?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          category?: string | null
          created_at?: string
          destination_id?: string
          email?: string | null
          facade_url?: string | null
          id?: string
          logo_url?: string | null
          owner_id?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          trade_name?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commercial_partners_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_partners_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          active: boolean
          banner_url: string | null
          created_at: string
          home_display: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
          state: string
        }
        Insert: {
          active?: boolean
          banner_url?: string | null
          created_at?: string
          home_display?: string
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
          state: string
        }
        Update: {
          active?: boolean
          banner_url?: string | null
          created_at?: string
          home_display?: string
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
          state?: string
        }
        Relationships: []
      }
      passport_checkins: {
        Row: {
          attraction_id: string
          created_at: string
          destination_id: string
          id: string
          user_id: string
          validation_type: Database["public"]["Enums"]["validation_type"]
        }
        Insert: {
          attraction_id: string
          created_at?: string
          destination_id: string
          id?: string
          user_id: string
          validation_type: Database["public"]["Enums"]["validation_type"]
        }
        Update: {
          attraction_id?: string
          created_at?: string
          destination_id?: string
          id?: string
          user_id?: string
          validation_type?: Database["public"]["Enums"]["validation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "passport_checkins_attraction_id_fkey"
            columns: ["attraction_id"]
            isOneToOne: false
            referencedRelation: "attractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passport_checkins_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passport_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city_origin: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          state_origin: string | null
        }
        Insert: {
          avatar_url?: string | null
          city_origin?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          state_origin?: string | null
        }
        Update: {
          avatar_url?: string | null
          city_origin?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          state_origin?: string | null
        }
        Relationships: []
      }
      rewards: {
        Row: {
          created_at: string
          description: string | null
          destination_id: string
          discount_percentage: number | null
          id: string
          is_active: boolean
          partner_id: string | null
          required_checkins_count: number
          reward_type: Database["public"]["Enums"]["reward_type"]
          route_only: boolean
          stock_limit: number | null
          title: string
          voucher_prefix: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          destination_id: string
          discount_percentage?: number | null
          id?: string
          is_active?: boolean
          partner_id?: string | null
          required_checkins_count?: number
          reward_type?: Database["public"]["Enums"]["reward_type"]
          route_only?: boolean
          stock_limit?: number | null
          title: string
          voucher_prefix?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          destination_id?: string
          discount_percentage?: number | null
          id?: string
          is_active?: boolean
          partner_id?: string | null
          required_checkins_count?: number
          reward_type?: Database["public"]["Enums"]["reward_type"]
          route_only?: boolean
          stock_limit?: number | null
          title?: string
          voucher_prefix?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "commercial_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      route_checkpoints: {
        Row: {
          attraction_id: string
          id: string
          position: number
          route_id: string
        }
        Insert: {
          attraction_id: string
          id?: string
          position?: number
          route_id: string
        }
        Update: {
          attraction_id?: string
          id?: string
          position?: number
          route_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_checkpoints_attraction_id_fkey"
            columns: ["attraction_id"]
            isOneToOne: false
            referencedRelation: "attractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_checkpoints_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "thematic_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      thematic_routes: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          destination_id: string
          estimated_duration: string | null
          id: string
          is_active: boolean
          mode: string
          order_sequence: number
          reward_id: string | null
          slug: string
          title: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          destination_id: string
          estimated_duration?: string | null
          id?: string
          is_active?: boolean
          mode?: string
          order_sequence?: number
          reward_id?: string | null
          slug: string
          title: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          destination_id?: string
          estimated_duration?: string | null
          id?: string
          is_active?: boolean
          mode?: string
          order_sequence?: number
          reward_id?: string | null
          slug?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "thematic_routes_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thematic_routes_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
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
      user_vouchers: {
        Row: {
          created_at: string
          id: string
          qr_code_data: string
          redeemed_at: string | null
          redeemed_by_partner_id: string | null
          reward_id: string
          status: Database["public"]["Enums"]["voucher_status"]
          user_id: string
          voucher_code: string
        }
        Insert: {
          created_at?: string
          id?: string
          qr_code_data: string
          redeemed_at?: string | null
          redeemed_by_partner_id?: string | null
          reward_id: string
          status?: Database["public"]["Enums"]["voucher_status"]
          user_id: string
          voucher_code: string
        }
        Update: {
          created_at?: string
          id?: string
          qr_code_data?: string
          redeemed_at?: string | null
          redeemed_by_partner_id?: string | null
          reward_id?: string
          status?: Database["public"]["Enums"]["voucher_status"]
          user_id?: string
          voucher_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_vouchers_redeemed_by_partner_id_fkey"
            columns: ["redeemed_by_partner_id"]
            isOneToOne: false
            referencedRelation: "commercial_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vouchers_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vouchers_user_id_fkey"
            columns: ["user_id"]
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
      _do_checkin: {
        Args: {
          _attr: Database["public"]["Tables"]["attractions"]["Row"]
          _type: Database["public"]["Enums"]["validation_type"]
        }
        Returns: Json
      }
      _grant_route_vouchers: {
        Args: { _attraction: string; _user: string }
        Returns: number
      }
      _grant_vouchers: {
        Args: { _dest: string; _user: string }
        Returns: number
      }
      _route_completed: {
        Args: { _route: string; _user: string }
        Returns: boolean
      }
      admin_attraction_secrets: {
        Args: never
        Returns: {
          id: string
          partner_code: string
          qr_code_token: string
        }[]
      }
      admin_manual_checkin: {
        Args: { _attraction_id: string; _user: string }
        Returns: Json
      }
      attraction_by_qr: { Args: { _token: string }; Returns: string }
      checkin_code: {
        Args: { _attraction_id: string; _code: string }
        Returns: Json
      }
      checkin_geofence: {
        Args: { _attraction_id: string; _lat: number; _lng: number }
        Returns: Json
      }
      checkin_qr: { Args: { _token: string }; Returns: Json }
      deliver_reward_retroactive: {
        Args: { _reward_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      partner_redemption_history: {
        Args: never
        Returns: {
          redeemed_at: string
          reward_title: string
          tourist: string
          voucher_code: string
        }[]
      }
      redeem_voucher: { Args: { _code: string }; Returns: Json }
    }
    Enums: {
      app_role: "tourist" | "partner" | "manager" | "admin"
      attraction_category:
        | "parque"
        | "cultural"
        | "gastronomia"
        | "historico"
        | "feira"
        | "museu"
        | "natureza"
        | "outro"
      partner_status: "pending" | "active" | "suspended"
      reward_type: "discount" | "gift" | "badge" | "experience"
      validation_mode: "geofence" | "code" | "both"
      validation_type: "geofence" | "qrcode" | "partner_code" | "manual_admin"
      voucher_status: "available" | "redeemed" | "expired"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["tourist", "partner", "manager", "admin"],
      attraction_category: [
        "parque",
        "cultural",
        "gastronomia",
        "historico",
        "feira",
        "museu",
        "natureza",
        "outro",
      ],
      partner_status: ["pending", "active", "suspended"],
      reward_type: ["discount", "gift", "badge", "experience"],
      validation_mode: ["geofence", "code", "both"],
      validation_type: ["geofence", "qrcode", "partner_code", "manual_admin"],
      voucher_status: ["available", "redeemed", "expired"],
    },
  },
} as const
