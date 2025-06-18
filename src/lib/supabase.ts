import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      beta_testers: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          device_type: 'ios' | 'android' /*| 'huawei'*/;
          device_model: string;
          experience_level: 'beginner' | 'intermediate' | 'expert';
          status: 'pending' | 'approved' | 'invited' | 'active' | 'declined';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          device_type: 'ios' | 'android' /*| 'huawei'*/;
          device_model: string;
          experience_level: 'beginner' | 'intermediate' | 'expert';
          status?: 'pending' | 'approved' | 'invited' | 'active' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          device_type?: 'ios' | 'android' /*| 'huawei'*/;
          device_model?: string;
          experience_level?: 'beginner' | 'intermediate' | 'expert';
          status?: 'pending' | 'approved' | 'invited' | 'active' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
      };
      beta_invitations: {
        Row: {
          id: string;
          tester_id: string;
          platform: 'google_play' | 'app_store' /*| 'huawei_gallery'*/;
          invitation_sent_at: string;
          status: 'sent' | 'accepted' | 'declined' | 'expired';
          invitation_link: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tester_id: string;
          platform: 'google_play' | 'app_store' /*| 'huawei_gallery'*/;
          invitation_sent_at?: string;
          status?: 'sent' | 'accepted' | 'declined' | 'expired';
          invitation_link: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tester_id?: string;
          platform?: 'google_play' | 'app_store' /*| 'huawei_gallery'*/;
          invitation_sent_at?: string;
          status?: 'sent' | 'accepted' | 'declined' | 'expired';
          invitation_link?: string;
          created_at?: string;
        };
      };
      beta_feedback: {
        Row: {
          id: string;
          device_type: 'ios' | 'android' /*| 'huawei'*/;
          device_model: string;
          feedback_type: 'bug_report' | 'suggestion' | 'general_comment';
          comment: string;
          is_anonymous: boolean;
          email: string | null;
          status: 'to_discuss' | 'low' | 'high' | 'to_implement' | 'archived'/* | 'published'*/;
          development_estimate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          device_type: 'ios' | 'android' /*| 'huawei'*/;
          device_model: string;
          feedback_type: 'bug_report' | 'suggestion' | 'general_comment';
          comment: string;
          is_anonymous?: boolean;
          email?: string | null;
          status?: 'to_discuss' | 'low' | 'high' | 'to_implement' | 'archived' | 'published';
          development_estimate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          device_type?: 'ios' | 'android' /*| 'huawei'*/;
          device_model?: string;
          feedback_type?: 'bug_report' | 'suggestion' | 'general_comment';
          comment?: string;
          is_anonymous?: boolean;
          email?: string | null;
          status?: 'to_discuss' | 'low' | 'high' | 'to_implement' | 'archived' | 'published';
          development_estimate?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};