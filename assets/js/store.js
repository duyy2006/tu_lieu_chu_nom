/* Nạp, chuẩn hóa và truy vấn dữ liệu hồ sơ. */

import { normalizeText } from './utils.js';

const DATA_URL = 'data/tulieu.json';

export const DC_FIELDS = [
  ['title', 'Nhan đề'],
  ['creator', 'Tác giả'],
  ['subject', 'Chủ đề'],
  ['description', 'Mô tả'],
  ['publisher', 'Nhà xuất bản / đơn vị công bố'],
  ['contributor', 'Người đóng góp'],
  ['date', 'Ngày tháng'],
  ['type', 'Loại tư liệu'],
  ['format', 'Định dạng'],
  ['identifier', 'Mã định danh'],
  ['source', 'Nguồn'],
  ['language', 'Ngôn ngữ'],
  ['relation', 'Liên quan'],
  ['coverage', 'Phạm vi'],
  ['rights', 'Quyền']
];

export const EXTRA_FIELDS = [
  ['noiLuuGiuHienNay', 'Nơi lưu giữ hiện nay'],
  ['noiLuuGiuTaiThoiDiem', 'Nơi lưu giữ tại thời điểm tư liệu'],
  ['loaiBanDangHienThi', 'Loại bản đang hiển thị'],
  ['tinhTrangBanGoc', 'Tình trạng bản gốc'],
  ['soDangKy', 'Số đăng ký'],
  ['nguoiChoPhepCongBo', 'Người cho phép công bố'],
  ['phamViDuocPhep', 'Phạm vi được phép'],
  ['phanKhongCongBo', 'Phần không công bố'],
  ['mucKiemChung', 'Mức kiểm chứng']
];

export const VERIFICATION_LEVELS = {
  'da-kiem-chung': {
    key: 'da-kiem-chung',
    label: 'Đã kiểm chứng',
    tone: 'ok',
    rank: 2,
    short: 'Đã đối chiếu bản gốc và có người kiểm xác nhận.'
  },
  'mot-phan': {
    key: 'mot-phan',
    label: 'Đã kiểm chứng một phần',
    tone: 'warn',
    rank: 1,
    short: 'Mới đối chiếu hoặc kiểm tra được một phần nội dung.'
  },
  'chua-kiem-chung': {
    key: 'chua-kiem-chung',
    label: 'Chưa kiểm chứng',
    tone: 'danger',
    rank: 0,
    short: 'Chưa có người kiểm đối chiếu với bản gốc.'
  }
};

const DEFAULT_META = {
  tenUngDung: 'Kiểm kê văn bia trong di tích tại một xã',
  tenDiTich: '[Tên di tích]',
  xa: '[Tên xã]',
  huyen: '[Tên huyện]',
  tinh: '[Tên tỉnh]',
  diaChi: '',
  gioiThieu:
    'Hồ sơ số tập hợp thông tin, ảnh và bản dịch tư liệu Hán Nôm còn lưu giữ tại di tích và trong cộng đồng.',
  lienHe: '',
  capNhat: '',
  nguonTuLieu: [],
  ghiNhan: []
};

const state = {
  meta: { ...DEFAULT_META },
  records: [],
  loaded: false,
  loadedAt: null,
  api: { available: false, gemini: false, model: '', reason: '' }
};

export async function loadData() {
  let response;
  try {
    response = await fetch(DATA_URL, { cache: 'no-store' });
  } catch {
    throw new Error(
      'Không tải được tệp dữ liệu. Nếu đang mở trực tiếp bằng tệp HTML, hãy chạy ứng dụng bằng lệnh "npm start".'
    );
  }

  if (!response.ok) {
    throw new Error(`Không tải được tệp dữ liệu (mã lỗi ${response.status}).`);
  }

  let raw;
  try {
    raw = await response.json();
  } catch {
    throw new Error('Tệp data/tulieu.json không phải JSON hợp lệ. Hãy kiểm tra lại cú pháp.');
  }

  state.meta = normalizeMeta(raw && raw.meta);
  state.records = Array.isArray(raw && raw.records)
    ? raw.records.map(normalizeRecord).filter(Boolean)
    : [];
  state.loaded = true;
  state.loadedAt = new Date();
  return state;
}

