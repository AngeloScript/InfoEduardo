(() => {
  'use strict';
  const store = window.EDUARDO_STORE || {};
  const price = Number.isFinite(store.price) && store.price > 0 ? store.price : 19.99;
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  document.querySelectorAll('[data-price]').forEach(node => { node.textContent = money; });

  const valueNote = document.getElementById('recipe-value');
  if (valueNote) valueNote.textContent = 'Menos de ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.floor(price / 110 * 100 + 1) / 100) + ' por receita.';

  const readingToggle = document.getElementById('reading-toggle');
  const readingLabel = document.getElementById('reading-label');
  const announcement = document.getElementById('reading-announcement');
  function applyReadingMode(large, announce = false) {
    document.documentElement.dataset.largeText = large ? 'true' : 'false';
    readingToggle.setAttribute('aria-pressed', String(large));
    readingLabel.textContent = large ? 'Letra normal' : 'Letra maior';
    if (announce) announcement.textContent = large ? 'A letra da página foi aumentada.' : 'A letra voltou ao tamanho normal.';
    try { localStorage.setItem('eduardo-large-text', large ? 'true' : 'false'); } catch (_) {}
    requestAnimationFrame(updateSticky);
  }
  let savedLarge = false;
  try { savedLarge = localStorage.getItem('eduardo-large-text') === 'true'; } catch (_) {}
  readingToggle.addEventListener('click', () => applyReadingMode(readingToggle.getAttribute('aria-pressed') !== 'true', true));

  const dialogs = [...document.querySelectorAll('dialog')];
  const openers = new WeakMap();
  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else { dialog.removeAttribute('open'); afterClose(dialog); }
  }
  function afterClose(dialog) {
    if (!dialogs.some(item => item.open)) {
      document.body.classList.remove('dialog-open');
      const trigger = openers.get(dialog);
      const fallback = document.getElementById('hero-buy');
      if (trigger && trigger.getClientRects().length) trigger.focus({ preventScroll: true });
      else fallback?.focus({ preventScroll: true });
    }
    updateSticky();
  }
  function openDialog(id, trigger) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    dialogs.forEach(item => { if (item.open) closeDialog(item); });
    openers.set(dialog, trigger || document.activeElement);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else { dialog.setAttribute('open', ''); dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('role', 'dialog'); }
    document.body.classList.add('dialog-open');
    dialog.scrollTop = 0;
    dialog.querySelector('[data-close]')?.focus({ preventScroll: true });
    updateSticky();
  }
  document.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => {
    document.getElementById('page-image').src = button.dataset.page;
    document.getElementById('page-image').alt = button.dataset.pageTitle;
    document.getElementById('page-original').href = button.dataset.page;
    document.getElementById('page-dialog-title').textContent = button.dataset.pageTitle;
    openDialog('page-dialog', button);
  }));
  document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => openDialog(button.dataset.dialog, button)));
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));
  dialogs.forEach(dialog => {
    dialog.addEventListener('close', () => afterClose(dialog));
    dialog.addEventListener('click', event => {
      const box = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) closeDialog(dialog);
    });
  });
  document.addEventListener('keydown', event => {
    const activeDialog = dialogs.find(item => item.open);
    if (!activeDialog || typeof activeDialog.showModal === 'function') return;
    if (event.key === 'Escape') { event.preventDefault(); closeDialog(activeDialog); }
    if (event.key === 'Tab') {
      const focusable = [...activeDialog.querySelectorAll('button,a[href],[tabindex="0"]')].filter(item => item.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });

  let checkout = null;
  if (typeof store.checkoutUrl === 'string' && store.checkoutUrl.trim()) {
    try { const url = new URL(store.checkoutUrl); if (url.protocol === 'https:') checkout = url.href; } catch (_) {}
  }
  if (checkout) {
    const status = document.getElementById('purchase-status');
    if (status) status.textContent = 'Ao escolher o ebook, você segue para a plataforma de pagamento. Confira nela as condições de pagamento e as instruções de acesso antes de concluir a compra.';
  }
  document.querySelectorAll('[data-buy]').forEach(button => {
    button.addEventListener('click', () => {
      if (checkout) { window.location.assign(checkout); return; }
      openDialog('checkout-dialog', button);
    });
  });

  const sticky = document.getElementById('sticky-buy');
  const heroBuy = document.getElementById('hero-buy');
  const offerBuy = document.getElementById('offer-buy');
  function updateSticky() {
    if (!sticky || !heroBuy || !offerBuy) return;
    const hero = heroBuy.getBoundingClientRect();
    const offer = offerBuy.getBoundingClientRect();
    const offerVisible = offer.top < window.innerHeight && offer.bottom > 0;
    const mobileView = window.matchMedia('(max-width: 850px)').matches;
    const heroVisible = hero.top < window.innerHeight && hero.bottom > 0;
    sticky.hidden = !((hero.bottom < 0 || (mobileView && !heroVisible)) && !offerVisible && !dialogs.some(item => item.open));
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(updateSticky, { threshold: [0, 1] });
    observer.observe(heroBuy); observer.observe(offerBuy);
  } else {
    let queued = false;
    window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; updateSticky(); }); } }, { passive: true });
  }
  window.addEventListener('resize', updateSticky, { passive: true });
  window.addEventListener('pageshow', updateSticky);
  applyReadingMode(savedLarge);
})();
