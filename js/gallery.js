const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SWIPER = 'https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min';
const FANCY = 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0.36/dist/fancybox/fancybox';

/* ---------- Loaders with caching ---------- */

const loaded = new Map();

function loadResource(url, type) {
  if (loaded.has(url)) return loaded.get(url);

  const promise = new Promise((resolve, reject) => {
    const el = document.createElement(type === 'css' ? 'link' : 'script');

    if (type === 'css') {
      el.rel = 'stylesheet';
      el.href = url;
    } else {
      el.src = url;
      el.async = true;
    }

    el.onload = resolve;
    el.onerror = () => {
      el.remove();
      loaded.delete(url);
      reject(new Error(`Failed to load: ${url}`));
    };

    document.head.append(el);
  });

  loaded.set(url, promise);
  return promise;
}

const loadCSS = (url) => loadResource(url, 'css');
const loadJS = (url) => loadResource(url, 'js');

/* ---------- Section observer ---------- */

function whenVisible(el, init, rootMargin = '400px') {
  if (!el) return;

  if (!('IntersectionObserver' in window)) {
    init();
    return;
  }

  const io = new IntersectionObserver((entries, obs) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      obs.disconnect();
      init();
    }
  }, { rootMargin });

  io.observe(el);
}

/* ---------- 1. Swiper: reviews ---------- */

whenVisible(document.getElementById('reviews'), async () => {
  if (!document.querySelector('.testimonials-swiper')) return;

  try {
    await Promise.all([loadCSS(`${SWIPER}.css`), loadJS(`${SWIPER}.js`)]);

    if (typeof Swiper === 'undefined') return;

    new Swiper('.testimonials-swiper', {
      rewind: true,
      spaceBetween: 20,
      autoplay: reduceMotion
        ? false
        : { delay: 5000, disableOnInteraction: true, pauseOnMouseEnter: true },
      navigation: {
        nextEl: '.swiper-button-next-custom',
        prevEl: '.swiper-button-prev-custom'
      },
      pagination: { el: '.swiper-pagination-custom', clickable: true },
      a11y: {
        prevSlideMessage: 'Попередній відгук',
        nextSlideMessage: 'Наступний відгук',
        paginationBulletMessage: 'Перейти до відгуку {{index}}'
      },
      breakpoints: {
        640: { slidesPerView: 1.6, spaceBetween: 24 },
        1024: { slidesPerView: 2, spaceBetween: 28 }
      }
    });
  } catch (error) {
    console.warn('Swiper loading failed:', error);
  }
});

/* ---------- 2. Fancybox: gallery ---------- */

whenVisible(document.getElementById('gallery'), async () => {
  if (!document.querySelector("[data-fancybox='main-gallery']")) return;

  try {
    await Promise.all([loadCSS(`${FANCY}.css`), loadJS(`${FANCY}.umd.js`)]);

    if (typeof Fancybox === 'undefined') return;

    Fancybox.bind("[data-fancybox='main-gallery']", {
      Carousel: { Transition: 'fade' },
      Images: { Panzoom: { maxScale: 3 } }
    });
  } catch (error) {
    console.warn('Fancybox loading failed:', error);
  }
});

/* ---------- 3. Typing effect (own code, no library) ----------
   The first phrase is already in the HTML, so first paint and LCP do not
   depend on JS. The animation starts only after load + idle. */

const typedEl = document.getElementById('typed-text');

if (typedEl && !reduceMotion) {
  const phrases = [
    'Фінансова свобода.',
    'Впевненість у завтрашньому дні.',
    'Керування доходами.'
  ];
  const TYPE_MS = 50;
  const BACK_MS = 30;
  const HOLD_MS = 1500;

  let phrase = 0;
  let pos = phrases[0].length;   // first phrase is already written
  let deleting = true;           // start by erasing it
  let timer = 0;
  let visible = true;

  const tick = () => {
    if (!visible) return;
    const text = phrases[phrase];

    pos += deleting ? -1 : 1;
    typedEl.textContent = text.slice(0, pos);

    let delay = deleting ? BACK_MS : TYPE_MS;

    if (!deleting && pos === text.length) {
      deleting = true;
      delay = HOLD_MS;
    } else if (deleting && pos === 0) {
      deleting = false;
      phrase = (phrase + 1) % phrases.length;
      delay = 300;
    }
    timer = setTimeout(tick, delay);
  };

  const start = () => {
    timer = setTimeout(tick, HOLD_MS);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        clearTimeout(timer);
        if (visible) timer = setTimeout(tick, TYPE_MS);
      }).observe(typedEl);
    }
  };

  const afterLoad = () => {
    const go = () => setTimeout(start, 3000);
    if ('requestIdleCallback' in window) requestIdleCallback(go);
    else go();
  };

  if (document.readyState === 'complete') afterLoad();
  else window.addEventListener('load', afterLoad, { once: true });
}

/* ---------- 4. Video and map: load on click ---------- */

document.querySelectorAll('[data-embed]').forEach((box) => {
  const btn = box.querySelector('[data-embed-load]');
  const tpl = box.querySelector('template');

  if (!btn || !tpl) return;

  btn.addEventListener('click', () => {
    const iframe = tpl.content.firstElementChild?.cloneNode(true);
    if (!iframe) return;

    box.replaceChildren(iframe);
    iframe.focus();
  }, { once: true });
});