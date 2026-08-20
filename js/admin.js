/* =========================================================================
   QUANG THANG CO.,LTD — Trang quản trị nội dung
   Thêm / sửa / xoá sản phẩm, nhóm sản phẩm, ứng dụng ngành, tin tức, xử lý
   yêu cầu liên hệ và cấu hình website. Dữ liệu lưu qua QTData (localStorage).
   ========================================================================= */
(function () {
  'use strict';

  /* Đây là lớp bảo mật THỨ HAI, chỉ để tiện dùng (nhớ 1 mật khẩu, không phải
     nhập lại UI đăng nhập lạ). Lớp bảo mật THẬT nằm ở máy chủ: file .htaccess
     ở gốc web yêu cầu HTTP Basic Auth (do Apache kiểm tra, không thể bỏ qua
     bằng cách sửa JavaScript) trước khi trình duyệt tải được admin.html —
     xem .htaccess và HUONG_DAN_BAO_MAT.md để biết cách cấu hình trên hosting.

     Mật khẩu không để nguyên văn trong mã nguồn — chỉ lưu mã băm SHA-256 của
     chuỗi 'QuangThang|<mật khẩu>'. Đổi mật khẩu: mở Console trình duyệt tại
     trang này, chạy QTAdminHash('mật khẩu mới'), dán chuỗi nhận được vào
     PASS_HASH bên dưới — VÀ nhớ tạo lại .htpasswd tương ứng trên hosting. */
  var USER = 'Quang Thang';
  var PASS_HASH = '7d07ddcff2745e62355588f104e8cc52b53fc0e13ca47523f463d32328d4b8d2';
  var SESSION_KEY = 'quangthang_admin_session';

  /** Băm mật khẩu bằng Web Crypto (khả dụng trên https và localhost). */
  function hashPassword(pw) {
    var data = new TextEncoder().encode('QuangThang|' + pw);
    if (!window.crypto || !window.crypto.subtle) return Promise.resolve(null);
    return window.crypto.subtle.digest('SHA-256', data).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    });
  }

  // Tiện ích để quản trị viên tự tạo mã băm khi đổi mật khẩu
  window.QTAdminHash = function (pw) {
    return hashPassword(pw).then(function (h) {
      console.log('PASS_HASH =', h);
      return h;
    });
  };

  var DATA = window.QTData.load();
  /* Danh sách ảnh thật trong imagesP/ để chọn khi thêm/sửa sản phẩm. */
  var IMAGE_POOL = [
    'imagesP/prod-hero.webp',
    'imagesP/prod-bloom-elegance.webp',
    'imagesP/prod-noir-intense.webp',
    'imagesP/prod-aqua-fresh.webp',
    'imagesP/prod-rose-garden.webp',
    'imagesP/prod-silk-hair.webp',
    'imagesP/prod-pearl-blossom.webp',
    'imagesP/prod-moon-light.webp',
    'imagesP/prod-emerald-woods.webp',
    'imagesP/prod-sunset-veil.webp',
    'imagesP/prod-spa-ritual.webp',
    'imagesP/prod-lavender-calm.webp',
    'imagesP/prod-warm-amber.webp',
    'imagesP/prod-tinh-dau.webp',
    'imagesP/prod-citrus-burst.webp',
    'imagesP/prod-creamy-vanilla.webp',
    'imagesP/prod-spice-master.webp',
    'imagesP/prod-savoury-blend.webp',
    'imagesP/prod-herbal-green.webp',
    'imagesP/prod-golden-curry.webp',
    'imagesP/prod-chili-paprika.webp',
    'imagesP/prod-pure-laundry.webp',
    'imagesP/prod-citrus-multiclean.webp',
    'imagesP/prod-calm-diffuser.webp',
    'imagesP/prod-strawberry-cream.webp',
    'imagesP/prod-fresh-milk.webp',
    'imagesP/prod-matcha-green.webp',
    'imagesP/prod-fruit-gummy.webp',
    'imagesP/prod-coconut-oil.webp',
    'imagesP/prod-warehouse.webp',
    'imagesP/prod-cocktail.webp'
  ];

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return iso || '';
    return d.getDate().toString().padStart(2, '0') + '/' +
      (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
  }

  function persist(msg) {
    var ok = window.QTData.save(DATA);
    toast(ok ? (msg || 'Đã lưu thay đổi.') : 'Không lưu được dữ liệu.', ok ? 'ok' : 'err');
    return ok;
  }

  var toastTimer = null;
  function toast(msg, kind) {
    var el = $('#toast');
    el.textContent = msg;
    el.className = 'toast is-visible toast--' + (kind || 'ok');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 3200);
  }

  /* ============================== ĐĂNG NHẬP =========================== */
  function initLogin() {
    var form = $('#login-form');
    var alertBox = $('#login-alert');

    if (sessionStorage.getItem(SESSION_KEY) === 'ok') return showAdmin();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var u = $('#lg-user').value.trim();
      var p = $('#lg-pass').value;
      var btn = $('button[type="submit"]', form);
      if (btn) btn.disabled = true;

      hashPassword(p).then(function (hash) {
        if (btn) btn.disabled = false;
        if (u === USER && hash === PASS_HASH) {
          sessionStorage.setItem(SESSION_KEY, 'ok');
          showAdmin();
          return;
        }
        alertBox.className = 'alert alert--err is-visible';
        alertBox.textContent = hash === null
          ? 'Trình duyệt không hỗ trợ kiểm tra mật khẩu. Hãy mở trang qua http://localhost hoặc https.'
          : 'Tên đăng nhập hoặc mật khẩu không đúng.';
        $('#lg-pass').value = '';
        $('#lg-pass').focus();
      });
    });
  }

  function showAdmin() {
    $('#login-screen').hidden = true;
    $('#login-screen').style.display = 'none';
    $('#admin-shell').hidden = false;
    render('dashboard');
  }

  function initLogout() {
    $('#logout-btn').addEventListener('click', function () {
      sessionStorage.removeItem(SESSION_KEY);
      location.reload();
    });
  }

  /* ============================== ĐIỀU HƯỚNG ========================== */
  var VIEWS = {
    dashboard: { title: 'Tổng quan', desc: 'Tình hình nội dung website và các yêu cầu mới nhất.' },
    products: { title: 'Sản phẩm', desc: 'Quản lý danh mục hương liệu hiển thị trên website.' },
    categories: { title: 'Nhóm sản phẩm', desc: 'Các nhóm dùng để phân loại và lọc sản phẩm.' },
    industries: { title: 'Ứng dụng ngành', desc: 'Nội dung khối giải pháp theo ngành sản xuất.' },
    news: { title: 'Tin tức', desc: 'Bài viết xu hướng, kiến thức ngành và tin công ty.' },
    quotes: { title: 'Yêu cầu liên hệ', desc: 'Yêu cầu báo giá và mẫu thử gửi từ trang liên hệ.' },
    settings: { title: 'Cấu hình website', desc: 'Thông tin liên hệ, nội dung hero, số liệu và đối tác.' },
    system: { title: 'Dữ liệu &amp; sao lưu', desc: 'Xuất, nhập và khôi phục toàn bộ nội dung website.' }
  };

  function initNav() {
    $$('.admin-nav button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.admin-nav button').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        render(btn.getAttribute('data-view'));
      });
    });
  }

  function render(view) {
    var meta = VIEWS[view] || VIEWS.dashboard;
    $('#view-title').textContent = meta.title.replace('&amp;', '&');
    $('#view-desc').textContent = meta.desc;
    $('#view-actions').innerHTML = '';
    updateBadge();

    switch (view) {
      case 'products': return viewProducts();
      case 'categories': return viewCategories();
      case 'industries': return viewIndustries();
      case 'news': return viewNews();
      case 'quotes': return viewQuotes();
      case 'settings': return viewSettings();
      case 'system': return viewSystem();
      default: return viewDashboard();
    }
  }

  function updateBadge() {
    var n = DATA.quotes.filter(function (q) { return q.status === 'Mới'; }).length;
    var el = $('#quote-badge');
    if (el) el.innerHTML = n ? '<span class="tag tag--solid" style="margin-left:.3rem">' + n + '</span>' : '';
  }

  function setActions(html) {
    $('#view-actions').innerHTML = html;
  }

  /* ============================== TỔNG QUAN =========================== */
  /* Rà soát nội dung còn là dữ liệu mẫu / còn thiếu trước khi đưa website ra
     công khai. Đăng thông tin bịa lên tên miền thật là rủi ro pháp lý thật. */
  function goLiveIssues() {
    var s = DATA.settings;
    var issues = [];
    var placeholder = function (v) { return String(v || '').indexOf('[CẬP NHẬT]') !== -1; };

    // Mã số thuế không nằm trong danh sách bắt buộc — công ty chủ động chọn để trống
    [['Số điện thoại bàn', s.phone], ['Hotline', s.hotline],
     ['Địa chỉ', s.address], ['Email', s.email]].forEach(function (p) {
      if (!String(p[1] || '').trim()) issues.push({ m: 'Chưa điền: ' + p[0], lv: 'cao' });
      else if (placeholder(p[1])) issues.push({ m: 'Còn là dữ liệu mẫu: ' + p[0], lv: 'cao' });
    });

    if (!String(s.zalo || '').trim()) issues.push({ m: 'Chưa có số Zalo (nút Zalo đang bị ẩn)', lv: 'thap' });

    DATA.certificates.forEach(function (c) {
      if (placeholder(c.name)) issues.push({ m: 'Chứng nhận "' + c.name + '" chưa thay bằng chứng nhận thật', lv: 'cao' });
    });

    if (!s.formEndpoint && window.QTData.storageInfo().mode !== 'server') {
      issues.push({ m: 'Chưa khai báo địa chỉ nhận form — yêu cầu của khách sẽ KHÔNG tới hộp thư công ty', lv: 'cao' });
    }

    issues.push({ m: 'Thay ' + DATA.products.length + ' sản phẩm mẫu bằng danh mục hương thật đang phân phối', lv: 'vua' });
    issues.push({ m: 'Thay ' + DATA.news.length + ' bài viết mẫu bằng tin thật của công ty', lv: 'vua' });
    issues.push({ m: 'Xác nhận với Givaudan về việc dùng tên hãng và cụm "nhà phân phối độc quyền Hoá mỹ phẩm"', lv: 'cao' });

    return issues;
  }

  function viewDashboard() {
    var newQuotes = DATA.quotes.filter(function (q) { return q.status === 'Mới'; }).length;
    var issues = goLiveIssues();
    var high = issues.filter(function (i) { return i.lv === 'cao'; }).length;
    var body = '' +
      '<div class="panel" style="border-left:4px solid ' + (high ? 'var(--red)' : 'var(--sage-500)') + '">' +
        '<div class="panel__head"><h2>Trước khi đưa website ra công khai</h2>' +
          '<span class="tag' + (high ? ' tag--red' : '') + '">' + issues.length + ' việc · ' + high + ' quan trọng</span></div>' +
        '<ul class="check-list" style="margin:0">' +
          issues.map(function (i) {
            var color = i.lv === 'cao' ? 'var(--red)' : (i.lv === 'vua' ? 'var(--ink)' : 'var(--muted)');
            return '<li style="color:' + color + '">' + esc(i.m) + '</li>';
          }).join('') +
        '</ul>' +
      '</div>' +
      '<div class="kpi-grid">' +
        '<div class="kpi"><b>' + DATA.products.length + '</b><span>Sản phẩm đang hiển thị</span></div>' +
        '<div class="kpi"><b>' + newQuotes + '</b><span>Yêu cầu chưa xử lý</span></div>' +
        '<div class="kpi"><b>' + DATA.news.length + '</b><span>Bài viết tin tức</span></div>' +
        '<div class="kpi"><b>' + DATA.categories.length + '</b><span>Nhóm sản phẩm</span></div>' +
      '</div>' +

      '<div class="panel">' +
        '<div class="panel__head"><h2>Lượt truy cập website</h2></div>' +
        '<p class="form-note">Website đã cài sẵn Google Analytics — số liệu khách truy cập thật ' +
          '(đang online, lượt xem trang, nguồn traffic...) được đo trực tiếp trên trình duyệt khách và ' +
          'xem chính xác nhất tại Google Analytics, thay vì đếm lại bằng code admin (dễ sai lệch vì ' +
          'website không có máy chủ chạy thường trực để đếm khách thật trên mọi thiết bị).</p>' +
        '<a class="btn btn--primary btn--sm" href="https://analytics.google.com/" target="_blank" rel="noopener">Mở Google Analytics ↗</a>' +
      '</div>' +

      '<div class="panel">' +
        '<div class="panel__head"><h2>Yêu cầu liên hệ mới nhất</h2>' +
          '<button class="btn btn--sm btn--outline" type="button" data-goto="quotes">Xem tất cả</button></div>' +
        (DATA.quotes.length ? tableQuotes(DATA.quotes.slice(0, 5)) :
          '<p class="form-note">Chưa có yêu cầu nào. Hãy thử gửi một yêu cầu từ trang Liên hệ để xem nó xuất hiện ở đây.</p>') +
      '</div>' +

      '<div class="panel">' +
        '<div class="panel__head"><h2>Sản phẩm nổi bật trên trang chủ</h2>' +
          '<button class="btn btn--sm btn--outline" type="button" data-goto="products">Quản lý sản phẩm</button></div>' +
        '<div class="table-wrap"><table class="data"><thead><tr><th>Ảnh</th><th>Mã</th><th>Tên</th><th>Nhóm</th></tr></thead><tbody>' +
        DATA.products.filter(function (p) { return p.featured; }).map(function (p) {
          return '<tr><td><img class="thumb" src="' + esc(p.image) + '" alt=""></td><td>' + esc(p.id) +
            '</td><td>' + esc(p.name) + '</td><td>' + esc(catName(p.category)) + '</td></tr>';
        }).join('') +
        '</tbody></table></div>' +
      '</div>';

    $('#view-body').innerHTML = body;

    $$('[data-goto]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-goto');
        $$('.admin-nav button').forEach(function (x) {
          x.classList.toggle('is-active', x.getAttribute('data-view') === v);
        });
        render(v);
      });
    });
    bindQuoteRows();
  }

  function catName(id) {
    var c = DATA.categories.filter(function (x) { return x.id === id; })[0];
    return c ? c.name : id;
  }

  /* =============================== SẢN PHẨM =========================== */
  function viewProducts() {
    setActions('<button class="btn btn--primary btn--sm" type="button" id="add-product">+ Thêm sản phẩm</button>');

    $('#view-body').innerHTML = '' +
      '<div class="panel">' +
        '<div class="panel__head">' +
          '<div class="search-box" style="flex:0 1 320px"><input type="search" id="admin-prod-search" placeholder="Tìm theo tên, mã, ứng dụng..."></div>' +
          '<span class="form-note" id="prod-count"></span>' +
        '</div>' +
        '<div class="table-wrap" id="prod-table"></div>' +
      '</div>';

    var search = $('#admin-prod-search');

    function draw() {
      var q = search.value.trim().toLowerCase();
      var list = DATA.products.filter(function (p) {
        if (!q) return true;
        return (p.name + ' ' + p.id + ' ' + p.app + ' ' + p.desc).toLowerCase().indexOf(q) !== -1;
      });
      $('#prod-count').textContent = list.length + ' / ' + DATA.products.length + ' sản phẩm';
      $('#prod-table').innerHTML = list.length ? '' +
        '<table class="data"><thead><tr>' +
          '<th>Ảnh</th><th>Mã</th><th>Tên sản phẩm</th><th>Nhóm</th><th>Ứng dụng</th><th>Nổi bật</th><th></th>' +
        '</tr></thead><tbody>' +
        list.map(function (p) {
          return '<tr>' +
            '<td><img class="thumb" src="' + esc(p.image) + '" alt=""></td>' +
            '<td><b>' + esc(p.id) + '</b></td>' +
            '<td>' + esc(p.name) + '</td>' +
            '<td>' + esc(catName(p.category)) + '</td>' +
            '<td>' + esc(p.app) + '</td>' +
            '<td>' + (p.featured ? '<span class="tag tag--red">Có</span>' : '<span class="tag">Không</span>') + '</td>' +
            '<td><div class="row-actions">' +
              '<button class="btn-icon" type="button" data-edit-prod="' + esc(p.id) + '">Sửa</button>' +
              '<button class="btn-icon btn-icon--danger" type="button" data-del-prod="' + esc(p.id) + '">Xoá</button>' +
            '</div></td>' +
          '</tr>';
        }).join('') + '</tbody></table>'
        : '<p class="form-note">Không có sản phẩm khớp từ khoá.</p>';

      $$('[data-edit-prod]').forEach(function (b) {
        b.addEventListener('click', function () { formProduct(b.getAttribute('data-edit-prod')); });
      });
      $$('[data-del-prod]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-del-prod');
          var p = DATA.products.filter(function (x) { return x.id === id; })[0];
          if (!confirm('Xoá sản phẩm "' + (p ? p.name : id) + '" (' + id + ')?\nThao tác này không thể hoàn lại.')) return;
          DATA.products = DATA.products.filter(function (x) { return x.id !== id; });
          persist('Đã xoá sản phẩm ' + id + '.');
          draw();
        });
      });
    }

    search.addEventListener('input', draw);
    $('#add-product').addEventListener('click', function () { formProduct(null); });
    draw();
    window.__redrawProducts = draw;
  }

  function formProduct(id) {
    var p = id ? DATA.products.filter(function (x) { return x.id === id; })[0] : null;
    var isNew = !p;
    if (isNew) {
      p = { id: '', name: '', category: DATA.categories[0] ? DATA.categories[0].id : 'personal-care', app: '', image: IMAGE_POOL[0], origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: '', packing: '', desc: '', notes: [], featured: false };
    }

    openModal('' +
      '<button type="button" class="modal__close" aria-label="Đóng">×</button>' +
      '<div class="modal__body">' +
        '<h2>' + (isNew ? 'Thêm sản phẩm' : 'Sửa sản phẩm ' + esc(p.id)) + '</h2>' +
        '<form id="prod-form" novalidate><div class="form-grid">' +
          field('Mã sản phẩm *', '<input type="text" name="id" value="' + esc(p.id) + '" placeholder="VD: QT-C111" required>') +
          field('Tên sản phẩm *', '<input type="text" name="name" value="' + esc(p.name) + '" required>') +
          field('Nhóm sản phẩm *', '<select name="category">' + DATA.categories.map(function (c) {
            return '<option value="' + esc(c.id) + '"' + (c.id === p.category ? ' selected' : '') + '>' + esc(c.name) + '</option>';
          }).join('') + '</select>') +
          field('Ứng dụng *', '<input type="text" name="app" value="' + esc(p.app) + '" placeholder="VD: Nước hoa, Đồ uống..." required>') +
          field('Nhà sản xuất', '<input type="text" name="origin" value="' + esc(p.origin) + '">') +
          field('Dạng sản phẩm', '<input type="text" name="form" value="' + esc(p.form) + '">') +
          field('Liều dùng đề nghị', '<input type="text" name="dosage" value="' + esc(p.dosage) + '" placeholder="VD: 0.5 – 2%">') +
          field('Quy cách đóng gói', '<input type="text" name="packing" value="' + esc(p.packing) + '">') +
          field('Mô tả *', '<textarea name="desc" required style="min-height:100px">' + esc(p.desc) + '</textarea>', true) +
          field('Đặc điểm hương (mỗi dòng một ý)', '<textarea name="notes" style="min-height:90px">' + esc((p.notes || []).join('\n')) + '</textarea>', true) +
          field('Ảnh sản phẩm', imagePicker(p.image), true) +
          '<div class="field field--full"><div class="switch-row"><input type="checkbox" name="featured" id="pf-featured"' + (p.featured ? ' checked' : '') + '><label for="pf-featured" style="margin:0">Hiển thị ở khối “Sản phẩm nổi bật” trên trang chủ</label></div></div>' +
          '<div class="field field--full" style="flex-direction:row;gap:.6rem">' +
            '<button class="btn btn--primary" type="submit">' + (isNew ? 'Thêm sản phẩm' : 'Lưu thay đổi') + '</button>' +
            '<button class="btn btn--outline" type="button" data-close>Huỷ</button>' +
          '</div>' +
        '</div></form>' +
      '</div>');

    bindImagePicker();

    $('#prod-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var newId = String(fd.get('id')).trim();

      if (!newId || !String(fd.get('name')).trim() || !String(fd.get('app')).trim() || !String(fd.get('desc')).trim()) {
        return toast('Vui lòng điền đủ các trường có dấu *.', 'err');
      }
      var dup = DATA.products.filter(function (x) { return x.id === newId && x.id !== (id || ''); }).length;
      if (dup) return toast('Mã sản phẩm "' + newId + '" đã tồn tại.', 'err');

      var record = {
        id: newId,
        name: String(fd.get('name')).trim(),
        category: fd.get('category'),
        app: String(fd.get('app')).trim(),
        image: $('input[name="image"]', e.target) ? $('input[name="image"]', e.target).value : p.image,
        origin: String(fd.get('origin') || '').trim(),
        form: String(fd.get('form') || '').trim(),
        dosage: String(fd.get('dosage') || '').trim(),
        packing: String(fd.get('packing') || '').trim(),
        desc: String(fd.get('desc')).trim(),
        notes: String(fd.get('notes') || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
        featured: !!fd.get('featured')
      };

      if (isNew) DATA.products.unshift(record);
      else DATA.products = DATA.products.map(function (x) { return x.id === id ? record : x; });

      persist(isNew ? 'Đã thêm sản phẩm ' + record.id + '.' : 'Đã cập nhật sản phẩm ' + record.id + '.');
      closeModal();
      if (window.__redrawProducts) window.__redrawProducts();
    });
  }

  /* ============================ NHÓM SẢN PHẨM ========================= */
  function viewCategories() {
    setActions('<button class="btn btn--primary btn--sm" type="button" id="add-cat">+ Thêm nhóm</button>');

    function draw() {
      $('#view-body').innerHTML = '' +
        '<div class="panel"><div class="table-wrap"><table class="data"><thead><tr>' +
        '<th>Ảnh</th><th>Mã nhóm</th><th>Tên nhóm</th><th>Mô tả</th><th>Sản phẩm</th><th></th>' +
        '</tr></thead><tbody>' +
        DATA.categories.map(function (c) {
          var count = DATA.products.filter(function (p) { return p.category === c.id; }).length;
          return '<tr>' +
            '<td><img class="thumb" src="' + esc(c.image) + '" alt=""></td>' +
            '<td><b>' + esc(c.id) + '</b></td>' +
            '<td>' + esc(c.name) + '</td>' +
            '<td style="max-width:340px">' + esc(c.desc) + '</td>' +
            '<td>' + count + '</td>' +
            '<td><div class="row-actions">' +
              '<button class="btn-icon" type="button" data-edit-cat="' + esc(c.id) + '">Sửa</button>' +
              '<button class="btn-icon btn-icon--danger" type="button" data-del-cat="' + esc(c.id) + '">Xoá</button>' +
            '</div></td></tr>';
        }).join('') +
        '</tbody></table></div>' +
        '<p class="form-note" style="margin-top:1rem">Không thể xoá nhóm đang có sản phẩm — hãy chuyển sản phẩm sang nhóm khác trước.</p>' +
        '</div>';

      $$('[data-edit-cat]').forEach(function (b) {
        b.addEventListener('click', function () { formCategory(b.getAttribute('data-edit-cat'), draw); });
      });
      $$('[data-del-cat]').forEach(function (b) {
        b.addEventListener('click', function () {
          var cid = b.getAttribute('data-del-cat');
          var used = DATA.products.filter(function (p) { return p.category === cid; }).length;
          if (used) return toast('Nhóm này còn ' + used + ' sản phẩm, không thể xoá.', 'err');
          if (!confirm('Xoá nhóm sản phẩm "' + cid + '"?')) return;
          DATA.categories = DATA.categories.filter(function (c) { return c.id !== cid; });
          persist('Đã xoá nhóm ' + cid + '.');
          draw();
        });
      });
    }

    draw();
    $('#add-cat').addEventListener('click', function () { formCategory(null, draw); });
  }

  function formCategory(id, done) {
    var c = id ? DATA.categories.filter(function (x) { return x.id === id; })[0] : null;
    var isNew = !c;
    if (isNew) c = { id: '', name: '', desc: '', image: IMAGE_POOL[0] };

    openModal('' +
      '<button type="button" class="modal__close" aria-label="Đóng">×</button>' +
      '<div class="modal__body">' +
        '<h2>' + (isNew ? 'Thêm nhóm sản phẩm' : 'Sửa nhóm ' + esc(c.name)) + '</h2>' +
        '<form id="cat-form" novalidate><div class="form-grid">' +
          field('Mã nhóm *', '<input type="text" name="id" value="' + esc(c.id) + '" placeholder="VD: homecare"' + (isNew ? '' : ' readonly') + ' required>') +
          field('Tên nhóm *', '<input type="text" name="name" value="' + esc(c.name) + '" required>') +
          field('Mô tả', '<textarea name="desc" style="min-height:90px">' + esc(c.desc) + '</textarea>', true) +
          field('Ảnh đại diện', imagePicker(c.image), true) +
          '<div class="field field--full" style="flex-direction:row;gap:.6rem">' +
            '<button class="btn btn--primary" type="submit">' + (isNew ? 'Thêm nhóm' : 'Lưu thay đổi') + '</button>' +
            '<button class="btn btn--outline" type="button" data-close>Huỷ</button>' +
          '</div>' +
        '</div></form></div>');

    bindImagePicker();

    $('#cat-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var cid = String(fd.get('id')).trim().toLowerCase().replace(/\s+/g, '-');
      if (!cid || !String(fd.get('name')).trim()) return toast('Vui lòng điền mã nhóm và tên nhóm.', 'err');
      if (isNew && DATA.categories.some(function (x) { return x.id === cid; })) {
        return toast('Mã nhóm "' + cid + '" đã tồn tại.', 'err');
      }
      var record = {
        id: cid,
        name: String(fd.get('name')).trim(),
        desc: String(fd.get('desc') || '').trim(),
        image: $('input[name="image"]', e.target).value
      };
      if (isNew) DATA.categories.push(record);
      else DATA.categories = DATA.categories.map(function (x) { return x.id === id ? record : x; });
      persist(isNew ? 'Đã thêm nhóm sản phẩm.' : 'Đã cập nhật nhóm sản phẩm.');
      closeModal();
      done();
    });
  }

  /* =========================== ỨNG DỤNG NGÀNH ========================= */
  function viewIndustries() {
    setActions('<button class="btn btn--primary btn--sm" type="button" id="add-ind">+ Thêm ngành</button>');

    function draw() {
      $('#view-body').innerHTML = '' +
        '<div class="panel"><div class="table-wrap"><table class="data"><thead><tr>' +
        '<th>Ảnh</th><th>Tên ngành</th><th>Mô tả</th><th>Hạng mục</th><th></th>' +
        '</tr></thead><tbody>' +
        DATA.industries.map(function (ind) {
          return '<tr>' +
            '<td><img class="thumb" src="' + esc(ind.image) + '" alt=""></td>' +
            '<td><b>' + esc(ind.name) + '</b></td>' +
            '<td style="max-width:360px">' + esc(ind.desc) + '</td>' +
            '<td>' + ind.items.length + '</td>' +
            '<td><div class="row-actions">' +
              '<button class="btn-icon" type="button" data-edit-ind="' + esc(ind.id) + '">Sửa</button>' +
              '<button class="btn-icon btn-icon--danger" type="button" data-del-ind="' + esc(ind.id) + '">Xoá</button>' +
            '</div></td></tr>';
        }).join('') + '</tbody></table></div></div>';

      $$('[data-edit-ind]').forEach(function (b) {
        b.addEventListener('click', function () { formIndustry(b.getAttribute('data-edit-ind'), draw); });
      });
      $$('[data-del-ind]').forEach(function (b) {
        b.addEventListener('click', function () {
          var iid = b.getAttribute('data-del-ind');
          if (!confirm('Xoá khối ứng dụng ngành này?')) return;
          DATA.industries = DATA.industries.filter(function (x) { return x.id !== iid; });
          persist('Đã xoá khối ứng dụng.');
          draw();
        });
      });
    }

    draw();
    $('#add-ind').addEventListener('click', function () { formIndustry(null, draw); });
  }

  function formIndustry(id, done) {
    var ind = id ? DATA.industries.filter(function (x) { return x.id === id; })[0] : null;
    var isNew = !ind;
    if (isNew) ind = { id: '', name: '', desc: '', image: IMAGE_POOL[7], items: [] };

    openModal('' +
      '<button type="button" class="modal__close" aria-label="Đóng">×</button>' +
      '<div class="modal__body">' +
        '<h2>' + (isNew ? 'Thêm ứng dụng ngành' : 'Sửa: ' + esc(ind.name)) + '</h2>' +
        '<form id="ind-form" novalidate><div class="form-grid">' +
          field('Mã (dùng cho liên kết) *', '<input type="text" name="id" value="' + esc(ind.id) + '" placeholder="VD: pet-food" required>') +
          field('Tên ngành *', '<input type="text" name="name" value="' + esc(ind.name) + '" required>') +
          field('Mô tả', '<textarea name="desc" style="min-height:90px">' + esc(ind.desc) + '</textarea>', true) +
          field('Hạng mục sản phẩm (mỗi dòng một ý)', '<textarea name="items" style="min-height:100px">' + esc(ind.items.join('\n')) + '</textarea>', true) +
          field('Ảnh đại diện', imagePicker(ind.image), true) +
          '<div class="field field--full" style="flex-direction:row;gap:.6rem">' +
            '<button class="btn btn--primary" type="submit">' + (isNew ? 'Thêm' : 'Lưu thay đổi') + '</button>' +
            '<button class="btn btn--outline" type="button" data-close>Huỷ</button>' +
          '</div>' +
        '</div></form></div>');

    bindImagePicker();

    $('#ind-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var iid = String(fd.get('id')).trim().toLowerCase().replace(/\s+/g, '-');
      if (!iid || !String(fd.get('name')).trim()) return toast('Vui lòng điền mã và tên ngành.', 'err');
      var record = {
        id: iid,
        name: String(fd.get('name')).trim(),
        desc: String(fd.get('desc') || '').trim(),
        image: $('input[name="image"]', e.target).value,
        items: String(fd.get('items') || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean)
      };
      if (isNew) DATA.industries.push(record);
      else DATA.industries = DATA.industries.map(function (x) { return x.id === id ? record : x; });
      persist('Đã lưu khối ứng dụng ngành.');
      closeModal();
      done();
    });
  }

  /* =============================== TIN TỨC ============================ */
  function viewNews() {
    setActions('<button class="btn btn--primary btn--sm" type="button" id="add-news">+ Viết bài mới</button>');

    function draw() {
      var list = DATA.news.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
      $('#view-body').innerHTML = '' +
        '<div class="panel"><div class="table-wrap"><table class="data"><thead><tr>' +
        '<th>Ảnh</th><th>Tiêu đề</th><th>Chuyên mục</th><th>Ngày</th><th></th>' +
        '</tr></thead><tbody>' +
        list.map(function (n) {
          return '<tr>' +
            '<td><img class="thumb" src="' + esc(n.image) + '" alt=""></td>' +
            '<td style="max-width:400px"><b>' + esc(n.title) + '</b></td>' +
            '<td><span class="tag">' + esc(n.category) + '</span></td>' +
            '<td>' + formatDate(n.date) + '</td>' +
            '<td><div class="row-actions">' +
              '<button class="btn-icon" type="button" data-edit-news="' + esc(n.id) + '">Sửa</button>' +
              '<button class="btn-icon btn-icon--danger" type="button" data-del-news="' + esc(n.id) + '">Xoá</button>' +
            '</div></td></tr>';
        }).join('') + '</tbody></table></div></div>';

      $$('[data-edit-news]').forEach(function (b) {
        b.addEventListener('click', function () { formNews(b.getAttribute('data-edit-news'), draw); });
      });
      $$('[data-del-news]').forEach(function (b) {
        b.addEventListener('click', function () {
          var nid = b.getAttribute('data-del-news');
          if (!confirm('Xoá bài viết này?')) return;
          DATA.news = DATA.news.filter(function (x) { return x.id !== nid; });
          persist('Đã xoá bài viết.');
          draw();
        });
      });
    }

    draw();
    $('#add-news').addEventListener('click', function () { formNews(null, draw); });
  }

  function formNews(id, done) {
    var n = id ? DATA.news.filter(function (x) { return x.id === id; })[0] : null;
    var isNew = !n;
    if (isNew) {
      n = { id: 'n' + Date.now(), title: '', date: new Date().toISOString().slice(0, 10), category: 'Xu hướng', image: IMAGE_POOL[1], excerpt: '', content: '' };
    }

    openModal('' +
      '<button type="button" class="modal__close" aria-label="Đóng">×</button>' +
      '<div class="modal__body">' +
        '<h2>' + (isNew ? 'Viết bài mới' : 'Sửa bài viết') + '</h2>' +
        '<form id="news-form" novalidate><div class="form-grid">' +
          field('Tiêu đề *', '<input type="text" name="title" value="' + esc(n.title) + '" required>', true) +
          field('Chuyên mục', '<input type="text" name="category" value="' + esc(n.category) + '" list="news-cats"><datalist id="news-cats"><option>Xu hướng</option><option>Tin công ty</option><option>Kiến thức</option></datalist>') +
          field('Ngày đăng', '<input type="date" name="date" value="' + esc(n.date) + '">') +
          field('Mô tả ngắn *', '<textarea name="excerpt" required style="min-height:80px">' + esc(n.excerpt) + '</textarea>', true) +
          field('Nội dung (mỗi đoạn cách nhau một dòng trống)', '<textarea name="content" style="min-height:160px">' + esc(n.content || '') + '</textarea>', true) +
          field('Ảnh bài viết', imagePicker(n.image), true) +
          '<div class="field field--full" style="flex-direction:row;gap:.6rem">' +
            '<button class="btn btn--primary" type="submit">' + (isNew ? 'Đăng bài' : 'Lưu thay đổi') + '</button>' +
            '<button class="btn btn--outline" type="button" data-close>Huỷ</button>' +
          '</div>' +
        '</div></form></div>');

    bindImagePicker();

    $('#news-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      if (!String(fd.get('title')).trim() || !String(fd.get('excerpt')).trim()) {
        return toast('Vui lòng nhập tiêu đề và mô tả ngắn.', 'err');
      }
      var record = {
        id: n.id,
        title: String(fd.get('title')).trim(),
        category: String(fd.get('category') || 'Tin công ty').trim(),
        date: fd.get('date') || new Date().toISOString().slice(0, 10),
        image: $('input[name="image"]', e.target).value,
        excerpt: String(fd.get('excerpt')).trim(),
        content: String(fd.get('content') || '').trim()
      };
      if (isNew) DATA.news.unshift(record);
      else DATA.news = DATA.news.map(function (x) { return x.id === id ? record : x; });
      persist(isNew ? 'Đã đăng bài viết.' : 'Đã cập nhật bài viết.');
      closeModal();
      done();
    });
  }

  /* ========================== YÊU CẦU LIÊN HỆ ========================= */
  function tableQuotes(list) {
    return '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>Mã</th><th>Người gửi</th><th>Liên hệ</th><th>Loại</th><th>Sản phẩm</th><th>Ngày</th><th>Trạng thái</th><th></th>' +
      '</tr></thead><tbody>' +
      list.map(function (q) {
        return '<tr>' +
          '<td><b>' + esc(q.id) + '</b></td>' +
          '<td>' + esc(q.name) + (q.company ? '<br><span class="form-note">' + esc(q.company) + '</span>' : '') + '</td>' +
          '<td><span class="form-note">' + esc(q.email) + '<br>' + esc(q.phone) + '</span></td>' +
          '<td>' + esc(q.type) + '</td>' +
          '<td>' + esc(q.product || '—') + '</td>' +
          '<td>' + formatDate(q.createdAt) + '</td>' +
          '<td><span class="tag' + (q.status === 'Mới' ? ' tag--red' : '') + '">' + esc(q.status) + '</span></td>' +
          '<td><div class="row-actions">' +
            '<button class="btn-icon" type="button" data-view-quote="' + esc(q.id) + '">Xem</button>' +
            '<button class="btn-icon btn-icon--danger" type="button" data-del-quote="' + esc(q.id) + '">Xoá</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function viewQuotes() {
    setActions(DATA.quotes.length
      ? '<button class="btn btn--outline btn--sm" type="button" id="export-quotes">Xuất CSV</button>' +
        '<button class="btn btn--outline btn--sm" type="button" id="clear-quotes">Xoá tất cả</button>'
      : '');

    $('#view-body').innerHTML = DATA.quotes.length
      ? '<div class="panel">' + tableQuotes(DATA.quotes) + '</div>'
      : '<div class="panel"><div class="empty-state"><strong>Chưa có yêu cầu nào</strong>' +
        'Các yêu cầu báo giá / mẫu thử gửi từ trang Liên hệ sẽ xuất hiện tại đây.</div></div>';

    bindQuoteRows();

    var exp = $('#export-quotes');
    if (exp) exp.addEventListener('click', exportQuotesCSV);
    var clr = $('#clear-quotes');
    if (clr) clr.addEventListener('click', function () {
      if (!confirm('Xoá toàn bộ ' + DATA.quotes.length + ' yêu cầu liên hệ?')) return;
      DATA.quotes = [];
      persist('Đã xoá toàn bộ yêu cầu.');
      render('quotes');
    });
  }

  function bindQuoteRows() {
    $$('[data-view-quote]').forEach(function (b) {
      b.addEventListener('click', function () { showQuote(b.getAttribute('data-view-quote')); });
    });
    $$('[data-del-quote]').forEach(function (b) {
      b.addEventListener('click', function () {
        var qid = b.getAttribute('data-del-quote');
        if (!confirm('Xoá yêu cầu ' + qid + '?')) return;
        DATA.quotes = DATA.quotes.filter(function (x) { return x.id !== qid; });
        persist('Đã xoá yêu cầu ' + qid + '.');
        render('quotes');
      });
    });
  }

  function showQuote(id) {
    var q = DATA.quotes.filter(function (x) { return x.id === id; })[0];
    if (!q) return;

    openModal('' +
      '<button type="button" class="modal__close" aria-label="Đóng">×</button>' +
      '<div class="modal__body">' +
        '<span class="tag' + (q.status === 'Mới' ? ' tag--red' : '') + '">' + esc(q.status) + '</span>' +
        '<h2 style="margin-top:.7rem">' + esc(q.type) + ' — ' + esc(q.id) + '</h2>' +
        '<table class="spec-table"><tbody>' +
          '<tr><th>Người gửi</th><td>' + esc(q.name) + '</td></tr>' +
          '<tr><th>Công ty</th><td>' + esc(q.company || '—') + '</td></tr>' +
          '<tr><th>Email</th><td><a href="mailto:' + esc(q.email) + '">' + esc(q.email) + '</a></td></tr>' +
          '<tr><th>Điện thoại</th><td><a href="tel:' + esc(q.phone) + '">' + esc(q.phone) + '</a></td></tr>' +
          '<tr><th>Sản phẩm quan tâm</th><td>' + esc(q.product || '—') + '</td></tr>' +
          '<tr><th>Số lượng dự kiến</th><td>' + esc(q.quantity || '—') + '</td></tr>' +
          '<tr><th>Thời gian gửi</th><td>' + formatDate(q.createdAt) + '</td></tr>' +
        '</tbody></table>' +
        '<h3 style="font-size:1rem">Nội dung</h3>' +
        '<p style="white-space:pre-wrap">' + esc(q.message) + '</p>' +
        '<div class="field" style="max-width:260px;margin:1.2rem 0">' +
          '<label for="q-status">Trạng thái xử lý</label>' +
          '<select id="q-status">' +
            ['Mới', 'Đang xử lý', 'Đã báo giá', 'Đã gửi mẫu', 'Hoàn tất', 'Từ chối'].map(function (s) {
              return '<option' + (s === q.status ? ' selected' : '') + '>' + s + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div style="display:flex;gap:.6rem;flex-wrap:wrap">' +
          '<button class="btn btn--primary btn--sm" type="button" id="save-status">Cập nhật trạng thái</button>' +
          '<a class="btn btn--outline btn--sm" href="mailto:' + esc(q.email) + '?subject=' +
            encodeURIComponent('Phản hồi yêu cầu ' + q.id + ' — Quang Thắng Co.,Ltd') + '">Trả lời qua email</a>' +
        '</div>' +
      '</div>');

    $('#save-status').addEventListener('click', function () {
      var val = $('#q-status').value;
      DATA.quotes = DATA.quotes.map(function (x) {
        if (x.id === id) x.status = val;
        return x;
      });
      persist('Đã cập nhật trạng thái yêu cầu ' + id + '.');
      closeModal();
      render('quotes');
    });
  }

  function exportQuotesCSV() {
    var head = ['Mã', 'Ngày', 'Trạng thái', 'Loại', 'Họ tên', 'Công ty', 'Email', 'Điện thoại', 'Sản phẩm', 'Số lượng', 'Nội dung'];
    var rows = DATA.quotes.map(function (q) {
      return [q.id, formatDate(q.createdAt), q.status, q.type, q.name, q.company, q.email, q.phone, q.product, q.quantity, q.message];
    });
    var csv = [head].concat(rows).map(function (r) {
      return r.map(function (cell) {
        return '"' + String(cell == null ? '' : cell).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
      }).join(',');
    }).join('\r\n');
    download('yeu-cau-lien-he-' + new Date().toISOString().slice(0, 10) + '.csv', '﻿' + csv, 'text/csv;charset=utf-8');
    toast('Đã xuất file CSV.');
  }

  /* =========================== CẤU HÌNH WEBSITE ======================= */
  function viewSettings() {
    var s = DATA.settings;

    $('#view-body').innerHTML = '' +
      '<form id="settings-form">' +

      '<div class="panel"><h2>Thông tin doanh nghiệp</h2><div class="form-grid">' +
        field('Tên công ty', '<input type="text" name="companyName" value="' + esc(s.companyName) + '">', true) +
        field('Địa chỉ', '<input type="text" name="address" value="' + esc(s.address) + '">', true) +
        field('Email', '<input type="email" name="email" value="' + esc(s.email) + '">') +
        field('Mã số thuế', '<input type="text" name="taxCode" value="' + esc(s.taxCode) + '">') +
        field('Điện thoại', '<input type="text" name="phone" value="' + esc(s.phone) + '">') +
        field('Hotline', '<input type="text" name="hotline" value="' + esc(s.hotline) + '">') +
        field('Số Zalo', '<input type="text" name="zalo" value="' + esc(s.zalo) + '">') +
        field('Giờ làm việc (mỗi dòng hiển thị một dòng riêng)', '<textarea name="workingHours" rows="2" style="min-height:auto">' + esc(s.workingHours) + '</textarea>') +
        field('Link nhúng Google Maps', '<input type="text" name="mapEmbed" value="' + esc(s.mapEmbed) + '">', true) +
        field('Địa chỉ nhận form liên hệ (endpoint)',
          '<input type="url" name="formEndpoint" value="' + esc(s.formEndpoint || '') +
          '" placeholder="https://formspree.io/f/xxxxxxx">', true) +
        field('Địa chỉ nhận riêng cho "Yêu cầu báo giá" (không bắt buộc)',
          '<input type="url" name="quoteFormEndpoint" value="' + esc(s.quoteFormEndpoint || '') +
          '" placeholder="https://formspree.io/f/yyyyyyy">', true) +
      '</div>' +
      '<p class="form-note">Để trống ô "báo giá" ở trên thì loại yêu cầu này vẫn dùng chung endpoint ' +
      'chính. Muốn yêu cầu báo giá vào thẳng hộp thư một nhân sự cụ thể (VD: mai.pham@quangthang.vn), ' +
      'tạo thêm 1 form Formspree thứ hai (miễn phí) với email nhận là hộp thư đó, rồi dán endpoint vào ô này.</p>' +
      '<p class="form-note"><b>Quan trọng khi website chạy trên hosting hiện tại (không có máy chủ backend):</b> ' +
      'nếu để trống ô này, yêu cầu của khách chỉ nằm trong trình duyệt của chính họ và ' +
      '<b>không đến được hộp thư công ty</b>. Hãy tạo một form miễn phí tại ' +
      '<a href="https://formspree.io" target="_blank" rel="noopener">formspree.io</a> ' +
      '(hoặc dịch vụ tương tự) rồi dán địa chỉ endpoint vào đây — yêu cầu sẽ được gửi thẳng tới ' +
      esc(s.email) + '. Khi chạy bằng <code>app.py</code> thì không cần, vì yêu cầu đã lưu trên máy chủ.</p>' +
      '</div>' +

      '<div class="panel"><h2>Khối hero trang chủ</h2><div class="form-grid">' +
        field('Tiêu đề chính (cho phép thẻ HTML đơn giản)', '<textarea name="heroTitle" style="min-height:80px">' + esc(s.heroTitle) + '</textarea>', true) +
        field('Mô tả', '<textarea name="heroDesc" style="min-height:90px">' + esc(s.heroDesc) + '</textarea>', true) +
        field('Slogan cạnh logo (dòng trên)', '<input type="text" name="slogan" value="' + esc(s.slogan) + '">') +
        field('Dòng phụ cạnh logo (dòng dưới)', '<input type="text" name="tagline" value="' + esc(s.tagline) + '">') +
      '</div>' +
      '<p class="form-note">Tiêu đề và mô tả ở đây được áp dụng trực tiếp vào khối hero trang chủ. Trong tiêu đề có thể dùng <code>&lt;br&gt;</code> để xuống dòng và <code>&lt;span class="txt-accent"&gt;…&lt;/span&gt;</code> để tô màu nhấn.</p>' +
      '</div>' +

      '<div class="panel"><h2>Số liệu nổi bật</h2>' +
        '<div class="form-grid" id="stats-fields">' +
        s.stats.map(function (st, i) {
          return field('Số liệu ' + (i + 1),
            '<div style="display:flex;gap:.4rem">' +
              '<input type="number" name="stat-value-' + i + '" value="' + esc(st.value) + '" style="flex:0 0 90px">' +
              '<input type="text" name="stat-suffix-' + i + '" value="' + esc(st.suffix) + '" style="flex:0 0 60px" placeholder="+">' +
              '<input type="text" name="stat-label-' + i + '" value="' + esc(st.label) + '" placeholder="Nhãn">' +
            '</div>', true);
        }).join('') +
        '</div></div>' +

      '<div class="panel"><h2>Đối tác &amp; khách hàng</h2><div class="form-grid">' +
        field('Danh sách (mỗi dòng một tên)', '<textarea name="partners" style="min-height:120px">' + esc(DATA.partners.join('\n')) + '</textarea>', true) +
      '</div></div>' +

      '<div class="panel"><h2>Chứng nhận &amp; hồ sơ</h2><div class="form-grid">' +
        field('Danh sách (mỗi dòng: Tên | Mô tả)', '<textarea name="certificates" style="min-height:130px">' +
          esc(DATA.certificates.map(function (c) { return c.name + ' | ' + c.desc; }).join('\n')) + '</textarea>', true) +
      '</div></div>' +

      '<div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-bottom:2rem">' +
        '<button class="btn btn--primary" type="submit">Lưu cấu hình</button>' +
        '<a class="btn btn--outline" href="index.html" target="_blank" rel="noopener">Xem kết quả ↗</a>' +
      '</div></form>' +

      '<div class="panel" id="gh-config-panel"><h2>Tải ảnh lên trực tiếp (khi chạy trên host tĩnh)</h2>' +
        '<p class="form-note">Khi chạy qua <code>app.py</code>, nút “Tải ảnh lên từ máy” ở phần chỉnh sửa sản phẩm/nhóm/ứng dụng/tin tức hoạt động ngay, không cần mục này. Trên hosting hiện tại (quangthang.vn), khai báo thông tin bên dưới để admin tự đưa ảnh mới thẳng vào kho mã nguồn trên GitHub — nhưng <b>vẫn cần tải ZIP mới từ GitHub và upload đè lên public_html qua cPanel</b> thì ảnh mới hiện lên trang thật, vì hosting này không tự động build lại từ GitHub.</p>' +
        '<div class="form-grid">' +
          field('Chủ sở hữu repo (owner)', '<input type="text" id="gh-owner" placeholder="VD: Maipt-87">') +
          field('Tên repo', '<input type="text" id="gh-repo" placeholder="VD: quangthang-website">') +
          field('Nhánh (branch)', '<input type="text" id="gh-branch" placeholder="main">') +
          field('GitHub Personal Access Token', '<input type="password" id="gh-token" placeholder="ghp_...">') +
        '</div>' +
        '<p class="form-note">Token cần quyền <code>repo</code> (hoặc <code>Contents: Read and write</code> nếu dùng fine-grained token) — tạo tại <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">github.com/settings/tokens</a>. Token chỉ lưu trong trình duyệt này (localStorage của máy bạn), không gửi cho ai khác ngoài GitHub.</p>' +
        '<div style="display:flex;gap:.6rem;flex-wrap:wrap">' +
          '<button class="btn btn--navy" type="button" id="gh-config-save">Lưu cấu hình GitHub</button>' +
          '<button class="btn btn--outline" type="button" id="gh-config-clear">Xoá token đã lưu</button>' +
        '</div>' +
        '<p class="form-note" id="gh-config-status"></p>' +
      '</div>';

    (function initGithubConfigPanel() {
      var cfg = getGithubConfig() || {};
      $('#gh-owner').value = cfg.owner || 'Maipt-87';
      $('#gh-repo').value = cfg.repo || 'quangthang-website';
      $('#gh-branch').value = cfg.branch || 'main';
      $('#gh-token').value = cfg.token || '';
      $('#gh-config-status').textContent = cfg.token
        ? '✓ Đã cấu hình — admin có thể tải ảnh thẳng lên GitHub.'
        : 'Chưa cấu hình — ảnh tải lên chỉ xem thử tạm thời trong trình duyệt.';

      $('#gh-config-save').addEventListener('click', function () {
        var owner = $('#gh-owner').value.trim();
        var repo = $('#gh-repo').value.trim();
        var branch = $('#gh-branch').value.trim() || 'main';
        var token = $('#gh-token').value.trim();
        if (!owner || !repo || !token) {
          return toast('Vui lòng điền đủ owner, repo và token.', 'err');
        }
        saveGithubConfig({ owner: owner, repo: repo, branch: branch, token: token });
        $('#gh-config-status').textContent = '✓ Đã cấu hình — admin có thể tải ảnh thẳng lên GitHub.';
        toast('Đã lưu cấu hình GitHub trên trình duyệt này.', 'ok');
      });

      $('#gh-config-clear').addEventListener('click', function () {
        clearGithubConfig();
        $('#gh-token').value = '';
        $('#gh-config-status').textContent = 'Chưa cấu hình — ảnh tải lên chỉ xem thử tạm thời trong trình duyệt.';
        toast('Đã xoá cấu hình GitHub khỏi trình duyệt này.', 'ok');
      });
    })();

    $('#settings-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);

      ['companyName', 'address', 'email', 'taxCode', 'phone', 'hotline', 'zalo', 'workingHours', 'formEndpoint',
        'quoteFormEndpoint', 'mapEmbed', 'heroTitle', 'heroDesc', 'slogan', 'tagline'].forEach(function (k) {
        DATA.settings[k] = String(fd.get(k) || '').trim();
      });

      DATA.settings.stats = DATA.settings.stats.map(function (_, i) {
        return {
          value: parseFloat(fd.get('stat-value-' + i)) || 0,
          suffix: String(fd.get('stat-suffix-' + i) || ''),
          label: String(fd.get('stat-label-' + i) || '')
        };
      });

      DATA.partners = String(fd.get('partners') || '').split('\n')
        .map(function (x) { return x.trim(); }).filter(Boolean);

      DATA.certificates = String(fd.get('certificates') || '').split('\n')
        .map(function (line) { return line.trim(); }).filter(Boolean)
        .map(function (line) {
          var parts = line.split('|');
          return { name: (parts[0] || '').trim(), desc: (parts[1] || '').trim() };
        });

      persist('Đã lưu cấu hình website.');
    });
  }

  /* ========================= DỮ LIỆU & SAO LƯU ======================== */
  function viewSystem() {
    $('#view-body').innerHTML = '' +
      '<div class="panel"><h2>Xuất dữ liệu</h2>' +
        '<p>Tải toàn bộ nội dung website (sản phẩm, tin tức, cấu hình, yêu cầu liên hệ) ra file JSON để sao lưu hoặc chuyển sang máy khác.</p>' +
        '<button class="btn btn--navy" type="button" id="export-json">Tải file sao lưu (.json)</button>' +
      '</div>' +

      '<div class="panel"><h2>Nhập dữ liệu</h2>' +
        '<p>Chọn file JSON đã sao lưu trước đó. Toàn bộ nội dung hiện tại sẽ bị ghi đè.</p>' +
        '<input type="file" id="import-json" accept="application/json,.json" style="margin-bottom:1rem">' +
      '</div>' +

      '<div class="panel"><h2>Khôi phục dữ liệu mẫu</h2>' +
        '<p>Đưa website về đúng nội dung mẫu ban đầu. Mọi thay đổi và yêu cầu liên hệ đã lưu sẽ bị xoá.</p>' +
        '<button class="btn btn--outline" type="button" id="reset-data" style="border-color:var(--red);color:var(--red)">Khôi phục dữ liệu mẫu</button>' +
      '</div>' +

      '<div class="panel"><h2>Thông tin bản demo</h2>' +
        '<table class="spec-table"><tbody>' +
          '<tr><th>Nơi lưu dữ liệu</th><td>' + esc(window.QTData.storageInfo().label) + '</td></tr>' +
          '<tr><th>Sản phẩm</th><td>' + DATA.products.length + '</td></tr>' +
          '<tr><th>Bài viết</th><td>' + DATA.news.length + '</td></tr>' +
          '<tr><th>Yêu cầu liên hệ</th><td>' + DATA.quotes.length + '</td></tr>' +
          '<tr><th>Thư viện ảnh</th><td>' + IMAGE_POOL.length + ' ảnh trong thư mục <code>imagesP/</code></td></tr>' +
        '</tbody></table>' +
        '<p class="form-note">' + (window.QTData.storageInfo().mode === 'server'
          ? 'Đang chạy qua <code>app.py</code>: nội dung lưu xuống file trên máy chủ và mọi máy truy cập đều thấy cùng dữ liệu. Máy chủ tự giữ 20 bản sao lưu gần nhất trong <code>data/backups/</code>.'
          : 'Đang mở trực tiếp bằng <code>file://</code> nên nội dung chỉ lưu trong trình duyệt này. Chạy <code>python app.py</code> để lưu xuống file dùng chung.') +
        '</p>' +
        '<p class="form-note">Khi triển khai thật, nên thay bằng cơ sở dữ liệu và đăng nhập có mã hoá mật khẩu.</p>' +
      '</div>';

    $('#export-json').addEventListener('click', function () {
      download('quangthang-backup-' + new Date().toISOString().slice(0, 10) + '.json',
        JSON.stringify(DATA, null, 2), 'application/json');
      toast('Đã tải file sao lưu.');
    });

    $('#import-json').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(reader.result);
          if (!parsed || !Array.isArray(parsed.products)) throw new Error('Cấu trúc file không đúng');
          if (!confirm('Ghi đè toàn bộ nội dung hiện tại bằng dữ liệu trong file?')) return;
          DATA = parsed;
          persist('Đã nhập dữ liệu từ file.');
          render('system');
        } catch (err) {
          toast('File không hợp lệ: ' + err.message, 'err');
        }
      };
      reader.readAsText(file);
    });

    $('#reset-data').addEventListener('click', function () {
      if (!confirm('Khôi phục dữ liệu mẫu và xoá mọi thay đổi?')) return;
      // reset() đã xoá nội dung đã lưu — không ghi lại, để website đọc dữ liệu mẫu
      DATA = window.QTData.reset();
      toast('Đã khôi phục dữ liệu mẫu.');
      render('system');
    });
  }

  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ========================== TIỆN ÍCH BIỂU MẪU ======================= */
  function field(label, control, full) {
    return '<div class="field' + (full ? ' field--full' : '') + '"><label>' + label + '</label>' + control + '</div>';
  }

  function imagePicker(current) {
    return '<input type="hidden" name="image" value="' + esc(current) + '">' +
      '<div style="display:flex;gap:.9rem;align-items:flex-start;flex-wrap:wrap">' +
        '<img id="img-preview" src="' + esc(current) + '" alt="" style="width:104px;height:82px;object-fit:cover;border-radius:8px;border:1px solid var(--line)">' +
        '<div style="flex:1;min-width:230px">' +
          '<div class="img-picker">' +
            IMAGE_POOL.map(function (src) {
              // Ẩn hẳn ô này nếu file ảnh không còn tồn tại trong imagesP/, thay vì
              // hiện icon ảnh vỡ trong bộ chọn.
              return '<button type="button" data-img="' + esc(src) + '"' + (src === current ? ' class="is-active"' : '') +
                '><img src="' + esc(src) + '" alt="" loading="lazy" ' +
                'onerror="this.closest(&quot;button&quot;).style.display=&quot;none&quot;"></button>';
            }).join('') +
          '</div>' +
          '<div style="margin-top:.7rem;display:flex;align-items:center;gap:.7rem;flex-wrap:wrap">' +
            '<label class="btn btn--outline btn--sm" style="cursor:pointer;margin:0;position:relative;overflow:hidden">' +
              '📤 Tải ảnh lên từ máy' +
              '<input type="file" id="img-upload-input" accept="image/*" ' +
              'style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer">' +
            '</label>' +
            '<span id="img-upload-status" class="form-note" style="margin:0"></span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function bindImagePicker() {
    var modal = $('#admin-modal');
    var picker = $('.img-picker', modal);
    if (picker) {
      picker.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-img]');
        if (!btn) return;
        var src = btn.getAttribute('data-img');
        $$('button', picker).forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        $('input[name="image"]', modal).value = src;
        $('#img-preview', modal).src = src;
      });
    }

    var fileInput = $('#img-upload-input', modal);
    if (!fileInput) return;
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      var statusEl = $('#img-upload-status', modal);
      var wrap = fileInput.closest('label');
      fileInput.disabled = true;
      if (wrap) { wrap.style.opacity = '.6'; wrap.style.pointerEvents = 'none'; }
      if (statusEl) statusEl.textContent = 'Đang xử lý ảnh…';

      var hintField = $('input[name="name"]', modal) || $('input[name="title"]', modal);
      var hint = hintField ? hintField.value : '';

      uploadImageFile(file, hint).then(function (result) {
        $('input[name="image"]', modal).value = result.path;
        var preview = $('#img-preview', modal);
        if (preview) preview.src = result.path;
        if (picker) $$('button', picker).forEach(function (b) { b.classList.remove('is-active'); });
        if (result.temporary) {
          toast('Ảnh mới chỉ xem trước tạm thời trong trình duyệt này — vào Cấu hình website để bật lưu thật lên GitHub, hoặc nhờ hỗ trợ kỹ thuật thêm file khi bạn Lưu.', 'err');
          if (statusEl) statusEl.textContent = '⚠ Ảnh xem trước tạm thời, chưa lưu thành file thật.';
        } else if (result.pending) {
          toast('Đã gửi ảnh lên GitHub — trang web sẽ cập nhật sau khoảng 1 phút.', 'ok');
          if (statusEl) statusEl.textContent = '✓ Đã gửi lên GitHub, đang chờ web build lại.';
        } else {
          toast('Đã tải ảnh lên thành công.', 'ok');
          if (statusEl) statusEl.textContent = '✓ Đã lưu: ' + result.path;
        }
      }).catch(function (err) {
        toast(err.message || 'Tải ảnh lên thất bại.', 'err');
        if (statusEl) statusEl.textContent = '✗ ' + (err.message || 'Có lỗi xảy ra.');
      }).finally(function () {
        fileInput.disabled = false;
        if (wrap) { wrap.style.opacity = ''; wrap.style.pointerEvents = ''; }
        fileInput.value = '';
      });
    });
  }

  /* ===================== TẢI ẢNH LÊN TỪ MÁY (ADMIN) =====================
     Cho phép admin tự thay ảnh sản phẩm/nhóm/ứng dụng/tin tức mà không cần
     nhờ hỗ trợ kỹ thuật. Ảnh luôn được nén lại ngay trong trình duyệt
     (cạnh dài tối đa 2000px, JPEG chất lượng 82% — đúng quy ước ảnh của
     dự án) trước khi lưu, theo 3 chế độ tuỳ nơi website đang chạy:
       1. Qua app.py (máy chủ nội bộ): gửi thẳng lên máy chủ, ghi file thật
          vào imagesP/ — hoạt động ngay, không cần cấu hình gì thêm.
       2. Host tĩnh (hosting hiện tại của quangthang.vn) + đã khai báo GitHub
          Token trong mục Cấu hình website: ảnh được commit thẳng vào repo
          qua GitHub API, nhưng vẫn cần tải ZIP mới và upload đè lên
          public_html qua cPanel thì mới hiện trên trang thật — hosting này
          không tự động build lại từ GitHub như GitHub Pages trước đây.
       3. Host tĩnh, CHƯA khai báo Token: ảnh chỉ lưu tạm trong trình duyệt
          hiện tại để xem thử ngay — không hiện với khách khác, admin sẽ
          được cảnh báo rõ để tự cấu hình hoặc nhờ thêm file. */
  var GH_CONFIG_KEY = 'quangthang_github_config';

  function getGithubConfig() {
    try {
      var raw = localStorage.getItem(GH_CONFIG_KEY);
      var cfg = raw ? JSON.parse(raw) : null;
      return (cfg && cfg.owner && cfg.repo && cfg.token) ? cfg : null;
    } catch (e) { return null; }
  }

  function saveGithubConfig(cfg) {
    try { localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(cfg)); return true; }
    catch (e) { return false; }
  }

  function clearGithubConfig() {
    try { localStorage.removeItem(GH_CONFIG_KEY); } catch (e) { /* bỏ qua */ }
  }

  function slugify(str) {
    var s = String(str || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s || 'anh';
  }

  function registerNewImage(path) {
    if (IMAGE_POOL.indexOf(path) === -1) IMAGE_POOL.unshift(path);
  }

  /* Đọc file ảnh -> vẽ lại qua canvas để giới hạn kích thước + nén WebP,
     trả về { dataUrl, ext }. Toàn bộ ảnh có sẵn trong imagesP/ đã chuyển
     sang WebP (nhẹ hơn JPEG ~30% cùng chất lượng) nên ảnh tải mới cũng nén
     theo định dạng này để đồng bộ. Trình duyệt cũ không xuất được canvas
     dạng WebP sẽ tự rơi về JPEG (toDataURL trả PNG nếu không hỗ trợ định
     dạng yêu cầu — kiểm tra chuỗi trả về để phát hiện, tránh PNG nặng). */
  function resizeImageFile(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      if (!file || file.type.indexOf('image/') !== 0) {
        reject(new Error('Vui lòng chọn một file ảnh (JPG, PNG…).'));
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Không đọc được file.')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('File không phải ảnh hợp lệ.')); };
        img.onload = function () {
          var w = img.naturalWidth, h = img.naturalHeight;
          var scale = Math.min(1, maxSide / Math.max(w, h));
          var cw = Math.max(1, Math.round(w * scale));
          var ch = Math.max(1, Math.round(h * scale));
          var canvas = document.createElement('canvas');
          canvas.width = cw; canvas.height = ch;
          canvas.getContext('2d').drawImage(img, 0, 0, cw, ch);
          var webp = canvas.toDataURL('image/webp', quality);
          if (webp.indexOf('data:image/webp') === 0) {
            resolve({ dataUrl: webp, ext: 'webp' });
          } else {
            resolve({ dataUrl: canvas.toDataURL('image/jpeg', quality), ext: 'jpg' });
          }
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  function commitImageToGithub(cfg, filename, dataUrl) {
    var base64 = dataUrl.split(',')[1];
    var url = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/imagesP/' + filename;
    return fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + cfg.token,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'admin: thêm ảnh ' + filename,
        content: base64,
        branch: cfg.branch || 'main'
      })
    }).then(function (res) {
      if (res.ok) return res.json();
      return res.json().catch(function () { return {}; }).then(function (body) {
        throw new Error(body.message || ('GitHub API lỗi (HTTP ' + res.status + ')'));
      });
    });
  }

  /* Điều phối chính: nén ảnh rồi lưu theo đúng chế độ đang chạy, trả về
     Promise<{ path, temporary?, pending? }> để gán vào field ảnh. */
  function uploadImageFile(file, nameHint) {
    var namePrefix = 'prod-' + slugify(nameHint) + '-' + Date.now().toString(36).slice(-5);
    return resizeImageFile(file, 2000, .82).then(function (resized) {
      var dataUrl = resized.dataUrl;
      var filename = namePrefix + '.' + resized.ext;
      if (window.QTData.storageInfo().mode === 'server') {
        return fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: filename, dataUrl: dataUrl })
        }).then(function (res) { return res.json(); }).then(function (result) {
          if (!result.ok) throw new Error(result.error || 'Tải ảnh lên thất bại.');
          registerNewImage(result.path);
          return { path: result.path };
        });
      }

      var cfg = getGithubConfig();
      if (cfg) {
        return commitImageToGithub(cfg, filename, dataUrl).then(function () {
          var path = 'imagesP/' + filename;
          registerNewImage(path);
          return { path: path, pending: true };
        });
      }

      // Không có máy chủ và chưa cấu hình GitHub — vẫn cho xem thử ngay
      // bằng data URL, nhưng đây chỉ là bản lưu tạm trong trình duyệt này.
      return { path: dataUrl, temporary: true };
    });
  }

  /* =============================== MODAL ============================== */
  function openModal(html) {
    $('#admin-modal-content').innerHTML = html;
    $('#admin-modal').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    $('#admin-modal').classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function initModal() {
    $('#admin-modal').addEventListener('click', function (e) {
      if (e.target.closest('.modal__backdrop') || e.target.closest('.modal__close') || e.target.closest('[data-close]')) {
        closeModal();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ============================== KHỞI TẠO ============================ */
  document.addEventListener('DOMContentLoaded', function () {
    initLogin();
    initLogout();
    initNav();
    initModal();
  });
})();
