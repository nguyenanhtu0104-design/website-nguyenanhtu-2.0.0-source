const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, PageOrientation, LevelFormat, HeadingLevel, BorderStyle, VerticalAlign, PageBreak, Footer, PageNumber } = require('docx');
const D = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const W = 15138, F = 'Arial';
const MAU = { logic: ['Xanh dương', 'EFF6FF', '1E3A8A'], 'niem-tin': ['Vàng', 'FFFBEB', '92400E'], 'phu-hop': ['Xanh lá', 'ECFDF5', '065F46'] };
const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFC5CC' };
const borders = { top: border, bottom: border, left: border, right: border };
const r = (t, o = {}) => new TextRun({ text: t, font: F, size: o.size || 20, bold: o.b, italics: o.i, color: o.c });
const p = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [runs], spacing: { before: o.before || 0, after: o.after ?? 60 }, alignment: o.al, numbering: o.num ? { reference: 'b', level: 0 } : undefined, keepNext: o.keepNext });
const cell = (kids, w, o = {}) => new TableCell({ children: (Array.isArray(kids) ? kids : [kids]).map((k) => (typeof k === 'string' ? p(r(k, o)) : k)), width: { size: w, type: WidthType.DXA }, borders, shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined, margins: { top: 70, bottom: 70, left: 100, right: 100 }, verticalAlign: VerticalAlign.TOP, columnSpan: o.span });
const head = (labels, ws, fill = '1F2933') => new TableRow({ tableHeader: true, children: labels.map((l, i) => cell(p(r(l, { b: true, c: 'FFFFFF', size: 19 })), ws[i], { fill })) });
const table = (ws, rows) => new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: ws, rows });
const hint = (t) => p(r(t, { i: true, c: '7A8590', size: 18 }));
const blankLines = (n) => Array.from({ length: n }, () => p(r('')));

