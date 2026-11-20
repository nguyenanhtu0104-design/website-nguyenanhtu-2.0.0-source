// Cloudflare Pages Function: POST /api/tim-nha
// Nhận phiếu từ trang Tìm nhà / sa bàn dự án: yêu cầu căn, ký gửi, đặt lịch tư vấn.
// Dùng lại biến môi trường của /api/lead: SHEET_WEBHOOK_URL, SHEET_SECRET, RESEND_API_KEY, MAIL_FROM, NOTIFY_TO, SITE_URL.
// Chỉ trả stored:true khi Google Sheet xác nhận đã ghi. Trang web chỉ hiện "Đã nhận" khi có stored:true.

const KINDS = {
  request: 'Yêu cầu căn',
  consign: 'Ký gửi căn',
  callback: 'Đặt lịch tư vấn',
  thamvan: 'Tham vấn qua Zalo',
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const clip = (s, n) => String(s ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function normPhone(v) {
  let d = String(v || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+84')) d = '0' + d.slice(3);
  else if (d.startsWith('84') && d.length === 11) d = '0' + d.slice(2);
  return d;
}

function allowedOrigin(origin, siteUrl, requestUrl) {
  try {
    const site = new URL(siteUrl);
    const allowed = new Set([site.origin, `${site.protocol}//www.${site.host.replace(/^www\./, '')}`, new URL(requestUrl).origin]);
    return allowed.has(origin);
  } catch {
    return false;
  }
}

async function appendSheet(env, row) {
  if (!env.SHEET_WEBHOOK_URL) return { ok: false, error: 'sheet_not_configured' };
  const res = await fetch(env.SHEET_WEBHOOK_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'content-type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret: env.SHEET_SECRET, ...row }),
  });
  if (!res.ok) return { ok: false, error: `sheet_${res.status}` };
  try {
    const j = await res.json();
    return { ok: !!j.ok, error: j.ok ? undefined : 'sheet_rejected' };
  } catch {
    return { ok: false, error: 'sheet_bad_response' };
  }
}

async function sendMail(env, { to, subject, html, text, replyTo, attachments, scheduledAt }) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !to) return { ok: false };
  const body = { from: env.MAIL_FROM, to: [to], subject, html, text };
  if (replyTo) body.reply_to = replyTo;
  if (attachments && attachments.length) body.attachments = attachments;
  if (scheduledAt) body.scheduled_at = scheduledAt;            // Resend cho hẹn tối đa 30 ngày
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: res.ok };
}

// ---- tự động hoá ký gửi (PROJECT_RULES §16.7), không cần Zalo OA ----
const NGAY_CHAM_SOC = 15;
const b64 = (str) => { const u = new TextEncoder().encode(str); let s = ''; for (const c of u) s += String.fromCharCode(c); return btoa(s); };
const icsEsc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
function icsFold(line) {                       // RFC 5545: tối đa 75 byte mỗi dòng, dòng nối bắt đầu bằng dấu cách
  const enc = new TextEncoder(); const out = []; let cur = '';
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ''; }
    cur += ch;
  }
  out.push(cur); return out.join('\r\n ');
}
const icsTime = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function hanChamSoc(now = new Date()) {         // 9 giờ sáng giờ Việt Nam (02:00 UTC), sau 15 ngày
  const d = new Date(now.getTime() + NGAY_CHAM_SOC * 86400000); d.setUTCHours(2, 0, 0, 0); return d;
}
function lichChamSoc({ id, unit, name, phone, project, han }) {
  const ket = new Date(han.getTime() + 30 * 60000);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//nguyenanhtu.vn//tim-nha//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${id}@nguyenanhtu.vn`, `DTSTAMP:${icsTime(new Date())}`, `DTSTART:${icsTime(han)}`, `DTEND:${icsTime(ket)}`,
    `SUMMARY:${icsEsc(`Chăm sóc ký gửi ${unit} (${id})`)}`,
    `DESCRIPTION:${icsEsc(`${project} · ${name} · ${phone}\nHỏi chủ nhà căn đã giao dịch chưa, giá có đổi không, rồi cập nhật giỏ hàng.\nZalo: https://zalo.me/${phone}`)}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-PT15M', `DESCRIPTION:${icsEsc('Chăm sóc ký gửi ' + unit)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'];
  return lines.map(icsFold).join('\r\n') + '\r\n';
}
const khung = (inner) => `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:560px">${inner}<p style="margin-top:22px;color:#666;font-size:13px">Nguyễn Anh Tú · Tư vấn bất động sản Đông Nam Bộ<br><a href="https://nguyenanhtu.vn">nguyenanhtu.vn</a></p></div>`;