export async function checkApi() {
  if (typeof location !== 'undefined' && location.protocol === 'file:') {
    state.api = {
      available: false,
      gemini: false,
      model: '',
      reason: 'Ứng dụng đang được mở trực tiếp bằng tệp HTML, không có máy chủ.'
    };
    return state.api;
  }

  try {
    const response = await fetch('/api/config', {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    state.api = {
      available: true,
      gemini: Boolean(data.gemini),
      model: typeof data.model === 'string' ? data.model : '',
      reason: data.gemini ? '' : 'Máy chủ chưa được cấu hình khoá Gemini.'
    };
  } catch {
    state.api = {
      available: false,
      gemini: false,
      model: '',
      reason: 'Không kết nối được máy chủ của ứng dụng.'
    };
  }
  return state.api;
}

export function getMeta() {
  return state.meta;
}

export function getRecords() {
  return state.records;
}

export function hasData() {
  return state.records.length > 0;
}

export function getRecord(id) {
  const wanted = String(id || '');
  return state.records.find((record) => String(record.id) === wanted) || null;
}

export function getApiStatus() {
  return state.api;
}

export function getLoadedAt() {
  return state.loadedAt;
}

export function normalizeLevel(value) {
  const text = normalizeText(value);
  if (!text) return 'chua-kiem-chung';
  if (text === 'da-kiem-chung' || text === 'mot-phan' || text === 'chua-kiem-chung') return text;
  if (text.includes('chua')) return 'chua-kiem-chung';
  if (text.includes('mot phan') || text.includes('partial')) return 'mot-phan';
  if (text.includes('da kiem chung') || text.includes('verified')) return 'da-kiem-chung';
  return 'chua-kiem-chung';
}

export function verificationInfo(value) {
  const key = normalizeLevel(value);
  return VERIFICATION_LEVELS[key] || VERIFICATION_LEVELS['chua-kiem-chung'];
}

export function contentVerification(record, field) {
  const content = record && record[field];
  return verificationInfo(content && content.mucKiemChung);
}

export function recordHeading(record) {
  const title = clean(record && record.title);
  return title || 'Bản ghi chưa có nhan đề';
}

export function recordSubtitle(record) {
  if (!record) return '';
  const parts = [];
  if (clean(record.nienHieu)) parts.push(`Niên hiệu ${clean(record.nienHieu)}`);
  else if (clean(record.date)) parts.push(clean(record.date));
  if (clean(record.thanHieu)) parts.push(`Thần hiệu ${clean(record.thanHieu)}`);
  return parts.join(' · ');
}

export function recordType(record) {
  return clean(record && (record.loaiTuLieu || record.type)) || 'Tư liệu';
}

export function recordImages(record) {
  return Array.isArray(record && record.anh) ? record.anh : [];
}

export function recordFacets(records = state.records) {
  return {
    nienHieu: uniqueValues(records, (record) => record.nienHieu),
    thanHieu: uniqueValues(records, (record) => record.thanHieu),
    loaiTuLieu: uniqueValues(records, (record) => record.loaiTuLieu || record.type),
    mucKiemChung: uniqueValues(records, (record) => normalizeLevel(record.mucKiemChung))
  };
}

export function filterRecords(filters = {}) {
  const q = normalizeText(filters.q || '');
  const tokens = q.split(/\s+/).filter((token) => token.length >= 2);
  const nienHieu = clean(filters.nienHieu);
  const thanHieu = clean(filters.thanHieu);
  const loai = clean(filters.loaiTuLieu);
  const muc = clean(filters.mucKiemChung);

  return state.records.filter((record) => {
    if (nienHieu && clean(record.nienHieu) !== nienHieu) return false;
    if (thanHieu && clean(record.thanHieu) !== thanHieu) return false;
    if (loai && clean(record.loaiTuLieu || record.type) !== loai) return false;
    if (muc && normalizeLevel(record.mucKiemChung) !== normalizeLevel(muc)) return false;

    if (tokens.length) {
      const haystack = normalizeText(
        [
          record.id,
          record.title,
          record.creator,
          record.subject,
          record.description,
          record.date,
          record.nienHieu,
          record.thanHieu,
          record.loaiTuLieu,
          record.type,
          record.noiLuuGiuHienNay,
          record.noiLuuGiuTaiThoiDiem,
          record.soDangKy,
          record.source,
          record.phienAm && record.phienAm.noiDung,
          record.dichNghia && record.dichNghia.noiDung
        ]
          .filter(Boolean)
          .join(' ')
      );
      if (!tokens.every((token) => haystack.includes(token))) return false;
    }

    return true;
  });
}

export function getStats() {
  const records = state.records;
  const images = records.reduce((sum, record) => sum + recordImages(record).length, 0);
  const verified = records.filter((record) => normalizeLevel(record.mucKiemChung) === 'da-kiem-chung').length;
  const years = new Set(records.map((record) => clean(record.nienHieu)).filter(Boolean));
  return {
    total: records.length,
    images,
    years: years.size,
    verified,
    unverified: records.length - verified
  };
}

export function topValues(field, limit = 4) {
  const counts = new Map();
  for (const record of state.records) {
    const value = clean(record[field]);
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

export function buildExport() {
  return {
    phienBan: 1,
    xuatLuc: new Date().toISOString(),
    ghiChuXuat:
      'Bản xuất toàn bộ dữ liệu công bố từ ứng dụng Kiểm kê văn bia. Mức kiểm chứng, phạm vi được phép và phần không công bố được giữ nguyên để đối chiếu.',
    meta: { ...state.meta },
    records: state.records.map(publicRecord)
  };
}

export function publicRecord(record) {
  const output = {};
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith('_')) continue;
    if (key === 'anh' && Array.isArray(value)) {
      output.anh = value.map((image) => ({
        tep: image.tep,
        loai: image.loai,
        moTa: image.moTa,
        nguon: image.nguon
      }));
      continue;
    }
    output[key] = value;
  }
  return output;
}

export function imageSource(record) {
  const first = recordImages(record)[0];
  if (!first) return null;
  return first.tep;
}

function normalizeMeta(raw) {
  const meta = { ...DEFAULT_META };
  if (!raw || typeof raw !== 'object') return meta;
  for (const key of Object.keys(DEFAULT_META)) {
    const value = raw[key];
    if (key === 'nguonTuLieu' || key === 'ghiNhan') {
      meta[key] = Array.isArray(value) ? value : [];
    } else if (typeof value === 'string' && value.trim()) {
      meta[key] = value.trim();
    }
  }
  return meta;
}

function normalizeRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = clean(raw.id || raw.identifier);
  if (!id) return null;

  const record = { ...raw, id };
  record.title = clean(raw.title);
  record.loaiTuLieu = clean(raw.loaiTuLieu || raw.type);
  record.nienHieu = clean(raw.nienHieu);
  record.thanHieu = clean(raw.thanHieu);
  record.mucKiemChung = normalizeLevel(raw.mucKiemChung);
  record.anh = normalizeImages(raw.anh);
  record.phienAm = normalizeContent(raw.phienAm);
  record.dichNghia = normalizeContent(raw.dichNghia);
  return record;
}

function normalizeContent(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      noiDung: '',
      mucKiemChung: 'chua-kiem-chung',
      nguoiKiem: '',
      ngayKiem: '',
      ghiChu: ''
    };
  }
  return {
    noiDung: clean(raw.noiDung),
    mucKiemChung: normalizeLevel(raw.mucKiemChung),
    nguoiKiem: clean(raw.nguoiKiem),
    ngayKiem: clean(raw.ngayKiem),
    ghiChu: clean(raw.ghiChu)
  };
}

function normalizeImages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((image, index) => {
      if (typeof image === 'string') {
        return { tep: image.trim(), loai: '', moTa: '', nguon: '' };
      }
      if (!image || typeof image !== 'object') return null;
      const tep = clean(image.tep);
      if (!tep) return null;
      return {
        tep,
        thumb: clean(image.thumb),
        loai: clean(image.loai) || (index === 0 ? 'toan-trang' : ''),
        moTa: clean(image.moTa),
        nguon: clean(image.nguon)
      };
    })
    .filter(Boolean);
}

function uniqueValues(records, getter) {
  const values = [...new Set(records.map(getter).map(clean).filter(Boolean))];
  return values.sort((a, b) => {
    const aNumber = /^\d+$/.test(a);
    const bNumber = /^\d+$/.test(b);
    if (aNumber && bNumber) return Number(a) - Number(b);
    if (aNumber !== bNumber) return aNumber ? -1 : 1;
    return a.localeCompare(b, 'vi');
  });
}

function clean(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}
