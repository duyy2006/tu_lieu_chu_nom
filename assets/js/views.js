/* Các màn hình của ứng dụng. */

import {
  DC_FIELDS,
  EXTRA_FIELDS,
  VERIFICATION_LEVELS,
  contentVerification,
  filterRecords,
  getApiStatus,
  getMeta,
  getRecord,
  getRecords,
  getStats,
  normalizeLevel,
  recordFacets,
  recordHeading,
  recordImages,
  recordSubtitle,
  recordType,
  topValues,
  verificationInfo
} from './store.js';
import {
  dateStamp,
  encodePath,
  esc,
  formatDate,
  icon,
  paragraphsHtml,
  simpleMarkdown,
  truncate
} from './utils.js';

const FALLBACK_TITLE = 'Kiểm kê văn bia trong di tích tại một xã';

export function home() {
  const meta = getMeta();
  const records = getRecords();
  const stats = getStats();
  const featured = records.slice(0, 3);
  const years = topValues('nienHieu', 4);
  const thanHieu = topValues('thanHieu', 4);
  const types = topValues('loaiTuLieu', 4);

  const html = `
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">Tư liệu Hán Nôm còn trong cộng đồng</p>
          <h1>${esc(meta.tenUngDung || FALLBACK_TITLE)}</h1>
          <p class="hero-place">${icon('mapPin')} ${esc(locationLine(meta))}</p>
          <p class="hero-sub">${esc(meta.gioiThieu)}</p>

          <form class="search-bar" data-form="search" role="search">
            <label class="sr-only" for="home-search">Tìm kiếm tư liệu</label>
            <span class="search-icon">${icon('search')}</span>
            <input id="home-search" name="q" type="search" autocomplete="off"
              placeholder="Tìm theo tên bia, niên hiệu, thần hiệu, nơi lưu giữ…">
            <button class="btn primary" type="submit">Tìm kiếm</button>
          </form>
          <p class="search-hint">Có thể tìm bằng mã bản ghi, tên tư liệu, niên hiệu, thần hiệu, nơi lưu giữ hoặc nội dung phiên âm.</p>
        </div>

        <aside class="hero-panel" aria-label="Giới thiệu hồ sơ số">
          <div class="hero-panel-head">
            <span class="seal" aria-hidden="true">碑</span>
            <div>
              <strong>Hồ sơ số tư liệu</strong>
              <span>15 trường Dublin Core và thông tin bổ sung cho mỗi bản ghi</span>
            </div>
          </div>
          <ul class="hero-panel-list">
            <li>${icon('image')} Ảnh toàn trang, cận cảnh có chú thích và nguồn</li>
            <li>${icon('book')} Phiên âm, dịch nghĩa kèm nhãn mức kiểm chứng</li>
            <li>${icon('filter')} Tra cứu theo niên hiệu, thần hiệu, loại tư liệu</li>
            <li>${icon('chat')} Hỏi đáp có dẫn mã bản ghi và nơi lưu giữ</li>
          </ul>
          <div class="hero-panel-foot">
            <span>Dữ liệu: <code>data/tulieu.json</code></span>
            <span>${records.length ? `${records.length} bản ghi đang công bố` : 'Chờ nạp dữ liệu thật'}</span>
          </div>
        </aside>
      </div>

      <div class="container">
        <div class="stats" aria-label="Số liệu hồ sơ">
          <div class="stat"><span class="stat-value">${stats.total}</span><span class="stat-label">Bản ghi tư liệu</span></div>
          <div class="stat"><span class="stat-value">${stats.images}</span><span class="stat-label">Ảnh số hóa</span></div>
          <div class="stat"><span class="stat-value">${stats.years}</span><span class="stat-label">Niên hiệu</span></div>
          <div class="stat"><span class="stat-value">${stats.verified}<span class="stat-of">/${stats.total}</span></span><span class="stat-label">Đã kiểm chứng</span></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Bộ tư liệu</p>
            <h2>Tư liệu trong hồ sơ</h2>
            <p class="section-sub">Mỗi bản ghi là một hồ sơ tra cứu độc lập, có mã định danh và mức kiểm chứng riêng.</p>
          </div>
          ${records.length ? `<a class="text-link" href="#/tu-lieu">Xem toàn bộ ${stats.total} bản ghi ${icon('arrowRight')}</a>` : ''}
        </div>

        ${
          featured.length
            ? `<div class="record-grid">${featured.map(recordCard).join('')}</div>`
            : emptyState({
                title: 'Hồ sơ chưa có bản ghi nào',
                text: 'Ban quản lý đang tiếp tục kiểm kê tư liệu. Khi dữ liệu thật được nạp, các bản ghi sẽ xuất hiện tại đây để tra cứu.',
                details: dataGuide()
              })
        }
      </div>
    </section>

    <section class="section section-tint">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Tra cứu nhanh</p>
            <h2>Tìm theo dấu vết của tư liệu</h2>
            <p class="section-sub">Niên hiệu, thần hiệu và loại tư liệu là ba lối vào thường dùng khi kiểm kê văn bia, sắc phong và tư liệu Hán Nôm tại di tích.</p>
          </div>
        </div>
        <div class="facet-grid">
          ${facetCard('Niên hiệu', years, 'nienHieu', 'Ví dụ: niên hiệu ghi trên trán bia hoặc ở cuối văn bản.')}
          ${facetCard('Thần hiệu', thanHieu, 'thanHieu', 'Thần hiệu ghi nhận vị thần được thờ tự tại di tích.')}
          ${facetCard('Loại tư liệu', types, 'loaiTuLieu', 'Văn bia, sắc phong, câu đối, hoành phi và các loại khác.')}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="principles">
          <article class="principle">
            <span class="principle-icon">${icon('book')}</span>
            <h3>Tra cứu, không thay thế bản gốc</h3>
            <p>Ứng dụng chỉ phục vụ tra cứu và giới thiệu. Khi cần trích dẫn học thuật hoặc kiểm tra chữ khắc, vui lòng đối chiếu bản gốc tại nơi lưu giữ.</p>
          </article>
          <article class="principle">
            <span class="principle-icon">${icon('check')}</span>
            <h3>Nhãn kiểm chứng rõ ràng</h3>
            <p>Mọi nội dung phiên âm, dịch nghĩa đều hiển thị mức kiểm chứng. Bản chưa kiểm chứng luôn được gắn nhãn, không trình bày như dữ liệu đã xác nhận.</p>
          </article>
          <article class="principle">
            <span class="principle-icon">${icon('info')}</span>
            <h3>Không suy đoán, không sinh ảnh</h3>
            <p>Thông tin chỉ lấy từ hồ sơ. Câu hỏi không có dữ liệu sẽ được trả lời là “Chưa có tư liệu trong hồ sơ”. Ứng dụng không tạo ra ảnh tư liệu.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section section-cta">
      <div class="container cta-inner">
        <div>
          <p class="eyebrow">Cần hỏi thêm?</p>
          <h2>Trao đổi với trợ lý hồ sơ</h2>
          <p>Đặt câu hỏi về niên đại, nơi lưu giữ, loại bản hoặc nội dung đã có trong hồ sơ. Mỗi câu trả lời đều kèm mã bản ghi, nơi lưu giữ và loại bản đang hiển thị.</p>
        </div>
        <div class="cta-actions">
          <a class="btn primary" href="#/hoi-dap">${icon('chat')} Mở trang hỏi đáp</a>
          <a class="btn secondary" href="#/nguon">${icon('link')} Nguồn tư liệu &amp; ghi nhận</a>
        </div>
      </div>
    </section>
  `;

  return { title: 'Trang chủ', html };
}

