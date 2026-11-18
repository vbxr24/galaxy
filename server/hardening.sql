-- Galaxy – extra beveiliging en snelheid (uit de Supabase Advisors)
-- 1) vaste search_path op alle eigen functies (geen "search_path mutable")
-- 2) trigger-functies niet aanroepbaar via de API
-- 3) RLS: auth.uid() één keer per query uitrekenen i.p.v. per rij (sneller)
-- 4) indexen op foreign keys zonder index
-- Alles is idempotent: opnieuw uitvoeren kan geen kwaad.

do $$
declare r record;
begin
  -- 1. search_path
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind in ('f','p')
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('alter function %s set search_path = public, extensions, pg_temp', r.sig);
  end loop;

  -- 2. trigger-functies
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prorettype = 'trigger'::regtype
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('revoke execute on function %s from public', r.sig);
    begin execute format('revoke execute on function %s from anon', r.sig); exception when undefined_object then null; end;
    begin execute format('revoke execute on function %s from authenticated', r.sig); exception when undefined_object then null; end;
  end loop;
end $$;

-- 3. RLS-policies: auth.<fn>() -> (select auth.<fn>())
do $$
declare r record; q text; w text; s text;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check from pg_policies
    where schemaname = 'public'
      and (coalesce(qual,'') ~ 'auth\.(uid|role|jwt)\(\)' or coalesce(with_check,'') ~ 'auth\.(uid|role|jwt)\(\)')
  loop
    q := r.qual; w := r.with_check;
    -- eerst al ingepakte varianten beschermen, dan inpakken, dan terugzetten
    if q is not null then
      q := regexp_replace(q, '\(\s*select\s+auth\.(uid|role|jwt)\(\)\s*(as\s+\w+\s*)?\)', '@@\1@@', 'gi');
      q := regexp_replace(q, 'auth\.(uid|role|jwt)\(\)', '(select auth.\1())', 'g');
      q := regexp_replace(q, '@@(uid|role|jwt)@@', '(select auth.\1())', 'g');
    end if;
    if w is not null then
      w := regexp_replace(w, '\(\s*select\s+auth\.(uid|role|jwt)\(\)\s*(as\s+\w+\s*)?\)', '@@\1@@', 'gi');
      w := regexp_replace(w, 'auth\.(uid|role|jwt)\(\)', '(select auth.\1())', 'g');
      w := regexp_replace(w, '@@(uid|role|jwt)@@', '(select auth.\1())', 'g');
    end if;
    if q is distinct from r.qual or w is distinct from r.with_check then
      s := format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
      if q is not null then s := s || format(' using (%s)', q); end if;
      if w is not null then s := s || format(' with check (%s)', w); end if;
      execute s;
    end if;
  end loop;
end $$;

-- 4. indexen op foreign keys
do $$
declare r record; cols text; nm text;
begin
  for r in
    select c.conrelid, c.conname, c.conkey, cl.relname
    from pg_constraint c join pg_class cl on cl.oid = c.conrelid join pg_namespace n on n.oid = cl.relnamespace
    where c.contype = 'f' and n.nspname = 'public'
      and not exists (
        select 1 from pg_index i
        where i.indrelid = c.conrelid
          and (i.indkey::int2[])[0:array_length(c.conkey,1)-1] = c.conkey)
  loop
    select string_agg(quote_ident(a.attname), ', ' order by k.ord) into cols
    from unnest(r.conkey) with ordinality k(attnum, ord) join pg_attribute a on a.attrelid = r.conrelid and a.attnum = k.attnum;
    nm := left('ix_' || r.relname || '_' || r.conname, 63);
    execute format('create index if not exists %I on public.%I (%s)', nm, r.relname, cols);
  end loop;
end $$;
