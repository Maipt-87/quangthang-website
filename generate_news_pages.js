/* =========================================================================
   Sinh trang HTML tĩnh riêng cho từng bài Tin tức (news/<slug>.html) từ
   DEFAULT_DATA.news trong js/data.js — để mỗi bài có URL/canonical/title/
   meta description riêng, giúp Google lập chỉ mục và xếp hạng theo đúng
   từ khoá của từng bài, thay vì gộp chung một URL news.html như trước.

   Chạy lại script này (node generate_news_pages.js) mỗi khi thêm/sửa bài
   trong js/data.js, rồi commit + push như bình thường.
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'news');

const window = {
  localStorage: { getItem: function () { return null; }, setItem: function () {} },
  location: { protocol: 'https:', hostname: 'quangthang.vn' }
};
const source = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');
new Function('window', source + '; return window.QTData;')(window);
const DATA = window.QTData.defaults;

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return dd + '/' + mm + '/' + d.getFullYear();
}

function paragraphsHTML(content) {
  return content.split('\n').filter(function (p) { return p.trim(); })
    .map(function (p) { return '<p>' + esc(p.trim()) + '</p>'; }).join('\n        ');
}

function otherArticlesHTML(current) {
  const others = DATA.news.filter(function (n) { return n.id !== current.id; })
    .sort(function (a, b) { return new Date(b.date) - new Date(a.date); })
    .slice(0, 3);
  return others.map(function (n) {
    return '' +
      '<article class="card">' +
        '<div class="card__media"><img src="../' + n.image + '" alt="' + esc(n.title) + '" loading="lazy"></div>' +
        '<div class="card__body">' +
          '<div class="news-card__meta"><span class="tag">' + esc(n.category) + '</span><time datetime="' + esc(n.date) + '">' + formatDate(n.date) + '</time></div>' +
          '<h3>' + esc(n.title) + '</h3>' +
          '<p>' + esc(n.excerpt) + '</p>' +
          '<div class="card__foot"><a class="btn btn--sm btn--outline" href="' + n.slug + '.html">Đọc tiếp</a></div>' +
        '</div>' +
      '</article>';
  }).join('\n        ');
}

function pageHTML(n) {
  const url = 'https://quangthang.vn/news/' + n.slug + '.html';
  const imgUrl = 'https://quangthang.vn/' + n.image;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: n.title,
    description: n.excerpt,
    image: imgUrl,
    datePublished: n.date,
    author: { '@type': 'Organization', name: 'Công ty TNHH Thương mại Quang Thắng' },
    publisher: {
      '@type': 'Organization',
      name: 'Công ty TNHH Thương mại Quang Thắng',
      logo: { '@type': 'ImageObject', url: 'https://quangthang.vn/assets/logo-h.png' }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url }
  };

  return '<!DOCTYPE html>\n<html lang="vi">\n<head>\n' +
'<!-- Google tag (gtag.js) -->\n' +
'<script async src="https://www.googletagmanager.com/gtag/js?id=G-C66XTGGVN5"></script>\n' +
'<script>\n' +
'  window.dataLayer = window.dataLayer || [];\n' +
'  function gtag(){dataLayer.push(arguments);}\n' +
'  gtag("js", new Date());\n' +
'  gtag("config", "G-C66XTGGVN5");\n' +
'</script>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + esc(n.title) + ' — Quang Thắng Co.,Ltd</title>\n' +
'<meta name="description" content="' + esc(n.excerpt) + '">\n' +
'<link rel="icon" type="image/png" href="../assets/favicon.png">\n' +
'<link rel="canonical" href="' + url + '">\n' +
'<meta property="og:type" content="article">\n' +
'<meta property="og:site_name" content="Quang Thắng Co.,Ltd">\n' +
'<meta property="og:locale" content="vi_VN">\n' +
'<meta property="og:url" content="' + url + '">\n' +
'<meta property="og:title" content="' + esc(n.title) + '">\n' +
'<meta property="og:description" content="' + esc(n.excerpt) + '">\n' +
'<meta property="og:image" content="' + imgUrl + '">\n' +
'<meta name="twitter:card" content="summary_large_image">\n' +
'<meta name="theme-color" content="#faf5ef">\n' +
'<script type="application/ld+json">' + JSON.stringify(jsonLd) + '</script>\n\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,600;1,700&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">\n' +
'<link rel="stylesheet" href="../css/style.css?v=20260804x">\n' +
'</head>\n' +
'<body data-page="news">\n\n' +
'<header class="header">\n' +
'  <div class="topbar">\n' +
'    <div class="container topbar__inner">\n' +
'      <ul class="topbar__list">\n' +
'        <li>📍 <span data-qt-address></span></li>\n' +
'        <li>✉ <a data-qt-href="email" data-qt-email></a></li>\n' +
'      </ul>\n' +
'      <ul class="topbar__list">\n' +
'        <li>Hotline: <a data-qt-href="hotline" data-qt-hotline></a></li>\n' +
'      </ul>\n' +
'    </div>\n' +
'  </div>\n' +
'  <div class="container nav">\n' +
'    <a class="brand" href="../index.html" aria-label="Quang Thắng - Trang chủ">\n' +
'      <img src="../assets/logo-h.png" alt="Quang Thắng Co.,Ltd">\n' +
'    </a>\n' +
'    <ul class="nav__menu">\n' +
'      <li><a class="nav__link" data-nav="home" href="../index.html">Trang chủ</a></li>\n' +
'      <li><a class="nav__link" data-nav="about" href="../about.html">Về chúng tôi</a></li>\n' +
'      <li><a class="nav__link" data-nav="products" href="../products.html">Sản phẩm</a></li>\n' +
'      <li><a class="nav__link" data-nav="industries" href="../industries.html">Ứng dụng</a></li>\n' +
'      <li><a class="nav__link" data-nav="news" href="../news.html">Tin tức</a></li>\n' +
'      <li><a class="nav__link" data-nav="contact" href="../contact.html">Liên hệ</a></li>\n' +
'    </ul>\n' +
'    <div class="nav__actions">\n' +
'      <a class="btn btn--primary btn--sm" href="../contact.html?type=quote">Yêu cầu báo giá</a>\n' +
'      <button class="nav__toggle" type="button" aria-label="Mở menu" aria-expanded="false"><span></span></button>\n' +
'    </div>\n' +
'  </div>\n' +
'</header>\n\n' +
'<main>\n\n' +
'  <section class="page-hero">\n' +
'    <div class="page-hero__bg" style="background-image:url(\'../' + n.image + '\')"></div>\n' +
'    <div class="container page-hero__inner">\n' +
'      <ul class="breadcrumb">\n' +
'        <li><a href="../index.html">Trang chủ</a></li>\n' +
'        <li><a href="../news.html">Tin tức</a></li>\n' +
'        <li>' + esc(n.title) + '</li>\n' +
'      </ul>\n' +
'      <h1>' + esc(n.title) + '</h1>\n' +
'      <p>' + esc(n.category) + ' · ' + formatDate(n.date) + '</p>\n' +
'    </div>\n' +
'  </section>\n\n' +
'  <section class="section">\n' +
'    <div class="container" style="max-width:760px">\n' +
'      <div class="reveal">\n' +
'        ' + paragraphsHTML(n.content) + '\n' +
'      </div>\n' +
'      <p style="margin-top:2rem"><a class="btn btn--outline" href="../news.html">← Xem tất cả bài viết</a></p>\n' +
'    </div>\n' +
'  </section>\n\n' +
'  <section class="section section--tight">\n' +
'    <div class="container">\n' +
'      <div class="sec-head txt-center">\n' +
'        <span class="eyebrow">Bài viết khác</span>\n' +
'        <h2>Có thể bạn quan tâm</h2>\n' +
'      </div>\n' +
'      <div class="grid grid--3">\n' +
'        ' + otherArticlesHTML(n) + '\n' +
'      </div>\n' +
'    </div>\n' +
'  </section>\n\n' +
'  <section class="section section--tight">\n' +
'    <div class="container">\n' +
'      <div class="cta-band reveal">\n' +
'        <div class="cta-band__inner">\n' +
'          <div>\n' +
'            <h2>Cần tư vấn chọn hương cho sản phẩm mới?</h2>\n' +
'            <p>Gửi yêu cầu để nhận báo giá và mẫu thử. Bộ phận kinh doanh phản hồi trong vòng 24 giờ làm việc.</p>\n' +
'          </div>\n' +
'          <a class="btn btn--primary" href="../contact.html?type=quote">Yêu cầu báo giá</a>\n' +
'        </div>\n' +
'      </div>\n' +
'    </div>\n' +
'  </section>\n\n' +
'</main>\n\n' +
'<footer class="footer">\n' +
'  <div class="container">\n' +
'    <div class="footer__grid">\n' +
'      <div>\n' +
'        <span class="footer__logo-plate">\n' +
'          <img class="footer__logo" src="../assets/logo-h.png" alt="Quang Thắng Co.,Ltd">\n' +
'        </span>\n' +
'        <p data-qt-company></p>\n' +
'        <p>Nhà cung cấp hương liệu mỹ phẩm &amp; thực phẩm của hãng Givaudan (Thụy Sĩ) tại Việt Nam.</p>\n' +
'        <p style="font-size:.86rem">Mã số thuế: <span data-qt-tax></span></p>\n' +
'      </div>\n' +
'      <div>\n' +
'        <h4>Liên kết</h4>\n' +
'        <ul class="footer__list">\n' +
'          <li><a href="../index.html">Trang chủ</a></li>\n' +
'          <li><a href="../about.html">Về chúng tôi</a></li>\n' +
'          <li><a href="../products.html">Sản phẩm</a></li>\n' +
'          <li><a href="../industries.html">Ứng dụng</a></li>\n' +
'          <li><a href="../news.html">Tin tức</a></li>\n' +
'          <li><a href="../contact.html">Liên hệ</a></li>\n' +
'        </ul>\n' +
'      </div>\n' +
'      <div>\n' +
'        <h4>Nhóm sản phẩm</h4>\n' +
'        <ul class="footer__list">\n' +
'          <li><a href="../products.html?cat=personal-care">Hương cho Personal Care</a></li>\n' +
'          <li><a href="../products.html?cat=home-care">Hương cho Home Care</a></li>\n' +
'          <li><a href="../products.html?cat=fine-fragrance">Hương cho Fine Fragrance</a></li>\n' +
'          <li><a href="../products.html?cat=incense">Hương cho Nhang – Trầm</a></li>\n' +
'          <li><a href="../products.html?cat=food">Hương cho Thực phẩm</a></li>\n' +
'        </ul>\n' +
'      </div>\n' +
'      <div>\n' +
'        <h4>Thông tin liên hệ</h4>\n' +
'        <ul class="footer__list footer__contact">\n' +
'          <li><span>📍</span><span data-qt-address></span></li>\n' +
'          <li><span>✉</span><a data-qt-href="email" data-qt-email href="#"></a></li>\n' +
'          <li><span>☎</span><a data-qt-href="phone" data-qt-phone href="#"></a></li>\n' +
'          <li><span>📱</span><a data-qt-href="hotline" data-qt-hotline href="#"></a></li>\n' +
'          <li><span>🕘</span><span data-qt-hours></span></li>\n' +
'        </ul>\n' +
'      </div>\n' +
'    </div>\n' +
'    <div class="footer__slogan-band">\n' +
'      <p class="footer__slogan"><b data-qt-slogan></b></p>\n' +
'      <p class="footer__tagline" data-qt-tagline></p>\n' +
'    </div>\n' +
'    <div class="footer__bottom">\n' +
'      <span>© Bản quyền thuộc về đội ngũ nhân viên công ty Quang Thắng</span>\n' +
'      <span><a href="../privacy.html">Chính sách bảo vệ dữ liệu cá nhân</a> Quang Thang Co.,LTD</span>\n' +
'    </div>\n' +
'  </div>\n' +
'</footer>\n\n' +
'<div class="fab">\n' +
'  <a class="fab__phone" data-qt-href="hotline" href="#" aria-label="Gọi hotline">☎</a>\n' +
'  <a class="fab__zalo" data-qt-href="zalo" href="#" target="_blank" rel="noopener" aria-label="Chat Zalo">Zalo</a>\n' +
'  <button class="fab__top" type="button" aria-label="Lên đầu trang">↑</button>\n' +
'</div>\n\n' +
'<script src="../js/data.js?v=20260804x"></script>\n' +
'<script src="../js/main.js?v=20260804x"></script>\n' +
'</body>\n</html>\n';
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

const generated = [];
DATA.news.forEach(function (n) {
  const filePath = path.join(OUT_DIR, n.slug + '.html');
  fs.writeFileSync(filePath, pageHTML(n), 'utf8');
  generated.push('news/' + n.slug + '.html');
});

console.log('Da sinh ' + generated.length + ' trang:');
generated.forEach(function (f) { console.log(' - ' + f); });

/* Cap nhat sitemap.xml: thay noi dung giua 2 dong marker bang danh sach
   URL bai viet hien tai, giu nguyen phan con lai cua file. */
const sitemapPath = path.join(ROOT, 'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const startMarker = '<!-- BAT-DAU-BAI-VIET (sinh tu dong boi generate_news_pages.js, dung sua tay) -->';
const endMarker = '<!-- KET-THUC-BAI-VIET -->';
const startIdx = sitemap.indexOf(startMarker);
const endIdx = sitemap.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1) {
  console.warn('KHONG tim thay marker trong sitemap.xml - bo qua buoc cap nhat sitemap.');
} else {
  const urlsXML = DATA.news.map(function (n) {
    return '  <url>\n' +
      '    <loc>https://quangthang.vn/news/' + n.slug + '.html</loc>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>0.5</priority>\n' +
      '  </url>';
  }).join('\n');
  const newSitemap = sitemap.slice(0, startIdx + startMarker.length) + '\n' +
    urlsXML + '\n  ' + sitemap.slice(endIdx);
  fs.writeFileSync(sitemapPath, newSitemap, 'utf8');
  console.log('Da cap nhat sitemap.xml voi ' + DATA.news.length + ' URL bai viet.');
}
