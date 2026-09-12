-- ============================================================
-- N2SA — Ajout : les admins peuvent modifier le profil des membres
-- À coller dans Supabase > SQL Editor > New query, puis "Run"
-- ============================================================
-- Jusqu'ici, un admin pouvait VOIR tous les profils, mais pas les
-- MODIFIER (seul chacun pouvait modifier son propre profil). Cette
-- policy permet à un admin de changer le rôle d'un autre membre
-- (ou toute autre info de son profil) depuis l'espace administrateur.
-- ============================================================

create policy "Les admins modifient tous les profils"
  on public.profiles for update
  using (public.is_admin());

-- ============================================================
-- Fin.
-- ============================================================
