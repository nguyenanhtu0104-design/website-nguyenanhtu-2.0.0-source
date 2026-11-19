// Cloudflare Pages Function: POST /api/tim-nha
// Nhận phiếu từ trang Tìm nhà / sa bàn dự án: yêu cầu căn, ký gửi, đặt lịch tư vấn.
// Dùng lại biến môi trường của /api/lead: SHEET_WEBHOOK_URL, SHEET_SECRET, RESEND_API_KEY, MAIL_FROM, NOTIFY_TO, SITE_URL.
// Chỉ trả stored:true khi Google Sheet xác nhận đã ghi. Trang web chỉ hiện "Đã nhận" khi có stored:true.

const KINDS = {
  request: 'Yêu cầu căn',
  consign: 'Ký gửi căn',
  callback: 'Đặt lịch tư vấn',
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

async function sendMail(env, { to, subject, html, text }) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !to) return { ok: false };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, html, text }),
  });
  return { ok: res.ok };
}

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
  const name = clip(b.name, 80);
  const phone = normPhone(b.phone);
  if (name.length < 2) return json({ ok: false, error: 'name' }, 400);
  if (!/^0\d{9}$/.test(phone)) return json({ ok: false, error: 'phone' }, 400);
  if (b.consent !== true) return json({ ok: false, error: 'consent' }, 400);

  const project = clip(b.project, 80) || 'Blanca City';
  const units = (Array.isArray(b.units) ? b.units : []).slice(0, 20).map((u) => clip(u, 80)).filter(Boolean);
  if (kind === 'request' && !units.length && !clip(b.note, 400)) return json({ ok: false, error: 'units' }, 400);
  if (kind === 'consign' && !clip(b.unit, 160)) return json({ ok: false, error: 'unit' }, 400);

  const detail = [
    units.length ? 'Căn quan tâm: ' + units.join('; ') : '',
    kind === 'consign' ? 'Căn ký gửi: ' + clip(b.unit, 160) : '',
    kind === 'consign' ? 'Nhu cầu: ' + clip(b.purpose, 20) : '',
    b.price ? 'Giá mong muốn: ' + clip(b.price, 100) : '',
    b.when ? 'Giờ gọi lại: ' + clip(b.when, 80) : '',
    b.note ? 'Ghi chú: ' + clip(b.note, 400) : '',
  ].filter(Boolean).join(' | ');

  const id = 'T' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  const row = {
    time: new Date().toISOString(),
    id, name, phone,
    email: clip(b.email, 120),
    channel: 'zalo',
    project,
    area: clip(b.zone, 80),
    doc: KINDS[kind],
    purpose: kind === 'consign' ? clip(b.purpose, 20) : clip(b.intent, 40),
    budget: clip(b.budget || b.price, 60),
    calc: detail,
    score: kind === 'request' ? 70 : kind === 'callback' ? 60 : 50,
    temp: 'Nóng',
    visits: 0, interactions: 0, projectsViewed: 0,
    source: 'tim-nha', medium: 'showroom-3d', campaign: project, page: clip(b.page, 120),
    consent: 'Đồng ý ' + new Date().toISOString().slice(0, 10),
  };

  const sheet = await appendSheet(env, row);
  if (!sheet.ok) return json({ ok: false, stored: false, error: sheet.error || 'store' }, 503);

  // Báo cho Tú (không bắt buộc; lỗi mail không làm mất phiếu đã lưu)
  let notified = false;
  try {
    const lines = [['Loại', KINDS[kind]], ['Mã phiếu', id], ['Dự án', project], ['Tên', name], ['Zalo/SĐT', phone], ['Chi tiết', detail || '-']];
    const zalo = `https://zalo.me/${phone}`;
    const m = await sendMail(env, {
      to: env.NOTIFY_TO,
      subject: `🔔 ${KINDS[kind]}: ${name} – ${project}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px"><table cellpadding="6">${lines.map(([k, v]) => `<tr><td style="color:#5b6770;vertical-align:top">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join('')}</table><p><a href="${esc(zalo)}">Mở Zalo của khách</a></p></div>`,
      text: lines.map(([k, v]) => `${k}: ${v}`).join('\n') + `\nZalo: ${zalo}`,
    });
    notified = m.ok;
  } catch {
    notified = false;
  }
  return json({ ok: true, stored: true, id, notified });
}

export const onRequest = () => json({ ok: false, error: 'method' }, 405);