export function listView(params) {
  const meta = getMeta();
  const facets = recordFacets();
  const filters = {
    q: params.get('q') || '',
    nienHieu: params.get('nienHieu') || '',
    thanHieu: params.get('thanHieu') || '',
    loaiTuLieu: params.get('loaiTuLieu') || '',
    mucKiemChung: params.get('mucKiemChung') || ''
  };
  const results = filterRecords(filters);
  const total = getRecords().length;
  const hasFilters = Boolean(filters.q || filters.nienHieu || filters.thanHieu || filters.loaiTuLieu || filters.mucKiemChung);

  const html = `
    <div class="page">
      <div class="container">
        <nav class="breadcrumb" aria-label="Đường dẫn">
          <a href="#/">Trang chủ</a><span aria-hidden="true">/</span><span>Danh sách tư liệu</span>
        </nav>

        <div class="page-head">
          <div>
            <p class="eyebrow">Bộ tư liệu · ${esc(locationShort(meta))}</p>
            <h1>Danh sách tư liệu</h1>
            <p class="page-sub">Tra cứu ${total} bản ghi theo niên hiệu, thần hiệu, loại tư liệu và mức kiểm chứng.</p>
          </div>
          <button class="btn secondary no-print" type="button" data-action="export" data-export>
            ${icon('download')} Xuất dữ liệu
          </button>
        </div>

        <form class="filters card" data-form="filters" role="search" aria-label="Bộ lọc tư liệu">
          <div class="field field-wide">
            <label for="filter-q">Từ khóa</label>
            <input id="filter-q" name="q" type="search" value="${esc(filters.q)}" placeholder="Tên bia, mã bản ghi, nơi lưu giữ…">
          </div>
          <div class="field">
            <label for="filter-year">Niên hiệu</label>
            <select id="filter-year" name="nienHieu" data-auto-filter>
              <option value="">Tất cả</option>
              ${options(facets.nienHieu, filters.nienHieu)}
            </select>
          </div>
          <div class="field">
            <label for="filter-deity">Thần hiệu</label>
            <select id="filter-deity" name="thanHieu" data-auto-filter>
              <option value="">Tất cả</option>
              ${options(facets.thanHieu, filters.thanHieu)}
            </select>
          </div>
          <div class="field">
            <label for="filter-type">Loại tư liệu</label>
            <select id="filter-type" name="loaiTuLieu" data-auto-filter>
              <option value="">Tất cả</option>
              ${options(facets.loaiTuLieu, filters.loaiTuLieu)}
            </select>
          </div>
          <div class="field">
            <label for="filter-verification">Mức kiểm chứng</label>
            <select id="filter-verification" name="mucKiemChung" data-auto-filter>
              <option value="">Tất cả</option>
              ${options(facets.mucKiemChung, filters.mucKiemChung, verificationLabel)}
            </select>
          </div>
          <div class="filter-actions">
            <button class="btn primary" type="submit">${icon('filter')} Lọc</button>
            ${
              hasFilters
                ? `<a class="btn ghost" href="#/tu-lieu">Xóa bộ lọc</a>`
                : ''
            }
          </div>
        </form>

        <div class="result-bar" aria-live="polite">
          <p><strong>${results.length}</strong> / ${total} bản ghi phù hợp</p>
          ${hasFilters ? `<p class="muted">${activeFilterText(filters)}</p>` : ''}
        </div>

        ${
          !total
            ? emptyState({
                title: 'Chưa có tư liệu trong hồ sơ',
                text: 'Hiện chưa có bản ghi nào được công bố. Khi Ban quản lý nạp dữ liệu thật, danh sách và bộ lọc sẽ hoạt động tại đây.',
                details: dataGuide()
              })
            : results.length
              ? `<div class="record-grid">${results.map(recordCard).join('')}</div>`
              : emptyState({
                  title: 'Không tìm thấy bản ghi phù hợp',
                  text: 'Không có tư liệu nào khớp với từ khóa và bộ lọc hiện tại. Hãy thử bỏ một vài điều kiện hoặc dùng từ khóa ngắn hơn.',
                  action: `<a class="btn secondary" href="#/tu-lieu">Xóa bộ lọc</a>`
                })
        }
      </div>
    </div>
  `;

  return { title: 'Danh sách tư liệu', html };
}

export function detailView(record, draft) {
  if (!record) {
    return {
      title: 'Không tìm thấy bản ghi',
      html: `
        <div class="page"><div class="container narrow">
          ${emptyState({
            title: 'Không tìm thấy bản ghi',
            text: 'Mã bản ghi này không tồn tại trong hồ sơ, hoặc bản ghi chưa được công bố.',
            action: `<a class="btn secondary" href="#/tu-lieu">${icon('arrowLeft')} Về danh sách tư liệu</a>`
          })}
        </div></div>
      `
    };
  }

  const meta = getMeta();
  const api = getApiStatus();
  const images = recordImages(record);
  const verification = verificationInfo(record.mucKiemChung);
  const headerBadges = [
    badge(recordType(record), 'ink'),
    verificationBadge(record.mucKiemChung),
    record.nienHieu ? badge(`Niên hiệu ${record.nienHieu}`) : '',
    record.thanHieu ? badge(`Thần hiệu ${record.thanHieu}`) : ''
  ]
    .filter(Boolean)
    .join('');

  const html = `
    <div class="page detail-page">
      <div class="container">
        <nav class="breadcrumb no-print" aria-label="Đường dẫn">
          <a href="#/">Trang chủ</a><span aria-hidden="true">/</span>
          <a href="#/tu-lieu">Danh sách tư liệu</a><span aria-hidden="true">/</span>
          <span>${esc(record.id)}</span>
        </nav>

        <div class="page-head detail-head">
          <div>
            <p class="eyebrow">${esc(recordType(record))} · Mã ${esc(record.id)}</p>
            <h1>${esc(recordHeading(record))}</h1>
            ${recordSubtitle(record) ? `<p class="page-sub">${esc(recordSubtitle(record))}</p>` : ''}
            <div class="record-tags">${headerBadges}</div>
          </div>
          <div class="title-actions no-print">
            <button class="btn secondary" type="button" data-action="copy" data-copy="${attr(citationText(record))}">
              ${icon('copy')} Sao chép trích dẫn
            </button>
            <button class="btn ghost" type="button" data-action="print">${icon('printer')} In hồ sơ</button>
          </div>
        </div>

        <div class="key-facts" aria-label="Thông tin tra cứu nhanh">
          ${keyFact('Nơi lưu giữ hiện nay', record.noiLuuGiuHienNay)}
          ${keyFact('Loại bản đang hiển thị', record.loaiBanDangHienThi)}
          ${keyFact('Số đăng ký', record.soDangKy)}
          <div class="key-fact">
            <span class="key-label">Mức kiểm chứng</span>
            <span class="key-value">${verificationBadge(record.mucKiemChung)}</span>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-main">
            <section class="card gallery-card" aria-labelledby="gallery-title">
              <div class="card-head">
                <h2 id="gallery-title">Ảnh tư liệu</h2>
                <span class="muted small">${images.length ? `${images.length} ảnh` : 'Chưa có ảnh'}</span>
              </div>
              ${galleryHtml(record, images)}
            </section>

            <section class="card content-card" aria-labelledby="transcription-title">
              <div class="card-head">
                <h2 id="transcription-title">Phiên âm</h2>
                ${verificationBadge(record.phienAm && record.phienAm.mucKiemChung)}
              </div>
              ${contentBody(record, 'phienAm', 'phiên âm')}
              ${ocrBox(record, images, api, draft)}
            </section>

            <section class="card content-card" aria-labelledby="translation-title">
              <div class="card-head">
                <h2 id="translation-title">Dịch nghĩa</h2>
                ${verificationBadge(record.dichNghia && record.dichNghia.mucKiemChung)}
              </div>
              ${contentBody(record, 'dichNghia', 'dịch nghĩa')}
            </section>

            <section class="card" aria-labelledby="dc-title">
              <div class="card-head">
                <h2 id="dc-title">Mô tả hồ sơ — 15 trường Dublin Core</h2>
              </div>
              <div class="meta-table-wrap">
                ${metaTable(record, DC_FIELDS)}
              </div>
              <p class="card-note">Các trường để trống nghĩa là hồ sơ chưa ghi nhận thông tin, không phải thông tin bị suy đoán.</p>
            </section>
          </div>

          <aside class="detail-aside">
            <section class="card side-card" aria-labelledby="extra-title">
              <div class="card-head compact">
                <h2 id="extra-title">Thông tin bổ sung</h2>
              </div>
              ${extraTable(record)}
            </section>

            <section class="card side-card" aria-labelledby="rights-title">
              <div class="card-head compact">
                <h2 id="rights-title">Quyền &amp; công bố</h2>
              </div>
              ${rightsList(record)}
            </section>

            <div class="callout info">
              ${icon('info')}
              <div>
                <strong>Về mức kiểm chứng</strong>
                <p>${esc(verification.short)} Nội dung chưa kiểm chứng cần được đối chiếu với ảnh hoặc bản gốc trước khi trích dẫn.</p>
              </div>
            </div>

            <div class="callout">
              ${icon('book')}
              <div>
                <strong>Nơi lưu giữ hiện nay</strong>
                <p>${esc(record.noiLuuGiuHienNay || 'Chưa ghi trong hồ sơ.')}</p>
                <p class="small muted">Vui lòng liên hệ Ban quản lý di tích ${esc(locationShort(meta))} để đăng ký xem bản gốc.</p>
              </div>
            </div>
          </aside>
        </div>

        <div class="detail-footer no-print">
          <a class="text-link" href="#/tu-lieu">${icon('arrowLeft')} Về danh sách tư liệu</a>
          <a class="text-link" href="#/nguon">Gửi ghi nhận hoặc đính chính ${icon('arrowRight')}</a>
        </div>
      </div>
    </div>
  `;

  return { title: recordHeading(record), html };
}

