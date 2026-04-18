export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  agent_webhook_url: string | null;
  agent_name: string | null;
  icon: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string | null;
  sender_type: 'user' | 'agent';
  content: string | null;
  message_type: 'text' | 'audio' | 'file' | 'image';
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  audio_duration: number | null;
  created_at: string;
  profiles?: Profile;
}
