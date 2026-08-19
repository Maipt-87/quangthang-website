/* =========================================================================
   QUANG THANG CO.,LTD — Lớp dữ liệu dùng chung cho website + trang admin
   -------------------------------------------------------------------------
   Toàn bộ nội dung (sản phẩm, tin tức, cấu hình, yêu cầu báo giá) được lưu
   trong localStorage nên trang admin có thể thêm / sửa / xoá và các trang
   public đọc lại ngay. DEFAULT_DATA là dữ liệu mẫu khi mở web lần đầu.
   ========================================================================= */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'quangthang_site_v1';

  /* Phiên bản nội dung mẫu trong file này. Khi sửa nội dung mẫu, hãy tăng số
     này lên: bản lưu cũ trong localStorage của khách sẽ bị bỏ qua để họ thấy
     ngay nội dung mới, thay vì kẹt với bản cũ đã lưu từ trước. Dữ liệu lưu
     trên máy chủ (app.py) không bị ảnh hưởng. */
  var CONTENT_VERSION = '2026-08-18.4';

  var IMG = 'imagesP/';

  var DEFAULT_DATA = {
    version: CONTENT_VERSION,
    settings: {
      companyName: 'Công ty TNHH Thương mại Quang Thắng',
      shortName: 'QUANG THANG CO.,LTD',
      slogan: 'Bringing the world of Fragrances & Flavours to YOU',
      tagline: 'Nhà phân phối hương liệu của hãng Givaudan tại Việt Nam',
      heroTitle: 'Hương liệu chuẩn quốc tế<br><span class="line--brand">từ hãng <img class="brand-mark" src="imagesP/logo-givaudan.webp" alt="Givaudan"></span>cho <span class="txt-accent">mỹ phẩm &amp; thực phẩm</span>',
      heroDesc: 'Quang Thắng là nhà cung cấp hương liệu về mỹ phẩm và thực phẩm của hãng Givaudan (Thụy Sĩ) — kèm hỗ trợ kỹ thuật, mẫu thử và chứng từ đầy đủ cho các đơn vị cũng như nhà máy sản xuất tại Việt Nam.',
      address: '998 Nguyễn Trãi, Phường Chợ Lớn, TP.HCM',
      email: 'info998@quangthang.vn',
      phone: '028-38591792 / 38572962 - 38386338',
      hotline: '0904 393978',
      // Mỗi dòng cách nhau bằng ký tự xuống dòng, hiển thị thành nhiều dòng
      workingHours: 'Thứ 2 – Thứ 6: 8:00 – 17:00\nThứ 7: 8:00 – 12:00',
      // Zalo dùng chung số với hotline
      zalo: '0904393978',
      taxCode: '0301260019',
      /* Địa chỉ nhận form (Formspree, EmailJS, Google Form…). Khi điền vào đây,
         yêu cầu của khách được gửi thẳng tới email công ty — cần thiết khi
         website chạy trên host tĩnh như GitHub Pages (không có máy chủ). */
      formEndpoint: 'https://formspree.io/f/xwleedde',
      mapEmbed: 'https://www.google.com/maps?q=998+Nguy%E1%BB%85n+Tr%C3%A3i,+Ph%C6%B0%E1%BB%9Dng+Ch%E1%BB%A3+L%E1%BB%9Bn,+TP.HCM&output=embed',
      stats: [
        { value: 30, suffix: '+', label: 'Năm kinh nghiệm từ 1995' },
        { value: 150, suffix: '+', label: 'Khách hàng bao gồm các nhà máy, cơ sở sản xuất, hộ kinh doanh' },
        { value: 900, suffix: '+', label: 'Dòng hương liệu' },
        { value: 24, suffix: 'h', label: 'Phản hồi yêu cầu mẫu thử' }
      ]
    },

    categories: [
      { id: 'personal-care', name: 'Hương cho Personal Care', desc: 'Hương cho dầu gội, sữa tắm, sữa rửa mặt, kem dưỡng da và các sản phẩm chăm sóc tóc, chăm sóc da.', image: IMG + 'prod-silk-hair.webp' },
      { id: 'home-care', name: 'Hương cho Home Care', desc: 'Hương cho nước giặt, nước xả, nước rửa chén, lau sàn, xịt tẩy rửa, nến thơm và tinh dầu khuếch tán không gian.', image: IMG + 'prod-calm-diffuser.webp' },
      { id: 'fine-fragrance', name: 'Hương cho Fine Fragrance', desc: 'Hương cao cấp cho nước hoa (Eau de Parfum/Toilette) và body mist, theo xu hướng quốc tế.', image: IMG + 'prod-bloom-elegance.webp' },
      { id: 'incense', name: 'Hương cho Nhang – Trầm', desc: 'Dòng hương chuyên biệt dành riêng cho sản xuất nhang, trầm hương và các sản phẩm xông thơm truyền thống.', image: IMG + 'prod-noir-intense.webp' },
      { id: 'food', name: 'Hương cho Thực phẩm', desc: 'Hương cho kem, sữa, bánh kẹo, trà, kẹo dẻo, nước giải khát và các sản phẩm thực phẩm chế biến.', image: IMG + 'prod-strawberry-cream.webp' }
    ],

    industries: [
      {
        id: 'personal-care',
        name: 'Mỹ phẩm & chăm sóc cá nhân',
        image: IMG + 'prod-spa-ritual.webp',
        desc: 'Hương bền màu, ổn định trong nền kem, sữa tắm, dầu gội, xịt khoáng và sản phẩm chăm sóc da.',
        items: ['Kem dưỡng & serum', 'Sữa tắm – dầu gội', 'Xịt khoáng – lăn khử mùi', 'Mỹ phẩm trang điểm']
      },
      {
        id: 'fine-fragrance',
        name: 'Nước hoa & fine fragrance',
        image: IMG + 'prod-bloom-elegance.webp',
        desc: 'Bộ hương cao cấp theo xu hướng quốc tế, hỗ trợ xây dựng hương ký (signature) riêng cho thương hiệu.',
        items: ['Eau de Parfum', 'Eau de Toilette', 'Body mist', 'Nước hoa nam / nữ / unisex']
      },
      {
        id: 'food-beverage',
        name: 'Thực phẩm & đồ uống',
        image: IMG + 'prod-strawberry-cream.webp',
        desc: 'Hương chịu nhiệt cho chế biến, hương trái cây tự nhiên cho nước giải khát, sữa và bánh kẹo.',
        items: ['Nước giải khát – trà sữa', 'Sữa & sản phẩm từ sữa', 'Bánh kẹo – kem', 'Thực phẩm chế biến']
      },
      {
        id: 'home-care',
        name: 'Hoá mỹ phẩm',
        image: IMG + 'prod-citrus-multiclean.webp',
        desc: 'Hương lưu lâu cho nước giặt, nước xả, nước rửa chén, sản phẩm làm sạch và khử mùi không gian.',
        items: ['Nước giặt – nước xả', 'Nước rửa chén', 'Tẩy rửa gia dụng', 'Nến thơm – tinh dầu']
      }
    ],

    /* Tên, mô tả và ghi chú hương của mỗi sản phẩm PHẢI khớp với ảnh minh hoạ
       (image) — không đặt tên gợi ý một mùi hương khác với thứ đang hiển thị
       trong ảnh, dễ gây hiểu lầm cho khách hàng xem catalogue. */
    products: [
      /* --- Hương cho Fine Fragrance --- */
      { id: 'QT-C101', name: 'Peony Élégance', category: 'fine-fragrance', app: 'Nước hoa', image: IMG + 'prod-bloom-elegance.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Hương mẫu đơn (peony) tươi tắn, cánh hoa mềm mại sắc hồng san hô, nốt hương đầu tươi sáng chuyển dần sang nền gỗ mềm. Phù hợp dòng nước hoa nữ cao cấp và body mist.', notes: ['Hương đầu: cam bergamot, lê', 'Hương giữa: mẫu đơn, hoa nhài', 'Hương cuối: gỗ tuyết tùng, xạ hương'], featured: true },
      { id: 'QT-C106', name: 'Orange Blossom', category: 'fine-fragrance', app: 'Nước hoa', image: IMG + 'prod-pearl-blossom.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Hương hoa cam (neroli) sang trọng, tươi sáng với nền ngọt ấm, phù hợp dòng nước hoa nữ dành cho thị trường châu Á.', notes: ['Hương đầu: quả mọng đỏ, chanh', 'Hương giữa: hoa cam, hoa huệ', 'Hương cuối: hổ phách, vani'], featured: true },
      { id: 'QT-C107', name: 'Mint Cool', category: 'fine-fragrance', app: 'Nước hoa', image: IMG + 'prod-moon-light.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Hương bạc hà mát lạnh, sạch sẽ, gợi cảm giác tươi mới suốt ngày dài — phù hợp dòng nước hoa unisex.', notes: ['Hương đầu: bạc hà, chanh xanh', 'Hương giữa: lá violet, hương thảo', 'Hương cuối: gỗ vetiver, xạ hương'], featured: false },
      { id: 'QT-C108', name: 'Rosemary Woods', category: 'fine-fragrance', app: 'Nước hoa', image: IMG + 'prod-emerald-woods.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Hương thảo (rosemary) xanh mát, cân bằng giữa tươi mới và ấm áp, dùng tốt cho dòng nước hoa unisex.', notes: ['Hương đầu: dứa, bergamot', 'Hương giữa: hương thảo, hoa iris', 'Hương cuối: gỗ đàn hương, hoắc hương'], featured: false },
      { id: 'QT-C109', name: 'Fruity Veil', category: 'fine-fragrance', app: 'Body mist', image: IMG + 'prod-sunset-veil.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Hương trái cây nhiệt đới tươi mát, tan nhanh, dành riêng cho dòng body mist và xịt thơm toàn thân.', notes: ['Hương đầu: cam quýt, đào', 'Hương giữa: hoa freesia, dứa', 'Hương cuối: xạ hương mềm'], featured: false },

      /* --- Hương cho Personal Care --- */
      { id: 'QT-C103', name: 'Aloe Fresh', category: 'personal-care', app: 'Chăm sóc cá nhân', image: IMG + 'prod-aqua-fresh.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Hương nha đam (lô hội) mát dịu, trong trẻo, ổn định tốt trong nền sữa tắm và dầu gội. Không gây đổi màu nền sản phẩm.', notes: ['Hương đầu: dưa leo, lá bạc hà', 'Hương giữa: nha đam, hoa sen', 'Hương cuối: xạ hương trắng'], featured: true },
      { id: 'QT-C104', name: 'Rosé Garden', category: 'personal-care', app: 'Chăm sóc da', image: IMG + 'prod-rose-garden.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Hương hoa hồng tự nhiên dịu nhẹ, thích hợp cho kem dưỡng, serum và toner dành cho da nhạy cảm.', notes: ['Hương đầu: hoa hồng tươi', 'Hương giữa: mẫu đơn, vải thiều', 'Hương cuối: xạ hương, gỗ đàn hương'], featured: false },
      { id: 'QT-C105', name: 'Jasmine Silk', category: 'personal-care', app: 'Chăm sóc tóc', image: IMG + 'prod-silk-hair.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Hương hoa lài trắng tinh khiết, lưu trên tóc sau khi sấy, kết hợp công nghệ giữ hương giúp mùi bền suốt ngày.', notes: ['Hương đầu: táo xanh, cam ngọt', 'Hương giữa: hoa lài, dừa', 'Hương cuối: vani, xạ hương'], featured: false },
      { id: 'QT-C110', name: 'Spa Soap Ritual', category: 'personal-care', app: 'Spa & massage', image: IMG + 'prod-spa-ritual.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Bộ hương thư giãn dành cho xà phòng thủ công, sản phẩm spa và sáp thơm dưỡng thể.', notes: ['Hương đầu: cam ngọt', 'Hương giữa: oải hương, phong lữ', 'Hương cuối: gỗ đàn hương, hương trầm'], featured: false },

      /* --- Hương cho Home Care --- */
      { id: 'QT-A201', name: 'Lavender Calm', category: 'home-care', app: 'Nến thơm', image: IMG + 'prod-lavender-calm.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Hương oải hương thuần khiết, chịu nhiệt tốt khi pha vào sáp nến, cho ngọn cháy sạch và toả hương đều.', notes: ['Hương đầu: oải hương tươi', 'Hương giữa: hoa cúc, cây xanh', 'Hương cuối: gỗ tuyết tùng, xạ hương'], featured: true },
      { id: 'QT-A202', name: 'Rose Amber Candle', category: 'home-care', app: 'Nến thơm', image: IMG + 'prod-warm-amber.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Hương hoa hồng ấm áp pha hổ phách, dành cho nến thơm cao cấp và sản phẩm khuếch tán hương phòng.', notes: ['Hương đầu: quế, cam', 'Hương giữa: hoa hồng khô, đinh hương', 'Hương cuối: hổ phách, gỗ trầm'], featured: false },
      { id: 'QT-H501', name: 'Pure Laundry', category: 'home-care', app: 'Nước giặt', image: IMG + 'prod-pure-laundry.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Hương lưu hương lâu cho nước giặt và nước xả vải, giữ mùi thơm tinh khiết bền lâu trên vải sau nhiều giờ phơi.', notes: ['Hương đầu: cam bergamot, ozone tươi mát', 'Hương giữa: hoa lan chuông, xạ hương trắng', 'Hương cuối: gỗ musk, lưu hương trên vải'], featured: true },
      { id: 'QT-H502', name: 'Citrus Multi-Clean', category: 'home-care', app: 'Nước rửa chén – Tẩy rửa đa năng', image: IMG + 'prod-citrus-multiclean.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Hương cam chanh the mát, át mùi dầu mỡ hiệu quả, phù hợp nước rửa chén và dung dịch tẩy rửa đa năng gia dụng.', notes: ['Hương chanh tươi, cam ngọt', 'Trung hoà mùi tanh, mùi dầu mỡ', 'Bền hương ngay cả khi pha loãng'], featured: false },
      { id: 'QT-H503', name: 'Calm Diffuser', category: 'home-care', app: 'Tinh dầu khuếch tán', image: IMG + 'prod-calm-diffuser.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Hương thư giãn dịu nhẹ dành cho máy khuếch tán tinh dầu và tăm hương phòng, lan toả đều trong không gian sống.', notes: ['Hương đầu: cam bergamot, bạc hà nhẹ', 'Hương giữa: hoa oải hương, gỗ tuyết tùng', 'Hương cuối: xạ hương trắng dịu'], featured: false },

      /* --- Hương cho Nhang – Trầm --- */
      { id: 'QT-C102', name: 'Sandalwood Incense', category: 'incense', app: 'Nhang – Trầm hương', image: IMG + 'prod-noir-intense.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Hương gỗ đàn hương (sandalwood) ấm, mộc và sâu lắng, phù hợp sản xuất nhang thơm, nụ trầm và các sản phẩm xông hương truyền thống.', notes: ['Hương đầu: gỗ đàn hương tươi', 'Hương giữa: hổ phách, trầm nhẹ', 'Hương cuối: xạ hương gỗ, ấm lâu bền'], featured: true },
      { id: 'QT-M301', name: 'Bộ tinh dầu pha chế', category: 'incense', app: 'Nguyên liệu – Nhang trầm', image: IMG + 'prod-tinh-dau.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg', desc: 'Tinh dầu tự nhiên và chất định hương dùng cho phòng R&D, hỗ trợ khách hàng tự phát triển công thức hương — bao gồm cả dòng nguyên liệu cho ngành sản xuất nhang, trầm hương.', notes: ['Tinh dầu cam, chanh, sả', 'Absolute hoa nhài, hoa hồng', 'Chất định hương gỗ – xạ hương'], featured: false },

      /* --- Hương cho Thực phẩm --- */
      { id: 'QT-F401', name: 'Citrus Burst', category: 'food', app: 'Đồ uống', image: IMG + 'prod-citrus-burst.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng & dạng bột', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg (dạng lỏng) / Thùng 25kg (dạng bột)', desc: 'Hương cam chanh tươi cho nước giải khát, trà trái cây và nước có gas. Bền màu, không lắng cặn.', notes: ['Đạt tiêu chuẩn phụ gia thực phẩm', 'Không chứa chất bảo quản', 'Hồ sơ COA – MSDS đầy đủ'], featured: true },
      { id: 'QT-F402', name: 'Creamy Vanilla', category: 'food', app: 'Sữa & kem', image: IMG + 'prod-creamy-vanilla.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng & dạng bột', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg (dạng lỏng) / Thùng 25kg (dạng bột)', desc: 'Hương vani sữa béo mịn cho kem, sữa chua, bánh và thức uống pha chế. Ổn định qua tiệt trùng UHT.', notes: ['Chịu nhiệt tốt', 'Không gây đắng hậu vị', 'Phù hợp sản phẩm cho trẻ em'], featured: true },
      { id: 'QT-F403', name: 'Bakery Delight', category: 'food', app: 'Bánh kẹo', image: IMG + 'prod-spice-master.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng & dạng bột', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg (dạng lỏng) / Thùng 25kg (dạng bột)', desc: 'Hương bánh nướng thơm bơ sữa, ngọt ấm, phù hợp bánh ngọt, bánh quy và các sản phẩm nướng công nghiệp.', notes: ['Hương bơ sữa, vani', 'Hương caramel nhẹ', 'Bền nhiệt khi nướng và sấy'], featured: true },
      { id: 'QT-F404', name: 'Savoury Cheese', category: 'food', app: 'Snack', image: IMG + 'prod-savoury-blend.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng & dạng bột', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg (dạng lỏng) / Thùng 25kg (dạng bột)', desc: 'Hương phô mai béo ngậy dùng cho snack, bánh mặn và các sản phẩm phối vị phô mai.', notes: ['Vị béo tự nhiên', 'Hậu vị umami nhẹ', 'Ổn định trong nền bột khô'], featured: false },
      { id: 'QT-F405', name: 'Herbal Green Tea', category: 'food', app: 'Đồ uống', image: IMG + 'prod-herbal-green.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng & dạng bột', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg (dạng lỏng) / Thùng 25kg (dạng bột)', desc: 'Hương trà xanh thảo mộc tươi mát cho trà đóng chai, nước detox và thức uống chức năng.', notes: ['Chiết xuất từ lá trà tự nhiên', 'Không tạo vẩn khi pha loãng', 'Hồ sơ tự nhiên (natural flavour)'], featured: false },
      { id: 'QT-F406', name: 'Golden Butter', category: 'food', app: 'Bánh kẹo', image: IMG + 'prod-golden-curry.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng & dạng bột', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg (dạng lỏng) / Thùng 25kg (dạng bột)', desc: 'Hương bơ béo vàng óng cho bánh, sốt kem và các sản phẩm nướng cao cấp.', notes: ['Màu vàng ổn định', 'Vị béo tự nhiên', 'Bền nhiệt khi nướng'], featured: false },
      { id: 'QT-F407', name: 'Red Apple', category: 'food', app: 'Đồ uống', image: IMG + 'prod-chili-paprika.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng & dạng bột', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg (dạng lỏng) / Thùng 25kg (dạng bột)', desc: 'Hương táo đỏ tươi giòn ngọt cho nước giải khát, snack trái cây và bánh kẹo.', notes: ['Vị táo tươi tự nhiên', 'Hậu vị chua ngọt cân bằng', 'Bền màu, không lắng cặn'], featured: false },
      { id: 'QT-F408', name: 'Strawberry Cream', category: 'food', app: 'Kem – Ice cream', image: IMG + 'prod-strawberry-cream.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng & dạng bột', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg (dạng lỏng) / Thùng 25kg (dạng bột)', desc: 'Hương dâu tây tươi ngọt dịu, chuẩn vị kem que và kem ốc quế, giữ màu hồng tự nhiên hấp dẫn.', notes: ['Vị dâu tươi tự nhiên', 'Chịu nhiệt tốt qua công đoạn đông lạnh', 'Không ám mùi lạ khi bảo quản lâu'], featured: true },
      { id: 'QT-F409', name: 'Fresh Milk', category: 'food', app: 'Sữa & kem', image: IMG + 'prod-fresh-milk.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng & dạng bột', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg (dạng lỏng) / Thùng 25kg (dạng bột)', desc: 'Hương sữa tươi béo ngậy, thơm dịu tự nhiên, phù hợp sữa nước, sữa chua và các loại bánh có nền sữa.', notes: ['Vị sữa tươi nguyên chất', 'Không gây tách lớp trong sản phẩm lỏng', 'Ổn định qua tiệt trùng UHT'], featured: false },
      { id: 'QT-F410', name: 'Matcha Green', category: 'food', app: 'Đồ uống', image: IMG + 'prod-matcha-green.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng & dạng bột', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg (dạng lỏng) / Thùng 25kg (dạng bột)', desc: 'Hương trà xanh matcha đậm vị, hơi chát nhẹ đặc trưng, phù hợp trà sữa, bánh và kem vị matcha.', notes: ['Vị trà xanh Nhật Bản đặc trưng', 'Hậu vị chát nhẹ tự nhiên', 'Bền màu xanh khi qua nhiệt'], featured: true },
      { id: 'QT-F411', name: 'Fruit Gummy', category: 'food', app: 'Bánh kẹo', image: IMG + 'prod-fruit-gummy.webp', origin: 'Givaudan – Singapore', form: 'Chất lỏng & dạng bột', dosage: 'Tuỳ từng sản phẩm – liên hệ chúng tôi để biết chi tiết', packing: 'Can 25kg (dạng lỏng) / Thùng 25kg (dạng bột)', desc: 'Hương trái cây hỗn hợp chua ngọt tươi vui, chuẩn vị kẹo dẻo nhiều màu, được trẻ em yêu thích.', notes: ['Đa vị trái cây: cam, dâu, nho, chanh', 'Bền hương qua công đoạn nấu kẹo', 'Đạt tiêu chuẩn phụ gia thực phẩm'], featured: false }
    ],

    news: [
      { id: 'n1', slug: 'xu-huong-huong-lieu-my-pham-2026', title: 'Xu hướng hương liệu mỹ phẩm 2026: tự nhiên và bền vững', date: '2026-08-15', category: 'Xu hướng', image: IMG + 'prod-coconut-oil.webp', excerpt: 'Người tiêu dùng ngày càng quan tâm tới nguồn gốc nguyên liệu. Hương từ nguyên liệu có nguồn gốc xuất xứ rõ ràng và quy trình sản xuất giảm phát thải, không thử trên động vật và thuần chay trở thành tiêu chí lựa chọn của nhà sản xuất.', content: 'Thị trường mỹ phẩm Việt Nam đang chuyển dịch mạnh sang các dòng sản phẩm có nguồn gốc nguyên liệu và xuất xứ minh bạch. Trong đó, hương liệu là thành phần được kiểm tra kỹ về hồ sơ IFRA, Allergen (khả năng gây dị ứng) và được sản xuất từ nguồn nguyên vật liệu an toàn, có đầy đủ chứng từ đi kèm hương như COA, MSDS, IFRA, allergen, essential oil...\n\nQuang Thắng luôn phối hợp cùng các chuyên gia tạo hương của Givaudan để cung cấp cho khách hàng những hương liệu phù hợp đi theo xu thế của thế giới cũng như cùng khách hàng tạo dựng riêng một sản phẩm mang tính cá nhân, duy nhất theo mong muốn của từng khách hàng.\nHương liệu theo chuẩn Châu Âu và luôn tuân thủ các quy định và hướng dẫn của pháp luật Việt Nam để đưa khách hàng tiếp cận với chuẩn hương thế giới.' },
      { id: 'n2', slug: 'mo-rong-kho-bao-quan-huong-lieu', title: 'Quang Thắng đang trong quá trình nghiên cứu, mở rộng kho bảo quản hương liệu', date: '2026-08-09', category: 'Tin công ty', image: IMG + 'prod-warehouse.webp', excerpt: 'Trước nhu cầu ngày càng tăng từ các nhà máy mỹ phẩm và thực phẩm, Quang Thắng đang nghiên cứu phương án mở rộng kho bảo quản hương liệu tại TP.HCM nhằm nâng cao năng lực lưu trữ và rút ngắn thời gian giao hàng.', content: 'Nhằm đáp ứng nhu cầu tăng nhanh từ các nhà máy mỹ phẩm và thực phẩm, Quang Thắng đang trong quá trình nghiên cứu và lên kế hoạch mở rộng khu kho bảo quản hương liệu, hướng tới hệ thống kiểm soát nhiệt độ hiện đại hơn, tách riêng khu hàng hương mỹ phẩm và hương thực phẩm theo yêu cầu an toàn.\n\nTrong thời gian nghiên cứu mở rộng, công ty vẫn duy trì hệ thống quản lý lô hàng theo mã COA giúp truy xuất nguồn gốc từng can hương, hỗ trợ khách hàng trong các đợt đánh giá nhà cung cấp.' },
      { id: 'n3', slug: 'huong-vi-do-uong-trai-cay-nhiet-doi', title: 'Hương vị đồ uống: nốt trái cây nhiệt đới tiếp tục dẫn đầu', date: '2026-08-06', category: 'Xu hướng', image: IMG + 'prod-cocktail.webp', excerpt: 'Xoài, vải, dừa và chanh dây là những nốt hương được nhà sản xuất đồ uống Việt Nam yêu cầu nhiều nhất trong nửa đầu năm.', content: 'Báo cáo nội bộ từ các đơn hàng mẫu cho thấy nhóm hương trái cây nhiệt đới chiếm hơn một nửa yêu cầu phát triển sản phẩm mới trong ngành đồ uống.\n\nĐiểm đáng chú ý là yêu cầu về hương "thật" hơn — gần với trái cây tươi, hậu vị sạch và ít ngọt — thay cho các nốt hương ngọt đậm của giai đoạn trước.' },
      { id: 'n4', slug: 'thu-nghiem-huong-lieu-tren-nen-san-pham', title: 'Hướng dẫn thử nghiệm hương trên nền sản phẩm thực tế', date: '2026-08-02', category: 'Kiến thức', image: IMG + 'prod-creamy-vanilla.webp', excerpt: 'Một mùi hương đẹp trên giấy thử không đảm bảo giữ nguyên khi vào nền kem hay sữa tắm. Bài viết chia sẻ quy trình thử nghiệm cơ bản.', content: 'Hương liệu phản ứng khác nhau tuỳ nền sản phẩm: pH, chất hoạt động bề mặt, nhiệt độ khi phối trộn đều ảnh hưởng tới mùi cuối cùng.\n\nQuy trình đề xuất gồm 4 bước: thử trên giấy, thử ở nồng độ thấp trong nền trắng, đánh giá sau 24 giờ và theo dõi ổn định trong 4 – 8 tuần ở nhiệt độ 45°C. Bộ phận kỹ thuật của Quang Thắng hỗ trợ khách hàng có nhu cầu để tư vấn cho khách hàng thực hiện các bước (nếu có yêu cầu) khi nhận mẫu.' },
      { id: 'n5', slug: 'huong-lieu-la-gi', title: 'Hương liệu là gì? Phân loại và ứng dụng cơ bản', date: '2026-08-18', category: 'Kiến thức', image: IMG + 'prod-tinh-dau.webp', excerpt: 'Hương liệu là hỗn hợp các chất tạo mùi hoặc tạo vị được phối chế theo công thức riêng, dùng để tạo hương/vị đặc trưng cho sản phẩm. Bài viết giải thích các khái niệm cơ bản trước khi lựa chọn nhà cung cấp.', content: 'Hương liệu (fragrance/flavour) là hỗn hợp nhiều thành phần thơm — có thể chiết xuất tự nhiên hoặc tổng hợp — được các chuyên gia tạo hương (perfumer) phối chế theo công thức riêng để tạo ra một mùi hương hoặc mùi vị đặc trưng, ổn định khi đưa vào sản phẩm cuối.\n\nCó hai nhóm chính: hương liệu mỹ phẩm (dùng cho nước hoa, sữa tắm, dầu gội, mỹ phẩm chăm sóc da) và hương liệu thực phẩm (dùng cho bánh kẹo, đồ uống, sữa, gia vị). Mỗi nhóm có quy chuẩn an toàn riêng — hương mỹ phẩm tuân theo tiêu chuẩn IFRA về nồng độ sử dụng an toàn trên da, còn hương thực phẩm phải đạt tiêu chuẩn phụ gia thực phẩm được phép sử dụng.\n\nKhi lựa chọn nhà cung cấp hương liệu, doanh nghiệp nên ưu tiên đơn vị có đầy đủ hồ sơ COA (Certificate of Analysis), MSDS (an toàn hoá chất) và bảng khai Allergen đi kèm từng lô hàng — đây là các chứng từ bắt buộc khi làm hồ sơ công bố sản phẩm hoặc đánh giá nhà cung cấp theo tiêu chuẩn quốc tế.' },
      { id: 'n6', slug: 'cach-chon-huong-lieu-my-pham-handmade', title: 'Cách chọn hương liệu cho mỹ phẩm handmade', date: '2026-08-11', category: 'Kiến thức', image: IMG + 'prod-soap-bars.webp', excerpt: 'Xà phòng, nến thơm hay mỹ phẩm handmade cần chọn hương liệu phù hợp nền sản phẩm và đúng nồng độ an toàn. Một số lưu ý quan trọng cho người mới bắt đầu.', content: 'Với các xưởng sản xuất nhỏ và người làm mỹ phẩm/nến thơm handmade, việc chọn sai hương liệu là nguyên nhân phổ biến khiến sản phẩm bị tách lớp, đổi màu hoặc mất mùi sau một thời gian ngắn. Trước tiên cần xác định đúng nhóm hương phù hợp nền sản phẩm: hương tan trong dầu cho xà phòng/nến, hương tan trong nước hoặc hệ nhũ tương cho kem và sữa tắm.\n\nNồng độ sử dụng cần tuân theo khuyến nghị IFRA đi kèm mỗi loại hương — dùng quá liều không chỉ gây kích ứng da mà còn có thể vi phạm quy định về mỹ phẩm khi công bố sản phẩm. Với xà phòng lạnh (cold process), độ kiềm cao trong giai đoạn xà phòng hoá cũng có thể làm biến đổi một số nốt hương, nên cần hương liệu được kiểm nghiệm bền với môi trường kiềm.\n\nLuôn thử nghiệm trên mẻ nhỏ, theo dõi ổn định mùi sau 2 – 4 tuần trước khi sản xuất đại trà, và chọn nhà cung cấp có hồ sơ IFRA/Allergen đầy đủ để có thể bổ sung vào hồ sơ công bố sản phẩm khi cần.' },
      { id: 'n7', slug: 'ung-dung-huong-lieu-givaudan-thuc-pham', title: 'Ứng dụng hương liệu Givaudan trong ngành thực phẩm', date: '2026-08-04', category: 'Kiến thức', image: IMG + 'prod-savoury-blend.webp', excerpt: 'Từ đồ uống, bánh kẹo đến gia vị chế biến — hương liệu Givaudan được ứng dụng rộng trong ngành thực phẩm Việt Nam nhờ danh mục đa dạng và hồ sơ an toàn đầy đủ.', content: 'Là nhà phân phối hương liệu Hoá mỹ phẩm của Givaudan tại Việt Nam, Quang Thắng cung cấp hương thực phẩm cho nhiều nhóm ngành: đồ uống (trái cây, trà, cà phê), bánh kẹo, kem – sữa, snack và gia vị chế biến. Mỗi nhóm ngành có yêu cầu kỹ thuật khác nhau về độ bền nhiệt, khả năng chịu tiệt trùng UHT hoặc ổn định qua công đoạn nướng.\n\nDanh mục hương thực phẩm Givaudan được phát triển dựa trên xu hướng khẩu vị theo từng thị trường, kết hợp cùng đội ngũ kỹ thuật để hiệu chỉnh phù hợp khẩu vị người tiêu dùng Việt Nam. Toàn bộ hương đi kèm hồ sơ COA, MSDS và tuân thủ quy định phụ gia thực phẩm hiện hành.\n\nDoanh nghiệp sản xuất thực phẩm có nhu cầu phát triển sản phẩm mới có thể liên hệ Quang Thắng để nhận mẫu thử và được đội ngũ kỹ thuật tư vấn hương phù hợp với nền sản phẩm và quy trình sản xuất thực tế.' }
    ],

    /* KHÔNG ghi tên doanh nghiệp khác vào đây nếu chưa có văn bản đồng ý của họ —
       nêu tên khách hàng/đối tác không phép là hành vi có thể bị kiện. Mặc định
       chỉ mô tả NHÓM khách hàng, không nêu tên. */
    partners: [
      'Nhà máy mỹ phẩm', 'Cơ sở chăm sóc cá nhân', 'Nhà máy thực phẩm',
      'Doanh nghiệp đồ uống', 'Cơ sở bánh kẹo', 'Nhà máy hoá mỹ phẩm',
      'Xưởng nến thơm & tinh dầu', 'Đơn vị gia công xuất khẩu'
    ],

    /* CHỈ liệt kê chứng nhận công ty thực sự đang nắm giữ và còn hiệu lực.
       Công bố chứng nhận không có là quảng cáo sai sự thật. */
    certificates: [
      { name: 'Giấy phép kinh doanh', desc: 'Đăng ký ngành nghề nhập khẩu và phân phối hương liệu, phụ gia thực phẩm.' },
      { name: 'Hồ sơ IFRA / COA / MSDS / ALLERGEN', desc: 'Cung cấp theo từng lô hàng do nhà sản xuất phát hành, phục vụ đánh giá nhà cung cấp.' },
      { name: 'Công bố sản phẩm', desc: 'Hỗ trợ khách hàng tư vấn hoàn thiện hồ sơ công bố theo quy định hiện hành.' }
      // Thêm chứng nhận khác (ISO, HALAL…) tại đây khi công ty thực sự có — kèm số hiệu và thời hạn.
      // Chỉ liệt kê chứng nhận đang còn hiệu lực; công bố chứng nhận không có là quảng cáo sai sự thật.
    ],

    quotes: []
  };

  /* ======================== Nơi lưu dữ liệu ==============================
     Khi website được mở qua app.py (http://), dữ liệu lưu xuống file
     data/site-data.json trên máy chủ — mọi máy truy cập đều thấy cùng nội
     dung. Khi mở trực tiếp bằng file:// hoặc máy chủ không có API, tự động
     quay về localStorage của trình duyệt.
     ===================================================================== */

  // Dùng đường dẫn tuyệt đối (bắt đầu bằng /) để các trang nằm trong thư
  // mục con (news/<bài viết>.html) vẫn gọi đúng /api/data thay vì
  // /news/api/data khi chạy qua app.py.
  var API = '/api/data';
  var apiUsable = /^https?:$/.test(global.location.protocol);

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /** Gọi API đồng bộ để giữ nguyên giao diện hàm load()/save(). */
  function apiRequest(method, payload) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, API + (method === 'GET' ? '?t=' + Date.now() : ''), false);
    if (payload) xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(payload || null);
    return xhr;
  }

  /** Bổ sung khoá còn thiếu nếu dữ liệu được lưu từ phiên bản trước. */
  function fillMissing(data) {
    Object.keys(DEFAULT_DATA).forEach(function (key) {
      if (data[key] === undefined) data[key] = clone(DEFAULT_DATA[key]);
    });
    Object.keys(DEFAULT_DATA.settings).forEach(function (key) {
      if (data.settings[key] === undefined) data.settings[key] = DEFAULT_DATA.settings[key];
    });
    return data;
  }

  /** Cập nhật bản lưu cũ trên máy chủ theo phiên bản nội dung mới.
      Khác với localStorage (xoá luôn), ở đây phải giữ lại nội dung admin đã
      nhập, chỉ làm mới những trường có thay đổi về định dạng. */
  function migrateServerData(data) {
    if (data.version === CONTENT_VERSION) return data;
    // Giờ làm việc trước đây lưu một dòng, nay tách nhiều dòng
    data.settings.workingHours = DEFAULT_DATA.settings.workingHours;
    data.version = CONTENT_VERSION;
    save(data);
    return data;
  }

  function load() {
    if (apiUsable) {
      try {
        var xhr = apiRequest('GET');
        if (xhr.status === 200) return migrateServerData(fillMissing(JSON.parse(xhr.responseText)));
        if (xhr.status === 404) {
          // 404 kiểu JSON là của app.py (chưa có nội dung nào được lưu).
          // 404 kiểu HTML là của máy chủ tĩnh (GitHub Pages…) — không có API.
          if ((xhr.getResponseHeader('Content-Type') || '').indexOf('json') !== -1) {
            return clone(DEFAULT_DATA);
          }
          apiUsable = false;
        } else {
          apiUsable = false;                                  // máy chủ không có API
        }
      } catch (err) {
        apiUsable = false;
      }
    }
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(DEFAULT_DATA);
      var saved = JSON.parse(raw);
      if (saved.version !== CONTENT_VERSION) {
        // Bản lưu trong trình duyệt thuộc phiên bản nội dung cũ — bỏ đi để
        // khách xem thấy đúng nội dung mới nhất của website. Riêng các yêu cầu
        // liên hệ đã nhận thì giữ lại, không được để mất.
        var fresh = clone(DEFAULT_DATA);
        if (Array.isArray(saved.quotes) && saved.quotes.length) fresh.quotes = saved.quotes;
        global.localStorage.removeItem(STORAGE_KEY);
        return fresh;
      }
      return fillMissing(saved);
    } catch (err) {
      console.warn('Không đọc được dữ liệu đã lưu, dùng dữ liệu mẫu.', err);
      return clone(DEFAULT_DATA);
    }
  }

  function save(data) {
    data.version = CONTENT_VERSION;      // đánh dấu bản lưu theo phiên bản hiện tại
    var json = JSON.stringify(data);
    if (apiUsable) {
      try {
        var xhr = apiRequest('POST', json);
        if (xhr.status === 200) return true;
        apiUsable = false;
      } catch (err) {
        apiUsable = false;
      }
    }
    try {
      global.localStorage.setItem(STORAGE_KEY, json);
      return true;
    } catch (err) {
      console.error('Không lưu được dữ liệu:', err);
      return false;
    }
  }

  function reset() {
    if (apiUsable) {
      try {
        apiRequest('DELETE');
      } catch (err) {
        apiUsable = false;
      }
    }
    try {
      global.localStorage.removeItem(STORAGE_KEY);
    } catch (err) { /* bỏ qua */ }
    return clone(DEFAULT_DATA);
  }

  /** Cho trang admin biết nội dung đang được lưu ở đâu. */
  function storageInfo() {
    return apiUsable
      ? { mode: 'server', label: 'File data/site-data.json trên máy chủ (app.py)' }
      : { mode: 'local', label: 'localStorage của trình duyệt (khoá ' + STORAGE_KEY + ')' };
  }

  global.QTData = {
    STORAGE_KEY: STORAGE_KEY,
    defaults: DEFAULT_DATA,
    load: load,
    save: save,
    reset: reset,
    clone: clone,
    storageInfo: storageInfo
  };
})(window);
