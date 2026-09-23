/* ==========================================================================
   N2SA — Script principal
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Écran de chargement élégant ---- */
  const loader = document.querySelector('.page-loader');
  if (loader){
    window.addEventListener('load', () => {
      setTimeout(() => loader.classList.add('hidden'), 250);
    });
    // Filet de sécurité si l'événement load a déjà eu lieu
    setTimeout(() => loader.classList.add('hidden'), 1200);
  }

  /* ---- Menu mobile (hamburger) ---- */
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (toggle && mobileMenu){
    toggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      toggle.classList.toggle('active', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        toggle.classList.remove('active');
        document.body.classList.remove('menu-open');
      });
    });
  }

  /* ---- Fond de navbar au défilement ---- */
  const nav = document.querySelector('.nav');
  if (nav){
    const onScroll = () => {
      nav.style.background = window.scrollY > 20
        ? 'rgba(10,22,40,0.96)'
        : 'rgba(10,22,40,0.82)';
    };
    document.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
  }

  /* ---- Apparition des éléments au défilement ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach((el, i) => {
      el.style.setProperty('--i', i % 8);
      io.observe(el);
    });
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* ---- Accordéon FAQ ---- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        if (openItem !== item){
          openItem.classList.remove('open');
          openItem.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      item.classList.toggle('open', !isOpen);
      a.style.maxHeight = !isOpen ? a.scrollHeight + 'px' : null;
    });
  });

  /* ---- Filtres à onglets (puces) ---- */
  document.querySelectorAll('.chip-row').forEach(row => {
    row.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        row.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterDocs();
      });
    });
  });

  /* ---- Filtres de bibliothèque / recherche instantanée ----
     docCards est re-interrogé à chaque appel (et non capturé une seule
     fois) pour prendre en compte les cartes ajoutées dynamiquement après
     le chargement des documents depuis Supabase. ---- */
  const searchInput = document.querySelector('[data-search-input]');
  const resultCount = document.querySelector('[data-result-count]');
  const emptyState = document.querySelector('[data-empty-state]');

  function filterDocs(){
    const docCards = document.querySelectorAll('[data-doc]');
    const filterCheckboxes = document.querySelectorAll('[data-filter]');
    if (!docCards.length){
      if (resultCount) resultCount.textContent = 0;
      return;
    }
    const term = (searchInput?.value || '').trim().toLowerCase();
    const activeChip = document.querySelector('.chip.active');
    const chipValue = activeChip ? activeChip.dataset.chip : 'tous';

    const activeSubjects = Array.from(document.querySelectorAll('[data-filter="matiere"]:checked')).map(c => c.value);
    const activeYears = Array.from(document.querySelectorAll('[data-filter="annee"]:checked')).map(c => c.value);
    const activeTypes = Array.from(document.querySelectorAll('[data-filter="type"]:checked')).map(c => c.value);

    let visible = 0;
    docCards.forEach(card => {
      const title = (card.dataset.title || '').toLowerCase();
      const subject = card.dataset.subject || '';
      const year = card.dataset.year || '';
      const type = card.dataset.type || '';

      const matchesTerm = !term || title.includes(term) || subject.toLowerCase().includes(term);
      const matchesChip = chipValue === 'tous' || type === chipValue;
      const matchesSubject = !activeSubjects.length || activeSubjects.includes(subject);
      const matchesYear = !activeYears.length || activeYears.includes(year);
      const matchesType = !activeTypes.length || activeTypes.includes(type);

      const show = matchesTerm && matchesChip && matchesSubject && matchesYear && matchesType;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (resultCount) resultCount.textContent = visible;
    if (emptyState) emptyState.style.display = visible ? 'none' : 'block';
  }

  // Rendue accessible globalement : appelée par js/documents.js une fois
  // les vrais documents chargés depuis Supabase et injectés dans le DOM.
  window.filterDocs = filterDocs;

  if (searchInput) searchInput.addEventListener('input', filterDocs);
  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-filter]')) filterDocs();
  });

  /* ---- Pré-filtrage depuis un lien externe (ex : Catégories) ----
     Si l'URL contient ?matiere=XXX (posé par les cartes de categories.html),
     on coche automatiquement la case correspondante avant le premier
     filtrage, pour arriver directement sur les documents de cette matière. */
  const matiereDepuisURL = new URLSearchParams(window.location.search).get('matiere');
  if (matiereDepuisURL) {
    const checkbox = document.querySelector(`[data-filter="matiere"][value="${CSS.escape(matiereDepuisURL)}"]`);
    if (checkbox) checkbox.checked = true;
  }

  filterDocs();

  /* ---- Réinitialisation des filtres ---- */
  document.querySelectorAll('[data-reset-filters]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(cb => cb.checked = false);
      if (searchInput) searchInput.value = '';
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      document.querySelector('.chip[data-chip="tous"]')?.classList.add('active');
      filterDocs();
    });
  });

  /* ---- Onglets du profil ---- */
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('[data-tab-panel]').forEach(panel => {
        panel.style.display = panel.dataset.tabPanel === target ? '' : 'none';
      });
    });
  });

  /* ---- Formulaires (frontend uniquement) ----
     Aucun backend n'est connecté : la soumission est interceptée pour
     éviter un rechargement de page, et un message neutre rappelle que
     le traitement réel (authentification, enregistrement, envoi...)
     sera branché plus tard. Aucune donnée n'est simulée ni enregistrée. */
  document.querySelectorAll('form[data-frontend-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const feedback = form.querySelector('[data-form-feedback]');
      if (feedback){
        feedback.style.display = 'block';
        feedback.textContent = 'Formulaire prêt côté interface — le traitement (base de données, authentification, envoi) sera connecté ultérieurement.';
      }
    });
  });

});

/* ==========================================================================
   Enregistrement du Service Worker (PWA)
   Rend le site installable (icône sur l'écran d'accueil, ouverture en
   plein écran) et met en cache les fichiers statiques pour un chargement
   plus rapide et un fonctionnement minimal hors connexion.
   Le chemin relatif "./sw.js" garantit que ça fonctionne aussi bien en
   local (Live Server) qu'en ligne (GitHub Pages, même dans un sous-dossier).
   ========================================================================== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("Service worker non enregistré :", err.message);
    });
  });
}
