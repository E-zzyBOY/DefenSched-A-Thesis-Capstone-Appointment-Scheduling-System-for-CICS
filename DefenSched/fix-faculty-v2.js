'use strict';
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'public', 'faculty-dashboard.html');
const src = fs.readFileSync(file, 'utf8');
let lines = src.split(/\r?\n/);

console.log('Original line count:', lines.length);

// === FIX 1: Remove the first duplicate <style> block (lines 9-140, 0-indexed 8-139) ===
// This is the old style block without dark mode support that duplicates lines 147-850
if (lines[8] && lines[8].trim() === '<style>' && lines[9] && lines[9].includes('--bg: #f7f8fc;')) {
  // Find the closing </style> of this first block
  let closeIdx = -1;
  for (let i = 9; i < 200; i++) {
    if (lines[i] && lines[i].trim() === '</style>') { closeIdx = i; break; }
  }
  if (closeIdx > 0) {
    // Also remove the duplicate meta/title/link tags that follow (lines 141-146 become right after </style>)
    // Find where the second <style> block starts
    let secondStyleIdx = -1;
    for (let i = closeIdx + 1; i < closeIdx + 20; i++) {
      if (lines[i] && lines[i].trim() === '<style>') { secondStyleIdx = i; break; }
    }
    if (secondStyleIdx > 0) {
      // Remove from line 9 (0-indexed 8) to just before the second <style>
      const removeCount = secondStyleIdx - 8;
      lines.splice(8, removeCount);
      console.log(`FIX 1: Removed ${removeCount} duplicate head lines (old style + duplicate meta/title/link)`);
    }
  }
}

// === FIX 2: Remove the old broken sidebar + orphaned HTML (lines 860-911 area) ===
// After FIX 1, line numbers shifted. Find the old sidebar by content.
// The old sidebar starts right after </div> of logo and has nav-items WITHOUT data-section
// Look for the pattern: broken nav-items followed by </nav> then duplicate sidebar-user then </aside> then <main> then page-header
// Then find the GOOD sidebar starting with <nav class="nav">

// Find the first <body> tag
let bodyIdx = lines.findIndex(l => l.trim() === '<body>');
if (bodyIdx < 0) bodyIdx = lines.findIndex(l => l.trim().startsWith('<body'));

// Find the closing </div> of the logo section (has "CICS · MSU Main Campus")
let logoEndIdx = -1;
for (let i = bodyIdx; i < bodyIdx + 30; i++) {
  if (lines[i] && lines[i].includes('CICS') && lines[i].includes('MSU')) {
    // Next line should be </div>
    logoEndIdx = i + 1; // the </div> closing logo
    break;
  }
}

if (logoEndIdx > 0) {
  // Now find where the OLD broken nav items start (right after logo close)
  // They are nav-items WITHOUT data-section attribute
  let oldNavStart = logoEndIdx + 1;
  
  // Find where the GOOD <nav class="nav"> starts
  let goodNavIdx = -1;
  for (let i = oldNavStart; i < oldNavStart + 120; i++) {
    if (lines[i] && lines[i].trim() === '<nav class="nav">') { goodNavIdx = i; break; }
  }
  
  if (goodNavIdx > 0) {
    // Everything between logoEndIdx+1 and goodNavIdx-1 is the old broken content
    // This includes: old nav items without data-section, old </nav>, old sidebar-user, old </aside>, old <main>, old page-header
    const removeCount = goodNavIdx - oldNavStart;
    if (removeCount > 0) {
      lines.splice(oldNavStart, removeCount);
      console.log(`FIX 2: Removed ${removeCount} lines of old broken sidebar/nav content`);
    }
  }
}

// === FIX 3: Remove orphaned catch/IIFE/script-close around the loadAvailability function ===
// Find the pattern: "} catch (e) { console.error('Stats load error'" followed by "})();" and "</script>"
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i] && lines[i].includes('Stats load error')) {
    // Check if next lines are })(); and </script>
    let count = 1;
    if (lines[i + 1] && lines[i + 1].trim() === '})();') count++;
    if (lines[i + count] && lines[i + count].trim() === '</script>') count++;
    lines.splice(i, count);
    console.log(`FIX 3: Removed ${count} orphaned catch/IIFE/script lines at index ${i}`);
    break;
  }
}

// === FIX 4: Fix the final })(); -> }); ===
// Find the DOMContentLoaded async listener's closing
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i] && lines[i].trim() === '})();') {
    lines[i] = lines[i].replace('})();', '});');
    console.log(`FIX 4: Fixed })(); -> }); at line ${i + 1}`);
    break;
  }
}

// === FIX 5: Make sure avail-mode event listener is inside the script tag ===
// Find any code that's between </script> and the next <script> or after </script> that should be inside
// This is already handled by FIX 3 removing the premature </script>

// === FIX 6: Remove duplicate DOMContentLoaded for theme (keep the one in init) ===
// Find the standalone theme DOMContentLoaded listener
let themeDCLIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i] && lines[i].includes("document.addEventListener('DOMContentLoaded', () =>") && 
      !lines[i].includes('async')) {
    // Check if next few lines mention theme-toggle
    let isThemeListener = false;
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      if (lines[j] && lines[j].includes('theme-toggle')) { isThemeListener = true; break; }
    }
    if (isThemeListener) {
      themeDCLIdx = i;
      break;
    }
  }
}

if (themeDCLIdx >= 0) {
  // Find the matching closing });
  let depth = 0, endIdx = themeDCLIdx;
  for (let i = themeDCLIdx; i < lines.length; i++) {
    depth += (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
    if (i > themeDCLIdx && depth <= 0) { endIdx = i; break; }
  }
  const count = endIdx - themeDCLIdx + 1;
  lines.splice(themeDCLIdx, count);
  console.log(`FIX 6: Removed duplicate theme DOMContentLoaded (${count} lines at index ${themeDCLIdx})`);
}

// === FIX 7: Add theme init + toggle into the main DOMContentLoaded async listener ===
// Find the main init listener
const initIdx = lines.findIndex(l => l.includes("document.addEventListener('DOMContentLoaded', async"));
if (initIdx >= 0) {
  const themeCode = [
    '      // Theme setup',
    '      initTheme();',
    "      const _themeBtn = document.getElementById('theme-toggle');",
    "      if (_themeBtn) _themeBtn.addEventListener('click', () => {",
    "        const _t = document.documentElement.getAttribute('data-theme') || 'light';",
    "        const _nt = _t === 'light' ? 'dark' : 'light';",
    "        document.documentElement.setAttribute('data-theme', _nt);",
    "        localStorage.setItem('defensched-theme', _nt);",
    '        updateThemeIcon(_nt);',
    '      });'
  ];
  lines.splice(initIdx + 1, 0, ...themeCode);
  console.log('FIX 7: Added theme wiring to main init listener');
}

// Write the result
fs.writeFileSync(file, lines.join('\r\n'), 'utf8');
console.log('Done! Final line count:', lines.length);
