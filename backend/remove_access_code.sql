-- ============================================================
-- N2SA — Suppression du système de Code N2SA (simplification)
-- À coller dans Supabase > SQL Editor > New query, puis "Run"
-- ============================================================
-- Le site n'utilise plus de code d'accès unique à l'inscription.
-- Cette table n'est donc plus nécessaire.
-- ============================================================

drop table if exists public.access_code;

-- ============================================================
-- Fin. L'inscription se fait maintenant directement, sans code.
-- ============================================================
