/* Điều hướng, tương tác và gọi API của ứng dụng. */

import {
  buildExport,
  checkApi,
  getApiStatus,
  getMeta,
  getRecord,
  getRecords,
  loadData
} from './store.js';
import * as views from './views.js';
import {
  copyText,
  dateStamp,
  downloadFile,
  encodePath,
  esc,
  icon,
  safeDecode,
  scrollToId
} from './utils.js';

const appEl = document.getElementById('app');
const headerEl = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const toastEl = document.getElementById('toast');

const drafts = new Map();
let dataReady = false;
let lastFeedback = null;
let toastTimer = null;
let qaRequestSeq = 0;

init();

async function init() {
  bindEvents();
  setFooterYear();

  try {
    await loadData();
    dataReady = true;
  } catch (error) {
    appEl.innerHTML = views.errorView(error.message).html;
    document.title = 'Không tải được hồ sơ · Kiểm kê văn bia';
    return;
  }

  await checkApi();
  window.addEventListener('hashchange', () => route());
  route();
}

function bindEvents() {
  document.addEventListener('click', onClick);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('change', onChange);
  document.addEventListener('input', onInput);
  document.addEventListener('keydown', onKeyDown);
}

function onClick(event) {
  // Liên kết bỏ qua dùng href="#main"; chặn để không kích hoạt hash routing.
  if (event.target.closest('.skip-link')) {
    event.preventDefault();
    const main = document.getElementById('main');
    if (main) {
      main.focus();
      main.scrollIntoView();
    }
    return;
  }

  const actionEl = event.target.closest('[data-action]');

  if (actionEl) {
    const action = actionEl.dataset.action;
    switch (action) {
      case 'toggle-menu':
        event.preventDefault();
        toggleMenu();
        break;
      case 'export':
        doExport();
        break;
      case 'print':
        window.print();
        break;
      case 'gallery':
        selectGallery(actionEl);
        break;
      case 'copy':
        copyToClipboard(actionEl.dataset.copy || '');
        break;
      case 'ocr':
        runOcr(actionEl);
        break;
      case 'copy-draft':
        copyDraft(actionEl);
        break;
      case 'download-draft':
        downloadDraft(actionEl);
        break;
      case 'clear-draft':
        clearDraft(actionEl);
        break;
      case 'suggest':
        useSuggestion(actionEl);
        break;
      case 'retry-ask':
        retryAsk();
        break;
      case 'reset-chat':
        resetChat();
        break;
      case 'download-feedback':
        downloadFeedback();
        break;
      case 'reload':
        location.reload();
        break;
      default:
        break;
    }

    if (action !== 'toggle-menu') closeMenu();
    return;
  }

  if (event.target.closest('.site-nav a')) closeMenu();
  if (
    headerEl.classList.contains('nav-open') &&
    !headerEl.contains(event.target)
  ) {
    closeMenu();
  }
}

function onSubmit(event) {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  const kind = form.dataset.form;

  if (kind === 'search') {
    const question = new FormData(form).get('q') || '';
    navigateToList({ q: String(question).trim() });
    return;
  }

  if (kind === 'filters') {
    const data = new FormData(form);
    const filters = {};
    for (const key of ['q', 'nienHieu', 'thanHieu', 'loaiTuLieu', 'mucKiemChung']) {
      const value = String(data.get(key) || '').trim();
      if (value) filters[key] = value;
    }
    navigateToList(filters);
    return;
  }

  if (kind === 'ask') {
    const data = new FormData(form);
    submitQuestion(String(data.get('question') || ''));
    return;
  }

  if (kind === 'ghi-nhan') {
    handleFeedback(form);
  }
}

function onChange(event) {
  if (event.target.matches('[data-auto-filter]')) {
    const form = event.target.closest('form[data-form="filters"]');
    if (form) form.requestSubmit();
  }
}

function onInput(event) {
  const field = event.target.closest('[data-draft-field]');
  if (!field) return;
  const box = field.closest('[data-ocr-record]');
  const recordId = box && box.dataset.ocrRecord;
  if (!recordId) return;
  const draft = drafts.get(recordId);
  if (!draft) return;
  draft[field.dataset.draftField] = field.value;
}

function onKeyDown(event) {
  if (event.key === 'Escape') closeMenu();
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    const input = event.target.closest('#ask-input');
    if (input && input.form) {
      event.preventDefault();
      input.form.requestSubmit();
    }
  }
}

