export function bindBookActions(container, openActions) {
  let timer, start, pressedCard, suppressClick = false;
  const cancel = () => {
    clearTimeout(timer);
    timer = null;
    window.removeEventListener('scroll', cancel, true);
  };
  const show = card => {
    cancel();
    if (card?.isConnected) openActions(card.dataset.book);
  };
  container.addEventListener('pointerdown', event => {
    cancel();
    suppressClick = false;
    if (!event.isPrimary || event.button !== 0 ||
        event.target.closest('button,a,input,select,summary')) return;
    pressedCard = event.target.closest('[data-book]');
    if (!pressedCard) return;
    start = {x: event.clientX, y: event.clientY};
    window.addEventListener('scroll', cancel, true);
    timer = setTimeout(() => {
      suppressClick = true;
      show(pressedCard);
    }, 550);
  });
  container.addEventListener('pointermove', event => {
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) cancel();
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
    container.addEventListener(type, cancel);
  }
  container.addEventListener('click', event => {
    if (suppressClick) {
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  container.addEventListener('contextmenu', event => {
    const card = event.target.closest('[data-book]');
    if (!card || event.target.closest('button,a,input,select,summary')) return;
    event.preventDefault();
    // Touch browsers may emit contextmenu after the long-press timer.
    if (!suppressClick) show(card);
  });
  container.addEventListener('keydown', event => {
    if (!event.target.matches('.book-title')) return;
    if (event.key === 'Enter' || event.key === ' ' ||
        event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      event.preventDefault();
      show(event.target.closest('[data-book]'));
    }
  });
}
