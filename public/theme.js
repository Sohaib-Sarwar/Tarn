// Applies the saved theme before the first paint so the page never flashes the wrong colors.
// The choice is mirrored here from the app (a per browser convenience); records stay in IndexedDB.
;(function () {
  try {
    var t = localStorage.getItem('tarn.theme') || 'system'
    var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light')
  }
})()
