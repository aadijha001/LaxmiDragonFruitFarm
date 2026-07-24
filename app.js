document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons for initial static DOM elements
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Fetch the data from data.json
  fetch('data.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      renderData(data);
      setupScrollAnimations();
    })
    .catch(error => {
      console.error('Error fetching data.json:', error);
      // Show CORS/Local Server instructions overlay
      const errorNotice = document.getElementById('error-notice');
      if (errorNotice) {
        errorNotice.classList.remove('hidden');
      }
    });

  // Setup UI Interactions
  setupHeaderScroll();
  setupMobileNav();
  setupContactForm();
});

/**
 * Render JSON data into the DOM placeholders
 */
function renderData(data) {
  // --- Global / Brand ---
  const businessName = data.businessName || 'Business Profile';
  document.title = `${businessName} | Premium Quality`;
  
  // Set business name in header, footer, and copyright
  const brandElements = ['nav-brand-name', 'footer-brand-name', 'footer-copyright-name'];
  brandElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = businessName;
  });

  // Copyright Year
  const copyrightYear = document.getElementById('copyright-year');
  if (copyrightYear) {
    copyrightYear.textContent = new Date().getFullYear();
  }

  // --- Hero Section ---
  if (data.hero) {
    setTextContent('hero-title', data.hero.title);
    setTextContent('hero-subtitle', data.hero.subtitle);
    if (data.tagline) {
      setTextContent('hero-badge', data.tagline);
    }
    // Set background image
    const heroBg = document.getElementById('hero-bg-img');
    if (heroBg && data.hero.image) {
      heroBg.style.backgroundImage = `url('${data.hero.image}')`;
    }
  }

  // --- Description Section (About) ---
  if (data.description) {
    setTextContent('about-title', data.description.title);
    setTextContent('about-text', data.description.text);
    setImageSource('about-img', data.description.image);
  }

  // --- Story Section ---
  if (data.story) {
    setTextContent('story-title', data.story.title);
    setTextContent('story-text', data.story.text);
    setImageSource('story-img', data.story.image);
  }

  // --- Details Section ---
  if (data.details) {
    setTextContent('details-title', data.details.title);
    setTextContent('details-subtitle', data.details.subtitle);
    setImageSource('details-img', data.details.image);

    // Dynamic Cards Rendering
    const detailsContainer = document.getElementById('details-items-container');
    if (detailsContainer && Array.isArray(data.details.items)) {
      detailsContainer.innerHTML = ''; // Clear loading card placeholder

      // Lucide icons list mapping for card index
      const cardIcons = ['shield-check', 'sparkles', 'award', 'shopping-bag', 'leaf', 'star'];

      data.details.items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'detail-card fade-up-scroll';
        
        // Select an icon from the array, looping back if index exceeds list
        const iconName = cardIcons[index % cardIcons.length];

        card.innerHTML = `
          <div class="detail-card-icon">
            <i data-lucide="${iconName}"></i>
          </div>
          <h3>${item.title || 'Feature'}</h3>
          <p>${item.text || ''}</p>
        `;
        detailsContainer.appendChild(card);
      });
    }
  }

  // --- Gallery Section ---
  if (data.gallery) {
    setTextContent('gallery-title', data.gallery.title);
    setTextContent('gallery-subtitle', data.gallery.subtitle);

    const track = document.getElementById('gallery-carousel-track');
    const dotsContainer = document.getElementById('carousel-indicators-container');

    if (track && Array.isArray(data.gallery.images) && data.gallery.images.length > 0) {
      track.innerHTML = '';
      if (dotsContainer) dotsContainer.innerHTML = '';

      data.gallery.images.forEach((imgData, idx) => {
        // Create slide container
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        
        slide.innerHTML = `
          <img src="${imgData.src}" alt="${imgData.caption || 'Farm gallery photo'}" loading="lazy">
          ${imgData.caption ? `<div class="slide-overlay"><p class="slide-caption">${imgData.caption}</p></div>` : ''}
        `;
        track.appendChild(slide);

        // Create dot element
        if (dotsContainer) {
          const dot = document.createElement('button');
          dot.className = `indicator-dot${idx === 0 ? ' active' : ''}`;
          dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
          dot.setAttribute('data-slide-index', idx);
          dotsContainer.appendChild(dot);
        }
      });

      // Initialize carousel functionality after building DOM
      initCarousel(track, dotsContainer);
    }
  }

  // --- Contact Section ---
  if (data.contact) {
    setTextContent('contact-title', data.contact.title);
    setTextContent('contact-subtitle', data.contact.subtitle);
    setTextContent('contact-phone', data.contact.phone);
    setTextContent('contact-email', data.contact.email);
    setTextContent('contact-address', data.contact.address);
    setTextContent('contact-hours', data.contact.hours);

    // Social Links Rendering
    const socialContainer = document.getElementById('social-links-container');
    if (socialContainer && data.contact.socialLinks) {
      socialContainer.innerHTML = '';
      
      const socials = data.contact.socialLinks;
      // Map platform names to Lucide icon names
      const iconMap = {
        facebook: 'facebook',
        instagram: 'instagram',
        whatsapp: 'phone-call', // fallback icon if whatsapp is not in standard lucide bundle
        twitter: 'twitter',
        linkedin: 'linkedin',
        youtube: 'youtube'
      };

      Object.keys(socials).forEach(platform => {
        const url = socials[platform];
        if (url) {
          const btn = document.createElement('a');
          btn.href = url;
          btn.target = '_blank';
          btn.rel = 'noopener noreferrer';
          btn.className = 'social-btn';
          btn.setAttribute('aria-label', platform);
          
          let iconName = iconMap[platform.toLowerCase()] || 'external-link';
          if (platform.toLowerCase() === 'whatsapp') {
            // Whatsapp specific override if Lucide support is tricky or we want a custom icon
            btn.innerHTML = `<i data-lucide="message-circle"></i>`;
          } else {
            btn.innerHTML = `<i data-lucide="${iconName}"></i>`;
          }
          socialContainer.appendChild(btn);
        }
      });
    }
  }

  // Re-run Lucide initialization to render new dynamic icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/**
 * Helper to safely set text content if element exists
 */