function route(options = {}) {
  if (!dataReady) return;

  const { segments, params } = parseRoute();
  let view;
  let navKey = '';

  if (!segments.length) {
    view = views.home();
    navKey = 'trang-chu';
  } else if (segments[0] === 'tu-lieu' && segments.length === 1) {
    view = views.listView(params);
    navKey = 'tu-lieu';
  } else if (segments[0] === 'tu-lieu' && segments.length >= 2) {
    const record = getRecord(segments[1]);
    view = views.detailView(record, drafts.get(segments[1]) || null);
    navKey = 'tu-lieu';
  } else if (segments[0] === 'hoi-dap') {
    view = views.qaView();
    navKey = 'hoi-dap';
  } else if (segments[0] === 'nguon') {
    view = views.sourcesView();
    navKey = 'nguon';
  } else if (segments[0] === 'gioi-thieu') {
    view = views.aboutView();
    navKey = 'gioi-thieu';
  } else {
    view = views.notFoundView();
  }

  appEl.innerHTML = view.html;
  document.title = `${view.title} · ${getMeta().tenUngDung || 'Kiểm kê văn bia'}`;
  setActiveNav(navKey);
  closeMenu();

  if (!options.keepScroll) window.scrollTo(0, 0);
  if (navKey === 'hoi-dap') {
    requestAnimationFrame(() => {
      const chat = document.getElementById('qa-chat');
      if (chat) chat.scrollTop = chat.scrollHeight;
    });
  }
}