export function qaView() {
  const api = getApiStatus();
  const records = getRecords();
  const meta = getMeta();
  const disabled = !api.gemini || !records.length;
  const suggestions = suggestedQuestions(records);

  const html = `
    <div class="page">
      <div class="container">
        <nav class="breadcrumb" aria-label="Đường dẫn">
          <a href="#/">Trang chủ</a><span aria-hidden="true">/</span><span>Hỏi đáp</span>
        </nav>

        <div class="page-head">
          <div>
            <p class="eyebrow">Trợ lý hồ sơ</p>
            <h1>Hỏi đáp về tư liệu</h1>
            <p class="page-sub">Câu trả lời chỉ dựa trên dữ liệu trong <code>tulieu.json</code>, kèm mã bản ghi, nơi lưu giữ và loại bản đang hiển thị.</p>
          </div>
          <div class="title-actions">
            <span class="api-chip ${api.gemini ? 'on' : 'off'}">
              ${icon(api.gemini ? 'check' : 'alert')}
              ${api.gemini ? `Gemini · ${esc(api.model || 'đã cấu hình')}` : 'Gemini chưa sẵn sàng'}
            </span>
            <button class="btn ghost" type="button" data-action="reset-chat">
              ${icon('refresh')} Cuộc hỏi đáp mới
            </button>
          </div>
        </div>

        ${
          !records.length
            ? `<div class="callout warn">${icon('info')}<div><strong>Chưa có tư liệu trong hồ sơ.</strong><p>Trang hỏi đáp chỉ hoạt động khi <code>data/tulieu.json</code> đã có bản ghi. Hiện chưa có dữ liệu để trả lời.</p></div></div>`
            : !api.gemini
              ? `<div class="callout warn">${icon('alert')}<div><strong>Chưa cấu hình Gemini trên máy chủ.</strong><p>${esc(api.reason || '')} Thêm <code>GEMINI_API_KEY</code> vào tệp <code>.env</code> rồi khởi động lại ứng dụng. Khoá API không bao giờ được đặt trong mã nguồn phía trình duyệt.</p></div></div>`
              : ''
        }

        <div class="qa-layout">
          <section class="card chat-card" aria-label="Khung hỏi đáp">
            <div class="chat" id="qa-chat" aria-live="polite">
              ${qaChatHtml()}
            </div>
            <form class="ask-form" data-form="ask">
              <label class="sr-only" for="ask-input">Câu hỏi của bạn</label>
              <textarea id="ask-input" name="question" rows="2" maxlength="2000"
                placeholder="${records.length ? 'Ví dụ: Bia nào có niên hiệu …? Hiện lưu giữ ở đâu?' : 'Chưa có tư liệu để hỏi đáp'}"
                ${disabled ? 'disabled' : ''}></textarea>
              <button class="btn primary" type="submit" ${disabled ? 'disabled' : ''}>
                ${icon('send')} Gửi
              </button>
            </form>
            <p class="chat-note">Nhấn <kbd>Ctrl</kbd> + <kbd>Enter</kbd> để gửi. Câu hỏi được gửi tới Gemini qua máy chủ của ứng dụng; không nhập thông tin cá nhân.</p>
          </section>

          <aside class="qa-aside">
            ${
              suggestions.length
                ? `<section class="card side-card">
                    <div class="card-head compact"><h2>Câu hỏi gợi ý</h2></div>
                    <div class="suggest-list">
                      ${suggestions
                        .map(
                          (question) => `<button class="suggest" type="button" data-action="suggest" data-question="${attr(question)}">
                            ${esc(question)} ${icon('arrowRight')}
                          </button>`
                        )
                        .join('')}
                    </div>
                  </section>`
                : ''
            }

            <section class="card side-card">
              <div class="card-head compact"><h2>Cách trả lời</h2></div>
              <ul class="check-list">
                <li>${icon('check')} Chỉ dùng dữ liệu có trong hồ sơ.</li>
                <li>${icon('check')} Nêu mã bản ghi cho thông tin được dùng.</li>
                <li>${icon('check')} Ghi rõ nội dung chưa kiểm chứng.</li>
                <li>${icon('alert')} Không có dữ liệu thì trả lời: “Chưa có tư liệu trong hồ sơ.”</li>
              </ul>
            </section>

            <div class="callout">
              ${icon('info')}
              <div>
                <strong>Phạm vi trả lời</strong>
                <p>Trợ lý không thay thế việc đọc bản gốc, không đưa ra kết luận về niên đại hay giá trị tư liệu ngoài phần đã ghi trong hồ sơ.</p>
              </div>
            </div>

            <div class="callout">
              ${icon('mapPin')}
              <div>
                <strong>Địa chỉ hồ sơ</strong>
                <p>${esc(locationLine(meta))}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  `;

  return { title: 'Hỏi đáp', html };
}