function setTextContent(id, text) {
  const el = document.getElementById(id);
  if (el && text) {
    el.textContent = text;
  }
}

/**
 * Helper to safely set image src if element exists
 */
function setImageSource(id, src) {
  const el = document.getElementById(id);
  if (el && src) {
    el.src = src;
  }
}

/**
 * Header Scrolled state
 */
function setupHeaderScroll() {
  const header = document.querySelector('.main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/**
 * Mobile navigation Drawer handler
 */
function setupMobileNav() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const menuIcon = toggleBtn ? toggleBtn.querySelector('i') : null;

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', () => {
      drawer.classList.toggle('open');
      const isOpen = drawer.classList.contains('open');
      
      if (menuIcon && typeof lucide !== 'undefined') {
        if (isOpen) {
          toggleBtn.innerHTML = '<i data-lucide="x"></i>';
        } else {
          toggleBtn.innerHTML = '<i data-lucide="menu"></i>';
        }
        lucide.createIcons();
      }
    });

    // Close drawer when clicking a link
    const links = drawer.querySelectorAll('.mobile-nav-link');
    links.forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('open');
        if (toggleBtn && menuIcon) {
          toggleBtn.innerHTML = '<i data-lucide="menu"></i>';
          lucide.createIcons();
        }
      });
    });
  }
}

/**
 * Setup scroll-based reveals/fades
 */
