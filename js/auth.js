/* ==========================================================================
   N2SA — Authentification (Supabase)
   Nécessite js/supabase-client.js chargé juste avant ce fichier.
   ========================================================================== */

/* ---------------------------------------------------------
   INSCRIPTION
   Crée le compte (Supabase Auth) et un profil (nom, prénom,
   filière, niveau) via les métadonnées.
   --------------------------------------------------------- */
async function inscrireMembre({ prenom, nom, email, filiere, niveau, motDePasse }) {
  const { data, error } = await db.auth.signUp({
    email,
    password: motDePasse,
    options: {
      data: { prenom, nom, filiere, niveau } // récupéré par le trigger handle_new_user() côté base
    }
  });

  if (error) {
    return { success: false, message: traduireErreur(error.message) };
  }
  return { success: true, message: "Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse." };
}

/* ---------------------------------------------------------
   CONNEXION
   --------------------------------------------------------- */
async function connecterMembre({ email, motDePasse }) {
  const { data, error } = await db.auth.signInWithPassword({
    email,
    password: motDePasse
  });

  if (error) {
    return { success: false, message: traduireErreur(error.message) };
  }
  return { success: true };
}

/* ---------------------------------------------------------
   DÉCONNEXION
   --------------------------------------------------------- */
async function deconnecterMembre() {
  await db.auth.signOut();
  window.location.href = "connexion.html";
}

/* ---------------------------------------------------------
   PROTECTION DE PAGE
   À appeler en haut de profil.html : redirige vers connexion.html
   si personne n'est connecté.
   --------------------------------------------------------- */
async function exigerConnexion() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = "connexion.html";
  }
  return session;
}

/* ---------------------------------------------------------
   PROTECTION ADMIN
   À appeler en haut de admin.html : vérifie la connexion
   ET que le rôle du profil est bien 'admin'.
   --------------------------------------------------------- */
async function exigerAdmin() {
  const session = await exigerConnexion();
  if (!session) return null;

  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    window.location.href = "index.html";
    return null;
  }
  return session;
}

/* ---------------------------------------------------------
   NAVBAR DYNAMIQUE
   Remplace les boutons "Connexion / Inscription" par
   "Mon profil / Se déconnecter" si un membre est connecté.
   À appeler sur chaque page contenant la navbar standard.
   --------------------------------------------------------- */
async function initNavAuthState() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) return; // Personne connecté : on laisse Connexion/Inscription

  const replacement = `
    <a href="profil.html" class="btn btn-ghost btn-sm">Mon profil</a>
    <button class="btn btn-primary btn-sm" data-nav-logout>Se déconnecter</button>
  `;

  document.querySelectorAll('.nav-actions').forEach(el => {
    el.innerHTML = replacement;
  });

  document.querySelectorAll('[data-nav-logout]').forEach(btn => {
    btn.addEventListener('click', deconnecterMembre);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof db !== 'undefined') initNavAuthState();
});

/* ---------------------------------------------------------
   Traduction simple des messages d'erreur Supabase en français
   --------------------------------------------------------- */
function traduireErreur(message) {
  const traductions = {
    "Invalid login credentials": "E-mail ou mot de passe incorrect.",
    "User already registered": "Un compte existe déjà avec cette adresse e-mail.",
    "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères."
  };
  return traductions[message] || message;
}
