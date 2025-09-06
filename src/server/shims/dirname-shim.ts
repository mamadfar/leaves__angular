// Minimal shim to provide CommonJS-like globals when running in ESM/SSR environments
// (Vite SSR) where __dirname and __filename may be missing. This keeps the shim
// tiny and safe: it only sets fallbacks when they don't already exist.

const _g: any = globalThis as any;

if (typeof _g.__dirname === 'undefined') {
  try {
    _g.__dirname =
      typeof process !== 'undefined' && typeof process.cwd === 'function' ? process.cwd() : '.';
  } catch {
    _g.__dirname = '.';
  }
}

if (typeof _g.__filename === 'undefined') {
  try {
    // Use a reasonable default: treat the filename as the entry directory + index.js
    // This is only a fallback used by code that expects __filename to exist.
    const cwd =
      typeof process !== 'undefined' && typeof process.cwd === 'function' ? process.cwd() : '.';
    _g.__filename =
      cwd + (cwd.endsWith('/') || cwd.endsWith('\\') ? '' : require('path').sep) + 'index.js';
  } catch {
    _g.__filename = 'index.js';
  }
}
