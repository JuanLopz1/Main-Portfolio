function followInSameTab(event, link) {
  return !event.defaultPrevented && event.button === 0 && !event.altKey && !event.ctrlKey &&
    !event.metaKey && !event.shiftKey && !link.hasAttribute('download') &&
    (!link.target || link.target === '_self');
}

document.addEventListener('click', event => {
  const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (!link || !followInSameTab(event, link)) return;

  const destination = new URL(link.href);
  const referrer = document.referrer ? new URL(document.referrer) : null;
  if (link.classList.contains('back-link') && history.length > 1 &&
      referrer?.origin === location.origin && destination.origin === location.origin &&
      referrer.pathname === destination.pathname) {
    event.preventDefault();
    history.back();
    return;
  }

  const isPageLink = destination.protocol === 'https:' || destination.protocol === 'http:';
  const samePage = destination.origin === location.origin &&
    destination.pathname === location.pathname && destination.search === location.search;
  if (samePage && location.pathname !== '/' && destination.hash) {
    const target = document.getElementById(destination.hash.slice(1));
    if (target) {
      event.preventDefault();
      history.replaceState(history.state, '', destination.href);
      target.focus({ preventScroll: true });
      target.scrollIntoView();
    }
    return;
  }

  if (isPageLink && !samePage) {
    history.replaceState({ ...history.state, portfolioReturnPoint: { top: scrollY, id: link.id } }, '');
  }
});

window.addEventListener('pageshow', event => {
  const position = history.state?.portfolioReturnPoint;
  const navigation = performance.getEntriesByType('navigation')[0];
  if (!position || (!event.persisted && navigation?.type !== 'back_forward')) return;

  requestAnimationFrame(() => {
    scrollTo({ top: position.top, behavior: 'instant' });
    if (position.id) document.getElementById(position.id)?.focus({ preventScroll: true });
  });
});