function build(X, file, laMau) {
  const kids = [];
  kids.push(p(r(laMau ? 'MẪU NHẬP ĐÁNH GIÁ DỰ ÁN' : `ĐÁNH GIÁ DỰ ÁN · ${X.ten.toUpperCase()}`, { b: true, size: 36 }), { after: 80 }));
  kids.push(p(r('Hai phần: (1) đánh giá tổng quan trên trang dự án — SWOT và thang điểm 1–5; (2) bản đánh giá chi tiết theo bộ tiêu chí tự đánh giá — 29 thẻ.', { size: 21, c: '4A5560' }), { after: 160 }));
  const iw = [3600, W - 3600];
  kids.push(table(iw, [
    ['Tên dự án', X.ten], ['Bài dự án trên web (đường dẫn)', X.slug ? `nguyenanhtu.vn/cam-nang/${X.slug}/` : ''], ['Hồ sơ dự án cập nhật', X.capNhat || ''], ['Ngày đánh giá', ''], ['Người đánh giá', 'Nguyễn Anh Tú'],
  ].map(([a, b]) => new TableRow({ children: [cell(p(r(a, { b: true })), iw[0], { fill: 'F2F4F6' }), cell(p(r(b)), iw[1])] }))));
  kids.push(p(r('Cách điền', { b: true, size: 24 }), { before: 200, after: 60 }));
  [
    'Chỉ điền vào ô trống. Ô nào chưa có thông tin cứ để trống — Claude sẽ bổ sung từ hồ sơ dự án và bài trên web, đánh dấu để anh duyệt lại.',
    'Điểm từ 1 đến 5, cho phép nửa điểm (ví dụ 4,5). Web tự tính điểm trung bình nhóm và tổng điểm.',
    'Phần 1 là nhận định của anh, viết tự do. Phần 2: cột "Dữ kiện" chỉ ghi thông tin, số liệu, tài liệu — không lời khuyên, không đánh giá; nhận định của anh ghi ở cột "Nhận xét".',
    'Gửi file này cùng Template nhập liệu & trình bày dự án khi hoàn thiện một dự án.',
  ].forEach((t) => kids.push(p(r(t, { size: 21 }), { num: true })));

  // PHẦN 1
  kids.push(p(new PageBreak()));
  kids.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [r('PHẦN 1 · ĐÁNH GIÁ TỔNG QUAN TRÊN TRANG DỰ ÁN', { b: true, size: 30 })] }));
  kids.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [r('1.1 Phân tích SWOT', { b: true, size: 26 })] }));
  kids.push(hint('Mỗi ô: ý chính (in đậm trên web) và phần diễn giải. Dòng kết luận hiện dạng mũi tên ở cuối ô, ví dụ "→ Thanh khoản cao → Giá trị gia tăng".'));
  const sw = [600, 4200, W - 4800];
  [['S', 'ĐIỂM MẠNH', '0B7A55'], ['W', 'ĐIỂM YẾU', 'B0382A'], ['O', 'CƠ HỘI', '1E40AF'], ['T', 'THÁCH THỨC', '92650E']].forEach(([k, lab, col]) => {
    const q = X.swot ? X.swot[k] : { items: [], kl: '' };
    const items = q.items.slice(); while (items.length < Math.max(5, q.items.length + 1)) items.push(['', '']);
    kids.push(p(r(''), { after: 40 }));
    kids.push(table(sw, [
      head(['#', `${lab} · Ý chính`, 'Diễn giải'], sw, col),
      ...items.map((it, i) => new TableRow({ children: [cell(p(r(String(i + 1))), sw[0]), cell(p(r(it[0], { b: true })), sw[1]), cell(p(r(it[1])), sw[2])] })),
      new TableRow({ children: [cell(p(r('→', { b: true })), sw[0], { fill: 'F2F4F6' }), cell(p(r('Dòng kết luận (nếu có)', { i: true })), sw[1], { fill: 'F2F4F6' }), cell(p(r(q.kl || '')), sw[2], { fill: 'F2F4F6' })] }),
    ]));
  });
  kids.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [r('1.2 Thang điểm đánh giá 1–5', { b: true, size: 26 })], pageBreakBefore: true }));
  kids.push(hint('Quy ước: 1 = yếu / rủi ro cao · 3 = trung bình · 5 = rất tốt. Tổng điểm = trung bình 6 tiêu chí (CĐT · Pháp lý · Chính sách · Vị trí · Cư dân · Nhà đầu tư); 3 nhóm sau lấy trung bình các chỉ số con.'));
  const tw = [3200, 6400, 1500, W - 11100];
  const rows = [head(['Nhóm', 'Tiêu chí', 'Điểm (1–5)', 'Ghi chú'], tw)];
  D.tieuChi.forEach(([g, cr]) => cr.forEach((c, i) => rows.push(new TableRow({ children: [cell(p(r(i ? '' : g, { b: true })), tw[0], { fill: i ? undefined : 'F2F4F6' }), cell(p(r(c)), tw[1]), cell(p(r(X.diem[c] || '', { b: true }), { al: AlignmentType.CENTER }), tw[2], { fill: 'FFFBEA' }), cell(p(r('')), tw[3])] }))));
  kids.push(table(tw, rows));

  // PHẦN 2
  kids.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [r('PHẦN 2 · BẢN ĐÁNH GIÁ CHI TIẾT (BỘ TIÊU CHÍ TỰ ĐÁNH GIÁ)', { b: true, size: 30 })] }));
  kids.push(hint('Đây là bản khách mở bằng nút "Xem đánh giá của Tú". Điểm của anh nhân với trọng số của khách, nên chỉ cần chấm mức dự án đáp ứng từng câu (1–5). Màu của thẻ chỉ để anh biết thẻ thuộc tầng nào; khách không thấy tên tầng khi chấm.'));
  kids.push(hint(laMau ? 'Cột Dữ kiện: dòng in nghiêng xám là gợi ý những dữ kiện cần có — xóa đi và ghi số liệu của dự án.' : 'Cột Dữ kiện: đã điền sẵn từ hồ sơ dự án đang có trên web; anh sửa hoặc bổ sung. Ô trống là chỗ chưa có số liệu.'));
  const cw = [800, 1100, 3400, 5338, 1100, 3400];
  D.chuDe.forEach((cd) => {
    kids.push(p(r(`${cd.id} · ${cd.ten}`, { b: true, size: 26 }), { before: 240, after: 80, keepNext: true }));
    const rows = [head(['Mã', 'Màu', 'Vấn đề đặt ra', 'Dữ kiện dự án — chỉ thông tin, số liệu', 'Điểm Tú (1–5)', 'Nhận xét của Tú'], cw)];
    D.the.filter((c) => c.chuDe === cd.id).forEach((c) => {
      const m = MAU[c.tang], pd = X.the[c.id];
      let dk = pd && pd.duKien && pd.duKien.length ? pd.duKien.map((f) => p(r(f))) : c.duKienGoiY.map((f) => hint('Gợi ý: ' + f));
      if (c.theoDuAn) dk = dk.concat([p(r('Các lựa chọn để khách chọn (chính sách thực tế của dự án):', { b: true }), { before: 60 }), p(r(pd && pd.luaChon ? pd.luaChon.join(' · ') : ''))]);
      rows.push(new TableRow({ cantSplit: true, children: [
        cell(p(r(c.id, { b: true })), cw[0]), cell(p(r(m[0], { c: m[2], b: true, size: 18 })), cw[1], { fill: m[1] }),
        cell([p(r(c.ten, { b: true })), p(r(c.vanDe))], cw[2]), cell(dk, cw[3]), cell(p(r('', { b: true }), { al: AlignmentType.CENTER }), cw[4], { fill: 'FFFBEA' }), cell(p(r('')), cw[5]),
      ] }));
    });
    kids.push(table(cw, rows));
  });
  kids.push(p(r('Duyệt công bố bản đánh giá chi tiết:  ☐ Có, công bố    ☐ Chưa, để nháp', { b: true, size: 22 }), { before: 300 }));

  const doc = new Document({
    styles: { default: { document: { run: { font: F, size: 22 } } }, paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: F, size: 30, bold: true }, paragraph: { spacing: { before: 120, after: 160 }, keepNext: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: F, size: 26, bold: true }, paragraph: { spacing: { before: 240, after: 100 }, keepNext: true, outlineLevel: 1 } }] },
    numbering: { config: [{ reference: 'b', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 260 } } } }] }] },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 850, bottom: 850, left: 850, right: 850 } } },
      footers: { default: new Footer({ children: [p([r((laMau ? 'Mẫu nhập đánh giá dự án' : X.ten) + ' · nguyenanhtu.vn · trang ', { size: 16, c: '7A8590' }), new TextRun({ children: [PageNumber.CURRENT], font: F, size: 16, color: '7A8590' })], { al: AlignmentType.RIGHT })] }) },
      children: kids }],
  });
  return Packer.toBuffer(doc).then((b) => fs.writeFileSync(file, b));
}
Promise.all([build(D.mau, 'Mau-nhap-danh-gia-du-an.docx', true), build(D.nm, 'Danh-gia-Nam-Mekong-Grand-Plaza.docx', false)]).then(() => console.log('ok'));
