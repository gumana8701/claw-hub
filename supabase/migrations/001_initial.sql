-- Profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Channels (each maps to an OpenClaw agent)
create table if not exists public.channels (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  agent_webhook_url text,
  agent_name text,
  icon text default '🤖',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  sender_id uuid references public.profiles(id),
  sender_type text default 'user' check (sender_type in ('user', 'agent')),
  content text,
  message_type text default 'text' check (message_type in ('text', 'audio', 'file', 'image')),
  file_url text,
  file_name text,
  file_size bigint,
  file_type text,
  audio_duration float,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_messages_channel_id on public.messages(channel_id);
create index if not exists idx_messages_created_at on public.messages(created_at);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;

-- RLS Policies
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Authenticated users can view channels" on public.channels for select using (auth.role() = 'authenticated');
create policy "Authenticated users can create channels" on public.channels for insert with check (auth.role() = 'authenticated');
create policy "Channel creators can update" on public.channels for update using (auth.uid() = created_by);
create policy "Channel creators can delete" on public.channels for delete using (auth.uid() = created_by);

create policy "Authenticated users can view messages" on public.messages for select using (auth.role() = 'authenticated');
create policy "Authenticated users can send messages" on public.messages for insert with check (auth.role() = 'authenticated');

-- Enable Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.channels;

-- Storage bucket for file uploads (500MB limit)
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', true, 524288000)
on conflict (id) do nothing;

-- Storage policies
create policy "Authenticated users can upload" on storage.objects for insert with check (bucket_id = 'attachments' and auth.role() = 'authenticated');
create policy "Anyone can view attachments" on storage.objects for select using (bucket_id = 'attachments');
create policy "Owners can delete attachments" on storage.objects for delete using (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1]);

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto-profile creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
