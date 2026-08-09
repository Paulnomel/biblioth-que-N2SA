-- ============================================================
-- N2SA — Structure de base de données Supabase
-- À coller dans Supabase > SQL Editor > New query, puis "Run"
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLE : profiles
-- Étend la table auth.users (gérée automatiquement par Supabase)
-- avec les informations propres à N2SA (nom, filière, niveau, rôle).
-- ------------------------------------------------------------
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  prenom text,
  nom text,
  filiere text,
  niveau text,
  role text not null default 'membre',  -- 'membre' ou 'admin'
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Chacun peut voir et modifier uniquement son propre profil
create policy "Un membre peut voir son propre profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Un membre peut modifier son propre profil"
  on public.profiles for update
  using (auth.uid() = id);

-- Les admins peuvent tout voir (utile pour l'espace administrateur)
-- Note : on utilise une fonction "security definer" (is_admin(), définie
-- plus bas) plutôt qu'une sous-requête directe sur profiles, pour éviter
-- une récursion infinie de la policy sur elle-même.

-- Création automatique d'un profil vide à chaque inscription
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, prenom, nom, filiere, niveau)
  values (
    new.id,
    new.raw_user_meta_data->>'prenom',
    new.raw_user_meta_data->>'nom',
    new.raw_user_meta_data->>'filiere',
    new.raw_user_meta_data->>'niveau'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ------------------------------------------------------------
-- 2. TABLE : documents
-- Cours, TD, examens, corrigés, mémoires.
-- ------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  matiere text not null,
  annee text,
  auteur text,
  type text not null,        -- 'Cours', 'TD', 'Examen', 'Corrigé', 'Mémoire'
  fichier_url text not null, -- URL du fichier dans Supabase Storage
  uploaded_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

alter table public.documents enable row level security;

-- Tous les membres connectés peuvent consulter les documents
create policy "Les membres connectés voient les documents"
  on public.documents for select
  using (auth.role() = 'authenticated');

-- Seuls les admins peuvent ajouter/modifier/supprimer des documents
-- (policy définie plus bas, après la fonction is_admin())


-- ------------------------------------------------------------
-- 3. TABLE : favoris
-- Documents mis en favori par chaque membre (page Profil).
-- ------------------------------------------------------------
create table public.favoris (
  user_id uuid references public.profiles(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (user_id, document_id)
);

alter table public.favoris enable row level security;

create policy "Un membre gère ses propres favoris"
  on public.favoris for all
  using (auth.uid() = user_id);

-- ============================================================
-- 4. FONCTION : is_admin()
-- Vérifie si l'utilisateur connecté a le rôle 'admin', en contournant
-- le RLS de la table profiles (via "security definer") pour éviter
-- toute récursion infinie dans les policies qui l'utilisent.
-- ------------------------------------------------------------
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

-- Policies admin, écrites avec is_admin() plutôt qu'une sous-requête
-- directe sur profiles (qui provoquerait une récursion infinie).
create policy "Les admins voient tous les profils"
  on public.profiles for select
  using (public.is_admin());

create policy "Seuls les admins gèrent les documents"
  on public.documents for all
  using (public.is_admin());


-- ============================================================
-- 5. PERMISSIONS DE BASE
-- Les policies RLS ci-dessus filtrent QUELLES lignes sont visibles,
-- mais il faut en plus donner aux rôles Supabase la permission
-- générale d'accéder aux tables (sans quoi : erreur "permission
-- denied", même pour ses propres données).
-- ------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, delete on public.favoris to authenticated;


-- ============================================================
-- Fin du script. Pensez à créer votre premier compte admin :
-- après votre inscription sur le site, repassez dans Supabase >
-- Table Editor > profiles, trouvez votre ligne, et changez
-- manuellement "role" de 'membre' à 'admin'.
-- ============================================================