export function qaChatHtml() {
  if (!qaState.messages.length) {
    const records = getRecords();
    const suggestions = suggestedQuestions(records);
    return `
      <div class="chat-welcome">
        <span class="seal small" aria-hidden="true">碑</span>
        <h2>Hỏi về từng bản ghi, tấm bia, dòng chữ</h2>
        <p>Ví dụ: “Bia này hiện lưu giữ ở đâu?”, “Niên hiệu ghi trên bản ghi VB-001 là gì?”, “Nội dung phiên âm đã được kiểm chứng chưa?”.</p>
        ${
          suggestions.length
            ? `<div class="chip-list">${suggestions
                .map(
                  (question) =>
                    `<button class="chip" type="button" data-action="suggest" data-question="${attr(question)}">${esc(question)}</button>`
                )
                .join('')}</div>`
            : ''
        }
      </div>
    `;
  }

  const items = qaState.messages.map(qaMessageHtml).join('');
  const pending = qaState.pending
    ? `<div class="msg assistant"><p class="who">Trợ lý hồ sơ</p><div class="typing" aria-label="Đang tìm trong hồ sơ"><span></span><span></span><span></span></div></div>`
    : '';
  return `${items}${pending}`;
}

export function qaMessageHtml(message) {
  if (message.role === 'user') {
    return `<div class="msg user"><p class="who">Bạn</p><p>${esc(message.text).replace(/\n/g, '<br>')}</p></div>`;
  }

  if (message.error) {
    return `
      <div class="msg assistant msg-error">
        <p class="who">Trợ lý hồ sơ</p>
        <div class="callout danger">${icon('alert')}<div><strong>Không nhận được câu trả lời</strong><p>${esc(message.text)}</p></div></div>
        ${message.retry ? `<button class="btn secondary small" type="button" data-action="retry-ask">${icon('refresh')} Thử lại</button>` : ''}
      </div>
    `;
  }

  return `
    <div class="msg assistant">
      <p class="who">Trợ lý hồ sơ</p>
      <div class="answer">${simpleMarkdown(message.text)}</div>
      ${
        message.canhBao
          ? `<div class="callout warn small">${icon('alert')}<div>${esc(message.canhBao)}</div></div>`
          : ''
      }
      ${message.citations && message.citations.length ? citationsHtml(message.citations) : ''}
    </div>
  `;
}

export function sourcesView() {
  const meta = getMeta();
  const records = getRecords();
  const sources = Array.isArray(meta.nguonTuLieu) ? meta.nguonTuLieu : [];
  const credits = Array.isArray(meta.ghiNhan) ? meta.ghiNhan : [];

  const html = `
    <div class="page">
      <div class="container">
        <nav class="breadcrumb" aria-label="Đường dẫn">
          <a href="#/">Trang chủ</a><span aria-hidden="true">/</span><span>Nguồn tư liệu &amp; ghi nhận</span>
        </nav>

        <div class="page-head">
          <div>
            <p class="eyebrow">Minh bạch nguồn gốc</p>
            <h1>Nguồn tư liệu và ghi nhận</h1>
            <p class="page-sub">Thông tin về nguồn hình thành hồ sơ, cách ghi mức kiểm chứng và kênh gửi bổ sung, đính chính từ cộng đồng.</p>
          </div>
        </div>

        <div class="two-col">
          <section class="card" aria-labelledby="sources-title">
            <div class="card-head"><h2 id="sources-title">Nguồn tư liệu</h2></div>
            ${
              sources.length
                ? `<ul class="source-list">${sources
                    .map((source) => {
                      const item = typeof source === 'string' ? { ten: source, moTa: '' } : source || {};
                      const name = clean(item.ten) || 'Nguồn chưa đặt tên';
                      const description = clean(item.moTa);
                      const link = safeHref(item.lienKet);
                      return `<li>
                        <span class="source-mark">${icon('file')}</span>
                        <div>
                          <strong>${esc(name)}</strong>
                          ${description ? `<p>${esc(description)}</p>` : ''}
                          ${
                            link
                              ? `<a class="text-link small" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Mở liên kết ${icon('link')}</a>`
                              : ''
                          }
                        </div>
                      </li>`;
                    })
                    .join('')}</ul>`
                : `<p class="muted">Ban quản lý chưa khai báo nguồn tư liệu chi tiết trong hồ sơ.</p>`
            }
            <p class="card-note">Nguồn cụ thể của từng ảnh được ghi ngay dưới ảnh và trong trường <code>source</code> của bản ghi.</p>
          </section>

          <section class="card" aria-labelledby="credits-title">
            <div class="card-head"><h2 id="credits-title">Ghi nhận</h2></div>
            ${
              credits.length
                ? `<ul class="credit-list">${credits
                    .map((credit) => {
                      const text =
                        typeof credit === 'string'
                          ? credit
                          : clean(credit && (credit.ten || credit.noiDung || credit.moTa));
                      return `<li>${icon('check')} <span>${esc(text || 'Ghi nhận chưa có nội dung')}</span></li>`;
                    })
                    .join('')}</ul>`
                : `<p class="muted">Chưa có nội dung ghi nhận.</p>`
            }
            <p class="card-note">Ứng dụng ghi nhận sự đóng góp của cộng đồng, Ban quản lý di tích và những người đã cung cấp ảnh, bản dịch, thông tin đối chiếu.</p>
          </section>
        </div>

        <section class="card section-card" aria-labelledby="levels-title">
          <div class="card-head">
            <h2 id="levels-title">Ba mức kiểm chứng</h2>
            <span class="muted small">Áp dụng cho bản ghi, phiên âm và dịch nghĩa</span>
          </div>
          <div class="level-grid">
            ${Object.values(VERIFICATION_LEVELS)
              .sort((a, b) => b.rank - a.rank)
              .map(
                (level) => `<article class="level-card">
                  ${verificationBadge(level.key)}
                  <p>${esc(level.short)}</p>
                </article>`
              )
              .join('')}
          </div>
          <p class="card-note">Mức “Đã kiểm chứng” chỉ được đặt khi người kiểm đã đối chiếu với ảnh chất lượng tốt hoặc bản gốc và ghi tên, ngày kiểm trong hồ sơ.</p>
        </section>

        <section class="card section-card" aria-labelledby="feedback-title">
          <div class="card-head">
            <h2 id="feedback-title">Gửi ghi nhận, đính chính</h2>
            <span class="muted small">Không tự động lưu vào hồ sơ</span>
          </div>
          <p class="form-intro">Nếu bạn có ảnh, bản dịch hoặc thông tin giúp đính chính một bản ghi, hãy gửi cho Ban quản lý di tích. Nội dung bạn nhập chỉ được dùng để tạo email hoặc tệp văn bản; ứng dụng không tự động sửa dữ liệu.</p>

          <form class="feedback-form" data-form="ghi-nhan" novalidate>
            <div class="form-grid">
              <div class="field">
                <label for="gh-name">Họ và tên <span class="required">*</span></label>
                <input id="gh-name" name="hoTen" type="text" required maxlength="120" autocomplete="name">
              </div>
              <div class="field">
                <label for="gh-contact">Email hoặc số điện thoại</label>
                <input id="gh-contact" name="lienHe" type="text" maxlength="160" autocomplete="email">
              </div>
              <div class="field">
                <label for="gh-type">Loại ghi nhận</label>
                <select id="gh-type" name="loai">
                  <option value="Bổ sung thông tin">Bổ sung thông tin</option>
                  <option value="Đính chính nội dung">Đính chính nội dung</option>
                  <option value="Góp ý về ảnh hoặc bản dịch">Góp ý về ảnh hoặc bản dịch</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div class="field">
                <label for="gh-record">Bản ghi liên quan</label>
                <select id="gh-record" name="maBanGhi">
                  <option value="">Không gắn với bản ghi cụ thể</option>
                  ${records
                    .map(
                      (record) =>
                        `<option value="${esc(record.id)}">${esc(record.id)} — ${esc(truncate(recordHeading(record), 70))}</option>`
                    )
                    .join('')}
                </select>
              </div>
            </div>
            <div class="field">
              <label for="gh-content">Nội dung ghi nhận <span class="required">*</span></label>
              <textarea id="gh-content" name="noiDung" rows="6" required maxlength="4000"
                placeholder="Mô tả thông tin cần bổ sung hoặc đính chính, kèm nguồn đối chiếu nếu có…"></textarea>
            </div>
            <div class="btn-row">
              <button class="btn primary" type="submit">${icon('mail')} Tạo bản ghi nhận</button>
            </div>
            <p class="small muted">Thông tin liên hệ của Ban quản lý: ${esc(meta.lienHe || 'chưa khai báo trong hồ sơ.')}</p>
          </form>

          <div id="ghi-nhan-result" class="form-result" hidden></div>
        </section>
      </div>
    </div>
  `;

  return { title: 'Nguồn tư liệu và ghi nhận', html };
}

