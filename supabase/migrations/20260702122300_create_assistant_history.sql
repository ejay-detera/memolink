create table public.assistant_threads (
  id uuid primary key default gen_random_uuid(),
  senior_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New Conversation',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.assistant_threads enable row level security;

create policy "Users can view their own threads"
  on public.assistant_threads for select
  using (auth.uid() = senior_id);

create policy "Users can insert their own threads"
  on public.assistant_threads for insert
  with check (auth.uid() = senior_id);

create policy "Users can update their own threads"
  on public.assistant_threads for update
  using (auth.uid() = senior_id);

create policy "Users can delete their own threads"
  on public.assistant_threads for delete
  using (auth.uid() = senior_id);

create table public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.assistant_threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.assistant_messages enable row level security;

create policy "Users can view messages in their threads"
  on public.assistant_messages for select
  using (
    exists (
      select 1 from public.assistant_threads
      where assistant_threads.id = assistant_messages.thread_id
      and assistant_threads.senior_id = auth.uid()
    )
  );

create policy "Users can insert messages to their threads"
  on public.assistant_messages for insert
  with check (
    exists (
      select 1 from public.assistant_threads
      where assistant_threads.id = assistant_messages.thread_id
      and assistant_threads.senior_id = auth.uid()
    )
  );
