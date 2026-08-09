/* ==========================================================================
   N2SA — Documents (Supabase)
   Nécessite js/supabase-client.js chargé juste avant ce fichier.
   ========================================================================== */

/* Icône utilisée pour chaque miniature de document (identique pour tous,
   en attendant une vraie génération de vignettes). */
const DOC_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 4h9l4 4v12H6z"/><path d="M15 4v4h4"/></svg>`;

/* ---------------------------------------------------------
   Récupère tous les documents depuis la table `documents`,
   du plus récent au plus ancien. `limite` est optionnelle
   (utile pour n'afficher que les derniers sur l'accueil).
   --------------------------------------------------------- */
async function chargerDocuments(limite = null) {
  let query = db.from("documents").select("*").order("created_at", { ascending: false });
  if (limite) query = query.limit(limite);

  const { data, error } = await query;
  if (error) {
    console.error("Erreur de chargement des documents :", error.message);
    return [];
  }
  return data;
}

/* ---------------------------------------------------------
   Construit le HTML d'une carte document (.doc-card), avec
   les attributs data-* nécessaires au filtrage déjà en place
   dans js/main.js (recherche, chips, filtres matière/année/type).
   --------------------------------------------------------- */
function carteDocument(doc) {
  return `
    <div class="doc-card reveal in-view" data-doc
         data-title="${escapeHtml(doc.titre)}"
         data-subject="${escapeHtml(doc.matiere)}"
         data-year="${escapeHtml(doc.annee || '')}"
         data-type="${escapeHtml(doc.type)}">
      <div class="doc-thumb" data-tag="${escapeHtml(doc.type)}">${DOC_ICON}</div>
      <div class="doc-body">
        <h3>${escapeHtml(doc.titre)}</h3>
        <div class="doc-meta">
          <span><strong>${escapeHtml(doc.matiere)}</strong></span>
          <span>${escapeHtml(doc.annee || '')}</span>
          <span>${escapeHtml(doc.auteur || '')}</span>
        </div>
        <div class="doc-actions">
          <a href="${doc.fichier_url}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm btn-block">Consulter</a>
        </div>
      </div>
    </div>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/* ---------------------------------------------------------
   Charge et affiche les documents dans un conteneur donné
   (id="doc-grid" en bibliothèque, id="search-grid" en recherche,
   ou tout autre conteneur passé en paramètre).
   Met à jour le compteur de résultats et relance le filtrage
   (js/main.js) une fois les cartes injectées.
   --------------------------------------------------------- */
async function afficherDocuments(containerId, limite = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const documents = await chargerDocuments(limite);
  container.innerHTML = documents.map(carteDocument).join("");

  const emptyState = document.querySelector("[data-empty-state]");
  if (emptyState) emptyState.style.display = documents.length ? "none" : "block";

  const resultCount = document.querySelector("[data-result-count]");
  if (resultCount) resultCount.textContent = documents.length;

  // Relance le filtrage/recherche défini dans js/main.js sur les nouvelles cartes
  if (window.filterDocs) window.filterDocs();

  return documents;
}

/* ---------------------------------------------------------
   Upload d'un document (espace administrateur) :
   1. Envoie le fichier dans le bucket Storage "documents".
   2. Récupère son URL publique.
   3. Insère la ligne correspondante dans la table `documents`.
   --------------------------------------------------------- */
async function ajouterDocument({ titre, matiere, annee, auteur, type, fichier }) {
  if (!fichier) return { success: false, message: "Aucun fichier sélectionné." };

  // Nom de fichier unique pour éviter les écrasements dans le bucket
  const cheminFichier = `${Date.now()}-${fichier.name.replace(/\s+/g, "-")}`;

  const { error: uploadError } = await db.storage
    .from("documents")
    .upload(cheminFichier, fichier);

  if (uploadError) {
    return { success: false, message: "Échec de l'envoi du fichier : " + uploadError.message };
  }

  const { data: urlData } = db.storage.from("documents").getPublicUrl(cheminFichier);

  const { data: { session } } = await db.auth.getSession();

  const { error: insertError } = await db.from("documents").insert({
    titre,
    matiere,
    annee,
    auteur,
    type,
    fichier_url: urlData.publicUrl,
    uploaded_by: session?.user?.id ?? null
  });

  if (insertError) {
    return { success: false, message: "Fichier envoyé, mais l'enregistrement a échoué : " + insertError.message };
  }

  return { success: true, message: "Document ajouté avec succès." };
}

/* ---------------------------------------------------------
   Suppression d'un document (espace administrateur).
   --------------------------------------------------------- */
async function supprimerDocument(id) {
  const { error } = await db.from("documents").delete().eq("id", id);
  return !error;
}
