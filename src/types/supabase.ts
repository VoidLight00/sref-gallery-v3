// Supabase Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          username: string | null
          password: string | null
          avatar: string | null
          bio: string | null
          is_premium: boolean
          role: 'USER' | 'PREMIUM' | 'ADMIN'
          email_verified: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          username?: string | null
          password?: string | null
          avatar?: string | null
          bio?: string | null
          is_premium?: boolean
          role?: 'USER' | 'PREMIUM' | 'ADMIN'
          email_verified?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          username?: string | null
          password?: string | null
          avatar?: string | null
          bio?: string | null
          is_premium?: boolean
          role?: 'USER' | 'PREMIUM' | 'ADMIN'
          email_verified?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      sref_codes: {
        Row: {
          id: string
          code: string
          title: string
          description: string | null
          prompt_examples: string[] | null
          image_url: string | null
          featured: boolean
          premium: boolean
          view_count: number
          like_count: number
          favorite_count: number
          comment_count: number
          status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'DELETED'
          published_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          code: string
          title: string
          description?: string | null
          prompt_examples?: string[] | null
          image_url?: string | null
          featured?: boolean
          premium?: boolean
          view_count?: number
          like_count?: number
          favorite_count?: number
          comment_count?: number
          status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'DELETED'
          published_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          code?: string
          title?: string
          description?: string | null
          prompt_examples?: string[] | null
          image_url?: string | null
          featured?: boolean
          premium?: boolean
          view_count?: number
          like_count?: number
          favorite_count?: number
          comment_count?: number
          status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'DELETED'
          published_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          user_id?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          color: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          color?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          use_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          use_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          use_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          sref_code_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sref_code_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sref_code_id?: string
          created_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          sref_code_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sref_code_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sref_code_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          content: string
          user_id: string
          sref_code_id: string
          parent_id: string | null
          is_edited: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          content: string
          user_id: string
          sref_code_id: string
          parent_id?: string | null
          is_edited?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          content?: string
          user_id?: string
          sref_code_id?: string
          parent_id?: string | null
          is_edited?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_view_count: {
        Args: { sref_id: string }
        Returns: void
      }
      search_sref_codes: {
        Args: {
          search_query: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          id: string
          code: string
          title: string
          description: string | null
          rank: number
        }[]
      }
    }
    Enums: {
      user_role: 'USER' | 'PREMIUM' | 'ADMIN'
      sref_status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'DELETED'
      analytics_event: 'VIEW' | 'LIKE' | 'FAVORITE' | 'SHARE' | 'DOWNLOAD' | 'COMMENT'
    }
  }
}
