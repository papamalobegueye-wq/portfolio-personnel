/* ============================================================
   PORTFOLIO — main.js
   1. Menu burger mobile (toggle ouverture / fermeture)
   2. Smooth scroll sur les liens de navigation
   3. Fermeture automatique du menu au clic sur un lien
   4. Fermeture du menu au clic en dehors
   5. Lien actif dans la navbar selon la section visible (IntersectionObserver)
   ============================================================ */


/* ─────────────────────────────────────────
   UTILITAIRE : attend que le DOM soit prêt
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════════
     1. CRÉATION DYNAMIQUE DU BOUTON BURGER
     On l'injecte dans la <nav> via JavaScript
     pour ne pas toucher au HTML sémantique.
  ══════════════════════════════════════════ */

  const nav        = document.querySelector('header nav');
  const navMenu    = document.querySelector('header nav ul');   // La liste des liens

  /* -- Création du bouton -- */
  const burgerBtn  = document.createElement('button');
  burgerBtn.setAttribute('type', 'button');
  burgerBtn.setAttribute('aria-label', 'Ouvrir le menu de navigation');
  burgerBtn.setAttribute('aria-expanded', 'false');  // Accessibilité : état initial fermé
  burgerBtn.setAttribute('aria-controls', 'nav-menu');
  burgerBtn.classList.add('burger');

  /* -- Icône burger : 3 barres SVG inline -- */
  burgerBtn.innerHTML = `
    <svg class="burger__icon" viewBox="0 0 24 24" width="24" height="24"
         aria-hidden="true" fill="none" stroke="currentColor"
         stroke-width="1.5" stroke-linecap="round">
      <line class="burger__bar burger__bar--top"    x1="3" y1="6"  x2="21" y2="6" />
      <line class="burger__bar burger__bar--middle" x1="3" y1="12" x2="21" y2="12" />
      <line class="burger__bar burger__bar--bottom" x1="3" y1="18" x2="21" y2="18" />
    </svg>
  `;

  /* -- Injection dans la nav (après le logo) -- */
  nav.appendChild(burgerBtn);

  /* -- ID sur le menu pour aria-controls -- */
  navMenu.setAttribute('id', 'nav-menu');


  /* ══════════════════════════════════════════
     2. INJECTION DES STYLES DU BURGER
     Technique CSS-in-JS légère : on injecte
     une balise <style> dans le <head> pour
     garder un seul fichier JS autonome.
  ══════════════════════════════════════════ */

  const burgerStyles = document.createElement('style');
  burgerStyles.textContent = `

    /* --- Bouton burger : caché par défaut sur desktop --- */
    .burger {
      display: none;
      background: transparent;
      border: 1px solid #1f1f1f;
      border-radius: 2px;
      color: #cccccc;
      padding: 0.45rem 0.55rem;
      cursor: pointer;
      transition: color 280ms ease, border-color 280ms ease;
      line-height: 0;
    }

    .burger:hover {
      color: #ffffff;
      border-color: #333333;
    }

    /* --- Transitions des barres SVG --- */
    .burger__bar {
      transform-origin: center;
      transition:
        transform    400ms cubic-bezier(0.4, 0, 0.2, 1),
        opacity      200ms ease,
        stroke-dashoffset 400ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* --- État ouvert : transformation en croix --- */
    .burger[aria-expanded="true"] .burger__bar--top {
      transform: translateY(6px) rotate(45deg);
    }

    .burger[aria-expanded="true"] .burger__bar--middle {
      opacity: 0;
      transform: scaleX(0);
    }

    .burger[aria-expanded="true"] .burger__bar--bottom {
      transform: translateY(-6px) rotate(-45deg);
    }

    /* --- Mobile : afficher le burger, cacher le menu par défaut --- */
    @media (max-width: 767px) {

      .burger {
        display: block;
      }

      #nav-menu {
        position: fixed;
        top: 57px;           /* Hauteur de la navbar */
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.97);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2.5rem;
        border-top: 1px solid #1f1f1f;

        /* État fermé : invisible et hors du flux de tabulation */
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: translateY(-8px);
        transition:
          opacity      350ms cubic-bezier(0.4, 0, 0.2, 1),
          transform    350ms cubic-bezier(0.4, 0, 0.2, 1),
          visibility   350ms;
      }

      /* État ouvert */
      #nav-menu.nav-menu--open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: translateY(0);
        display: flex;
      }

      /* Liens plus grands sur mobile */
      #nav-menu a {
        font-size: 1.75rem !important;
        letter-spacing: 0.15em;
      }

      /* Animation en cascade des liens (stagger) */
      #nav-menu li {
        opacity: 0;
        transform: translateY(12px);
        transition:
          opacity   350ms ease,
          transform 350ms ease;
      }

      #nav-menu.nav-menu--open li:nth-child(1) { opacity: 1; transform: none; transition-delay: 80ms;  }
      #nav-menu.nav-menu--open li:nth-child(2) { opacity: 1; transform: none; transition-delay: 140ms; }
      #nav-menu.nav-menu--open li:nth-child(3) { opacity: 1; transform: none; transition-delay: 200ms; }
      #nav-menu.nav-menu--open li:nth-child(4) { opacity: 1; transform: none; transition-delay: 260ms; }
    }

    /* --- Desktop : s'assurer que le menu reste visible --- */
    @media (min-width: 768px) {
      #nav-menu {
        display: flex !important;
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
        pointer-events: auto !important;
        position: static;
        background: transparent;
        backdrop-filter: none;
        flex-direction: row;
      }
    }

    /* --- Lien actif dans la navbar --- */
    header nav ul a.nav-link--active {
      color: #eeeeee;
    }

    header nav ul a.nav-link--active::after {
      width: 100% !important;
    }

  `;

  document.head.appendChild(burgerStyles);


  /* ══════════════════════════════════════════
     3. LOGIQUE D'OUVERTURE / FERMETURE DU MENU
  ══════════════════════════════════════════ */

  let isMenuOpen = false;

  /**
   * Ouvre ou ferme le menu burger.
   * @param {boolean} forceClose - Si true, force la fermeture sans toggle.
   */
  function toggleMenu(forceClose = false) {

    isMenuOpen = forceClose ? false : !isMenuOpen;

    /* Mise à jour des attributs ARIA */
    burgerBtn.setAttribute('aria-expanded', String(isMenuOpen));
    burgerBtn.setAttribute(
      'aria-label',
      isMenuOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'
    );

    /* Ajout / suppression de la classe d'état sur le menu */
    navMenu.classList.toggle('nav-menu--open', isMenuOpen);

    /* Bloquer le scroll du body quand le menu est ouvert */
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
  }

  /* Clic sur le bouton burger */
  burgerBtn.addEventListener('click', (event) => {
    event.stopPropagation(); // Empêche la propagation vers le document
    toggleMenu();
  });

  /* Fermeture au clic en dehors du menu */
  document.addEventListener('click', (event) => {
    if (isMenuOpen && !nav.contains(event.target)) {
      toggleMenu(true);
    }
  });

  /* Fermeture avec la touche Echap */
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isMenuOpen) {
      toggleMenu(true);
      burgerBtn.focus(); // Restituer le focus au bouton pour l'accessibilité
    }
  });

  /* Fermeture automatique si on redimensionne vers desktop */
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && isMenuOpen) {
      toggleMenu(true);
    }
  });


  /* ══════════════════════════════════════════
     4. SMOOTH SCROLL SUR LES LIENS DE NAV
     HTML smooth-scroll est déjà activé via CSS
     (scroll-behavior: smooth). Ce code gère :
     - La fermeture du menu burger au clic
     - Le décalage exact dû à la navbar fixe
  ══════════════════════════════════════════ */

  const navLinks = document.querySelectorAll('header nav ul a[href^="#"]');

  navLinks.forEach((link) => {

    link.addEventListener('click', (event) => {
      event.preventDefault(); // On gère le scroll manuellement

      const targetId      = link.getAttribute('href');       // ex: "#about"
      const targetSection = document.querySelector(targetId);

      if (!targetSection) return;

      /* Fermer le menu mobile avant de scroller */
      if (isMenuOpen) toggleMenu(true);

      /* Calcul du décalage : hauteur de la navbar fixe + marge */
      const navbarHeight = document.querySelector('header').offsetHeight;
      const extraOffset  = 16; // px de respiration supplémentaire
      const targetY      = targetSection.getBoundingClientRect().top
                         + window.scrollY
                         - navbarHeight
                         - extraOffset;

      window.scrollTo({
        top:      targetY,
        behavior: 'smooth',
      });

      /* Mettre à jour l'URL sans recharger la page */
      history.pushState(null, '', targetId);

    });
  });


  /* ══════════════════════════════════════════
     5. LIEN ACTIF SELON LA SECTION VISIBLE
     IntersectionObserver : détecte quelle
     section est dans le viewport et surligne
     le lien correspondant dans la navbar.
  ══════════════════════════════════════════ */

  const sections      = document.querySelectorAll('main section[id]');
  const navbarHeight  = document.querySelector('header').offsetHeight;

  /**
   * Met en actif le lien correspondant à l'id de section donné.
   * @param {string} activeId - L'id de la section active (ex: "about").
   */
  function setActiveLink(activeId) {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${activeId}`;
      link.classList.toggle('nav-link--active', isActive);
    });
  }

  const observerOptions = {
    root:       null,                         // Viewport comme référence
    rootMargin: `-${navbarHeight + 20}px 0px -55% 0px`,  // Déclenche quand la section atteint le haut
    threshold:  0,
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActiveLink(entry.target.id);
      }
    });
  }, observerOptions);

  /* Observer chaque section */
  sections.forEach((section) => sectionObserver.observe(section));

}); // Fin DOMContentLoaded