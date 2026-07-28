(function () {
  'use strict';

  document.documentElement.classList.add('js');
  window.__suocFetchCalls = 0;

  function initializeMenu() {
    const navigation = document.querySelector('.primary-navigation');
    const toggle = navigation?.querySelector('.menu-toggle');
    if (!navigation || !toggle) return;

    function closeMenu({ returnFocus = false } = {}) {
      navigation.removeAttribute('data-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Deschide meniul');
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeMenu();
        return;
      }
      navigation.setAttribute('data-open', '');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Închide meniul');
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu({ returnFocus: true });
      }
    });

    window.matchMedia('(min-width: 861px)').addEventListener('change', (event) => {
      if (event.matches) closeMenu();
    });
  }

  function normalizeSearchText(value) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('ro-RO');
  }

  function initializeSearch() {
    const form = document.querySelector('[data-search-form]');
    const input = document.querySelector('[data-search-input]');
    const results = document.querySelector('[data-search-results]');
    const index = Array.isArray(window.SUOC_SEARCH_INDEX) ? window.SUOC_SEARCH_INDEX : [];
    const script = document.querySelector('script[src$="assets/js/site.js"]');
    if (!form || !input || !results || !script) return;
    const siteRoot = new URL('../../', script.src);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = normalizeSearchText(input.value.trim());
      results.replaceChildren();
      if (!query) {
        results.hidden = true;
        return;
      }

      const matches = index
        .map((entry) => {
          const title = normalizeSearchText(entry.title);
          const text = normalizeSearchText(entry.text);
          return { entry, score: title.includes(query) ? 2 : text.includes(query) ? 1 : 0 };
        })
        .filter((candidate) => candidate.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, 8);

      if (!matches.length) {
        const empty = document.createElement('p');
        empty.textContent = 'Niciun rezultat.';
        results.append(empty);
      } else {
        const list = document.createElement('ul');
        for (const { entry } of matches) {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = new URL(entry.file, siteRoot).href;
          link.textContent = entry.title;
          item.append(link);
          list.append(item);
        }
        results.append(list);
      }
      results.hidden = false;
    });

    input.addEventListener('search', () => {
      if (!input.value) results.hidden = true;
    });
  }

  function initializeGallery() {
    const dialog = document.querySelector('dialog.lightbox');
    const items = [...document.querySelectorAll('[data-gallery-item]')];
    if (!dialog || !items.length) return;

    const image = dialog.querySelector('[data-lightbox-image]');
    const caption = dialog.querySelector('[data-lightbox-caption]');
    const previousButton = dialog.querySelector('[data-lightbox-previous]');
    const nextButton = dialog.querySelector('[data-lightbox-next]');
    const closeButton = dialog.querySelector('[data-lightbox-close]');
    let currentIndex = 0;
    let returnTarget = null;

    function showImage(index) {
      currentIndex = (index + items.length) % items.length;
      const item = items[currentIndex];
      const thumbnail = item.querySelector('img');
      const label = thumbnail?.alt ?? '';
      image.setAttribute('src', item.getAttribute('href'));
      image.setAttribute('alt', label);
      caption.textContent = label;
    }

    items.forEach((item, index) => {
      item.addEventListener('click', (event) => {
        event.preventDefault();
        returnTarget = item;
        showImage(index);
        dialog.showModal();
        closeButton.focus();
      });
    });

    previousButton.addEventListener('click', () => showImage(currentIndex - 1));
    nextButton.addEventListener('click', () => showImage(currentIndex + 1));
    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => returnTarget?.focus());
  }

  initializeMenu();
  initializeSearch();
  initializeGallery();
}());