export async function onRequestPost({ request, env }) {
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }
  const siteUrl = env.SITE_URL || 'https://nguyenanhtu.vn';
  const origin = request.headers.get('origin');
  if (origin && !allowedOrigin(origin, siteUrl, request.url)) return json({ ok: false, error: 'origin' }, 403);

  // Chống bot: ô ẩn bị điền hoặc gửi quá nhanh thì im lặng bỏ qua (không báo "đã nhận")
  if (b.website || Number(b.t) < 1200) return json({ ok: false, error: 'rejected' }, 400);

  const kind = KINDS[b.kind] ? b.kind : null;
  if (!kind) return json({ ok: false, error: 'kind' }, 400);
  // Tham vấn qua Zalo: khách bấm chat sau khi đã chọn căn. Trang mở Zalo cho khách ngay, phiếu này chỉ chuyển
  // bản tóm tắt (căn, phương thức, giá cuối, liên kết phiếu) cho tư vấn. Không bắt buộc tên, không nhận số điện thoại.
  const thamVan = kind === 'thamvan';
  const name = clip(b.name, 80) || (thamVan ? 'Khách chat Zalo' : '');
  const phone = thamVan ? '' : normPhone(b.phone);
  if (name.length < 2) return json({ ok: false, error: 'name' }, 400);
  if (!thamVan && !/^0\d{9}$/.test(phone)) return json({ ok: false, error: 'phone' }, 400);
  if (!thamVan && b.consent !== true) return json({ ok: false, error: 'consent' }, 400);

  const project = clip(b.project, 80) || 'Blanca City';
  const units = (Array.isArray(b.units) ? b.units : []).slice(0, 20).map((u) => clip(u, thamVan ? 320 : 80)).filter(Boolean);
  if (thamVan && !units.length) return json({ ok: false, error: 'units' }, 400);
  const maPhieu = thamVan ? clip(b.maPhieu, 16).replace(/[^A-Z0-9]/gi, '') : '';
  let link = '';
  if (thamVan) { try { const u = new URL(clip(b.link, 4000)); if (u.protocol === 'https:' || u.hostname === 'localhost' || u.hostname === '127.0.0.1') link = u.href; } catch { link = ''; } }
  if (kind === 'request' && !units.length && !clip(b.note, 400)) return json({ ok: false, error: 'units' }, 400);
  if (kind === 'consign' && !clip(b.unit, 160)) return json({ ok: false, error: 'unit' }, 400);

  // Số tiền: chỉ nhận số nguyên dương hợp lý, tính lại ở máy chủ chứ không tin số do trình duyệt gửi.
  const soTien = (v) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n > 0 && n < 1e15 ? n : 0; };
  const vnd = (n) => n ? n.toLocaleString('vi-VN') + ' đ' : '';
  const giaMuaHD = soTien(b.giaMuaHD), giaBan = soTien(b.giaBan);
  const giaMuaGoc = soTien(b.giaMuaGoc) || (giaMuaHD ? Math.round(giaMuaHD / 1.12) : 0);
  const giaChenh = giaMuaHD && giaBan ? giaBan - giaMuaHD : 0;
  const giaBanCuoi = giaMuaGoc ? giaMuaGoc + giaChenh : 0;
  const hhMuc = clip(b.hoaHongMuc, 16);
  const hhPhanTram = /^(trong30|sau30)-[123]$/.test(hhMuc) ? Number(hhMuc.split('-')[1]) : 0;
  const hhTien = hhPhanTram && giaBanCuoi ? Math.round(giaBanCuoi * hhPhanTram / 100) : 0;

  const detail = [
    units.length ? 'Căn quan tâm: ' + units.join('; ') : '',
    kind === 'consign' ? 'Căn ký gửi: ' + clip(b.unit, 160) : '',
    kind === 'consign' ? 'Nhu cầu: ' + clip(b.purpose, 20) : '',
    giaMuaHD ? 'Giá mua trên HĐ (gồm VAT, KPBT): ' + vnd(giaMuaHD) : '',
    giaBan ? 'Giá bán mong muốn: ' + vnd(giaBan) : '',
    giaChenh ? 'Giá chênh: ' + vnd(giaChenh) : '',
    giaMuaGoc ? 'Giá mua chưa VAT và KPBT: ' + vnd(giaMuaGoc) + (soTien(b.giaMuaGoc) ? '' : ' (tạm tính)') : '',
    giaBanCuoi ? 'Giá bán cuối tính hoa hồng: ' + vnd(giaBanCuoi) : '',
    hhPhanTram ? 'Hoa hồng chọn: ' + hhPhanTram + '% ' + (hhMuc.startsWith('trong30') ? 'nếu giao dịch trong 30 ngày' : 'nếu giao dịch sau 30 ngày') + ' = ' + vnd(hhTien) + ' (dự tính)' : '',
    b.thuongLuong ? 'Giá còn thương lượng' : '',
    b.giaNet ? 'Giá net' : '',
    clip(b.ngayHD, 10) ? 'Ngày ký HĐ: ' + clip(b.ngayHD, 10) : '',
    kind === 'consign' ? 'Ảnh hợp đồng và giấy tờ chính chủ: CHƯA nhận, chờ gửi qua Zalo kèm mã phiếu' : '',
    b.price ? 'Giá mong muốn: ' + clip(b.price, 100) : '',
    b.when ? 'Giờ gọi lại: ' + clip(b.when, 80) : '',
    b.note ? 'Ghi chú: ' + clip(b.note, 400) : '',
  ].filter(Boolean).join(' | ');

  const id = maPhieu || 'T' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  const row = {
    time: new Date().toISOString(),
    id, name, phone,
    email: clip(b.email, 120),
    channel: 'zalo',
    project,
    area: clip(b.zone, 80),
    doc: KINDS[kind],
    purpose: kind === 'consign' ? clip(b.purpose, 20) : clip(b.intent, 40),
    budget: giaBan ? vnd(giaBan) : clip(b.budget || b.price, 60),
    calc: detail + (link ? ' | Phiếu: ' + link : ''),
    score: thamVan ? 80 : kind === 'request' ? 70 : kind === 'callback' ? 60 : 50,
    temp: 'Nóng',
    visits: 0, interactions: 0, projectsViewed: 0,
    source: 'tim-nha', medium: 'showroom-3d', campaign: project, page: clip(b.page, 120),
    consent: thamVan ? 'Không thu số điện thoại' : 'Đồng ý ' + new Date().toISOString().slice(0, 10),
  };

  const sheet = await appendSheet(env, row);
  if (!sheet.ok) return json({ ok: false, stored: false, error: sheet.error || 'store' }, 503);

  // Báo cho Tú (không bắt buộc; lỗi mail không làm mất phiếu đã lưu)
  let notified = false;
  try {
    const m = thamVan ? await sendMail(env, {
      to: env.NOTIFY_TO,
      subject: `💬 Khách vừa mở Zalo tham vấn ${units.length} căn – ${project} (${id})`,
      html: khung(`<p><b>${esc(name)}</b> vừa bấm "Chat Zalo với tư vấn" trên sa bàn ${esc(project)}. Khách đã được sao chép sẵn bản tóm tắt dưới đây để dán vào Zalo; nếu khách chưa dán, đây là những gì khách đã chọn.</p>
        <ol>${units.map((u) => `<li style="margin:6px 0">${esc(u)}</li>`).join('')}</ol>
        ${clip(b.note, 400) ? `<p>Lời nhắn: <b>${esc(clip(b.note, 400))}</b></p>` : ''}
        ${link ? `<p><a href="${esc(link)}" style="display:inline-block;background:#c99a42;color:#221a08;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">Mở phiếu ${esc(id)}: căn, phương thức và bản tính khách đã xem</a></p>` : ''}
        <p style="color:#666;font-size:13px">Giá trong phiếu tính lại theo quỹ đại lý và chính sách hiện hành khi anh mở link.</p>`),
      text: `Khách ${name} mở Zalo tham vấn (${id}):\n` + units.map((u, i) => `${i + 1}. ${u}`).join('\n') + (clip(b.note, 400) ? `\nLời nhắn: ${clip(b.note, 400)}` : '') + (link ? `\nPhiếu: ${link}` : ''),
    }) : await (async () => {
      const lines = [['Loại', KINDS[kind]], ['Mã phiếu', id], ['Dự án', project], ['Tên', name], ['Zalo/SĐT', phone], ['Chi tiết', detail || '-']];
      const zalo = `https://zalo.me/${phone}`;
      return sendMail(env, {
        to: env.NOTIFY_TO,
        subject: `🔔 ${KINDS[kind]}: ${name} – ${project}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px"><table cellpadding="6">${lines.map(([k, v]) => `<tr><td style="color:#5b6770;vertical-align:top">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join('')}</table><p><a href="${esc(zalo)}">Mở Zalo của khách</a></p></div>`,
        text: lines.map(([k, v]) => `${k}: ${v}`).join('\n') + `\nZalo: ${zalo}`,
      });
    })();
    notified = m.ok;
  } catch {
    notified = false;
  }

  // Ký gửi: thư cảm ơn cho chủ nhà, lịch chăm sóc cho Tú, và hai thư hẹn giờ sau 15 ngày.
  // Mọi bước đều không bắt buộc: lỗi gửi thư không làm mất phiếu đã lưu.
  const auto = { camOn: false, lich: false, nhacTu: false, hoiChuNha: false };
  if (kind === 'consign') {
    const unit = clip(b.unit, 80), email = clip(b.email, 120);
    const zaloTu = clip(env.ZALO_TU || '0978618149', 20).replace(/\D/g, '');
    const zaloTxt = zaloTu.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');
    const han = hanChamSoc(), hanTxt = han.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const tomTat = [
      ['Căn ký gửi', unit + ' · ' + project], ['Nhu cầu', clip(b.purpose, 20)],
      ['Giá bán mong muốn', vnd(giaBan)], ['Giá chênh', vnd(giaChenh)],
      hhPhanTram ? ['Hoa hồng đã chọn', `${hhPhanTram}% ${hhMuc.startsWith('trong30') ? 'nếu giao dịch trong 30 ngày' : 'nếu giao dịch sau 30 ngày'}, dự tính ${vnd(hhTien)}`] : null,
    ].filter(Boolean).filter(([, v]) => v);
    const bang = `<table cellpadding="5" style="border-collapse:collapse">${tomTat.map(([k, v]) => `<tr><td style="color:#666">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join('')}</table>`;
    if (/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
      try {
        const m1 = await sendMail(env, {
          to: email, replyTo: env.NOTIFY_TO,
          subject: `Đã nhận phiếu ký gửi ${unit} · mã ${id}`,
          html: khung(`<p>Chào anh/chị ${esc(name)},</p>
            <p>Cảm ơn anh/chị đã tin tưởng ký gửi căn <b>${esc(unit)}</b> tại ${esc(project)}. Em đã lưu phiếu, mã <b>${esc(id)}</b>.</p>${bang}
            <p><b>Còn một bước để căn lên giỏ hàng:</b> anh/chị gửi ảnh trang tiêu đề hợp đồng, bảng tính căn, CCCD hoặc VNeID và phần thông tin cá nhân trên hợp đồng qua Zalo <a href="https://zalo.me/${zaloTu}">${zaloTxt}</a>, nhắn kèm mã <b>${esc(id)}</b>. Giấy tờ tuỳ thân chỉ dùng để đối chiếu chính chủ, không công khai.</p>
            <p>Em sẽ cùng anh/chị định giá sát thị trường và đưa căn đến đúng người mua đang tìm. Chúc anh/chị sớm thanh khoản thuận lợi.</p>
            <p>Có gì cần đổi, anh/chị chỉ cần trả lời thư này.</p>`),
          text: `Chào anh/chị ${name},\nCảm ơn anh/chị đã ký gửi căn ${unit} tại ${project}. Mã phiếu: ${id}.\n` +
            tomTat.map(([k, v]) => `${k}: ${v}`).join('\n') +
            `\nCòn một bước: gửi ảnh hợp đồng và giấy tờ chính chủ qua Zalo ${zaloTxt}, nhắn kèm mã ${id}.\nChúc anh/chị sớm thanh khoản thuận lợi.\nNguyễn Anh Tú · nguyenanhtu.vn`,
        });
        auto.camOn = m1.ok;
        const m2 = await sendMail(env, {
          to: email, replyTo: env.NOTIFY_TO, scheduledAt: han.toISOString(),
          subject: `Căn ${unit} ký gửi ${NGAY_CHAM_SOC} ngày: anh/chị cập nhật giúp em`,
          html: khung(`<p>Chào anh/chị ${esc(name)},</p>
            <p>Đã ${NGAY_CHAM_SOC} ngày từ khi anh/chị ký gửi căn <b>${esc(unit)}</b> (mã ${esc(id)}). Anh/chị cập nhật giúp em:</p>
            <ul><li>Căn đã giao dịch chưa?</li><li>Giá mong muốn có thay đổi không?</li></ul>
            <p>Anh/chị trả lời thư này hoặc nhắn Zalo <a href="https://zalo.me/${zaloTu}">${zaloTxt}</a>. Em cập nhật giỏ hàng ngay để không giới thiệu nhầm căn đã bán.</p>`),
          text: `Đã ${NGAY_CHAM_SOC} ngày từ khi anh/chị ký gửi căn ${unit} (mã ${id}). Căn đã giao dịch chưa, giá có đổi không? Trả lời thư này hoặc Zalo ${zaloTxt}.`,
        });
        auto.hoiChuNha = m2.ok;
      } catch { /* bỏ qua */ }
    }
    if (env.NOTIFY_TO) {
      try {
        const m3 = await sendMail(env, {
          to: env.NOTIFY_TO,
          subject: `📅 Lịch chăm sóc ký gửi ${unit} ngày ${hanTxt} (${id})`,
          html: khung(`<p>Phiếu ký gửi <b>${esc(id)}</b> · ${esc(name)} · ${esc(phone)}.</p>${bang}
            <p>Mở tệp đính kèm để thêm lịch nhắc chăm sóc ngày <b>${esc(hanTxt)}</b> 9:00 vào lịch điện thoại. Hôm đó hệ thống cũng tự gửi thư nhắc anh, và gửi thư hỏi chủ nhà căn đã bán chưa.</p>
            <p><a href="https://zalo.me/${esc(phone)}">Nhắn Zalo chủ nhà</a></p>`),
          text: `Phiếu ${id} · ${name} · ${phone}. Lịch chăm sóc ${hanTxt} 9:00 đính kèm.`,
          attachments: [{ filename: `cham-soc-${id}.ics`, content: b64(lichChamSoc({ id, unit, name, phone, project, han })) }],
        });
        auto.lich = m3.ok;
        const m4 = await sendMail(env, {
          to: env.NOTIFY_TO, scheduledAt: han.toISOString(),
          subject: `⏰ Đến hạn chăm sóc ký gửi ${unit} (${id})`,
          html: khung(`<p>Hôm nay đủ ${NGAY_CHAM_SOC} ngày từ khi nhận phiếu ký gửi <b>${esc(id)}</b>.</p>${bang}
            <p>Chủ nhà: <b>${esc(name)}</b> · ${esc(phone)} · <a href="https://zalo.me/${esc(phone)}">Nhắn Zalo</a></p>
            <p>Việc cần làm: hỏi căn đã giao dịch chưa, giá có đổi không, rồi cập nhật giỏ hàng. Hệ thống đã gửi thư hỏi chủ nhà cùng lúc với thư này.</p>`),
          text: `Đến hạn chăm sóc ký gửi ${unit} (${id}). Chủ nhà ${name} · ${phone}. Hỏi căn đã bán chưa và cập nhật giỏ hàng.`,
        });
        auto.nhacTu = m4.ok;
      } catch { /* bỏ qua */ }
    }
  }
  return json({ ok: true, stored: true, id, notified, auto });
}

export const onRequest = () => json({ ok: false, error: 'method' }, 405);
