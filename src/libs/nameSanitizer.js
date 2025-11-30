/**
 * Sanitize full name to prevent repetition and excessive length
 * @param {string} name - The full name to sanitize
 * @param {number} maxWords - Maximum number of words to keep (default: 6)
 * @returns {string} - The sanitized name
 */
export function sanitizeFullName(name, maxWords = 6) {
  if (!name || typeof name !== "string") return name;

  // 1) Replace line breaks, commas, semicolons with spaces, remove extra spaces
  let s = name.replace(/[\r\n,;]+/g, " ").trim();
  s = s.replace(/\s+/g, " ");
  if (!s) return s;

  // 2) Split into words and compress consecutive duplicates (e.g., "Quân Quân" -> "Quân")
  const parts = s.split(" ");
  const compressed = [];
  for (const p of parts) {
    if (!p) continue;
    const last = compressed[compressed.length - 1];
    if (!last || last.toLowerCase() !== p.toLowerCase()) compressed.push(p);
  }

  // 3) Check if compressed is a repetition of a smaller block (e.g., block of 3 words)
  const n = compressed.length;
  for (let k = 1; k <= Math.floor(n / 2); k++) {
    if (n % k !== 0) continue;
    let ok = true;
    for (let i = 0; i < n; i++) {
      if (compressed[i].toLowerCase() !== compressed[i % k].toLowerCase()) {
        ok = false;
        break;
      }
    }
    if (ok) return compressed.slice(0, k).join(" ");
  }

  // 4) If still long, limit the number of words (e.g., 6 words)
  return compressed.slice(0, maxWords).join(" ");
}