/**
 * RigMind Regex Search & Query Utility
 * 
 * Provides safe regex compilation, validation, pattern matching,
 * and escaping for search inputs across the application.
 */

/**
 * Escapes all regular expression special characters in a string.
 * @param {string} str 
 * @returns {string}
 */
export function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parses a search query into either a validated RegExp or clean text pattern.
 * Supports:
 * 1. Explicit slash format: `/pattern/i` or `/pattern/`
 * 2. Regex mode toggle (where raw input is treated as regex)
 * 3. Graceful fallback when regex syntax is invalid (prevents crashes)
 * 
 * @param {string} query 
 * @param {boolean} isExplicitRegexMode 
 * @returns {{ regex: RegExp|null, isRegex: boolean, isValid: boolean, error: string|null, cleanQuery: string }}
 */
export function parseSearchRegex(query = '', isExplicitRegexMode = false) {
  if (!query || typeof query !== 'string') {
    return { regex: null, isRegex: false, isValid: true, error: null, cleanQuery: '' };
  }

  const trimmed = query.trim();

  // 1. Check for slash delimiter format: /pattern/flags
  const slashMatch = trimmed.match(/^\/(.+)\/([gimsuy]*)$/);
  if (slashMatch) {
    const pattern = slashMatch[1];
    const flags = slashMatch[2] || 'i';
    try {
      const regex = new RegExp(pattern, flags);
      return { regex, isRegex: true, isValid: true, error: null, cleanQuery: pattern };
    } catch (err) {
      return { regex: null, isRegex: true, isValid: false, error: err.message, cleanQuery: pattern };
    }
  }

  // 2. If regex mode is explicitly toggled by user
  if (isExplicitRegexMode) {
    try {
      const regex = new RegExp(trimmed, 'i');
      return { regex, isRegex: true, isValid: true, error: null, cleanQuery: trimmed };
    } catch (err) {
      return { regex: null, isRegex: true, isValid: false, error: err.message, cleanQuery: trimmed };
    }
  }

  // 3. Standard text search - safe for any special characters
  return { regex: null, isRegex: false, isValid: true, error: null, cleanQuery: trimmed };
}

/**
 * Tests if an object's specified fields match a search query (regex or substring)
 * 
 * @param {object} item 
 * @param {string[]} fields 
 * @param {string} query 
 * @param {boolean} isRegexMode 
 * @returns {boolean}
 */
export function matchSearch(item, fields = ['title'], query = '', isRegexMode = false) {
  if (!query || !item) return true;

  const parsed = parseSearchRegex(query, isRegexMode);

  if (parsed.isRegex) {
    if (!parsed.isValid || !parsed.regex) return false;
    return fields.some((field) => {
      const val = item[field];
      if (val == null) return false;
      if (Array.isArray(val)) {
        return val.some((v) => parsed.regex.test(String(v)));
      }
      return parsed.regex.test(String(val));
    });
  }

  // Standard case-insensitive substring search
  const lowerQuery = query.toLowerCase().trim();
  return fields.some((field) => {
    const val = item[field];
    if (val == null) return false;
    if (Array.isArray(val)) {
      return val.some((v) => String(v).toLowerCase().includes(lowerQuery));
    }
    return String(val).toLowerCase().includes(lowerQuery);
  });
}
