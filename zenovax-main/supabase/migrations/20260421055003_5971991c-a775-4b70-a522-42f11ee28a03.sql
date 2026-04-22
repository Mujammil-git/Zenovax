
-- Notes
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default 'Untitled',
  content text default '',
  tags text[] default '{}',
  pinned boolean default false,
  color text default 'default',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.notes enable row level security;
create policy "users manage own notes" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Habits
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  icon text default '🔥',
  color text default 'orange',
  target_per_week integer default 7,
  cadence text default 'daily',
  created_at timestamptz default now()
);
alter table public.habits enable row level security;
create policy "users manage own habits" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  habit_id uuid not null references public.habits(id) on delete cascade,
  log_date date not null default current_date,
  created_at timestamptz default now(),
  unique (habit_id, log_date)
);
alter table public.habit_logs enable row level security;
create policy "users manage own habit logs" on public.habit_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Money
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric(12,2) not null,
  type text not null default 'expense',
  category text not null default 'Other',
  description text default '',
  txn_date date not null default current_date,
  created_at timestamptz default now()
);
alter table public.transactions enable row level security;
create policy "users manage own transactions" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  category text not null,
  monthly_limit numeric(12,2) not null,
  created_at timestamptz default now(),
  unique (user_id, category)
);
alter table public.budgets enable row level security;
create policy "users manage own budgets" on public.budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Calendar events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text default '',
  start_at timestamptz not null,
  end_at timestamptz not null,
  color text default 'blue',
  all_day boolean default false,
  created_at timestamptz default now()
);
alter table public.events enable row level security;
create policy "users manage own events" on public.events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Focus sessions
create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  duration_minutes integer not null,
  session_type text default 'pomodoro',
  task_id uuid,
  completed_at timestamptz default now()
);
alter table public.focus_sessions enable row level security;
create policy "users manage own focus sessions" on public.focus_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- AI messages
create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  conversation_id uuid not null default gen_random_uuid(),
  role text not null,
  content text not null,
  created_at timestamptz default now()
);
alter table public.ai_messages enable row level security;
create policy "users manage own ai messages" on public.ai_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index idx_notes_user on public.notes(user_id);
create index idx_habits_user on public.habits(user_id);
create index idx_habit_logs_user_date on public.habit_logs(user_id, log_date);
create index idx_transactions_user_date on public.transactions(user_id, txn_date);
create index idx_events_user_start on public.events(user_id, start_at);
create index idx_focus_user on public.focus_sessions(user_id);
create index idx_ai_msg_user_conv on public.ai_messages(user_id, conversation_id);
