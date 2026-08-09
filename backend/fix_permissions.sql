-- ============================================================
-- N2SA — Correctif : permissions manquantes sur les tables
-- À coller dans Supabase > SQL Editor > New query, puis "Run"
-- ============================================================
-- Problème : les tables ont bien leurs règles de sécurité (RLS),
-- mais les rôles "authenticated" (utilisateurs connectés) n'avaient
-- pas la permission de base d'accéder aux tables. Résultat : erreur
-- "permission denied" (code 42501), même pour ses propres données.
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, delete on public.favoris to authenticated;

-- ============================================================
-- Fin du correctif.
-- ============================================================