export function aboutView() {
  const meta = getMeta();

  const html = `
    <div class="page">
      <div class="container">
        <nav class="breadcrumb" aria-label="Đường dẫn">
          <a href="#/">Trang chủ</a><span aria-hidden="true">/</span><span>Giới thiệu</span>
        </nav>

        <div class="page-head">
          <div>
            <p class="eyebrow">Về ứng dụng</p>
            <h1>Giới thiệu</h1>
            <p class="page-sub">${esc(meta.tenUngDung || FALLBACK_TITLE)} — hồ sơ số phục vụ kiểm kê và tra cứu tư liệu Hán Nôm còn trong cộng đồng.</p>
          </div>
        </div>

        <div class="about-grid">
          <div class="about-main">
            <section class="card section-card">
              <div class="card-head"><h2>Mục đích</h2></div>
              <p>Ứng dụng tạo một hồ sơ số cho tư liệu Hán Nôm đang lưu giữ tại di tích và trong cộng đồng, bắt đầu từ việc kiểm kê văn bia. Mỗi tư liệu được mô tả bằng 15 trường Dublin Core cùng các trường bổ sung về nơi lưu giữ, loại bản, tình trạng, quyền công bố và mức kiểm chứng.</p>
              <p>Người xem có thể tra cứu thông tin, ảnh số hóa, phiên âm và dịch nghĩa mà không cần mở bản gốc. Ban quản lý di tích có thể dùng dữ liệu này để tiếp tục đối chiếu, bổ sung và lập kế hoạch bảo tồn.</p>
            </section>

            <section class="card section-card">
              <div class="card-head"><h2>Người dùng hướng tới</h2></div>
              <div class="audience-grid">
                <div><strong>Ban quản lý di tích</strong><p>Tra cứu nhanh hồ sơ, kiểm tra quyền công bố và tình trạng kiểm chứng.</p></div>
                <div><strong>Người dân, con cháu xa quê</strong><p>Xem ảnh và thông tin về tư liệu của làng, gửi bổ sung hoặc đính chính.</p></div>
                <div><strong>Sinh viên, nhà nghiên cứu</strong><p>Đọc mô tả, phiên âm, dịch nghĩa và trích dẫn kèm mã bản ghi.</p></div>
              </div>
            </section>

            <section class="card section-card">
              <div class="card-head"><h2>Nguyên tắc dữ liệu</h2></div>
              <ul class="check-list roomy">
                <li>${icon('check')} <span><strong>Không suy đoán, không bịa thông tin.</strong> Trường nào chưa có dữ liệu sẽ để trống hoặc ghi “chưa có thông tin”.</span></li>
                <li>${icon('check')} <span><strong>Không tìm thấy thì trả lời là chưa có tư liệu.</strong> Trợ lý hỏi đáp không dùng kiến thức bên ngoài hồ sơ.</span></li>
                <li>${icon('check')} <span><strong>Không sinh ảnh.</strong> Toàn bộ ảnh hiển thị là ảnh tư liệu thật do Ban quản lý hoặc cộng đồng cung cấp.</span></li>
                <li>${icon('check')} <span><strong>Luôn gắn nhãn kiểm chứng.</strong> Phiên âm, dịch nghĩa chưa kiểm chứng không bao giờ được hiển thị mà thiếu nhãn.</span></li>
                <li>${icon('check')} <span><strong>Khoá API không nằm ở trình duyệt.</strong> Mọi lời gọi Gemini đi qua máy chủ; khoá được đọc từ biến môi trường.</span></li>
              </ul>
            </section>

            <section class="card section-card">
              <div class="card-head"><h2>Cách hoạt động</h2></div>
              <ol class="steps">
                <li><span>1</span><div><strong>Kiểm kê tại di tích</strong><p>Chụp ảnh toàn trang và cận cảnh, ghi phiếu mô tả, xác định nơi lưu giữ và tình trạng bản gốc.</p></div></li>
                <li><span>2</span><div><strong>Nạp vào hồ sơ số</strong><p>Mỗi tư liệu là một bản ghi trong <code>data/tulieu.json</code>; ảnh đặt trong thư mục <code>images/</code>.</p></div></li>
                <li><span>3</span><div><strong>Phiên âm, dịch và kiểm chứng</strong><p>Nội dung chưa kiểm chứng được gắn nhãn. Người kiểm đối chiếu bản gốc, ghi tên và ngày kiểm.</p></div></li>
                <li><span>4</span><div><strong>Tra cứu và chia sẻ</strong><p>Người dùng tìm kiếm, hỏi đáp có dẫn mã bản ghi, in hồ sơ hoặc xuất dữ liệu công bố ra tệp JSON.</p></div></li>
              </ol>
            </section>
          </div>

          <aside class="about-aside">
            <section class="card credit-card">
              <span class="seal" aria-hidden="true">碑</span>
              <h2>Sản phẩm thực tập</h2>
              <dl class="credit-details">
                <div><dt>Người thực hiện</dt><dd>Võ Đức Duy</dd></div>
                <div><dt>Mã sinh viên</dt><dd>PH62905</dd></div>
                <div><dt>Nhóm</dt><dd>Nhóm 2</dd></div>
                <div><dt>Chương trình</dt><dd>Thực tập sinh Đợt 15 FPT Polytechnic và IMTA TECH</dd></div>
                <div><dt>Loại dự án</dt><dd>Dự án xã hội phi lợi nhuận</dd></div>
              </dl>
            </section>

            <section class="card side-card">
              <div class="card-head compact"><h2>Phạm vi hồ sơ</h2></div>
              <dl class="side-list">
                <div><dt>Di tích</dt><dd>${esc(meta.tenDiTich)}</dd></div>
                <div><dt>Địa bàn</dt><dd>${esc(adminArea(meta))}</dd></div>
                <div><dt>Cập nhật dữ liệu</dt><dd>${esc(formatDate(meta.capNhat) || 'Chưa ghi')}</dd></div>
                <div><dt>Liên hệ</dt><dd>${esc(meta.lienHe || 'Chưa khai báo')}</dd></div>
              </dl>
            </section>

            <div class="callout">
              ${icon('info')}
              <div>
                <strong>Miễn trừ</strong>
                <p>Ứng dụng phục vụ mục đích học tập, bảo tồn và tra cứu cộng đồng. Nội dung không thay thế bản gốc hay kết luận chuyên môn của cơ quan quản lý di sản.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  `;

  return { title: 'Giới thiệu', html };
}

export function notFoundView() {
  return {
    title: 'Không tìm thấy trang',
    html: `
      <div class="page"><div class="container narrow">
        ${emptyState({
          title: 'Không tìm thấy trang',
          text: 'Đường dẫn bạn mở không tồn tại hoặc đã được thay đổi.',
          action: `<a class="btn primary" href="#/">${icon('arrowLeft')} Về trang chủ</a>`
        })}
      </div></div>
    `
  };
}

