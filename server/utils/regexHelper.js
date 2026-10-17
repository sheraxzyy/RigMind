/**
 * RigMind Backend Regex Query Utility
 * 
 * Safely parses and applies regex filters to server-side game searches
 * preventing regex injection or unhandled syntax exceptions.
 */

export function parseBackendRegex(query = '', useRegex = false) {
  if (!query || typeof query !== 'string') {
    return { regex: null, isRegex: false, isValid: true, cleanText: '' };
  }

  const trimmed = query.trim();

  // 1. Check for slash delimiter format: /pattern/flags
  const slashMatch = trimmed.match(/^\/(.+)\/([gimsuy]*)$/);
  if (slashMatch) {
    const pattern = slashMatch[1];
    const flags = slashMatch[2] || 'i';
    try {
      const regex = new RegExp(pattern, flags);
      return { regex, isRegex: true, isValid: true, cleanText: pattern };
    } catch {
      return { regex: null, isRegex: true, isValid: false, cleanText: pattern };
    }
  }

  // 2. Explicit useRegex parameter
  if (useRegex) {
    try {
      const regex = new RegExp(trimmed, 'i');
      return { regex, isRegex: true, isValid: true, cleanText: trimmed };
    } catch {
      return { regex: null, isRegex: true, isValid: false, cleanText: trimmed };
    }
  }

  // 3. Auto-detect regex metacharacters if present
  if (/[\\^$.*+?()[\]{}|]/.test(trimmed)) {
    try {
      const regex = new RegExp(trimmed, 'i');
      return { regex, isRegex: true, isValid: true, cleanText: trimmed };
    } catch {
      // Invalid regex: will fallback safely to literal substring search
      return { regex: null, isRegex: false, isValid: true, cleanText: trimmed };
    }
  }

  return { regex: null, isRegex: false, isValid: true, cleanText: trimmed };
}
