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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          page_path: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          function_name: string
          id: string
          items_created: number
          metadata: Json | null
          started_at: string
          status: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          function_name: string
          id?: string
          items_created?: number
          metadata?: Json | null
          started_at?: string
          status?: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          function_name?: string
          id?: string
          items_created?: number
          metadata?: Json | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      autonomous_colleges_directory: {
        Row: {
          affiliated_university: string | null
          autonomous_since: number | null
          city: string | null
          college_name: string
          created_at: string | null
          id: string
          institution_type: string | null
          is_active: boolean | null
          naac_grade: string | null
          source_url: string | null
          state: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          affiliated_university?: string | null
          autonomous_since?: number | null
          city?: string | null
          college_name: string
          created_at?: string | null
          id?: string
          institution_type?: string | null
          is_active?: boolean | null
          naac_grade?: string | null
          source_url?: string | null
          state: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          affiliated_university?: string | null
          autonomous_since?: number | null
          city?: string | null
          college_name?: string
          created_at?: string | null
          id?: string
          institution_type?: string | null
          is_active?: boolean | null
          naac_grade?: string | null
          source_url?: string | null
          state?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          ai_model: string | null
          author_id: string | null
          author_name: string | null
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          id: string
          is_ai_generated: boolean
          is_featured: boolean
          is_published: boolean
          published_at: string | null
          review_status: string
          slug: string
          source_notification_title: string | null
          source_notification_url: string | null
          source_urls: string[] | null
          summary: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_model?: string | null
          author_id?: string | null
          author_name?: string | null
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          review_status?: string
          slug: string
          source_notification_title?: string | null
          source_notification_url?: string | null
          source_urls?: string[] | null
          summary?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_model?: string | null
          author_id?: string | null
          author_name?: string | null
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          review_status?: string
          slug?: string
          source_notification_title?: string | null
          source_notification_url?: string | null
          source_urls?: string[] | null
          summary?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string
          certificate_type: string
          event_id: string | null
          holder_name: string
          id: string
          issued_at: string
          program_id: string | null
          user_id: string
        }
        Insert: {
          certificate_number: string
          certificate_type?: string
          event_id?: string | null
          holder_name: string
          id?: string
          issued_at?: string
          program_id?: string | null
          user_id: string
        }
        Update: {
          certificate_number?: string
          certificate_type?: string
          event_id?: string | null
          holder_name?: string
          id?: string
          issued_at?: string
          program_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completed_at: string | null
          enrolled_at: string
          id: string
          program_id: string
          progress_percent: number
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          program_id: string
          progress_percent?: number
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          program_id?: string
          progress_percent?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          attended: boolean
          certificate_id: string | null
          event_id: string
          id: string
          pass_code: string | null
          registered_at: string
          user_id: string
        }
        Insert: {
          attended?: boolean
          certificate_id?: string | null
          event_id: string
          id?: string
          pass_code?: string | null
          registered_at?: string
          user_id: string
        }
        Update: {
          attended?: boolean
          certificate_id?: string | null
          event_id?: string
          id?: string
          pass_code?: string | null
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          content: string | null
          cover_image_url: string | null
          created_at: string
          description: string
          end_date: string | null
          event_date: string
          event_type: string
          flyer_image_url: string | null
          highlights: Json | null
          id: string
          is_featured: boolean
          is_published: boolean
          location: string | null
          max_attendees: number | null
          registration_url: string | null
          slug: string
          speakers: Json | null
          tags: string[] | null
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string
          end_date?: string | null
          event_date: string
          event_type?: string
          flyer_image_url?: string | null
          highlights?: Json | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          location?: string | null
          max_attendees?: number | null
          registration_url?: string | null
          slug: string
          speakers?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string
          end_date?: string | null
          event_date?: string
          event_type?: string
          flyer_image_url?: string | null
          highlights?: Json | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          location?: string | null
          max_attendees?: number | null
          registration_url?: string | null
          slug?: string
          speakers?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      institutions: {
        Row: {
          achievements: string | null
          address: string | null
          affiliated_university: string | null
          city: string | null
          created_at: string
          description: string | null
          established_year: number | null
          faculty_count: number | null
          id: string
          institution_name: string
          institution_type: string
          logo_url: string | null
          membership_id: string | null
          membership_status: string
          naac_grade: string | null
          nirf_rank: number | null
          notable_alumni: string | null
          pincode: string | null
          programs_offered: string[] | null
          representative_designation: string | null
          representative_email: string
          representative_name: string
          representative_phone: string | null
          representative_user_id: string | null
          state: string | null
          student_count: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          achievements?: string | null
          address?: string | null
          affiliated_university?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          established_year?: number | null
          faculty_count?: number | null
          id?: string
          institution_name: string
          institution_type?: string
          logo_url?: string | null
          membership_id?: string | null
          membership_status?: string
          naac_grade?: string | null
          nirf_rank?: number | null
          notable_alumni?: string | null
          pincode?: string | null
          programs_offered?: string[] | null
          representative_designation?: string | null
          representative_email: string
          representative_name: string
          representative_phone?: string | null
          representative_user_id?: string | null
          state?: string | null
          student_count?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          achievements?: string | null
          address?: string | null
          affiliated_university?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          established_year?: number | null
          faculty_count?: number | null
          id?: string
          institution_name?: string
          institution_type?: string
          logo_url?: string | null
          membership_id?: string | null
          membership_status?: string
          naac_grade?: string | null
          nirf_rank?: number | null
          notable_alumni?: string | null
          pincode?: string | null
          programs_offered?: string[] | null
          representative_designation?: string | null
          representative_email?: string
          representative_name?: string
          representative_phone?: string | null
          representative_user_id?: string | null
          state?: string | null
          student_count?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      module_progress: {
        Row: {
          id: string
          is_completed: boolean
          last_watched_at: string
          module_id: string
          program_id: string
          user_id: string
          watch_percent: number
        }
        Insert: {
          id?: string
          is_completed?: boolean
          last_watched_at?: string
          module_id: string
          program_id: string
          user_id: string
          watch_percent?: number
        }
        Update: {
          id?: string
          is_completed?: boolean
          last_watched_at?: string
          module_id?: string
          program_id?: string
          user_id?: string
          watch_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "program_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_progress_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      news_updates: {
        Row: {
          category: string
          content: string | null
          created_at: string
          expires_at: string | null
          id: string
          image_url: string | null
          is_ai_generated: boolean
          is_pinned: boolean
          is_published: boolean
          job_sub_category: string | null
          last_date: string | null
          location: string | null
          organization: string | null
          published_at: string
          retention_category: string
          source_name: string | null
          source_url: string | null
          summary: string
          title: string
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_ai_generated?: boolean
          is_pinned?: boolean
          is_published?: boolean
          job_sub_category?: string | null
          last_date?: string | null
          location?: string | null
          organization?: string | null
          published_at?: string
          retention_category?: string
          source_name?: string | null
          source_url?: string | null
          summary: string
          title: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_ai_generated?: boolean
          is_pinned?: boolean
          is_published?: boolean
          job_sub_category?: string | null
          last_date?: string | null
          location?: string | null
          organization?: string | null
          published_at?: string
          retention_category?: string
          source_name?: string | null
          source_url?: string | null
          summary?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          department: string | null
          designation: string | null
          email: string | null
          experience_years: number | null
          full_name: string | null
          google_scholar_url: string | null
          id: string
          institution: string | null
          linkedin_url: string | null
          membership_id: string | null
          membership_status: string | null
          phone: string | null
          specialization: string | null
          state: string | null
          teacher_type: string | null
          updated_at: string
          country: string | null
          work_email: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string | null
          experience_years?: number | null
          full_name?: string | null
          google_scholar_url?: string | null
          id: string
          institution?: string | null
          linkedin_url?: string | null
          membership_id?: string | null
          membership_status?: string | null
          phone?: string | null
          specialization?: string | null
          state?: string | null
          teacher_type?: string | null
          updated_at?: string
          country?: string | null
          work_email?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string | null
          experience_years?: number | null
          full_name?: string | null
          google_scholar_url?: string | null
          id?: string
          institution?: string | null
          linkedin_url?: string | null
          membership_id?: string | null
          membership_status?: string | null
          phone?: string | null
          specialization?: string | null
          state?: string | null
          teacher_type?: string | null
          updated_at?: string
          country?: string | null
          work_email?: string | null
        }
        Relationships: []
      }
      program_modules: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          program_id: string
          sort_order: number
          title: string
          video_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          program_id: string
          sort_order?: number
          title: string
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          program_id?: string
          sort_order?: number
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_modules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          certificate_type: string
          completion_threshold: number
          cover_image_url: string | null
          created_at: string
          description: string
          duration_hours: number | null
          id: string
          is_featured: boolean
          is_published: boolean
          program_type: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          certificate_type?: string
          completion_threshold?: number
          cover_image_url?: string | null
          created_at?: string
          description?: string
          duration_hours?: number | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          program_type?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          certificate_type?: string
          completion_threshold?: number
          cover_image_url?: string | null
          created_at?: string
          description?: string
          duration_hours?: number | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          program_type?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tool_results: {
        Row: {
          created_at: string
          id: string
          input_data: Json
          result_data: Json
          score: number | null
          tool_name: string
          tool_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_data?: Json
          result_data?: Json
          score?: number | null
          tool_name: string
          tool_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_data?: Json
          result_data?: Json
          score?: number | null
          tool_name?: string
          tool_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      institutions_public: {
        Row: {
          achievements: string | null
          address: string | null
          affiliated_university: string | null
          city: string | null
          created_at: string | null
          description: string | null
          established_year: number | null
          faculty_count: number | null
          id: string | null
          institution_name: string | null
          institution_type: string | null
          logo_url: string | null
          membership_id: string | null
          membership_status: string | null
          naac_grade: string | null
          nirf_rank: number | null
          notable_alumni: string | null
          pincode: string | null
          programs_offered: string[] | null
          state: string | null
          student_count: number | null
          website: string | null
        }
        Insert: {
          achievements?: string | null
          address?: string | null
          affiliated_university?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          established_year?: number | null
          faculty_count?: number | null
          id?: string | null
          institution_name?: string | null
          institution_type?: string | null
          logo_url?: string | null
          membership_id?: string | null
          membership_status?: string | null
          naac_grade?: string | null
          nirf_rank?: number | null
          notable_alumni?: string | null
          pincode?: string | null
          programs_offered?: string[] | null
          state?: string | null
          student_count?: number | null
          website?: string | null
        }
        Update: {
          achievements?: string | null
          address?: string | null
          affiliated_university?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          established_year?: number | null
          faculty_count?: number | null
          id?: string | null
          institution_name?: string | null
          institution_type?: string | null
          logo_url?: string | null
          membership_id?: string | null
          membership_status?: string | null
          naac_grade?: string | null
          nirf_rank?: number | null
          notable_alumni?: string | null
          pincode?: string | null
          programs_offered?: string[] | null
          state?: string | null
          student_count?: number | null
          website?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          department: string | null
          designation: string | null
          experience_years: number | null
          full_name: string | null
          google_scholar_url: string | null
          id: string | null
          institution: string | null
          linkedin_url: string | null
          membership_id: string | null
          membership_status: string | null
          specialization: string | null
          state: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          department?: string | null
          designation?: string | null
          experience_years?: number | null
          full_name?: string | null
          google_scholar_url?: string | null
          id?: string | null
          institution?: string | null
          linkedin_url?: string | null
          membership_id?: string | null
          membership_status?: string | null
          specialization?: string | null
          state?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          department?: string | null
          designation?: string | null
          experience_years?: number | null
          full_name?: string | null
          google_scholar_url?: string | null
          id?: string | null
          institution?: string | null
          linkedin_url?: string | null
          membership_id?: string | null
          membership_status?: string | null
          specialization?: string | null
          state?: string | null
        }
        Relationships: []
      }
      public_institutions: {
        Row: {
          achievements: string | null
          affiliated_university: string | null
          city: string | null
          created_at: string | null
          description: string | null
          established_year: number | null
          faculty_count: number | null
          id: string | null
          institution_name: string | null
          institution_type: string | null
          logo_url: string | null
          membership_id: string | null
          naac_grade: string | null
          nirf_rank: number | null
          notable_alumni: string | null
          pincode: string | null
          programs_offered: string[] | null
          state: string | null
          student_count: number | null
          website: string | null
        }
        Insert: {
          achievements?: string | null
          affiliated_university?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          established_year?: number | null
          faculty_count?: number | null
          id?: string | null
          institution_name?: string | null
          institution_type?: string | null
          logo_url?: string | null
          membership_id?: string | null
          naac_grade?: string | null
          nirf_rank?: number | null
          notable_alumni?: string | null
          pincode?: string | null
          programs_offered?: string[] | null
          state?: string | null
          student_count?: number | null
          website?: string | null
        }
        Update: {
          achievements?: string | null
          affiliated_university?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          established_year?: number | null
          faculty_count?: number | null
          id?: string | null
          institution_name?: string | null
          institution_type?: string | null
          logo_url?: string | null
          membership_id?: string | null
          naac_grade?: string | null
          nirf_rank?: number | null
          notable_alumni?: string | null
          pincode?: string | null
          programs_offered?: string[] | null
          state?: string | null
          student_count?: number | null
          website?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          department: string | null
          designation: string | null
          experience_years: number | null
          full_name: string | null
          id: string | null
          institution: string | null
          membership_id: string | null
          specialization: string | null
          state: string | null
          teacher_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          department?: string | null
          designation?: string | null
          experience_years?: number | null
          full_name?: string | null
          id?: string | null
          institution?: string | null
          membership_id?: string | null
          specialization?: string | null
          state?: string | null
          teacher_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          department?: string | null
          designation?: string | null
          experience_years?: number | null
          full_name?: string | null
          id?: string | null
          institution?: string | null
          membership_id?: string | null
          specialization?: string | null
          state?: string | null
          teacher_type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_certificate_number: { Args: never; Returns: string }
      generate_institution_membership_id: { Args: never; Returns: string }
      generate_membership_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
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
      app_role: ["super_admin", "admin", "user"],
    },
  },
} as const
