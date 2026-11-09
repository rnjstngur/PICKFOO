/* PICKFOO API base: use SAME origin on Django-hosted web (and Android dev remote).
 * Only legacy static 8765 development goes across localhost ports.
 */
window.PICKFOO_API_BASE = (() => {
  const loc = window.location;
  if (['127.0.0.1', 'localhost'].includes(loc.hostname) && loc.port === '8765') {
    return `${loc.protocol}//${loc.hostname}:8000`;
  }
  return loc.origin;
})();
