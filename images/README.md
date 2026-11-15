# Thư mục ảnh

Đặt ảnh số hóa của tư liệu trong thư mục này, sau đó khai báo đường dẫn tương đối
trong trường `anh` của từng bản ghi trong `data/tulieu.json`.

## Quy ước đề nghị

- Tên tệp: `<mã bản ghi>-<số thứ tự>-<loại>.jpg`, ví dụ `VB-001-01-toan-trang.jpg`. Hồ sơ hiện tại đặt tên theo số thác bản, ví dụ `son-loi-15345.jpg`.
- Định dạng: JPG hoặc WebP. Ảnh hiển thị chính nên có cạnh dài khoảng 1400 px,
  dung lượng khoảng 1 MB để còn đọc được chữ Hán trên điện thoại.
- Ảnh thu nhỏ đặt trong `thumbs/`, rộng khoảng 420 px, dung lượng dưới 100 KB.
  Thẻ danh sách và dải ảnh chọn dùng ảnh thu nhỏ; ảnh chính mở bản đầy đủ.
- Ảnh toàn trang dùng để đối chiếu tổng thể; ảnh cận cảnh dùng để đọc rõ chữ.
- Luôn giữ bản gốc dung lượng cao ở nơi khác; thư mục này chỉ chứa bản phục vụ tra cứu.
- Không đặt ảnh do AI sinh vào thư mục này. Ứng dụng chỉ hiển thị ảnh tư liệu thật.
- Ảnh trong hồ sơ Sơn Lôi là **ảnh số hóa từ thác bản**, không phải ảnh chụp bia tại di tích; ghi rõ điều này trong `moTa` và `nguon`.

## Khai báo trong `tulieu.json`

```json
"anh": [
  {
    "tep": "images/VB-001-01-toan-trang.jpg",
    "thumb": "images/thumbs/VB-001-01-toan-trang.jpg",
    "loai": "toan-trang",
    "moTa": "Toàn trang bia mặt trước",
    "nguon": "Ảnh do Ban quản lý di tích cung cấp, chụp ngày 10/10/2026"
  },
  {
    "tep": "images/VB-001-02-can-canh.jpg",
    "thumb": "images/thumbs/VB-001-02-can-canh.jpg",
    "loai": "can-canh",
    "moTa": "Cận cảnh phần trán bia",
    "nguon": "Ảnh do Ban quản lý di tích cung cấp"
  }
]
```

`loai` nhận một trong các giá trị: `toan-trang`, `mat-sau`, `can-canh`, `khac`. Nếu bỏ trống `thumb`, ứng dụng dùng chính `tep`.
