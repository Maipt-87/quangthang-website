/* =========================================================================
   QUANG THANG CO.,LTD — Xử lý giao diện & tương tác cho các trang public
   Đọc nội dung từ QTData (localStorage) nên mọi thay đổi trong trang admin
   được phản ánh ngay trên website.
   ========================================================================= */
(function () {
  'use strict';

  var DATA = window.QTData.load();
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.getDate().toString().padStart(2, '0') + '/' +
      (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
  }

  function catName(id) {
    var c = DATA.categories.filter(function (x) { return x.id === id; })[0];
    return c ? c.name : id;
  }

  /* Ép xuống dòng ngay sau "Hương cho" cho MỌI tên nhóm sản phẩm, thay vì để
     trình duyệt tự ngắt dòng theo độ rộng — nếu không, tên ngắn (vừa 1 dòng)
     và tên dài (phải xuống 2 dòng) sẽ đẩy phần mô tả/link bên dưới lệch nhau
     giữa các thẻ trong cùng một hàng. */
  function catTitleHTML(name) {
    var prefix = 'Hương cho ';
    if (name.indexOf(prefix) === 0) {
      return esc(prefix.trim()) + '<br>' + esc(name.slice(prefix.length));
    }
    return esc(name);
  }

  /* ===================== 1. Thông tin liên hệ động ===================== */
  function fillSettings() {
    var s = DATA.settings;
    var map = {
      'data-qt-address': s.address,
      'data-qt-email': s.email,
      'data-qt-phone': s.phone,
      'data-qt-hotline': s.hotline,
      'data-qt-company': s.companyName,
      'data-qt-year': new Date().getFullYear()
    };
    Object.keys(map).forEach(function (attr) {
      $$('[' + attr + ']').forEach(function (el) { el.textContent = map[attr]; });
    });

    // Mã số thuế: chưa điền thì ẩn cả dòng, không để lộ chữ "[CẬP NHẬT]" công khai
    $$('[data-qt-tax]').forEach(function (el) {
      var line = el.closest('p') || el;
      if (isReady(s.taxCode)) {
        el.textContent = s.taxCode;
        line.hidden = false;
      } else {
        line.hidden = true;
      }
    });

    // Giờ làm việc: mỗi dòng trong cấu hình hiển thị thành một dòng riêng
    // (CSS đặt white-space: pre-line cho [data-qt-hours] nên giữ nguyên \n)
    var hours = String(s.workingHours || '').split('\n')
      .map(function (line) { return line.trim(); })
      .filter(Boolean)
      .join('\n');
    $$('[data-qt-hours]').forEach(function (el) { el.textContent = hours; });
    // khối hero (cho phép thẻ HTML đơn giản trong tiêu đề)
    $$('[data-qt-hero-title]').forEach(function (el) { el.innerHTML = s.heroTitle; });
    $$('[data-qt-hero-desc]').forEach(function (el) { el.textContent = s.heroDesc; });
    $$('[data-qt-slogan]').forEach(function (el) { el.textContent = s.slogan; });
    $$('[data-qt-tagline]').forEach(function (el) { el.textContent = s.tagline; });

    // Thông tin chưa được điền thì không tạo liên kết hỏng: ẩn hẳn phần tử đi
    // thay vì để khách bấm vào một số điện thoại hoặc Zalo không tồn tại.
    function linkOrHide(selector, build, value) {
      $$(selector).forEach(function (el) {
        if (isReady(value)) {
          el.href = build(value);
          el.hidden = false;
          if (el.closest('li')) el.closest('li').hidden = false;
        } else {
          el.removeAttribute('href');
          el.hidden = true;
          if (el.closest('li')) el.closest('li').hidden = true;
        }
      });
    }

    linkOrHide('[data-qt-href="email"]', function (v) { return 'mailto:' + v; }, s.email);
    // s.phone có thể gồm nhiều số điện thoại bàn cách nhau bằng "/" — link
    // tel: chỉ gọi được một số nên lấy số đầu tiên, phần hiển thị vẫn đủ cả.
    linkOrHide('[data-qt-href="phone"]', function (v) { return 'tel:' + String(v).split('/')[0].replace(/[^\d+]/g, ''); }, s.phone);
    linkOrHide('[data-qt-href="hotline"]', function (v) { return 'tel:' + String(v).replace(/[^\d+]/g, ''); }, s.hotline);
    linkOrHide('[data-qt-href="zalo"]', function (v) { return 'https://zalo.me/' + v; }, s.zalo);

    var map1 = $('[data-qt-map]');
    if (map1 && s.mapEmbed) map1.src = s.mapEmbed;
  }

  /* Dữ liệu có cấu trúc Organization/LocalBusiness (JSON-LD) — giúp Google
     hiểu đây là công ty gì, địa chỉ, liên hệ ra sao, hỗ trợ hiển thị đẹp hơn
     trên kết quả tìm kiếm. Đọc trực tiếp từ DATA.settings nên luôn khớp với
     thông tin admin đã cập nhật, không cần sửa tay ở từng trang HTML. */
  function injectOrgSchema() {
    var s = DATA.settings;
    var addrParts = String(s.address || '').split(',').map(function (p) { return p.trim(); }).filter(Boolean);
    var schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: s.companyName,
      alternateName: s.shortName,
      url: 'https://quangthang.vn/',
      logo: 'https://quangthang.vn/assets/logo-h.png',
      image: 'https://quangthang.vn/assets/logo-h.png',
      description: s.heroDesc,
      email: s.email,
      telephone: s.hotline,
      address: {
        '@type': 'PostalAddress',
        streetAddress: addrParts.slice(0, addrParts.length - 1).join(', '),
        addressLocality: addrParts[addrParts.length - 1] || '',
        addressCountry: 'VN'
      },
      areaServed: 'VN'
    };
    var el = document.getElementById('qt-org-schema');
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = 'qt-org-schema';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(schema);
  }

  /** Một trường được coi là đã điền khi không rỗng và không còn dấu [CẬP NHẬT]. */
  function isReady(value) {
    var v = String(value == null ? '' : value).trim();
    return v !== '' && v.indexOf('[CẬP NHẬT]') === -1;
  }

  /* ========================= 2. Header & menu ========================= */
  function initHeader() {
    var header = $('.header');
    var toggle = $('.nav__toggle');
    var menu = $('.nav__menu');

    if (header) {
      var onScroll = function () {
        header.classList.toggle('is-stuck', window.scrollY > 8);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        var open = menu.classList.toggle('is-open');
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      // đóng menu khi bấm vào một liên kết hoặc khi phóng to màn hình
      $$('a', menu).forEach(function (a) {
        a.addEventListener('click', function () {
          menu.classList.remove('is-open');
          toggle.classList.remove('is-open');
        });
      });
      window.addEventListener('resize', function () {
        if (window.innerWidth > 960) {
          menu.classList.remove('is-open');
          toggle.classList.remove('is-open');
        }
      });
    }

    // đánh dấu mục menu đang mở
    var page = document.body.getAttribute('data-page');
    $$('.nav__link').forEach(function (link) {
      if (link.getAttribute('data-nav') === page) link.classList.add('is-active');
    });
  }

  /* ========================== 3. Hero slider ========================== */
  function initHero() {
    var wrap = $('.hero__slides');
    if (!wrap) return;
    var slides = $$('.hero__slide', wrap);
    var dotsBox = $('.hero__dots');
    if (slides.length < 2) { if (slides[0]) slides[0].classList.add('is-active'); return; }

    var index = 0, timer = null;

    if (dotsBox) {
      slides.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Ảnh ' + (i + 1));
        b.addEventListener('click', function () { go(i); restart(); });
        dotsBox.appendChild(b);
      });
    }
    var dots = dotsBox ? $$('button', dotsBox) : [];

    function go(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === index); });
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === index); });
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(function () { go(index + 1); }, 6000);
    }
    go(0);
    restart();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearInterval(timer); else restart();
    });
  }

  /* ======================= 4. Hiệu ứng cuộn trang ====================== */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        setTimeout(function () { el.classList.add('is-visible'); }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ========================= 5. Số liệu đếm lên ======================== */
  function initCounters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var dur = 1500, start = performance.now();
      var step = function (now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('vi-VN');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ===================== 6. Render nội dung động ====================== */
  function productCard(p) {
    return '' +
      '<article class="card reveal" data-id="' + esc(p.id) + '">' +
        '<div class="card__media">' +
          (p.featured ? '<span class="badge-float badge-float--red">Nổi bật</span>' : '') +
          '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">' +
        '</div>' +
        '<div class="card__body">' +
          '<span class="prod-card__id">' + esc(p.id) + '</span>' +
          '<h3>' + esc(p.name) + '</h3>' +
          '<p>' + esc(p.desc) + '</p>' +
          '<div class="card__foot">' +
            '<span class="tag' + (p.category === 'food' ? ' tag--red' : '') + '">' + esc(p.app) + '</span>' +
            '<button type="button" class="btn btn--sm btn--outline" data-detail="' + esc(p.id) + '">Chi tiết</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderCategories() {
    var box = $('[data-render="categories"]');
    if (!box) return;
    box.innerHTML = DATA.categories.map(function (c, i) {
      return '' +
        '<a class="cat-card reveal" data-delay="' + (i * 90) + '" href="products.html?cat=' + esc(c.id) + '">' +
          '<img src="' + esc(c.image) + '" alt="' + esc(c.name) + '" loading="lazy">' +
          '<div class="cat-card__body">' +
            '<h3>' + catTitleHTML(c.name) + '</h3>' +
            '<p>' + esc(c.desc) + '</p>' +
            '<span class="cat-card__link">Xem sản phẩm</span>' +
          '</div>' +
        '</a>';
    }).join('');
  }

  function renderFeatured() {
    var box = $('[data-render="featured"]');
    if (!box) return;
    var list = DATA.products.filter(function (p) { return p.featured; }).slice(0, 6);
    if (!list.length) list = DATA.products.slice(0, 6);
    box.innerHTML = list.map(productCard).join('');
  }

  function renderIndustries() {
    var box = $('[data-render="industries"]');
    if (!box) return;
    box.innerHTML = DATA.industries.map(function (ind, i) {
      return '' +
        '<article class="card reveal" data-delay="' + (i * 90) + '" id="' + esc(ind.id) + '">' +
          '<div class="card__media"><img src="' + esc(ind.image) + '" alt="' + esc(ind.name) + '" loading="lazy"></div>' +
          '<div class="card__body">' +
            '<h3>' + esc(ind.name) + '</h3>' +
            '<p>' + esc(ind.desc) + '</p>' +
            '<ul class="check-list">' + ind.items.map(function (it) { return '<li>' + esc(it) + '</li>'; }).join('') + '</ul>' +
            '<div class="card__foot"><a class="btn btn--sm btn--outline" href="products.html">Hương liệu phù hợp</a></div>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  function renderNews(limit) {
    var box = $('[data-render="news"]');
    if (!box) return;
    var list = DATA.news.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    if (limit) list = list.slice(0, limit);
    box.innerHTML = list.map(function (n, i) {
      return '' +
        '<article class="card reveal" data-delay="' + (i * 80) + '">' +
          '<div class="card__media"><img src="' + esc(n.image) + '" alt="' + esc(n.title) + '" loading="lazy"></div>' +
          '<div class="card__body">' +
            '<div class="news-card__meta"><span class="tag">' + esc(n.category) + '</span><time datetime="' + esc(n.date) + '">' + formatDate(n.date) + '</time></div>' +
            '<h3>' + esc(n.title) + '</h3>' +
            '<p>' + esc(n.excerpt) + '</p>' +
            '<div class="card__foot"><button type="button" class="btn btn--sm btn--outline" data-news="' + esc(n.id) + '">Đọc tiếp</button></div>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  function renderStats() {
    var box = $('[data-render="stats"]');
    if (!box) return;
    box.innerHTML = DATA.settings.stats.map(function (s) {
      return '<div class="stat reveal"><div class="stat__num"><span data-count="' + s.value + '">0</span><span class="suffix">' + esc(s.suffix) + '</span></div><p>' + esc(s.label) + '</p></div>';
    }).join('');
  }

  function renderPartners() {
    var box = $('[data-render="partners"]');
    if (!box) return;
    box.innerHTML = DATA.partners.map(function (p) {
      return '<div class="partner-chip">' + esc(p) + '</div>';
    }).join('');
  }

  function renderCertificates() {
    var box = $('[data-render="certificates"]');
    if (!box) return;
    box.innerHTML = DATA.certificates.map(function (c, i) {
      return '<div class="usp reveal" data-delay="' + (i * 80) + '"><div class="usp__icon">✓</div><h3>' + esc(c.name) + '</h3><p>' + esc(c.desc) + '</p></div>';
    }).join('');
  }

  /* ================== 7. Trang sản phẩm: lọc & tìm kiếm ================ */
  var productState = { cat: 'all', app: 'all', q: '' };

  function initProductPage() {
    var grid = $('[data-render="products"]');
    if (!grid) return;

    var chipBox = $('[data-render="cat-chips"]');
    var appBox = $('[data-render="app-select"]');
    var countEl = $('[data-render="count"]');
    var search = $('#product-search');

    // chip danh mục
    if (chipBox) {
      chipBox.innerHTML = '<button type="button" class="chip is-active" data-cat="all">Tất cả</button>' +
        DATA.categories.map(function (c) {
          return '<button type="button" class="chip" data-cat="' + esc(c.id) + '">' + esc(c.name) + '</button>';
        }).join('');
    }

    // select ứng dụng
    if (appBox) {
      var apps = [];
      DATA.products.forEach(function (p) { if (apps.indexOf(p.app) === -1) apps.push(p.app); });
      appBox.innerHTML = '<option value="all">Tất cả ứng dụng</option>' +
        apps.sort().map(function (a) { return '<option value="' + esc(a) + '">' + esc(a) + '</option>'; }).join('');
    }

    // đọc ?cat= từ URL
    var urlCat = new URLSearchParams(location.search).get('cat');
    if (urlCat && DATA.categories.some(function (c) { return c.id === urlCat; })) {
      productState.cat = urlCat;
      $$('.chip', chipBox).forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-cat') === urlCat);
      });
    }

    function apply() {
      var q = productState.q.trim().toLowerCase();
      var list = DATA.products.filter(function (p) {
        if (productState.cat !== 'all' && p.category !== productState.cat) return false;
        if (productState.app !== 'all' && p.app !== productState.app) return false;
        if (q) {
          var hay = (p.name + ' ' + p.id + ' ' + p.desc + ' ' + p.app + ' ' + catName(p.category)).toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });

      if (countEl) {
        countEl.textContent = 'Hiển thị ' + list.length + ' / ' + DATA.products.length + ' sản phẩm' +
          (productState.cat !== 'all' ? ' · ' + catName(productState.cat) : '');
      }

      grid.innerHTML = list.length
        ? list.map(productCard).join('')
        : '<div class="empty-state" style="grid-column:1/-1"><strong>Không tìm thấy sản phẩm phù hợp</strong>Thử bỏ bớt điều kiện lọc hoặc đổi từ khoá tìm kiếm.</div>';
      initReveal();
    }

    if (chipBox) {
      chipBox.addEventListener('click', function (e) {
        var btn = e.target.closest('.chip');
        if (!btn) return;
        $$('.chip', chipBox).forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        productState.cat = btn.getAttribute('data-cat');
        apply();
      });
    }
    if (appBox) {
      appBox.addEventListener('change', function () { productState.app = appBox.value; apply(); });
    }
    if (search) {
      var t = null;
      search.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { productState.q = search.value; apply(); }, 220);
      });
    }
    apply();
  }

  /* ====================== 8. Modal chi tiết chung ===================== */
  function openModal(html) {
    var modal = $('#modal');
    if (!modal) return;
    $('#modal-content').innerHTML = html;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var closeBtn = $('.modal__close', modal);
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    var modal = $('#modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function initModal() {
    var modal = $('#modal');
    if (!modal) return;

    modal.addEventListener('click', function (e) {
      if (e.target.closest('.modal__backdrop') || e.target.closest('.modal__close')) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    // mở chi tiết sản phẩm / tin tức (event delegation cho nội dung render động)
    document.addEventListener('click', function (e) {
      var pBtn = e.target.closest('[data-detail]');
      if (pBtn) {
        var p = DATA.products.filter(function (x) { return x.id === pBtn.getAttribute('data-detail'); })[0];
        if (p) openModal(productDetailHTML(p));
        return;
      }
      var nBtn = e.target.closest('[data-news]');
      if (nBtn) {
        var n = DATA.news.filter(function (x) { return x.id === nBtn.getAttribute('data-news'); })[0];
        if (n) openModal(newsDetailHTML(n));
      }
    });
  }

  function productDetailHTML(p) {
    return '' +
      '<button type="button" class="modal__close" aria-label="Đóng">×</button>' +
      '<div class="modal__grid">' +
        '<div class="modal__media"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '"></div>' +
        '<div class="modal__body">' +
          '<span class="tag' + (p.category === 'food' ? ' tag--red' : '') + '">' + esc(catName(p.category)) + '</span>' +
          '<h2 style="margin-top:.7rem">' + esc(p.name) + '</h2>' +
          '<p class="prod-card__id">Mã sản phẩm: ' + esc(p.id) + '</p>' +
          '<p>' + esc(p.desc) + '</p>' +
          '<table class="spec-table"><tbody>' +
            '<tr><th>Nhà sản xuất</th><td>' + esc(p.origin) + '</td></tr>' +
            '<tr><th>Dạng sản phẩm</th><td>' + esc(p.form) + '</td></tr>' +
            '<tr><th>Liều dùng đề nghị</th><td>' + esc(p.dosage) + '</td></tr>' +
            '<tr><th>Quy cách đóng gói</th><td>' + esc(p.packing) + '</td></tr>' +
            '<tr><th>Ứng dụng</th><td>' + esc(p.app) + '</td></tr>' +
          '</tbody></table>' +
          (p.notes && p.notes.length
            ? '<h3 style="font-size:1rem">Đặc điểm hương</h3><ul class="check-list">' +
              p.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>'
            : '') +
          '<div style="display:flex;gap:.6rem;flex-wrap:wrap">' +
            '<a class="btn btn--primary btn--sm" href="contact.html?product=' + encodeURIComponent(p.id) + '">Yêu cầu mẫu thử</a>' +
            '<a class="btn btn--outline btn--sm" href="contact.html?product=' + encodeURIComponent(p.id) + '&type=quote">Nhận báo giá</a>' +
          '</div>' +
          '<p class="form-note" style="margin-top:1rem">Tài liệu kỹ thuật (TDS/MSDS/COA) được cung cấp sau khi xác nhận thông tin doanh nghiệp.</p>' +
        '</div>' +
      '</div>';
  }

  function newsDetailHTML(n) {
    return '' +
      '<button type="button" class="modal__close" aria-label="Đóng">×</button>' +
      '<div class="modal__media" style="max-height:280px;overflow:hidden"><img src="' + esc(n.image) + '" alt="' + esc(n.title) + '" style="width:100%;height:280px;object-fit:cover"></div>' +
      '<div class="modal__body">' +
        '<div class="news-card__meta"><span class="tag">' + esc(n.category) + '</span><time>' + formatDate(n.date) + '</time></div>' +
        '<h2>' + esc(n.title) + '</h2>' +
        String(n.content || n.excerpt).split('\n').filter(function (x) { return x.trim(); })
          .map(function (para) { return '<p>' + esc(para.trim()) + '</p>'; }).join('') +
      '</div>';
  }

  /* ======================= 9. Form liên hệ / báo giá =================== */
  function initContactForm() {
    var form = $('#contact-form');
    if (!form) return;

    // gợi ý sản phẩm trong select nếu có
    var prodSelect = $('#cf-product', form);
    if (prodSelect) {
      prodSelect.innerHTML = '<option value="">— Chưa xác định / cần tư vấn —</option>' +
        DATA.products.map(function (p) {
          return '<option value="' + esc(p.id) + '">' + esc(p.id) + ' — ' + esc(p.name) + '</option>';
        }).join('');
      var params = new URLSearchParams(location.search);
      var pre = params.get('product');
      if (pre) prodSelect.value = pre;

      var typeSelect = $('#cf-type', form);
      var typeMap = {
        quote: 'Yêu cầu báo giá',
        sample: 'Yêu cầu mẫu thử',
        support: 'Tư vấn kỹ thuật',
        visit: 'Đặt lịch tham quan',
        news: 'Đăng ký nhận tin'
      };
      var wanted = typeMap[params.get('type')] || (pre ? 'Yêu cầu mẫu thử' : '');
      if (wanted && typeSelect) {
        // chỉ chọn khi select thực sự có mục đó
        Array.prototype.forEach.call(typeSelect.options, function (opt) {
          if (opt.value === wanted) typeSelect.value = wanted;
        });
      }
    }

    var alertBox = $('#contact-alert');

    // Nói rõ yêu cầu sẽ đi đâu — nếu chưa có kênh gửi tự động thì mời khách
    // dùng ngay email / hotline thay vì chờ phản hồi không bao giờ đến.
    var note = $('#form-channel-note');
    if (note && !DATA.settings.formEndpoint && window.QTData.storageInfo().mode !== 'server') {
      note.hidden = false;
      note.innerHTML = 'Bạn cũng có thể liên hệ trực tiếp: ' +
        '<a href="mailto:' + esc(DATA.settings.email) + '">' + esc(DATA.settings.email) + '</a> · ' +
        '<a href="tel:' + esc(String(DATA.settings.hotline).replace(/[^\d+]/g, '')) + '">' +
        esc(DATA.settings.hotline) + '</a>';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;

      $$('.field', form).forEach(function (field) {
        var input = $('input, select, textarea', field);
        if (!input || !input.required) return;
        var invalid;
        if (input.type === 'checkbox') {
          invalid = !input.checked;                     // ô đồng ý xử lý dữ liệu
        } else {
          var value = input.value.trim();
          invalid = !value;
          if (!invalid && input.type === 'email') invalid = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
          if (!invalid && input.type === 'tel') invalid = !/^[\d\s+().-]{8,}$/.test(value);
        }
        field.classList.toggle('has-error', invalid);
        if (invalid) ok = false;
      });

      if (!ok) {
        if (alertBox) {
          alertBox.className = 'alert alert--err is-visible';
          alertBox.textContent = 'Vui lòng kiểm tra lại các trường được đánh dấu đỏ.';
        }
        var firstErr = $('.field.has-error input, .field.has-error select, .field.has-error textarea', form);
        if (firstErr) firstErr.focus();
        return;
      }

      var fd = new FormData(form);
      var record = {
        id: 'RQ' + Date.now(),
        createdAt: new Date().toISOString(),
        status: 'Mới',
        name: fd.get('name') || '',
        company: fd.get('company') || '',
        email: fd.get('email') || '',
        phone: fd.get('phone') || '',
        type: fd.get('type') || '',
        product: fd.get('product') || '',
        quantity: fd.get('quantity') || '',
        message: fd.get('message') || ''
      };

      DATA.quotes.unshift(record);
      var savedTo = window.QTData.save(DATA) ? window.QTData.storageInfo().mode : null;

      var btn = $('button[type="submit"]', form);
      if (btn) { btn.disabled = true; btn.textContent = 'Đang gửi…'; }

      deliver(record).then(function (delivered) {
        form.reset();
        if (prodSelect) prodSelect.value = '';
        if (btn) { btn.disabled = false; btn.textContent = 'Gửi yêu cầu'; }
        showResult(record, delivered, savedTo);
      });
    });

    /* Gửi yêu cầu tới công ty.
       1. Nếu quản trị đã khai báo formEndpoint (Formspree/EmailJS…) → gửi thẳng
          tới email công ty, hoạt động cả trên host tĩnh như GitHub Pages.
       2. Nếu website chạy qua app.py → yêu cầu đã nằm trong file trên máy chủ,
          quản trị mở trang admin là thấy.
       3. Còn lại → không có kênh nào gửi được, phải báo thật cho khách. */
    function deliver(record) {
      var endpoint = DATA.settings.formEndpoint;
      if (!endpoint) return Promise.resolve(null);
      return fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(record)
      }).then(function (res) {
        return res.ok;
      }).catch(function () {
        return false;
      });
    }

    /** Soạn sẵn email để khách gửi thẳng cho công ty khi không có kênh tự động. */
    function mailtoLink(r) {
      var body = [
        'Loại yêu cầu: ' + r.type,
        'Họ và tên: ' + r.name,
        'Công ty: ' + (r.company || '—'),
        'Email: ' + r.email,
        'Điện thoại: ' + r.phone,
        'Sản phẩm quan tâm: ' + (r.product || '—'),
        'Số lượng dự kiến: ' + (r.quantity || '—'),
        '',
        'Nội dung:',
        r.message,
        '',
        '(Mã yêu cầu: ' + r.id + ')'
      ].join('\n');
      return 'mailto:' + DATA.settings.email +
        '?subject=' + encodeURIComponent('[' + r.type + '] ' + r.name + (r.company ? ' — ' + r.company : '')) +
        '&body=' + encodeURIComponent(body);
    }

    function showResult(record, delivered, savedTo) {
      if (!alertBox) return;

      if (delivered === true || savedTo === 'server') {
        alertBox.className = 'alert alert--ok is-visible';
        alertBox.innerHTML = '<strong>Đã gửi thành công!</strong> Mã yêu cầu của bạn là <b>' + esc(record.id) +
          '</b>. Bộ phận kinh doanh sẽ liên hệ trong vòng 24 giờ làm việc.';
      } else {
        // Không có kênh gửi tự động — hướng dẫn khách gửi email hoặc gọi ngay,
        // tuyệt đối không báo "đã gửi" khi thực tế chưa tới tay công ty.
        alertBox.className = 'alert alert--err is-visible';
        alertBox.innerHTML =
          '<strong>Chưa gửi được tự động.</strong> Vui lòng bấm nút bên dưới để gửi ' +
          'nội dung vừa nhập qua email, hoặc gọi hotline ' +
          '<a href="tel:' + esc(String(DATA.settings.hotline).replace(/[^\d+]/g, '')) + '"><b>' +
          esc(DATA.settings.hotline) + '</b></a>.' +
          '<div style="margin-top:.8rem;display:flex;gap:.6rem;flex-wrap:wrap">' +
            '<a class="btn btn--primary btn--sm" href="' + esc(mailtoLink(record)) + '">Gửi qua email</a>' +
            '<a class="btn btn--outline btn--sm" href="' + esc('https://zalo.me/' + DATA.settings.zalo) +
              '" target="_blank" rel="noopener">Nhắn Zalo</a>' +
          '</div>';
      }
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // xoá trạng thái lỗi khi người dùng sửa lại
    ['input', 'change'].forEach(function (evt) {
      form.addEventListener(evt, function (e) {
        var field = e.target.closest('.field');
        if (field) field.classList.remove('has-error');
      });
    });
  }

  /* ========================== 10. Nút lên đầu ========================= */
  function initFab() {
    var top = $('.fab__top');
    if (!top) return;
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    var onScroll = function () { top.classList.toggle('is-visible', window.scrollY > 500); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============================== Khởi tạo ============================ */
  document.addEventListener('DOMContentLoaded', function () {
    fillSettings();
    injectOrgSchema();
    initHeader();
    initHero();
    renderCategories();
    renderFeatured();
    renderIndustries();
    renderStats();
    renderPartners();
    renderCertificates();
    renderNews(document.body.getAttribute('data-page') === 'home' ? 3 : 0);
    initProductPage();
    initModal();
    initContactForm();
    initFab();
    initCounters();
    initReveal();
  });
})();