export function errorView(message) {
  return {
    title: 'Không tải được hồ sơ',
    html: `
      <div class="page"><div class="container narrow">
        <div class="callout danger">${icon('alert')}
          <div><strong>Không tải được dữ liệu hồ sơ</strong><p>${esc(message)}</p></div>
        </div>
        <div class="card error-help">
          <h2>Kiểm tra nhanh</h2>
          <ol>
            <li>Chạy ứng dụng bằng lệnh <code>npm start</code> thay vì mở trực tiếp tệp HTML.</li>
            <li>Kiểm tra <code>data/tulieu.json</code> có đúng cú pháp JSON và có mảng <code>records</code>.</li>
            <li>Đặt ảnh trong thư mục <code>images/</code> và dùng đường dẫn tương đối, ví dụ <code>images/bia-01.jpg</code>.</li>
          </ol>
          <button class="btn secondary" type="button" data-action="reload">${icon('refresh')} Tải lại trang</button>
        </div>
      </div></div>
    `
  };
}

export function draftDownloadText(record, draft) {
  const lines = [
    'BẢN NHÁP PHIÊN ÂM — CHƯA KIỂM CHỨNG',
    '====================================',
    `Bản ghi: ${record.id} — ${recordHeading(record)}`,
    `Nơi lưu giữ hiện nay: ${clean(record.noiLuuGiuHienNay) || 'Chưa ghi trong hồ sơ'}`,
    `Loại bản đang hiển thị: ${clean(record.loaiBanDangHienThi) || 'Chưa ghi trong hồ sơ'}`,
    `Nguồn đề xuất: Gemini${draft.model ? ` (${draft.model})` : ''}`,
    `Người kiểm: ${draft.nguoiKiem || 'Chưa ghi'}`,
    `Ghi chú: ${draft.ghiChu || 'Chưa ghi'}`,
    `Ngày tạo bản nháp: ${new Date().toLocaleString('vi-VN')}`,
    '',
    'Nội dung đề xuất (người kiểm cần đối chiếu ảnh/bản gốc trước khi dùng):',
    '--------------------------------------------------------------------',
    draft.text,
    ''
  ];
  return lines.join('\n');
}

export function feedbackText(fields) {
  return [
    'GHI NHẬN / ĐÍNH CHÍNH TƯ LIỆU',
    '==============================',
    `Họ và tên: ${fields.hoTen}`,
    `Liên hệ: ${fields.lienHe || 'Không cung cấp'}`,
    `Loại ghi nhận: ${fields.loai}`,
    `Bản ghi liên quan: ${fields.maBanGhi || 'Không gắn với bản ghi cụ thể'}`,
    `Ngày tạo: ${new Date().toLocaleString('vi-VN')}`,
    '',
    'Nội dung:',
    fields.noiDung,
    '',
    '— Gửi từ ứng dụng Kiểm kê văn bia trong di tích tại một xã.'
  ].join('\n');
}

export function feedbackResultHtml(fields, meta) {
  const text = feedbackText(fields);
  const subject = `Ghi nhận tư liệu${fields.maBanGhi ? ` — ${fields.maBanGhi}` : ''}`;
  const email = clean(meta.lienHe).includes('@') ? clean(meta.lienHe) : '';
  const mailto = email
    ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
    : '';

  return `
    <div class="callout info">${icon('check')}
      <div>
        <strong>Đã tạo bản ghi nhận</strong>
        <p>Bạn có thể mở email, sao chép nội dung hoặc tải tệp văn bản để gửi Ban quản lý. Ứng dụng không tự động lưu thông tin này vào hồ sơ.</p>
      </div>
    </div>
    <div class="feedback-preview">
      <pre>${esc(text)}</pre>
    </div>
    <div class="btn-row">
      ${mailto ? `<a class="btn primary" href="${esc(mailto)}">${icon('mail')} Mở email gửi Ban quản lý</a>` : ''}
      <button class="btn secondary" type="button" data-action="copy" data-copy="${attr(text)}">${icon('copy')} Sao chép nội dung</button>
      <button class="btn secondary" type="button" data-action="download-feedback">${icon('download')} Tải tệp .txt</button>
    </div>
    ${mailto ? '' : `<p class="small muted">Hồ sơ chưa khai báo địa chỉ email liên hệ. Hãy tải tệp .txt và gửi trực tiếp cho Ban quản lý di tích.</p>`}
  `;
}

export function draftFilename(record) {
  return `ban-nhap-phien-am-${record.id}-${dateStamp()}.txt`;
}

export function feedbackFilename() {
  return `ghi-nhan-tu-lieu-${dateStamp()}.txt`;
}

const qaState = {
  messages: [],
  pending: false,
  lastFailed: ''
};

export function getQaState() {
  return qaState;
}

export function pushQaMessage(message) {
  qaState.messages.push(message);
}

export function setQaPending(value) {
  qaState.pending = Boolean(value);
}

export function resetQa() {
  qaState.messages = [];
  qaState.pending = false;
  qaState.lastFailed = '';
}

export function getDraftDownload(record, draft) {
  return { filename: draftFilename(record), content: draftDownloadText(record, draft) };
}

function recordCard(record) {
  const firstImage = recordImages(record)[0];
  const image = firstImage ? firstImage.thumb || firstImage.tep : null;
  const href = `#/tu-lieu/${encodeURIComponent(record.id)}`;
  const tags = [
    badge(recordType(record), 'ink'),
    verificationBadge(record.mucKiemChung)
  ].join('');

  return `
    <article class="card record-card">
      <a class="record-thumb" href="${href}" tabindex="-1" aria-hidden="true">
        ${
          image
            ? `<img src="${esc(encodePath(image))}" alt="" loading="lazy" decoding="async">`
            : `<span class="thumb-mark">碑</span>`
        }
      </a>
      <div class="record-body">
        <div class="record-tags">${tags}</div>
        <h3 class="record-title"><a href="${href}">${esc(recordHeading(record))}</a></h3>
        ${recordSubtitle(record) ? `<p class="record-sub">${esc(recordSubtitle(record))}</p>` : ''}
        ${
          clean(record.description)
            ? `<p class="record-excerpt">${esc(truncate(record.description, 165))}</p>`
            : `<p class="record-excerpt muted">Chưa có mô tả trong hồ sơ.</p>`
        }
        <div class="record-foot">
          <span class="record-id">Mã: ${esc(record.id)}</span>
          <a class="text-link" href="${href}">Xem hồ sơ ${icon('arrowRight')}</a>
        </div>
      </div>
    </article>
  `;
}

function facetCard(title, values, field, hint) {
  return `
    <article class="card facet-card">
      <h3>${esc(title)}</h3>
      <p class="facet-hint">${esc(hint)}</p>
      ${
        values.length
          ? `<div class="chip-list">${values
              .map(
                (item) => `<a class="chip link-chip" href="#/tu-lieu?${encodeURIComponent(field)}=${encodeURIComponent(item.value)}">
                  ${esc(item.value)} <span class="chip-count">${item.count}</span>
                </a>`
              )
              .join('')}</div>`
          : `<p class="muted small">Chưa có dữ liệu để thống kê.</p>`
      }
      <a class="text-link facet-link" href="#/tu-lieu">Xem danh sách ${icon('arrowRight')}</a>
    </article>
  `;
}

