/* Tiện ích dùng chung cho giao diện. */

export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeText(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatDate(value) {
  if (!value) return '';
  const text = String(value).trim();
  if (/^\d{4}$/.test(text)) return text;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return text;
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function dateStamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
}

export function truncate(value, max = 180) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

export function paragraphsHtml(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${esc(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/**
 * Kết xuất văn bản thuần từ Gemini thành HTML an toàn.
 * Chỉ hỗ trợ in đậm, in nghiêng và gạch đầu dòng; mọi thẻ khác đều bị thoát.
 */
export function simpleMarkdown(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  const inline = (line) =>
    esc(line)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');

  const html = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length) {
      html.push(`<ul>${listItems.map((item) => `<li>${item}</li>`).join('')}</ul>`);
      listItems = [];
    }
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      listItems.push(inline(bullet[1]));
      continue;
    }
    flushList();
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (heading) {
      html.push(`<p class="chat-heading">${inline(heading[1])}</p>`);
    } else {
      html.push(`<p>${inline(line)}</p>`);
    }
  }
  flushList();
  return html.join('');
}

export function downloadFile(filename, content, mime = 'application/json;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyText(text) {
  const value = String(text || '');
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* thử cách dự phòng */
  }

  try {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function encodePath(path) {
  return String(path || '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

export function scrollToId(id, behavior = 'smooth') {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior, block: 'start' });
}

export function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function icon(name, className = 'icon') {
  const paths = ICONS[name] || '';
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}

const ICONS = {
  search:
    '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.6-3.6"></path>',
  download:
    '<path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"></path>',
  close: '<path d="m6 6 12 12M18 6 6 18"></path>',
  arrowRight: '<path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path>',
  arrowLeft: '<path d="M19 12H5"></path><path d="m11 18-6-6 6-6"></path>',
  chat:
    '<path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-5.5A8 8 0 1 1 21 12Z"></path><path d="M8 11h8M8 15h5"></path>',
  book:
    '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z"></path><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"></path>',
  mapPin:
    '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.6"></circle>',
  image:
    '<rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="8.5" cy="9" r="1.5"></circle><path d="m21 15-4.5-4.5L7 20"></path>',
  check: '<path d="m4 12 5 5L20 6"></path>',
  alert:
    '<path d="M12 3 2.5 20h19L12 3Z"></path><path d="M12 9v5"></path><circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none"></circle>',
  info:
    '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5"></path><circle cx="12" cy="8" r=".8" fill="currentColor" stroke="none"></circle>',
  sparkles:
    '<path d="m12 3 1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7L12 3Z"></path><path d="M18 15.5 18.9 18l2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9.9-2.5Z"></path>',
  copy:
    '<rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M15 5.5A1.5 1.5 0 0 0 13.5 4H5.5A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15"></path>',
  printer:
    '<path d="M6 9V4h12v5"></path><rect x="4" y="9" width="16" height="8" rx="2"></rect><path d="M7 15h10v5H7z"></path>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"></path>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2"></path><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"></path>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"></path><path d="M14 3v6h6"></path>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 6.3"></path><path d="M20 4v7h-7"></path>',
  send: '<path d="m4 4 17 8-17 8 4-8-4-8Z"></path><path d="M8 12h13"></path>'
};
