# Kiểm kê văn bia trong di tích tại một xã

**Tư liệu Hán Nôm còn trong cộng đồng** — hồ sơ số giúp Ban quản lý di tích, người dân, con cháu xa quê và người nghiên cứu tra cứu tư liệu Hán Nôm mà không phải mở bản gốc.

Ứng dụng gồm 6 màn hình:

1. **Trang chủ** — giới thiệu di tích và bộ tư liệu, ô tìm kiếm, số liệu tổng quan.
2. **Danh sách tư liệu** — lọc theo niên hiệu, thần hiệu, loại tư liệu, mức kiểm chứng; tìm theo từ khóa.
3. **Chi tiết bản ghi** — ảnh toàn trang/cận cảnh có chú thích và nguồn; phiên âm, dịch nghĩa kèm nhãn kiểm chứng; 15 trường Dublin Core và 9 trường bổ sung; nút nhờ Gemini đề xuất phiên âm từ ảnh.
4. **Hỏi đáp** — Gemini chỉ trả lời từ `data/tulieu.json`, kèm mã bản ghi, nơi lưu giữ và loại bản.
5. **Nguồn tư liệu và ghi nhận** — nguồn hình thành hồ sơ, ba mức kiểm chứng, biểu mẫu gửi bổ sung/đính chính.
6. **Giới thiệu** — mục đích, nguyên tắc dữ liệu, thông tin sản phẩm thực tập.

Nút **Xuất dữ liệu** ở phần đầu trang tải toàn bộ hồ sơ hiện có ra tệp JSON.

---

## 1. Chạy ứng dụng

Yêu cầu: **Node.js 20 trở lên** (không cần cài thêm gói npm).

```bash
npm start
```

Mở `http://localhost:3000`.

Ứng dụng **không chạy đúng nếu mở trực tiếp `index.html` bằng `file://`** vì trình duyệt chặn tải `data/tulieu.json` và không có máy chủ API.

### Cấu hình Gemini