function setupScrollAnimations() {
  const scrollElements = document.querySelectorAll('.fade-up-scroll');

  const elementInView = (el, dividend = 1) => {
    const elementTop = el.getBoundingClientRect().top;
    return (
      elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend
    );
  };

  const displayScrollElement = (element) => {
    element.classList.add('visible');
  };

  const handleScrollAnimation = () => {
    scrollElements.forEach((el) => {
      if (elementInView(el, 1.15)) {
        displayScrollElement(el);
      }
    });
  };

  window.addEventListener('scroll', () => {
    handleScrollAnimation();
  });

  // Run once initially to show elements already in view
  setTimeout(handleScrollAnimation, 300);
}

/**
 * Mock Contact form handler
 */
function setupContactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');

  if (form && status) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Show loader on button
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      // Simulate network request
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        status.classList.remove('hidden', 'error', 'success');
        status.classList.add('success');
        status.textContent = 'Thank you! Your message was sent successfully. We will get back to you shortly.';
        
        // Reset form fields
        form.reset();

        // Hide success alert after 5 seconds
        setTimeout(() => {
          status.classList.add('hidden');
        }, 5000);
      }, 1500);
    });
  }
}

/**
 * Initialize Carousel functionality (Transitions, Autoplay, Dots, Prev/Next buttons, and Swipes)
 */
function initCarousel(track, dotsContainer) {
  const slides = Array.from(track.children);
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  let dots = dotsContainer ? Array.from(dotsContainer.children) : [];

  if (slides.length <= 1) {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    return;
  }

  let currentIndex = 0;
  let autoplayTimer = null;
  const autoplayDelay = 5000; // 5 seconds

  // Transition helper function
  function moveToSlide(index) {
    // Keep index in bounds (loop around)
    if (index < 0) {
      index = slides.length - 1;
    } else if (index >= slides.length) {
      index = 0;
    }

    currentIndex = index;
    const slideWidth = slides[0].getBoundingClientRect().width;
    track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;

    // Update active dot
    if (dots.length > 0) {
      dots.forEach((dot, idx) => {
        if (idx === currentIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }
  }

  // Handle window resizing to keep carousel aligned
  window.addEventListener('resize', () => {
    const slideWidth = slides[0].getBoundingClientRect().width;
    track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
  });

  // Next / Prev listeners
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      moveToSlide(currentIndex + 1);
      resetAutoplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      moveToSlide(currentIndex - 1);
      resetAutoplay();
    });
  }

  // Dots click listeners
  if (dots.length > 0) {
    dotsContainer.addEventListener('click', (e) => {
      const targetDot = e.target.closest('.indicator-dot');
      if (!targetDot) return;

      const targetIdx = parseInt(targetDot.getAttribute('data-slide-index'), 10);
      moveToSlide(targetIdx);
      resetAutoplay();
    });
  }

  // Autoplay control
  function startAutoplay() {
    stopAutoplay(); // clear existing if any
    autoplayTimer = setInterval(() => {
      moveToSlide(currentIndex + 1);
    }, autoplayDelay);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  // Start Autoplay initially
  startAutoplay();

  // Pause autoplay when hovering
  const container = track.closest('.carousel-container');
  if (container) {
    container.addEventListener('mouseenter', stopAutoplay);
    container.addEventListener('mouseleave', startAutoplay);
  }

  // Click on the slide to advance to the next image
  track.addEventListener('click', () => {
    moveToSlide(currentIndex + 1);
    resetAutoplay();
  });

  // Mobile Touch Swipe Support
  let startX = 0;
  let isSwiping = false;

  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isSwiping = true;
    stopAutoplay();
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    isSwiping = false;
    const endX = e.changedTouches[0].clientX;
    const diffX = startX - endX;
    const threshold = 50; // minimum distance in px to register a swipe

    if (diffX > threshold) {
      // Swipe Left -> Next Slide
      moveToSlide(currentIndex + 1);
    } else if (diffX < -threshold) {
      // Swipe Right -> Prev Slide
      moveToSlide(currentIndex - 1);
    }
    startAutoplay();
  }, { passive: true });
}
