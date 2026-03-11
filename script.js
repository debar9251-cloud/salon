/* HEADSHOT Lifestyle Saloon — script.js */

document.addEventListener('DOMContentLoaded', () => {

  // --- PERSISTENT STATE ---
  let transitionOverlay;
  let revealObs;

  /**
   * 1. SETUP TRANSITION OVERLAY (Persistent)
   */
  const setupTransition = () => {
    if (document.getElementById('scissor-transition')) {
      transitionOverlay = document.getElementById('scissor-transition');
      return;
    }
    const overlayHTML = `
      <div class="transition-overlay" id="scissor-transition">
        <div class="scissor-animation-container">
          <div class="cut-line"></div>
          <div class="spark"></div>
          <svg class="scissor-icon" viewBox="0 0 24 24" fill="none" stroke="#FFC107" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <g class="scissor-top">
              <circle cx="6" cy="6" r="3"></circle>
              <path d="M8.12 8.12 12 12"></path>
              <path d="M20 4 8.12 15.88"></path>
            </g>
            <g class="scissor-bottom">
              <circle cx="6" cy="18" r="3"></circle>
              <path d="M8.12 15.88 12 12"></path>
              <path d="M20 20 8.12 8.12"></path>
            </g>
          </svg>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', overlayHTML);
    transitionOverlay = document.getElementById('scissor-transition');
  };

  /**
   * 2. CLOSE MOBILE MENU helper
   */
  const closeMenu = () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    const overlay   = document.querySelector('.mobile-nav-overlay');
    hamburger?.classList.remove('open');
    mobileNav?.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
  };

  /**
   * 3. INITIALIZE PAGE COMPONENTS
   * Re-run this after every AJAX navigation
   */
  const initPage = () => {
    // Current page filename for active links
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    /* ---- STICKY HEADER ---- */
    const header = document.getElementById('header');
    const onScroll = () => {
      if (header) header.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.removeEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---- MOBILE NAV TOGGLE ---- */
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    const overlay   = document.querySelector('.mobile-nav-overlay');

    if (hamburger && mobileNav && overlay) {
      // Clear old listeners by cloning if necessary (simpler to just replace nodes via innerHTML)
      hamburger.onclick = () => {
        const isOpen = mobileNav.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        overlay.classList.toggle('open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      };
      overlay.onclick = closeMenu;
      document.querySelectorAll('.mobile-nav a').forEach(a => a.onclick = closeMenu);
    }

    /* ---- ACTIVE NAV LINK ---- */
    document.querySelectorAll('.nav-menu a, .mobile-nav a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === currentPath) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });

    /* ---- SCROLL REVEAL ---- */
    if (revealObs) revealObs.disconnect();
    revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    /* ---- SMOOTH SCROLL (anchor links) ---- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.onclick = function (e) {
        const id = this.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          const offset = 80;
          window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
        }
      };
    });

    /* ---- CONTACT FORM ---- */
    const form = document.getElementById('contact-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.textContent = 'Message Sent ✓';
        btn.style.background = '#22c55e';
        btn.style.color = '#fff';
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = 'Send Message';
          btn.style.background = '';
          btn.style.color = '';
          btn.disabled = false;
          form.reset();
        }, 4000);
      };
    }

    /* ---- INTERACTIVE SERVICE MENU ---- */
    const serviceBtns = document.querySelectorAll('.service-btn');
    const servicePanels = document.querySelectorAll('.service-panel');
    serviceBtns.forEach(btn => {
      btn.onclick = () => {
        serviceBtns.forEach(b => b.classList.remove('active'));
        servicePanels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetId = `panel-${btn.dataset.target}`;
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) targetPanel.classList.add('active');
      };
    });

    /* ---- NAVIGATION INTERCEPT ---- */
    const internalLinks = document.querySelectorAll('a[href]');
    internalLinks.forEach(link => {
      const href = link.getAttribute('href');
      const isInternal = href && !href.startsWith('#') && !href.startsWith('tel:') && 
                         !href.startsWith('mailto:') && !href.startsWith('http') && 
                         !link.hasAttribute('download') && link.target !== '_blank';
      
      if (isInternal) {
        link.onclick = (e) => {
          // Normalize names
          const targetFile = href.split('/').pop() || 'index.html';
          const currentFile = window.location.pathname.split('/').pop() || 'index.html';
          
          if (targetFile === currentFile) return; 
          
          e.preventDefault();
          closeMenu();
          navigateTo(href);
        };
      }
    });
  };

  /**
   * 4. AJAX NAVIGATION & HISTORY API
   */
  const navigateTo = async (url, pushHistory = true) => {
    // Show transition overlay
    transitionOverlay.classList.remove('active');
    void transitionOverlay.offsetWidth; // force redraw
    transitionOverlay.classList.add('active');

    try {
      // Fetch new content
      const response = await fetch(url);
      if (!response.ok) throw new Error('Fetch failed');
      const text = await response.text();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const newBody = doc.querySelector('body');
      const newTitle = doc.title;

      // Wait for scissor "cutting" point (middle of animation)
      await new Promise(r => setTimeout(r, 650));

      // Update DOM
      document.title = newTitle;
      
      // We replace the body content but keep our persistent transition overlay
      const overlay = document.getElementById('scissor-transition');
      document.body.innerHTML = newBody.innerHTML;
      if (overlay) document.body.appendChild(overlay);

      // Add to history
      if (pushHistory) {
        history.pushState({ url }, '', url);
      }

      // Re-init logic and scroll top
      initPage();
      window.scrollTo(0, 0);

      // Hide transition
      setTimeout(() => {
        transitionOverlay.classList.remove('active');
      }, 200);

    } catch (err) {
      console.error('SPA Navigation Error:', err);
      // Fallback: regular navigation
      window.location.href = url;
    }
  };

  /**
   * 5. BACK/FORWARD NAVIGATION HANDLING
   */
  window.onpopstate = (event) => {
    // Determine the url to load
    const url = window.location.pathname;
    navigateTo(url, false);
  };

  // Run initializers
  setupTransition();
  initPage();

});