1. Sao chép `.env.example` thành `.env`.
2. Điền khoá API:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
```

3. Khởi động lại `npm start`.

Khoá API **chỉ được đọc ở máy chủ** (`server.mjs`). Mã phía trình duyệt chỉ gọi các điểm cuối `/api/hoi-dap` và `/api/phien-am`; không có khoá nào trong HTML, JavaScript, hay tệp dữ liệu.

Nếu chưa cấu hình khoá, toàn bộ chức năng tra cứu, lọc, xuất dữ liệu vẫn hoạt động; trang Hỏi đáp và nút đề xuất phiên âm sẽ báo chưa sẵn sàng.

---

## 2. Cấu trúc thư mục

```
.
├── index.html               # khung giao diện, điều hướng, footer
├── vercel.json              # cấu hình build/output/function cho Vercel
├── server.mjs               # máy chủ tĩnh + proxy Gemini (Node, không phụ thuộc gói ngoài)
├── package.json
├── .env.example
├── api/                     # hàm máy chủ dùng khi triển khai Vercel
│   ├── config.mjs
│   ├── health.mjs
│   ├── hoi-dap.mjs
│   └── phien-am.mjs
├── scripts/
│   └── build-vercel.mjs     # tạo public/ cho bản deploy
├── data/
│   └── tulieu.json          # nguồn dữ liệu duy nhất
├── images/                  # ảnh số hóa, đặt tên theo mã bản ghi
│   └── README.md
├── assets/
│   ├── css/style.css
│   ├── js/app.js            # điều hướng, tương tác, gọi API
│   ├── js/store.js          # nạp, chuẩn hóa, lọc, xuất dữ liệu
│   ├── js/views.js          # 6 màn hình
│   ├── js/utils.js
│   └── favicon.svg
└── public/                  # sinh tự động bởi npm run build; không commit
```

---

## 3. Cấu trúc `data/tulieu.json`

Tệp gồm `meta` (thông tin chung) và `records` (mảng bản ghi).

### Dữ liệu hiện có

Hồ sơ đang công bố **15 văn bia của xã Sơn Lôi, huyện Bình Xuyên, tỉnh Vĩnh Phúc** (nay thuộc xã Bình Nguyên, tỉnh Phú Thọ), niên đại **1782–1931**, thuộc 9 niên hiệu: Cảnh Hưng, Chiêu Thống, Minh Mệnh, Thiệu Trị, Tự Đức, Đồng Khánh, Thành Thái, Khải Định, Bảo Đại.

- Bốn loại tư liệu: bia hậu, bia điều lệ, bia văn chỉ, bia cầu đường.
- 15 bản ghi tương ứng 17 ảnh (hai bia có hai mặt).
- 7 nguồn trong `meta.nguonTuLieu`: Vietnamica, Viện Nghiên cứu Hán Nôm, EFEO, Báo Nhân Dân, Wikipedia, TTXVN và Tạp chí Hán Nôm.
- Nguồn chính là **Cơ sở dữ liệu Thác bản văn bia Hán Nôm** do EFEO sưu tầm (1910–1944), hiện lưu tại Viện Nghiên cứu Hán Nôm và công bố trên Vietnamica.

> **Vì sao toàn bộ để “Chưa kiểm chứng”?** Ảnh trong hồ sơ là ảnh số hóa từ **bản thác bản (bản dập giấy)**, không phải ảnh chụp bia tại di tích. Chưa có đợt đối chiếu thực địa để xác nhận bia gốc còn hay mất, vị trí hiện tại và nội dung khắc trên đá. Tạp chí Hán Nôm cũng đã cảnh báo về tình trạng ngụy tạo niên đại trong một số thác bản. Vì vậy hồ sơ giữ mức `chua-kiem-chung` cho tất cả bản ghi, và chỉ công bố ảnh thác bản cùng phần tóm tắt nội dung do cơ sở dữ liệu cung cấp — không có phiên âm, dịch nghĩa đầy đủ.

Cấu trúc `meta` (ví dụ rút gọn; mảng `records` chứa 15 bản ghi hiện có):

```json
{
  "phienBan": 1,
  "meta": {
    "tenUngDung": "Kiểm kê văn bia trong di tích tại một xã",
    "tenDiTich": "đình, chùa và văn chỉ",
    "xa": "Sơn Lôi",
    "huyen": "Bình Xuyên",
    "tinh": "Vĩnh Phúc",
    "diaChi": "Xã Sơn Lôi, huyện Bình Xuyên, tỉnh Vĩnh Phúc (nay thuộc xã Bình Nguyên, tỉnh Phú Thọ)",
    "gioiThieu": "Đoạn giới thiệu ngắn về di tích và bộ tư liệu.",
    "lienHe": "",
    "capNhat": "2026-11-15",
    "nguonTuLieu": [
      { "ten": "Tên nguồn", "moTa": "Mô tả ngắn", "lienKet": "https://..." }
    ],
    "ghiNhan": ["Cá nhân/tập thể đã đóng góp"]
  },
  "records": []
}
```

Khi dùng cho xã khác, thay toàn bộ giá trị trong `meta` và `records` bằng dữ liệu đã đối chiếu. Không giữ chuỗi ví dụ trong bản công bố.

### Mẫu một bản ghi

Mỗi bản ghi có **15 trường Dublin Core**, **9 trường bổ sung bắt buộc**, các trường phục vụ tra cứu, mảng ảnh và hai khối nội dung phiên âm/dịch nghĩa.

```json
{
  "id": "VB-001",

  "title": "<nhan đề tư liệu>",
  "creator": "<tác giả / người soạn>",
  "subject": "<chủ đề>",
  "description": "<mô tả nội dung, hình thức, chất liệu>",
  "publisher": "<đơn vị công bố>",
  "contributor": "<người đóng góp>",
  "date": "<ngày tháng hoặc năm, ví dụ 1854>",
  "type": "Văn bia",
  "format": "<chất liệu, kích thước, số mặt>",
  "identifier": "<mã định danh khác nếu có>",
  "source": "<nguồn tư liệu>",
  "language": "Hán / Nôm",
  "relation": "<bản ghi hoặc tư liệu liên quan>",
  "coverage": "<địa điểm, thời kỳ>",
  "rights": "<thông tin quyền>",

  "noiLuuGiuHienNay": "<nơi lưu giữ hiện nay>",
  "noiLuuGiuTaiThoiDiem": "<nơi lưu giữ tại thời điểm tư liệu>",
  "loaiBanDangHienThi": "Ảnh số hóa",
  "tinhTrangBanGoc": "<tình trạng bản gốc>",
  "soDangKy": "<số đăng ký>",
  "nguoiChoPhepCongBo": "<cá nhân/tập thể cho phép công bố>",
  "phamViDuocPhep": "<phạm vi được phép công bố>",
  "phanKhongCongBo": "<phần không công bố, nếu có>",
  "mucKiemChung": "chua-kiem-chung",

  "nienHieu": "<niên hiệu, dùng để lọc>",
  "thanHieu": "<thần hiệu, dùng để lọc>",
  "loaiTuLieu": "Văn bia",

  "anh": [
    {
      "tep": "images/VB-001-01-toan-trang.jpg",
      "thumb": "images/thumbs/VB-001-01-toan-trang.jpg",
      "loai": "toan-trang",
      "moTa": "Toàn trang bia mặt trước",
      "nguon": "Ảnh do Ban quản lý di tích cung cấp"
    },
    {
      "tep": "images/VB-001-02-can-canh.jpg",
      "thumb": "images/thumbs/VB-001-02-can-canh.jpg",
      "loai": "can-canh",
      "moTa": "Cận cảnh phần trán bia",
      "nguon": "Ảnh do Ban quản lý di tích cung cấp"
    }
  ],

  "phienAm": {
    "noiDung": "<nội dung phiên âm>",
    "mucKiemChung": "chua-kiem-chung",
    "nguoiKiem": "",
    "ngayKiem": "",
    "ghiChu": ""
  },

  "dichNghia": {
    "noiDung": "<nội dung dịch nghĩa>",
    "mucKiemChung": "chua-kiem-chung",
    "nguoiKiem": "",
    "ngayKiem": "",
    "ghiChu": ""
  }
}
```

### Giải thích các trường quan trọng

| Trường | Ý nghĩa |
|---|---|
| `id` | Mã bản ghi duy nhất, hiển thị và dùng để trích dẫn. Nên dùng mã ngắn, không dấu, ví dụ `VB-001`. |
| `type` | Trường Dublin Core số 8. Có thể dùng `loaiTuLieu` để ghi giá trị dùng cho bộ lọc; nếu bỏ trống, ứng dụng lấy `type`. |
| `nienHieu` | Niên hiệu ghi trên tư liệu hoặc niên đại dùng để tra cứu. Đây là trường phụ, không thay thế `date`. |
| `thanHieu` | Thần hiệu được thờ tự, dùng để lọc. Không suy đoán nếu chưa xác định. |
| `mucKiemChung` | Mức kiểm chứng của **toàn bản ghi**: `da-kiem-chung`, `mot-phan` hoặc `chua-kiem-chung`. |
| `phienAm.mucKiemChung`, `dichNghia.mucKiemChung` | Mức kiểm chứng riêng của từng nội dung. Luôn được hiển thị thành nhãn. |
| `phamViDuocPhep` | Ghi rõ nội dung được phép công bố (ảnh, phiên âm, bản dịch…). |
| `phanKhongCongBo` | Ghi rõ phần không công bố. Ứng dụng hiển thị trường này như một ghi chú về quyền. |
| `anh[].nguon` | Nguồn ảnh, hiển thị ngay dưới ảnh. Không bỏ trống nếu biết nguồn. |
| `anh[].loai` | `toan-trang`, `mat-sau`, `can-canh` hoặc `khac`. |
| `anh[].thumb` | Ảnh thu nhỏ cho thẻ danh sách và dải ảnh chọn. Nếu bỏ trống, ứng dụng dùng chính `tep`. |

### Ba mức kiểm chứng

| Giá trị | Nhãn hiển thị | Dùng khi |
|---|---|---|
| `da-kiem-chung` | Đã kiểm chứng | Đã đối chiếu ảnh chất lượng tốt/bản gốc và có người kiểm xác nhận. |
| `mot-phan` | Đã kiểm chứng một phần | Mới kiểm tra được một phần nội dung. |
| `chua-kiem-chung` | Chưa kiểm chứng | Chưa có người kiểm, là bản đề xuất, hoặc không rõ. |

Nếu bỏ trống, ứng dụng mặc định là **chưa kiểm chứng**. Không đặt “đã kiểm chứng” nếu chưa thực sự đối chiếu.

### Ảnh

- Đặt ảnh trong `images/`, ảnh thu nhỏ trong `images/thumbs/`.
- Ảnh hiển thị chính nên có cạnh dài khoảng **1400 px**, dung lượng khoảng **1 MB** để còn đọc được chữ Hán trên điện thoại. Giữ bản gốc độ phân giải cao ở nơi khác.
- Ảnh thu nhỏ nên rộng khoảng **420 px**, dung lượng dưới **100 KB**; dùng cho thẻ danh sách và dải ảnh chọn để trang tải nhanh.
- Không đặt ảnh do AI sinh vào thư mục này. Ứng dụng chỉ hiển thị ảnh tư liệu thật.
- Đường dẫn trong `anh[].tep` và `anh[].thumb` là đường dẫn tương đối từ gốc dự án, ví dụ `images/VB-001-01.jpg` và `images/thumbs/VB-001-01.jpg`.
- Ghi rõ trong `moTa` và `nguon` nếu ảnh là **ảnh số hóa từ thác bản**, không phải ảnh chụp bia tại di tích.

---

## 4. Gemini

### Hỏi đáp

- Trình duyệt gửi câu hỏi tới `POST /api/hoi-dap`.
- Máy chủ đọc lại `data/tulieu.json`, dựng ngữ cảnh từ các bản ghi, gọi Gemini với `temperature` thấp và **response schema** bắt buộc trả về `answer`, `coTuLieu`, `recordIds`.
- Câu trả lời chỉ được dùng thông tin trong hồ sơ. Nếu không có dữ liệu, câu trả lời là **“Chưa có tư liệu trong hồ sơ.”**
- Giao diện hiển thị thêm thẻ **Bản ghi liên quan** gồm mã bản ghi, nơi lưu giữ hiện nay, loại bản đang hiển thị và mức kiểm chứng của bản ghi.
- Nếu bản ghi liên quan có mức kiểm chứng chưa đạt **đã kiểm chứng**, hoặc còn phiên âm/dịch nghĩa chưa kiểm chứng, câu trả lời kèm cảnh báo nhắc người đọc đối chiếu ảnh hoặc bản gốc trước khi trích dẫn.
- Nếu câu trả lời không gắn được với bản ghi nào trong hồ sơ, ứng dụng không hiển thị câu trả lời đó mà trả về **“Chưa có tư liệu trong hồ sơ.”**

### Đề xuất phiên âm từ ảnh

- Nút **“Đề xuất phiên âm từ ảnh”** trong trang chi tiết gửi `recordId` tới `POST /api/phien-am`.
- Máy chủ chỉ đọc các ảnh đã khai báo trong bản ghi, nằm trong thư mục `images/`; giới hạn 3 ảnh, mỗi ảnh tối đa 6 MB.
- Kết quả luôn hiển thị với nhãn **Chưa kiểm chứng**, có ô văn bản cho người kiểm sửa, ô ghi tên người kiểm/ghi chú, nút sao chép và tải bản nháp `.txt`.
- Kết quả **không tự động lưu** vào `tulieu.json`. Người quản trị phải tự đối chiếu bản gốc, cập nhật dữ liệu và đổi mức kiểm chứng.

### Giới hạn và an toàn

- Giới hạn tần suất: 20 yêu cầu/phút cho mỗi địa chỉ IP.
- Nội dung yêu cầu tối đa 64 KB; câu hỏi tối đa 2.000 ký tự.
- Header CSP, `X-Content-Type-Options`, `Referrer-Policy`, giới hạn kích thước ảnh.
- Không hiển thị chi tiết lỗi nội bộ của Gemini cho người dùng; lỗi đầy đủ chỉ ghi ở log máy chủ.

---

## 5. Xuất dữ liệu

Nút **Xuất dữ liệu** tải tệp `tulieu-cong-bo-YYYYMMDD.json` gồm:

- `meta`
- toàn bộ `records` với 15 trường Dublin Core, 9 trường bổ sung, ảnh, phiên âm, dịch nghĩa và mức kiểm chứng
- `xuatLuc`, `ghiChuXuat`, `phienBan`

Các khóa nội bộ bắt đầu bằng `_` (nếu có) sẽ bị loại bỏ. Trường `phanKhongCongBo` được giữ lại như ghi chú về phạm vi công bố.

---

## 6. Nguyên tắc nội dung

1. **Không suy đoán hoặc bịa thông tin.** Trường không có dữ liệu để trống hoặc ghi “chưa có thông tin”.
2. **Không tìm thấy trong dữ liệu thì trả lời “Chưa có tư liệu trong hồ sơ.”**
3. **Không sinh ảnh.** Toàn bộ ảnh là ảnh tư liệu thật.
4. **Không hiển thị phiên âm/dịch nghĩa chưa kiểm mà thiếu nhãn.** Nhãn nằm ngay tiêu đề khối nội dung và kèm cảnh báo khi chưa đạt mức “đã kiểm chứng”.
5. **Không đặt khoá API trong mã nguồn phía trình duyệt.**
6. Ứng dụng không thay thế bản gốc; mọi trích dẫn học thuật cần đối chiếu bản gốc.

---

## 7. Triển khai

### Triển khai trên Vercel

Ứng dụng dùng cấu hình tĩnh + hàm máy chủ trong `vercel.json`:

- **Root Directory:** để trống hoặc `.` (thư mục gốc của kho mã). Không trỏ vào `public/`.
- **Framework Preset:** `Other`.
- **Build Command:** `npm run build`.
- **Output Directory:** `public`.
- **Install Command:** để mặc định (`npm install`).

Khi build, `scripts/build-vercel.mjs` tạo thư mục `public/` gồm `index.html`, `assets/`, `data/`, `images/`. Thư mục này **được sinh tự động và không commit** (đã nằm trong `.gitignore`). Các hàm trong `api/` dùng `server.mjs` để xử lý `/api/config`, `/api/health`, `/api/hoi-dap`, `/api/phien-am`; `vercel.json` khai báo `includeFiles` để hàm đọc được `data/tulieu.json` và ảnh.

Thêm biến môi trường cho Gemini (nếu dùng):

```
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