function parseRoute() {
  let raw = location.hash.replace(/^#/, '');
  if (!raw) raw = '/';
  const queryIndex = raw.indexOf('?');
  const pathPart = queryIndex === -1 ? raw : raw.slice(0, queryIndex);
  const queryPart = queryIndex === -1 ? '' : raw.slice(queryIndex + 1);
  const segments = pathPart
    .split('/')
    .filter(Boolean)
    .map((segment) => safeDecode(segment));
  return { segments, params: new URLSearchParams(queryPart) };
}

function navigateToList(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  const target = query ? `#/tu-lieu?${query}` : '#/tu-lieu';
  if (location.hash === target) {
    route();
  } else {
    location.hash = target;
  }
}

function setActiveNav(navKey) {
  for (const link of document.querySelectorAll('.site-nav a[data-nav]')) {
    const active = link.dataset.nav === navKey;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

function toggleMenu(force) {
  const open =
    typeof force === 'boolean' ? force : !headerEl.classList.contains('nav-open');
  headerEl.classList.toggle('nav-open', open);
  if (menuButton) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
  }
}

function closeMenu() {
  toggleMenu(false);
}

function selectGallery(button) {
  const recordId = button.dataset.record;
  const index = Number(button.dataset.index);
  const record = getRecord(recordId);
  if (!record || !Array.isArray(record.anh) || !record.anh[index]) return;

  const image = record.anh[index];
  const imageEl = document.getElementById('gallery-image');
  const captionEl = document.getElementById('gallery-caption');
  const sourceEl = document.getElementById('gallery-source');
  const frame = imageEl ? imageEl.closest('a') : null;
  const path = encodePath(image.tep);

  if (imageEl) {
    imageEl.src = path;
    imageEl.alt = image.moTa || 'Ảnh tư liệu';
  }
  if (frame) frame.href = path;
  if (captionEl) captionEl.textContent = image.moTa || 'Ảnh tư liệu';
  if (sourceEl) {
    sourceEl.textContent = `Nguồn: ${image.nguon || 'Chưa ghi trong hồ sơ.'}`;
  }

  for (const thumb of button.parentElement.querySelectorAll('.thumb')) {
    const active = thumb === button;
    thumb.classList.toggle('active', active);
    thumb.setAttribute('aria-pressed', String(active));
  }
}

async function copyToClipboard(text) {
  if (!text) {
    showToast('Không có nội dung để sao chép.');
    return;
  }
  const ok = await copyText(text);
  showToast(ok ? 'Đã sao chép nội dung.' : 'Không sao chép được. Hãy chọn nội dung và sao chép thủ công.');
}

function doExport() {
  if (!dataReady) {
    showToast('Dữ liệu chưa tải xong, vui lòng thử lại.');
    return;
  }
  const payload = buildExport();
  const filename = `tulieu-cong-bo-${dateStamp()}.json`;
  downloadFile(filename, JSON.stringify(payload, null, 2));
  showToast(`Đã xuất ${payload.records.length} bản ghi ra tệp ${filename}.`);
}

async function submitQuestion(rawQuestion) {
  const question = String(rawQuestion || '').trim();
  if (!question) return;

  const api = getApiStatus();
  if (!getRecords().length) {
    showToast('Chưa có tư liệu trong hồ sơ.');
    return;
  }
  if (!api.gemini) {
    showToast('Gemini chưa sẵn sàng. Kiểm tra cấu hình máy chủ.');
    return;
  }

  const qa = views.getQaState();
  if (qa.pending) return;
  if (question.length > 2000) {
    showToast('Câu hỏi quá dài. Vui lòng rút gọn dưới 2.000 ký tự.');
    return;
  }

  const requestSeq = ++qaRequestSeq;
  views.pushQaMessage({ role: 'user', text: question });
  qa.lastFailed = question;
  views.setQaPending(true);
  refreshChat();

  const inputEl = document.getElementById('ask-input');
  if (inputEl) inputEl.value = '';

  try {
    const response = await fetch('/api/hoi-dap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const data = await response.json().catch(() => null);
    if (requestSeq !== qaRequestSeq) return;
    if (!response.ok) {
      throw new Error(
        (data && data.error) || `Máy chủ trả về lỗi ${response.status}.`
      );
    }
    views.pushQaMessage({
      role: 'assistant',
      text: data.answer || 'Chưa có tư liệu trong hồ sơ.',
      citations: Array.isArray(data.citations) ? data.citations : [],
      canhBao: data.canhBao || ''
    });
    qa.lastFailed = '';
  } catch (error) {
    if (requestSeq !== qaRequestSeq) return;
    views.pushQaMessage({
      role: 'assistant',
      error: true,
      text: error.message || 'Không nhận được câu trả lời từ máy chủ.',
      retry: true
    });
  } finally {
    if (requestSeq === qaRequestSeq) {
      views.setQaPending(false);
      refreshChat();
      const input = document.getElementById('ask-input');
      if (input && !input.disabled) input.focus();
    }
  }
}

function refreshChat() {
  const chat = document.getElementById('qa-chat');
  if (!chat) return;
  const qa = views.getQaState();
  chat.innerHTML = views.qaChatHtml();
  chat.scrollTop = chat.scrollHeight;

  const submit = document.querySelector('.ask-form button[type="submit"]');
  if (submit) {
    submit.disabled =
      qa.pending || !getApiStatus().gemini || !getRecords().length;
  }
}

function useSuggestion(button) {
  const question = button.dataset.question || '';
  const input = document.getElementById('ask-input');
  if (input) {
    input.value = question;
    input.focus();
  }
  submitQuestion(question);
}

function retryAsk() {
  const qa = views.getQaState();
  if (!qa.lastFailed) return;
  const last = qa.messages[qa.messages.length - 1];
  if (last && last.error) qa.messages.pop();
  const previous = qa.messages[qa.messages.length - 1];
  if (previous && previous.role === 'user' && previous.text === qa.lastFailed) {
    qa.messages.pop();
  }
  submitQuestion(qa.lastFailed);
}

function resetChat() {
  qaRequestSeq += 1;
  views.resetQa();
  refreshChat();
  const input = document.getElementById('ask-input');
  if (input && !input.disabled) input.focus();
  showToast('Đã bắt đầu cuộc hỏi đáp mới.');
}

async function runOcr(button) {
  const recordId = button.dataset.record;
  const record = getRecord(recordId);
  if (!record) return;

  const api = getApiStatus();
  if (!api.gemini) {
    showToast('Gemini chưa sẵn sàng. Kiểm tra cấu hình máy chủ.');
    return;
  }
  if (!Array.isArray(record.anh) || !record.anh.length) {
    showToast('Bản ghi chưa có ảnh số hóa để đọc.');
    return;
  }

  const result = document.getElementById('ocr-result');
  const status = document.getElementById('ocr-status');
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `${icon('sparkles')} Đang đọc ảnh…`;
  if (status) status.textContent = 'Gemini đang đọc ảnh và đề xuất phiên âm. Quá trình có thể mất vài chục giây.';
  if (result) {
    result.innerHTML = `<div class="ocr-loading"><span class="typing"><span></span><span></span><span></span></span> Đang xử lý ảnh…</div>`;
  }

  try {
    const response = await fetch('/api/phien-am', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        (data && data.error) || `Máy chủ trả về lỗi ${response.status}.`
      );
    }

    drafts.set(recordId, {
      text: data.text || '',
      model: data.model || '',
      nguoiKiem: '',
      ghiChu: '',
      createdAt: new Date().toISOString()
    });

    showToast('Đã nhận bản đề xuất. Nội dung được gắn nhãn chưa kiểm chứng và không tự động lưu.');
    route({ keepScroll: true });
    requestAnimationFrame(() => {
      scrollToId('ocr-draft', 'smooth');
    });
    return;
  } catch (error) {
    if (result) {
      result.innerHTML = `<div class="callout danger">${icon('alert')}<div><strong>Không nhận được bản đề xuất</strong><p>${esc(
        error.message || 'Vui lòng thử lại sau.'
      )}</p></div></div>`;
    }
    showToast('Không nhận được bản đề xuất từ Gemini.');
  } finally {
    button.disabled = false;
    button.innerHTML = original;
    if (status) status.textContent = '';
  }
}

function draftContext(element) {
  const box = element.closest('[data-ocr-record]');
  const recordId = box && box.dataset.ocrRecord;
  if (!recordId) return null;
  const record = getRecord(recordId);
  const draft = drafts.get(recordId);
  if (!record || !draft) return null;
  return { record, draft };
}

async function copyDraft(element) {
  const context = draftContext(element);
  if (!context) return;
  if (!context.draft.text.trim()) {
    showToast('Bản nháp chưa có nội dung.');
    return;
  }
  const ok = await copyText(context.draft.text);
  showToast(ok ? 'Đã sao chép bản nháp.' : 'Không sao chép được bản nháp.');
}

function downloadDraft(element) {
  const context = draftContext(element);
  if (!context) return;
  const { filename, content } = views.getDraftDownload(context.record, context.draft);
  downloadFile(filename, content, 'text/plain;charset=utf-8');
  showToast('Đã tải bản nháp. Bản nháp vẫn chưa được kiểm chứng.');
}

function clearDraft(element) {
  const context = draftContext(element);
  if (!context) return;
  const confirmed = window.confirm(
    'Xóa bản nháp phiên âm này? Dữ liệu trong tulieu.json không bị thay đổi.'
  );
  if (!confirmed) return;
  drafts.delete(context.record.id);
  route({ keepScroll: true });
  showToast('Đã xóa bản nháp trong phiên làm việc.');
}

function handleFeedback(form) {
  const data = new FormData(form);
  const fields = {
    hoTen: String(data.get('hoTen') || '').trim(),
    lienHe: String(data.get('lienHe') || '').trim(),
    loai: String(data.get('loai') || 'Bổ sung thông tin').trim(),
    maBanGhi: String(data.get('maBanGhi') || '').trim(),
    noiDung: String(data.get('noiDung') || '').trim()
  };

  if (!fields.hoTen) {
    showToast('Vui lòng nhập họ và tên.');
    const input = form.querySelector('[name="hoTen"]');
    if (input) input.focus();
    return;
  }
  if (fields.noiDung.length < 10) {
    showToast('Vui lòng mô tả nội dung ghi nhận dài hơn 10 ký tự.');
    const input = form.querySelector('[name="noiDung"]');
    if (input) input.focus();
    return;
  }

  const result = document.getElementById('ghi-nhan-result');
  if (!result) return;
  result.innerHTML = views.feedbackResultHtml(fields, getMeta());
  result.hidden = false;
  lastFeedback = {
    filename: views.feedbackFilename(),
    content: views.feedbackText(fields)
  };
  showToast('Đã tạo bản ghi nhận. Bạn có thể mở email hoặc tải tệp để gửi.');
  requestAnimationFrame(() => {
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function downloadFeedback() {
  if (!lastFeedback) {
    showToast('Chưa có bản ghi nhận để tải.');
    return;
  }
  downloadFile(lastFeedback.filename, lastFeedback.content, 'text/plain;charset=utf-8');
  showToast('Đã tải bản ghi nhận.');
}

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 4500);
}

function setFooterYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}
