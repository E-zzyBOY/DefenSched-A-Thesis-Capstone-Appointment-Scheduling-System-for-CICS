'use strict';
const fs = require('fs');
const file = 'public/faculty-dashboard.html';
let lines = fs.readFileSync(file, 'utf8').split('\r\n');

// All operations highest-index first to avoid index shifting

// FIX: Line 1645 (1-indexed): })(); -> });
if (lines[1644] && lines[1644].trim() === '})();') {
  lines[1644] = '    });';
  console.log('Fixed: })(); -> });');
}

// FIX: Delete lines 1502-1504 (1-indexed, 0-indexed: 1501-1503)
// orphaned catch + IIFE close + premature </script>
if (lines[1501] && lines[1501].includes('Stats load error')) {
  lines.splice(1501, 3);
  console.log('Fixed: removed orphaned catch/iife/premature-script-close');
}

// FIX: Remove duplicate DOMContentLoaded theme-only listener (lines 1604-1616 original)
// After splice above (-3), it's now around 1601-1613
// Find it by content
const themeListenerIdx = lines.findIndex(l => l.includes("document.addEventListener('DOMContentLoaded', () => {"));
if (themeListenerIdx >= 0) {
  // Find matching closing });
  let depth = 0, endIdx = themeListenerIdx;
  for (let i = themeListenerIdx; i < lines.length; i++) {
    depth += (lines[i].match(/\{/g)||[]).length - (lines[i].match(/\}/g)||[]).length;
    if (i > themeListenerIdx && depth <= 0) { endIdx = i; break; }
  }
  lines.splice(themeListenerIdx, endIdx - themeListenerIdx + 1);
  console.log('Fixed: removed duplicate DOMContentLoaded at', themeListenerIdx + 1);
}

// FIX: Wire theme toggle into init DOMContentLoaded
// Find the main init listener and add theme wiring at start
const initIdx = lines.findIndex(l => l.includes("document.addEventListener('DOMContentLoaded', async () => {"));
if (initIdx >= 0) {
  const themeWiring = [
    '      // Theme setup',
    '      initTheme();',
    '      const _themeBtn = document.getElementById(\'theme-toggle\');',
    '      if (_themeBtn) _themeBtn.addEventListener(\'click\', () => {',
    '        const _t = document.documentElement.getAttribute(\'data-theme\') || \'light\';',
    '        const _nt = _t === \'light\' ? \'dark\' : \'light\';',
    '        document.documentElement.setAttribute(\'data-theme\', _nt);',
    '        localStorage.setItem(\'defensched-theme\', _nt);',
    '        updateThemeIcon(_nt);',
    '      });'
  ];
  lines.splice(initIdx + 1, 0, ...themeWiring);
  console.log('Fixed: added theme wiring to init listener');
}

// FIX: Delete lines 860-911 (1-indexed, 0-indexed: 859-910) = 52 lines
// Old broken nav items + first sidebar-user + first </aside> + bad <main> + bad page-header
if (lines[859] && lines[859].includes('nav-item') && !lines[859].includes('data-section')) {
  lines.splice(859, 52);
  console.log('Fixed: removed broken body structure (lines 860-911)');
} else {
  console.log('WARN: body fix skipped - line 860 is:', JSON.stringify(lines[859]));
}

// FIX: Delete lines 9-146 (1-indexed, 0-indexed: 8-145) = 138 lines
// First duplicate style block + duplicate meta/link tags
if (lines[8] && lines[8].trim() === '<style>' && lines[9] && lines[9].includes('--bg: #f7f8fc;')) {
  lines.splice(8, 138);
  console.log('Fixed: removed duplicate head content (lines 9-146)');
} else {
  console.log('WARN: head fix skipped - line 9 is:', JSON.stringify(lines[8]));
}

fs.writeFileSync(file, lines.join('\r\n'), 'utf8');
console.log('Done! Total lines:', lines.length);
