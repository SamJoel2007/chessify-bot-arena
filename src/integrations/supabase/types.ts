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
      certificates: {
        Row: {
          bot_defeated: string
          bot_rating: number
          certificate_data: Json | null
          certificate_name: string
          created_at: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          bot_defeated: string
          bot_rating: number
          certificate_data?: Json | null
          certificate_name: string
          created_at?: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          bot_defeated?: string
          bot_rating?: number
          certificate_data?: Json | null
          certificate_name?: string
          created_at?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          created_at: string
          email: string
          event_name: string
          full_name: string
          id: string
          phone_number: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          event_name?: string
          full_name: string
          id?: string
          phone_number: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          event_name?: string
          full_name?: string
          id?: string
          phone_number?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          id: string
          name: string
          start_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_challenges: {
        Row: {
          challenged_avatar: string | null
          challenged_id: string
          challenged_username: string
          challenger_avatar: string | null
          challenger_id: string
          challenger_username: string
          created_at: string
          expires_at: string
          game_id: string | null
          id: string
          status: string
        }
        Insert: {
          challenged_avatar?: string | null
          challenged_id: string
          challenged_username: string
          challenger_avatar?: string | null
          challenger_id: string
          challenger_username: string
          created_at?: string
          expires_at?: string
          game_id?: string | null
          id?: string
          status?: string
        }
        Update: {
          challenged_avatar?: string | null
          challenged_id?: string
          challenged_username?: string
          challenger_avatar?: string | null
          challenger_id?: string
          challenger_username?: string
          created_at?: string
          expires_at?: string
          game_id?: string | null
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_challenges_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_chat: {
        Row: {
          created_at: string
          game_id: string
          id: string
          message: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          message: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          message?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      game_moves: {
        Row: {
          created_at: string
          fen_after: string
          game_id: string
          id: string
          move_number: number
          move_san: string
          player_id: string
          time_taken: number
        }
        Insert: {
          created_at?: string
          fen_after: string
          game_id: string
          id?: string
          move_number: number
          move_san: string
          player_id: string
          time_taken: number
        }
        Update: {
          created_at?: string
          fen_after?: string
          game_id?: string
          id?: string
          move_number?: number
          move_san?: string
          player_id?: string
          time_taken?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_moves_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          black_avatar: string | null
          black_player_id: string
          black_time_remaining: number
          black_username: string
          created_at: string
          current_fen: string
          current_turn: string
          id: string
          status: string
          updated_at: string
          white_avatar: string | null
          white_player_id: string
          white_time_remaining: number
          white_username: string
          winner_id: string | null
        }
        Insert: {
          black_avatar?: string | null
          black_player_id: string
          black_time_remaining?: number
          black_username: string
          created_at?: string
          current_fen?: string
          current_turn?: string
          id?: string
          status?: string
          updated_at?: string
          white_avatar?: string | null
          white_player_id: string
          white_time_remaining?: number
          white_username: string
          winner_id?: string | null
        }
        Update: {
          black_avatar?: string | null
          black_player_id?: string
          black_time_remaining?: number
          black_username?: string
          created_at?: string
          current_fen?: string
          current_turn?: string
          id?: string
          status?: string
          updated_at?: string
          white_avatar?: string | null
          white_player_id?: string
          white_time_remaining?: number
          white_username?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      match_queue: {
        Row: {
          created_at: string
          current_avatar: string | null
          expires_at: string
          id: string
          time_control: number
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          current_avatar?: string | null
          expires_at?: string
          id?: string
          time_control?: number
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          current_avatar?: string | null
          expires_at?: string
          id?: string
          time_control?: number
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          related_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          related_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          related_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          coins: number
          created_at: string
          current_avatar: string | null
          email: string | null
          id: string
          points: number
          rank: Database["public"]["Enums"]["user_rank"]
          updated_at: string
          username: string | null
        }
        Insert: {
          coins?: number
          created_at?: string
          current_avatar?: string | null
          email?: string | null
          id: string
          points?: number
          rank?: Database["public"]["Enums"]["user_rank"]
          updated_at?: string
          username?: string | null
        }
        Update: {
          coins?: number
          created_at?: string
          current_avatar?: string | null
          email?: string | null
          id?: string
          points?: number
          rank?: Database["public"]["Enums"]["user_rank"]
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          id: string
          registered_at: string
          tournament_id: string
          user_id: string
          username: string
        }
        Insert: {
          id?: string
          registered_at?: string
          tournament_id: string
          user_id: string
          username: string
        }
        Update: {
          id?: string
          registered_at?: string
          tournament_id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          max_participants: number | null
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          max_participants?: number | null
          name: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          max_participants?: number | null
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          id: string
          item_data: Json | null
          item_id: string
          item_name: string
          item_type: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          id?: string
          item_data?: Json | null
          item_id: string
          item_name: string
          item_type: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          id?: string
          item_data?: Json | null
          item_id?: string
          item_name?: string
          item_type?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          role: Database["public"]["Enums"]["app_role"]
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
      user_spins: {
        Row: {
          created_at: string
          id: string
          last_spin_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_spin_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_spin_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_queue_entries: { Args: never; Returns: undefined }
      expire_old_challenges: { Args: never; Returns: undefined }
      find_match: {
        Args: {
          p_current_avatar: string
          p_time_control?: number
          p_user_id: string
          p_username: string
        }
        Returns: Json
      }
      get_user_role: {
        Args: { target_user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      handle_purchase: {
        Args: {
          p_item_data: Json
          p_item_id: string
          p_item_name: string
          p_item_type: string
          p_price: number
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_user_points: {
        Args: { points_change: number; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      user_rank: "bronze" | "silver" | "gold" | "diamond" | "platinum"
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
      user_rank: ["bronze", "silver", "gold", "diamond", "platinum"],
    },
  },
} as const
