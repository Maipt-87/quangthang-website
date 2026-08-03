# Website Công ty TNHH Thương mại Quang Thắng

Website giới thiệu doanh nghiệp cho nhà cung cấp hương liệu mỹ phẩm & thực phẩm
của hãng **Givaudan** (Thụy Sĩ) tại Việt Nam. Xây dựng bằng HTML / CSS /
JavaScript thuần — không framework, không bước build.

> **The Essence of Excellence** — Hương liệu Givaudan · Từ 1995

## Chạy thử

**Cách 1 — mở trực tiếp:** nháy đúp `index.html`. Nội dung sửa trong trang admin
lưu vào localStorage của trình duyệt.

**Cách 2 — chạy máy chủ nội bộ (khuyến nghị):**

```bash
python app.py
```

Mở <http://localhost:8000>. Ở chế độ này, nội dung sửa trong admin được lưu
xuống file `data/site-data.json` nên mọi máy truy cập đều thấy cùng dữ liệu.

## Xuất bản lên GitHub Pages

Repo này chạy được trực tiếp trên GitHub Pages (toàn bộ là file tĩnh):

1. Vào **Settings → Pages** của repo
2. Mục **Source**, chọn nhánh `main` và thư mục `/ (root)`
3. Lưu lại — sau 1–2 phút website có tại
   `https://<tên-tài-khoản>.github.io/<tên-repo>/`

Khi chạy trên GitHub Pages không có máy chủ Python, website **tự động** chuyển
sang lưu bằng localStorage — không cần sửa dòng code nào.

## Trang quản trị

Truy cập trực tiếp bằng đường dẫn `admin.html` (không có liên kết công khai
trên website, và đã chặn trong `robots.txt`). Tài khoản do người quản lý
website giữ.

Quản lý sản phẩm, nhóm sản phẩm, ứng dụng ngành, tin tức, yêu cầu liên hệ
(xuất CSV) và cấu hình website; xuất/nhập dữ liệu dạng JSON. Ảnh sản phẩm có
thể tải trực tiếp từ máy (tự nén, tự lưu vào `imagesP/` khi chạy `app.py`,
hoặc commit thẳng lên GitHub nếu đã khai báo Token trong mục Cấu hình).

**Đổi mật khẩu:** mở Console của trình duyệt tại trang admin, chạy
`QTAdminHash('mật khẩu mới')`, rồi dán chuỗi nhận được vào `PASS_HASH` trong
`js/admin.js`. Mật khẩu không bao giờ nằm nguyên văn trong mã nguồn.

⚠️ **Giới hạn của website tĩnh:** mọi kiểm tra đăng nhập đều chạy trong trình
duyệt nên về nguyên tắc có thể bị vượt qua, và API của `app.py` không yêu cầu
xác thực. Lớp này chỉ ngăn người ngoài vô tình sửa nội dung — muốn bảo mật
nghiêm túc phải chuyển xác thực về máy chủ.

## Nhận yêu cầu báo giá từ khách

Website xử lý theo thứ tự sau khi khách bấm gửi:

1. **Đã khai báo endpoint** trong admin → *Cấu hình website* → *Địa chỉ nhận
   form*: yêu cầu được gửi thẳng tới email công ty. Đây là cách duy nhất hoạt
   động trên GitHub Pages. Tạo form miễn phí tại [formspree.io](https://formspree.io),
   copy địa chỉ endpoint dạng `https://formspree.io/f/xxxxxxx` rồi dán vào.
2. **Chạy qua `app.py`**: yêu cầu lưu vào `data/site-data.json`, quản trị viên
   mở trang admin là thấy ngay ở mục *Yêu cầu liên hệ*.
3. **Không có cả hai**: website **không báo "đã gửi thành công"** mà hiển thị
   cảnh báo kèm nút gửi email đã điền sẵn toàn bộ nội dung và nút nhắn Zalo,
   để yêu cầu của khách không bị rơi vào khoảng không.

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `index.html` | Trang chủ |
| `about.html` | Về chúng tôi — câu chuyện 30 năm, dòng thời gian, chứng nhận |
| `products.html` | Danh mục sản phẩm, lọc và tìm kiếm |
| `industries.html` | Ứng dụng theo ngành, quy trình làm việc |
| `news.html` | Tin tức & xu hướng |
| `contact.html` | Liên hệ, bản đồ, form yêu cầu báo giá |
| `admin.html` | Trang quản trị nội dung |
| `css/style.css` | Toàn bộ giao diện, responsive |
| `js/data.js` | Dữ liệu dùng chung + lớp lưu trữ |
| `js/main.js` | Hiệu ứng và tương tác trang public |
| `js/admin.js` | Chức năng trang quản trị |
| `app.py` | Máy chủ nội bộ + API lưu nội dung |
| `assets/` | Logo, favicon |
| `imagesP/` | Thư viện ảnh dùng cho sản phẩm và bài viết |

## Thương hiệu

Bảng màu chủ đạo lấy tông ấm cùng họ với logo, đi từ nhạt đến đậm: salmon
`#f6c9b5` → coral `#ad4229` → poppy `#b8341e` (màu chính, dùng cho nút CTA và
tiêu đề nhấn) → nâu bơ/caramel `#6e4818` (lớp phủ ảnh banner). Toàn bộ khai
báo trong `:root` ở đầu file `css/style.css`.

## Lưu ý

Thông tin liên hệ, số liệu và ảnh sản phẩm trong dữ liệu mặc định là dữ liệu
thật của công ty. Danh mục sản phẩm và tin tức vẫn đang được bổ sung dần qua
trang admin — mở rộng thêm khi có sản phẩm/bài viết mới. Tên và nhãn hiệu
**Givaudan** thuộc quyền sở hữu của Givaudan SA; cần xác nhận với hãng về
cách dùng tên và logo trước khi công bố rộng rãi.
