// Shift-click a PDF link to pick the style; a plain click gets the default (ember).
(function () {
  if (window.__pdfTheme) return;
  window.__pdfTheme = true;
  var themes = ['ember', 'classic', 'engineeringclassic', 'engineeringresumes', 'harvard', 'ink', 'moderncv', 'opal', 'sb2nov'];
  var menu;
  document.addEventListener('click', function (e) {
    if (menu && menu.contains(e.target)) return;   // a theme link: let it open
    if (menu) { menu.remove(); menu = null; }
    var a = e.target.closest && e.target.closest('a[href*="/pandoc/resume.pdf"]');
    if (!a || !e.shiftKey) return;
    e.preventDefault();
    menu = document.createElement('div');
    menu.style.cssText = 'position:fixed;z-index:9999;background:#1e293b;color:#fff;border:1px solid #334155;border-radius:8px;padding:6px;font:14px sans-serif;left:' + e.clientX + 'px;top:' + e.clientY + 'px';
    themes.forEach(function (t) {
      var l = document.createElement('a');
      l.href = a.getAttribute('href').split('?')[0] + '?theme=' + t;
      l.target = '_blank';
      l.textContent = t + (t === 'ember' ? ' (default)' : '');
      l.style.cssText = 'display:block;padding:4px 10px;color:#fff;text-decoration:none';
      menu.appendChild(l);
    });
    document.body.appendChild(menu);
    e.stopPropagation();
  }, true);
})();
