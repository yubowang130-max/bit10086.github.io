begin;

-- Allowlist is administered through SQL only, never by browser clients.
create table public.chapter_owners (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.chapter_owners enable row level security;
revoke all on public.chapter_owners from anon, authenticated;

create function public.chapter_is_owner() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.chapter_owners where user_id = (select auth.uid())); $$;
revoke all on function public.chapter_is_owner() from public, anon;
grant execute on function public.chapter_is_owner() to authenticated;

create table public.chapter_state (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  document jsonb not null check (jsonb_typeof(document) = 'object' and document->>'version' = '1'),
  revision bigint not null check (revision > 0),
  last_write_id uuid not null,
  updated_at timestamptz not null default now()
);
alter table public.chapter_state enable row level security;
revoke all on public.chapter_state from anon, authenticated;
grant select on public.chapter_state to authenticated;
create policy chapter_read_own on public.chapter_state for select to authenticated
using (owner_id = (select auth.uid()) and (select public.chapter_is_owner()));

-- Atomic compare-and-swap; a repeated write ID safely handles a lost response.
create function public.chapter_save(p_owner_id uuid, p_expected_revision bigint, p_write_id uuid, p_document jsonb)
returns bigint language plpgsql security definer set search_path = ''
as $$
declare current_row public.chapter_state%rowtype;
begin
  if auth.uid() is null or auth.uid() is distinct from p_owner_id or not public.chapter_is_owner() then
    raise exception 'CHAPTER_FORBIDDEN' using errcode = '42501';
  end if;
  if p_write_id is null or p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'CHAPTER_INVALID_INPUT' using errcode = '22023';
  end if;
  if p_document is null or jsonb_typeof(p_document) is distinct from 'object'
     or p_document->>'version' is distinct from '1'
     or octet_length(p_document::text) > 10485760
     or jsonb_typeof(p_document->'profile') is distinct from 'object'
     or jsonb_typeof(p_document->'projects') is distinct from 'object'
     or jsonb_typeof(p_document->'courses') is distinct from 'array'
     or jsonb_typeof(p_document->'tasks') is distinct from 'array'
     or jsonb_typeof(p_document->'health') is distinct from 'array'
     or jsonb_typeof(p_document->'transactions') is distinct from 'array'
     or jsonb_typeof(p_document->'applications') is distinct from 'array' then
    raise exception 'CHAPTER_INVALID_DOCUMENT' using errcode = '22023';
  end if;
  -- Serialize first insert as well as updates for a single owner.
  perform pg_advisory_xact_lock(hashtextextended(p_owner_id::text, 0));
  select * into current_row from public.chapter_state where owner_id = p_owner_id for update;
  if found then
    if current_row.last_write_id = p_write_id then
      if current_row.document is distinct from p_document then
        raise exception 'CHAPTER_WRITE_ID_REUSED' using errcode = '22023';
      end if;
      return current_row.revision;
    end if;
    if current_row.revision <> p_expected_revision then
      raise exception 'CHAPTER_CONFLICT' using errcode = '40001';
    end if;
    update public.chapter_state set document = p_document, revision = revision + 1,
      last_write_id = p_write_id, updated_at = now() where owner_id = p_owner_id
      returning revision into current_row.revision;
    return current_row.revision;
  end if;
  if p_expected_revision <> 0 then
    raise exception 'CHAPTER_CONFLICT' using errcode = '40001';
  end if;
  insert into public.chapter_state(owner_id, document, revision, last_write_id)
    values (p_owner_id, p_document, 1, p_write_id);
  return 1;
end;
$$;
revoke all on function public.chapter_save(uuid, bigint, uuid, jsonb) from public, anon;
grant execute on function public.chapter_save(uuid, bigint, uuid, jsonb) to authenticated;

commit;
