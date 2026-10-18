// Google Apps Script: nhận lead từ website và ghi vào Google Sheet theo cấu phần.
// Tab "Tất cả lead": mọi lead. Mỗi dự án có thêm một tab riêng. Tab "Tổng quan": thống kê tự động.

const SECRET = 'DOI_MA_NAY_THANH_CHUOI_BAT_KY_DAI';   // phải trùng biến SHEET_SECRET trên Cloudflare
const ALL = 'Tất cả lead';

// [nhóm, màu, [tiêu đề cột...]]
const GROUPS = [
  ['MÃ', '#37474f', ['Thời gian', 'Mã lead']],
  ['LIÊN HỆ', '#0b5d56', ['Họ tên', 'SĐT/Zalo', 'Email', 'Kênh nhận']],
  ['DỰ ÁN', '#1a5276', ['Dự án', 'Khu vực', 'Tài liệu']],
  ['NHU CẦU', '#7d6608', ['Nhu cầu', 'Ngân sách', 'Phương án khách tính']],
  ['MỨC ĐỘ QUAN TÂM', '#922b21', ['Điểm', 'Mức độ', 'Số lần vào trang', 'Số tương tác', 'Số dự án đã xem']],
  ['NGUỒN', '#5b2c6f', ['Nguồn', 'Kênh', 'Chiến dịch', 'Trang vào']],
  ['XỬ LÝ', '#b8894a', ['Trạng thái', 'Người phụ trách', 'Ghi chú']],
  ['PHÁP LÝ', '#566573', ['Đồng ý xử lý dữ liệu']],
  ['FILE', '#117a65', ['File PDF phương án']],
];
const PDF_FOLDER = 'Lead - Phương án PDF';
const HEAD = GROUPS.reduce((a, g) => a.concat(g[2]), []);

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.secret !== SECRET) return out({ ok: false, error: 'secret' });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const row = [
      d.time, d.id,
      d.name, "'" + d.phone, d.email, d.channel,
      d.project, d.area || '', d.doc,
      d.purpose, d.budget, d.calc || '',
      d.score, d.temp, d.visits || 0, d.interactions || 0, d.projectsViewed || 0,
      d.source, d.medium || '', d.campaign, d.page,
      'Mới', '', '',
      d.consent,
      '',
    ];
    let pdfUrl = '';
    if (d.pdf) {
      try {
        const f = getFolder().createFile(Utilities.newBlob(Utilities.base64Decode(d.pdf), 'application/pdf', d.pdfName || ('PhuongAn-' + d.id + '.pdf')));
        pdfUrl = f.getUrl();
        row[row.length - 1] = pdfUrl;
      } catch (err2) { row[row.length - 1] = 'Lỗi lưu PDF: ' + err2; }
    }
    getSheet(ss, ALL).appendRow(row);
    getSheet(ss, String(d.project || 'Khác').slice(0, 90)).appendRow(row);
    ensureOverview(ss);
    return out({ ok: true, pdfUrl: pdfUrl });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function getSheet(ss, name) {
  let sh = ss.getSheetByName(name);
  if (sh) { ensureLastColumn(sh); return sh; }
  sh = ss.insertSheet(name);
  const n = HEAD.length;
  // Hàng 1: tên nhóm; hàng 2: tiêu đề cột
  let c = 1;
  GROUPS.forEach(function (g) {
    const w = g[2].length;
    const band = sh.getRange(1, c, 1, w);
    band.merge().setValue(g[0]).setBackground(g[1]).setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
    sh.getRange(2, c, 1, w).setValues([g[2]]).setBackground(g[1]).setFontColor('#ffffff').setFontWeight('bold').setWrap(true);
    c += w;
  });
  sh.setFrozenRows(2);
  sh.setFrozenColumns(4);
  const st = HEAD.indexOf('Trạng thái') + 1, tp = HEAD.indexOf('Mức độ') + 1;
  sh.getRange(3, st, 998, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Mới', 'Đã liên hệ', 'Hẹn xem', 'Đang tư vấn', 'Đã cọc', 'Không phù hợp'], true).build());
  const rg = [sh.getRange(3, tp, 998, 1)];
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Nóng').setBackground('#f4b6b0').setRanges(rg).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Ấm').setBackground('#fde9b0').setRanges(rg).build(),
  ]);
  sh.setColumnWidths(1, n, 120);
  sh.setColumnWidth(HEAD.indexOf('Phương án khách tính') + 1, 280);
  sh.setColumnWidth(HEAD.indexOf('Ghi chú') + 1, 220);
  return sh;
}

function getFolder() {
  const it = DriveApp.getFoldersByName(PDF_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(PDF_FOLDER);
}

// Sheet tạo từ phiên bản cũ: thêm cột "File PDF phương án" vào cuối
function ensureLastColumn(sh) {
  const n = HEAD.length;
  if (sh.getLastColumn() >= n) return;
  const g = GROUPS[GROUPS.length - 1];
  sh.getRange(1, n).setValue(g[0]).setBackground(g[1]).setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange(2, n).setValue(g[2][0]).setBackground(g[1]).setFontColor('#ffffff').setFontWeight('bold').setWrap(true);
  sh.setColumnWidth(n, 220);
}

// Tab "Tổng quan": đếm lead theo dự án và mức độ (công thức, tự cập nhật)
function ensureOverview(ss) {
  if (ss.getSheetByName('Tổng quan')) return;
  const sh = ss.insertSheet('Tổng quan', 0);
  const A = "'" + ALL + "'!";
  const proj = HEAD.indexOf('Dự án') + 1, temp = HEAD.indexOf('Mức độ') + 1, stat = HEAD.indexOf('Trạng thái') + 1;
  const col = function (i) { return String.fromCharCode(64 + i); };
  sh.getRange('A1').setValue('TỔNG QUAN LEAD').setFontWeight('bold').setFontSize(14);
  sh.getRange('A3:F3').setValues([['Dự án', 'Tổng lead', 'Nóng', 'Ấm', 'Mới', 'Chưa xử lý']]).setFontWeight('bold').setBackground('#0b5d56').setFontColor('#fff');
  sh.getRange('A4').setFormula('=IFERROR(UNIQUE(FILTER(' + A + col(proj) + '3:' + col(proj) + ',' + A + col(proj) + '3:' + col(proj) + '<>"")),"")');
  const r = col(proj) + '3:' + col(proj), t = col(temp) + '3:' + col(temp), s = col(stat) + '3:' + col(stat);
  sh.getRange('B4:B30').setFormula('=IF($A4="","",COUNTIF(' + A + r + ',$A4))');
  sh.getRange('C4:C30').setFormula('=IF($A4="","",COUNTIFS(' + A + r + ',$A4,' + A + t + ',"Nóng"))');
  sh.getRange('D4:D30').setFormula('=IF($A4="","",COUNTIFS(' + A + r + ',$A4,' + A + t + ',"Ấm"))');
  sh.getRange('E4:E30').setFormula('=IF($A4="","",COUNTIFS(' + A + r + ',$A4,' + A + t + ',"Mới"))');
  sh.getRange('F4:F30').setFormula('=IF($A4="","",COUNTIFS(' + A + r + ',$A4,' + A + s + ',"Mới"))');
  sh.setColumnWidth(1, 220);
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
