-- ============================================================
-- N2SA — Correctif : récursion infinie dans les policies RLS
-- À coller dans Supabase > SQL Editor > New query, puis "Run"
-- ============================================================
-- Problème : la policy "Les admins voient tous les profils" vérifiait
-- le rôle admin en interrogeant la table profiles... depuis une policy
-- appliquée sur profiles elle-même, ce qui boucle à l'infini.
--
-- Solution : une fonction "security definer" qui contourne le RLS
-- pour cette vérification précise, évitant ainsi la boucle.
-- ============================================================

-- 1. Supprimer les policies provoquant (ou pouvant provoquer) la récursion
drop policy if exists "Les admins voient tous les profils" on public.profiles;
drop policy if exists "Seuls les admins gèrent les documents" on public.documents;
drop policy if exists "Seuls les admins modifient le code" on public.access_code;

-- 2. Fonction sécurisée : vérifie si l'utilisateur connecté est admin
--    sans déclencher les policies RLS de la table profiles (donc sans boucle)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. Recréer les policies en utilisant cette fonction
create policy "Les admins voient tous les profils"
  on public.profiles for select
  using (public.is_admin());

create policy "Seuls les admins gèrent les documents"
  on public.documents for all
  using (public.is_admin());

create policy "Seuls les admins modifient le code"
  on public.access_code for update
  using (public.is_admin());

-- ============================================================
-- Fin du correctif.
-- ============================================================