function galleryHtml(record, images) {
  if (!images.length) {
    return `
      <div class="gallery-empty">
        ${icon('image')}
        <p><strong>Chưa có ảnh số hóa cho bản ghi này.</strong></p>
        <p class="small muted">Khi ảnh được bổ sung vào thư mục <code>images/</code> và khai báo trong hồ sơ, ảnh sẽ hiển thị tại đây kèm chú thích và nguồn.</p>
      </div>
    `;
  }

  const first = images[0];
  return `
    <figure class="gallery-main">
      <a class="gallery-frame" href="${esc(encodePath(first.tep))}" target="_blank" rel="noopener noreferrer" aria-label="Mở ảnh ${esc(first.moTa || 'tư liệu')} trong tab mới">
        <img id="gallery-image" src="${esc(encodePath(first.tep))}" alt="${esc(first.moTa || 'Ảnh tư liệu')}" decoding="async">
      </a>
      <figcaption>
        <span class="cap" id="gallery-caption">${esc(first.moTa || 'Ảnh tư liệu')}</span>
        <span class="src" id="gallery-source">Nguồn: ${esc(first.nguon || 'Chưa ghi trong hồ sơ.')}</span>
      </figcaption>
    </figure>

    ${
      images.length > 1
        ? `<div class="thumbs" role="group" aria-label="Chọn ảnh để xem">
            ${images
              .map(
                (image, index) => `<button class="thumb ${index === 0 ? 'active' : ''}" type="button"
                  data-action="gallery" data-index="${index}" data-record="${esc(record.id)}"
                  aria-pressed="${index === 0 ? 'true' : 'false'}"
                  aria-label="Xem ảnh ${index + 1}: ${esc(image.moTa || 'Ảnh tư liệu')}">
                  <img src="${esc(encodePath(image.thumb || image.tep))}" alt="" loading="lazy" decoding="async">
                </button>`
              )
              .join('')}
          </div>`
        : ''
    }

    <p class="gallery-note">${icon('info')} Ảnh hiển thị là bản số hóa cỡ web, đã được giảm kích thước để tải nhanh trên điện thoại. Tư liệu gốc hiện lưu tại <strong>${esc(record.noiLuuGiuHienNay || 'nơi lưu giữ ghi trong hồ sơ')}</strong>.</p>

    ${
      images.length
        ? `<details class="image-notes">
            <summary>Chú thích và nguồn của tất cả ảnh (${images.length})</summary>
            <ol>
              ${images
                .map(
                  (image, index) => `<li>
                    <strong>Ảnh ${index + 1}:</strong> ${esc(image.moTa || 'Chưa có chú thích')}
                    <span class="src">Nguồn: ${esc(image.nguon || 'Chưa ghi trong hồ sơ.')}</span>
                  </li>`
                )
                .join('')}
            </ol>
          </details>`
        : ''
    }
  `;
}

function contentBody(record, field, label) {
  const content = record[field] || {};
  const text = clean(content.noiDung);
  const info = verificationInfo(content.mucKiemChung);
  const showWarning = info.key !== 'da-kiem-chung';
  const metaLine = [
    clean(content.nguoiKiem) ? `Người kiểm: ${clean(content.nguoiKiem)}` : '',
    clean(content.ngayKiem) ? `Ngày kiểm: ${formatDate(content.ngayKiem)}` : '',
    clean(content.ghiChu) ? `Ghi chú: ${clean(content.ghiChu)}` : ''
  ]
    .filter(Boolean)
    .join(' · ');

  return `
    ${
      showWarning && text
        ? `<div class="callout ${info.tone === 'warn' ? 'warn' : 'danger'} small">
            ${icon('alert')}
            <div><strong>${esc(info.label)}.</strong> ${esc(info.short)} Nội dung dưới đây cần được đối chiếu với ảnh hoặc bản gốc trước khi trích dẫn.</div>
          </div>`
        : ''
    }
    ${
      text
        ? `<div class="prose content-prose">${paragraphsHtml(text)}</div>`
        : `<p class="empty-content">Chưa có bản ${esc(label)} trong hồ sơ.</p>`
    }
    ${metaLine ? `<p class="verified-by">${esc(metaLine)}</p>` : ''}
  `;
}

function ocrBox(record, images, api, draft) {
  const disabled = !api.gemini || !images.length;
  let note = '';
  if (!images.length) {
    note = 'Bản ghi chưa có ảnh số hóa nên chưa thể nhờ Gemini đọc.';
  } else if (!api.gemini) {
    note = api.reason || 'Gemini chưa được cấu hình trên máy chủ.';
  }

  return `
    <div class="ai-box no-print" data-ocr-record="${esc(record.id)}">
      <div class="ai-head">
        <span class="ai-icon">${icon('sparkles')}</span>
        <div>
          <h3>Nhờ Gemini đề xuất phiên âm từ ảnh</h3>
          <p>Gemini đọc ảnh đã số hóa và đề xuất bản phiên âm. Kết quả luôn được gắn nhãn <strong>chưa kiểm chứng</strong> và không tự động lưu vào dữ liệu.</p>
        </div>
      </div>
      <div class="ai-actions">
        <button class="btn secondary" type="button" data-action="ocr" data-record="${esc(record.id)}" ${disabled ? 'disabled' : ''}>
          ${icon('sparkles')} ${images.length ? 'Đề xuất phiên âm từ ảnh' : 'Chưa có ảnh để đọc'}
        </button>
        <span class="small muted" id="ocr-status">${esc(note)}</span>
      </div>
      <div id="ocr-result">${draft ? draftPanel(record, draft) : ''}</div>
    </div>
  `;
}

function draftPanel(record, draft) {
  return `
    <div class="draft-panel" id="ocr-draft">
      <div class="draft-head">
        <span class="badge danger">Chưa kiểm chứng</span>
        <span class="draft-model">Gemini đề xuất${draft.model ? ` · ${esc(draft.model)}` : ''}</span>
      </div>
      <p class="small">Bản nháp dưới đây chỉ nằm trong phiên làm việc hiện tại và <strong>không tự động lưu</strong> vào <code>tulieu.json</code>. Người kiểm có thể sửa trực tiếp rồi sao chép hoặc tải về.</p>
      <label class="field-label" for="ocr-text">Nội dung đề xuất (có thể sửa)</label>
      <textarea id="ocr-text" class="draft-textarea" data-draft-field="text" rows="12" spellcheck="false">${esc(draft.text)}</textarea>
      <div class="draft-grid">
        <label class="field">
          <span>Người kiểm</span>
          <input type="text" data-draft-field="nguoiKiem" value="${attr(draft.nguoiKiem)}" maxlength="120" placeholder="Họ tên người đối chiếu">
        </label>
        <label class="field">
          <span>Ghi chú kiểm tra</span>
          <input type="text" data-draft-field="ghiChu" value="${attr(draft.ghiChu)}" maxlength="300" placeholder="Ví dụ: đã đối chiếu ảnh cận cảnh">
        </label>
      </div>
      <div class="btn-row">
        <button class="btn secondary small" type="button" data-action="copy-draft">${icon('copy')} Sao chép</button>
        <button class="btn secondary small" type="button" data-action="download-draft">${icon('download')} Tải bản nháp (.txt)</button>
        <button class="btn ghost small" type="button" data-action="clear-draft">Xóa bản nháp</button>
      </div>
      <p class="small muted">Sau khi đối chiếu bản gốc, cập nhật nội dung đã kiểm vào hồ sơ và đổi mức kiểm chứng thành “Đã kiểm chứng” hoặc “Đã kiểm chứng một phần”.</p>
    </div>
  `;
}

function metaTable(record, fields) {
  return `<dl class="meta-list">${fields
    .map(([key, label]) => {
      const value = fieldValue(record, key);
      let display = value
        ? esc(value).replace(/\n/g, '<br>')
        : `<span class="muted">Chưa có thông tin</span>`;
      if (key === 'mucKiemChung') display = verificationBadge(value);
      return `<div class="meta-row"><dt>${esc(label)}</dt><dd>${display}</dd></div>`;
    })
    .join('')}</dl>`;
}

