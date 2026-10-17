/**
 * RigMind PC System Requirements Parser
 * 
 * Safely parses raw publisher HTML or structured text from Steam / PCGamingWiki / IGDB
 * into clean, queryable hardware fields.
 */

export function parseRequirementsHtml(htmlString, defaultTarget = '') {
  if (!htmlString || typeof htmlString !== 'string') {
    return null;
  }

  // Strip HTML tags and clean whitespace while preserving key-value boundaries
  const cleanText = htmlString
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();

  const lines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);

  const parsed = {};

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.startsWith('os:') || lower.startsWith('operating system:')) {
      parsed.os = line.replace(/^(os|operating system):\s*/i, '').trim();
    } else if (lower.startsWith('processor:') || lower.startsWith('cpu:')) {
      parsed.cpu = line.replace(/^(processor|cpu):\s*/i, '').trim();
    } else if (lower.startsWith('memory:') || lower.startsWith('ram:')) {
      const ramText = line.replace(/^(memory|ram):\s*/i, '').trim();
      parsed.ram = ramText;
      const match = ramText.match(/(\d+)\s*(gb|mb)/i);
      if (match) {
        parsed.ramGb = match[2].toLowerCase() === 'gb' ? parseInt(match[1], 10) : Math.round(parseInt(match[1], 10) / 1024);
      }
    } else if (lower.startsWith('graphics:') || lower.startsWith('gpu:') || lower.startsWith('video card:')) {
      const gpuText = line.replace(/^(graphics|gpu|video card):\s*/i, '').trim();
      parsed.gpu = gpuText;
      const vramMatch = gpuText.match(/(\d+)\s*(gb|mb)/i);
      if (vramMatch) {
        parsed.vram = `${vramMatch[1]} ${vramMatch[2].toUpperCase()}`;
        parsed.vramGb = vramMatch[2].toLowerCase() === 'gb' ? parseInt(vramMatch[1], 10) : 1;
      }
    } else if (lower.startsWith('directx:')) {
      parsed.directX = line.replace(/^directx:\s*/i, '').trim();
    } else if (lower.startsWith('storage:') || lower.startsWith('hard drive:')) {
      const storageText = line.replace(/^(storage|hard drive):\s*/i, '').trim();
      parsed.storage = storageText;
      const match = storageText.match(/(\d+)\s*(gb|tb|mb)/i);
      if (match) {
        const val = parseInt(match[1], 10);
        parsed.storageGb = match[2].toLowerCase() === 'tb' ? val * 1024 : val;
      }
      if (storageText.toLowerCase().includes('ssd')) {
        parsed.storageType = 'SSD Required';
      }
    } else if (lower.startsWith('additional notes:') || lower.startsWith('notes:')) {
      const notesText = line.replace(/^(additional notes|notes):\s*/i, '').trim();
      parsed.notes = notesText;
      if (notesText.toLowerCase().includes('ssd')) {
        parsed.storageType = 'SSD Required';
      }
      if (notesText.toLowerCase().includes('1080p') || notesText.toLowerCase().includes('60 fps') || notesText.toLowerCase().includes('30 fps')) {
        parsed.target = notesText;
      }
    }
  }

  if (defaultTarget && !parsed.target) parsed.target = defaultTarget;
  return Object.keys(parsed).length ? parsed : null;
}