Sau khi thêm/sửa biến môi trường hoặc `vercel.json`, cần **Redeploy** (bỏ cache build) để áp dụng.

Nếu trước đó Vercel trả trang `404: NOT_FOUND`:

1. Kiểm tra **Root Directory** đang là thư mục gốc, không phải thư mục con.
2. Kiểm tra **Output Directory** đúng là `public`.
3. Bảo đảm tệp `index.html` nằm ở gốc kho mã (chữ thường).
4. Vào **Deployments → Redeploy**, chọn bỏ cache nếu cần.
5. Kiểm tra log build có dòng `Đã tạo public/ với: index.html, assets, data, images`.

Lưu ý: `public/` không nằm trong kho mã nên không thể mở trực tiếp bằng cách trỏ Vercel vào thư mục này nếu chưa chạy build.

### Triển khai máy chủ Node khác

- Cần máy chủ Node để dùng Gemini. Có thể triển khai bất kỳ dịch vụ hỗ trợ Node 20+ (Render, Railway, VPS…).
- Có thể phục vụ như trang tĩnh nếu chỉ cần tra cứu, lọc và xuất dữ liệu; khi đó trang Hỏi đáp và nút đề xuất phiên âm sẽ hiển thị trạng thái chưa sẵn sàng.
- Không đưa `.env` lên kho mã công khai. `.gitignore` đã chặn `.env`.
- Khi thay dữ liệu, không cần khởi động lại máy chủ cho phần hỏi đáp (máy chủ đọc lại tệp mỗi lần gọi), nhưng trình duyệt cần tải lại trang để thấy dữ liệu mới.

---

## 8. Thông tin sản phẩm

Sản phẩm thực tập của **Võ Đức Duy**, mã sinh viên **PH62905**, **Nhóm 2**, Chương trình Thực tập sinh **Đợt 15 FPT Polytechnic và IMTA TECH**, dự án xã hội phi lợi nhuận.