function extraTable(record) {
  return `<dl class="meta-list compact-list">${EXTRA_FIELDS.map(([key, label]) => {
    const value = fieldValue(record, key);
    let display = value
      ? esc(value).replace(/\n/g, '<br>')
      : `<span class="muted">Chưa có thông tin</span>`;
    if (key === 'mucKiemChung') display = verificationBadge(value);
    if (key === 'phanKhongCongBo' && value) {
      display = `<span class="lock-line">${icon('lock')} ${esc(value)}</span>`;
    }
    return `<div class="meta-row"><dt>${esc(label)}</dt><dd>${display}</dd></div>`;
  }).join('')}</dl>`;
}

function rightsList(record) {
  const draft = [
    ['Người cho phép công bố', record.nguoiChoPhepCongBo],
    ['Phạm vi được phép', record.phamViDuocPhep],
    ['Phần không công bố', record.phanKhongCongBo],
    ['Tình trạng bản gốc', record.tinhTrangBanGoc],
    ['Nơi lưu giữ tại thời điểm tư liệu', record.noiLuuGiuTaiThoiDiem]
  ];
  return `<dl class="side-list">${draft
    .map(([label, value]) => {
      const text = clean(value);
      return `<div><dt>${esc(label)}</dt><dd>${text ? esc(text) : '<span class="muted">Chưa có thông tin</span>'}</dd></div>`;
    })
    .join('')}</dl>`;
}

function keyFact(label, value) {
  const text = clean(value);
  return `<div class="key-fact"><span class="key-label">${esc(label)}</span><span class="key-value">${text ? esc(text) : '<span class="muted">Chưa có thông tin</span>'}</span></div>`;
}

function citationsHtml(citations) {
  return `
    <div class="citations">
      <p class="citations-title">Bản ghi liên quan</p>
      <ul>
        ${citations
          .map(
            (citation) => `<li>
              <a class="citation-link" href="#/tu-lieu/${encodeURIComponent(citation.id)}">
                <span class="cite-id">${esc(citation.id)}</span>
                <span class="cite-title">${esc(citation.title)}</span>
              </a>
              <dl class="cite-meta">
                <div><dt>Nơi lưu giữ</dt><dd>${esc(citation.noiLuuGiuHienNay || 'Chưa ghi trong hồ sơ.')}</dd></div>
                <div><dt>Loại bản</dt><dd>${esc(citation.loaiBanDangHienThi || 'Chưa ghi trong hồ sơ.')}</dd></div>
                <div><dt>Mức kiểm chứng</dt><dd>${verificationBadge(citation.mucKiemChung)}</dd></div>
              </dl>
            </li>`
          )
          .join('')}
      </ul>
    </div>
  `;
}

function suggestedQuestions(records) {
  if (!records.length) return [];
  const record = records[0];
  const list = [
    `Cho tôi biết thông tin về bản ghi ${record.id}.`,
    `Tư liệu ${record.id} hiện lưu giữ ở đâu và đang hiển thị loại bản nào?`
  ];
  if (record.nienHieu) list.push(`Những tư liệu nào có niên hiệu ${record.nienHieu}?`);
  else if (record.thanHieu) list.push(`Những tư liệu nào liên quan đến thần hiệu ${record.thanHieu}?`);
  else list.push('Hồ sơ hiện có bao nhiêu bản ghi?');
  return list.slice(0, 3);
}

function badge(text, tone = '') {
  return `<span class="badge ${tone}">${esc(text)}</span>`;
}

function verificationBadge(level) {
  const info = verificationInfo(level);
  return `<span class="badge ${info.tone}" title="${attr(info.short)}">${esc(info.label)}</span>`;
}

function emptyState({ title, text, action = '', details = '' }) {
  return `
    <div class="empty-state card">
      <span class="seal ghost" aria-hidden="true">碑</span>
      <h3>${esc(title)}</h3>
      <p>${esc(text)}</p>
      ${action ? `<div class="empty-actions">${action}</div>` : ''}
      ${details || ''}
    </div>
  `;
}

function dataGuide() {
  return `
    <details class="data-guide">
      <summary>Hướng dẫn nạp dữ liệu thật</summary>
      <ol>
        <li>Mở <code>data/tulieu.json</code>, thêm bản ghi vào mảng <code>records</code> theo mẫu trong <code>README.md</code>.</li>
        <li>Đặt ảnh đã giảm kích thước vào thư mục <code>images/</code>, khai báo đường dẫn trong trường <code>anh</code>.</li>
        <li>Ghi rõ <code>noiLuuGiuHienNay</code>, <code>loaiBanDangHienThi</code>, <code>soDangKy</code> và <code>mucKiemChung</code> cho từng bản ghi.</li>
        <li>Chạy <code>npm start</code> để xem thay đổi. Dữ liệu được đọc lại mỗi lần tải trang.</li>
      </ol>
    </details>
  `;
}

function options(values, selected, labeler) {
  return values
    .map((value) => {
      const label = labeler ? labeler(value) : value;
      return `<option value="${attr(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`;
    })
    .join('');
}

function verificationLabel(value) {
  return verificationInfo(value).label;
}

function activeFilterText(filters) {
  const parts = [];
  if (filters.q) parts.push(`từ khóa “${filters.q}”`);
  if (filters.nienHieu) parts.push(`niên hiệu ${filters.nienHieu}`);
  if (filters.thanHieu) parts.push(`thần hiệu ${filters.thanHieu}`);
  if (filters.loaiTuLieu) parts.push(`loại ${filters.loaiTuLieu}`);
  if (filters.mucKiemChung) parts.push(verificationInfo(filters.mucKiemChung).label.toLowerCase());
  return parts.length ? `Đang lọc theo ${parts.join(' · ')}` : '';
}

function fieldValue(record, key) {
  if (key === 'type') return clean(record.type || record.loaiTuLieu);
  if (key === 'identifier') return clean(record.identifier || record.id);
  if (key === 'date') return formatDate(record.date);
  if (key === 'mucKiemChung') return normalizeLevel(record.mucKiemChung);
  return clean(record[key]);
}

function citationText(record) {
  const parts = [`${recordHeading(record)} [${record.id}].`];
  if (record.nienHieu) parts.push(`Niên hiệu: ${record.nienHieu}.`);
  if (record.noiLuuGiuHienNay) parts.push(`Nơi lưu giữ hiện nay: ${record.noiLuuGiuHienNay}.`);
  if (record.loaiBanDangHienThi) parts.push(`Loại bản đang hiển thị: ${record.loaiBanDangHienThi}.`);
  parts.push(`Mức kiểm chứng: ${verificationInfo(record.mucKiemChung).label}.`);
  if (typeof location !== 'undefined') {
    parts.push(`Hồ sơ số: ${location.origin}${location.pathname}#/tu-lieu/${encodeURIComponent(record.id)}`);
  }
  return parts.join(' ');
}

function locationLine(meta) {
  const parts = [];
  if (meta.tenDiTich) parts.push(`Di tích ${meta.tenDiTich}`);
  const area = adminArea(meta);
  if (area) parts.push(area);
  return parts.join(' · ') || 'Hồ sơ tư liệu Hán Nôm';
}

function locationShort(meta) {
  const area = adminArea(meta);
  return [meta.tenDiTich, area].filter(Boolean).join(', ');
}

function adminArea(meta) {
  return [meta.xa, meta.huyen, meta.tinh].filter(Boolean).join(', ');
}

function safeHref(value) {
  const text = clean(value);
  if (/^https?:\/\//i.test(text)) return text;
  if (text.startsWith('/') || text.startsWith('#') || text.startsWith('./')) return text;
  return '';
}

function clean(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function attr(value) {
  return esc(value).replace(/\n/g, '&#10;');
}
