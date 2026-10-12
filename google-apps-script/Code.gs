// Google Apps Script: nhận lead từ website và ghi vào Google Sheet.
// Cách cài: xem LEAD_SYSTEM_HUONG_DAN.md, bước 1.

const SECRET = 'DOI_MA_NAY_THANH_CHUOI_BAT_KY_DAI';   // phải trùng biến SHEET_SECRET trên Cloudflare
const SHEET_NAME = 'Leads';

const HEADERS = ['Thời gian','Mã lead','Họ tên','SĐT/Zalo','Email','Kênh nhận','Dự án','Tài liệu',
  'Mục đích','Ngân sách','Điểm','Mức độ','Nguồn','Chiến dịch','Trang','Đồng ý xử lý dữ liệu','Phương án khách tính','Trạng thái','Ghi chú'];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.secret !== SECRET) return out({ ok: false, error: 'secret' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(SHEET_NAME);
      sh.appendRow(HEADERS);
      sh.setFrozenRows(1);
    }
    sh.appendRow([
      d.time, d.id, d.name, "'" + d.phone, d.email, d.channel, d.project, d.doc,
      d.purpose, d.budget, d.score, d.temp, d.source, d.campaign, d.page, d.consent, d.calc || '',
      'Mới', ''
    ]);
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
