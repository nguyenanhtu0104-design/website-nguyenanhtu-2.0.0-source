// Cloudflare Pages Function: POST /api/lead
// Biến môi trường (Cloudflare Pages > Settings > Variables and Secrets):
//   RESEND_API_KEY     khoá API của Resend (Secret)
//   MAIL_FROM          vd: "Nguyễn Anh Tú <lead@nguyenanhtu.vn>" (tên miền đã xác thực ở Resend)
//   NOTIFY_TO          email nhận thông báo lead (email của Tú)
//   SHEET_WEBHOOK_URL  địa chỉ Web app của Google Apps Script
//   SHEET_SECRET       mã bí mật, trùng với SECRET trong Apps Script (Secret)
//   SITE_URL           mặc định https://nguyenanhtu.vn

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function normPhone(v) {
  let d = String(v || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+84')) d = '0' + d.slice(3);
  else if (d.startsWith('84') && d.length === 11) d = '0' + d.slice(2);
  return d;
}

function allowedOrigin(origin, siteUrl, requestUrl) {
  try {
    const site = new URL(siteUrl);
    const allowed = new Set([
      site.origin,
      `${site.protocol}//www.${site.host.replace(/^www\./, '')}`,
      new URL(requestUrl).origin,
    ]);
    return allowed.has(origin);
  } catch {
    return false;
  }
}

async function loadData(env, request) {
  const url = new URL('/assets/lead/lead-data.json', request.url);
  const res = env.ASSETS ? await env.ASSETS.fetch(new Request(url)) : await fetch(url);
  if (!res.ok) throw new Error('lead-data.json not found');
  return res.json();
}

function isOwnUrl(u, siteUrl) {
  try {
    const a = new URL(u, siteUrl);
    const s = new URL(siteUrl);
    return a.host.replace(/^www\./, '') === s.host.replace(/^www\./, '');
  } catch {
    return false;
  }
}

// Gắn UTM (và mã lead nếu là link của chính site) để biết khách bấm link nào
function withTracking(u, siteUrl, params) {
  if (!u) return '';
  try {
    const url = new URL(u, siteUrl);
    const own = isOwnUrl(url.toString(), siteUrl);
    for (const [k, v] of Object.entries(params)) {
      if (!v) continue;
      if (k === 'lid' && !own) continue; // không đưa mã lead sang trang bên ngoài
      url.searchParams.set(k, v);
    }
    return url.toString();
  } catch {
    return u;
  }
}

const clip = (s, n) => String(s ?? '').slice(0, n);

function cleanCalc(c) {
  if (!c || !Array.isArray(c.inputs)) return null;
  const inputs = c.inputs.slice(0, 20).map((i) => ({ k: clip(i.k, 40), l: clip(i.l, 60), v: clip(i.v, 40) })).filter((i) => i.k && i.v);
  if (!inputs.length) return null;
  const results = (Array.isArray(c.results) ? c.results : []).slice(0, 10).map((r) => ({ l: clip(r.l, 60), v: clip(r.v, 60) })).filter((r) => r.v);
  return { inputs, results };
}

const calcText = (c) =>
  c ? c.inputs.map((i) => `${i.l}: ${i.v}`).join('; ') + (c.results.length ? ' → ' + c.results.map((r) => `${r.l ? r.l + ': ' : ''}${r.v}`).join('; ') : '') : '';

// Link mở lại bảng tính với các số khách đã nhập
function reopenUrl(project, calc, siteUrl, params) {
  const d = project.docs && project.docs['bang-tinh'];
  if (!calc || !d || !d.url) return '';
  const u = new URL(d.url, siteUrl);
  u.searchParams.set('calc', JSON.stringify(Object.fromEntries(calc.inputs.map((i) => [i.k, i.v]))));
  return withTracking(u.toString(), siteUrl, params);
}

function pickRelated(data, slug, project) {
  const projects = data.projects || {};
  let list = Array.isArray(project.related) ? project.related.slice() : [];
  if (!list.length && project.region) {
    list = Object.keys(projects).filter((k) => k !== slug && projects[k].region === project.region);
  }
  return list
    .map((k) => ({ slug: k, p: projects[k] }))
    .filter((x) => x.p && x.p.ready && x.p.url)
    .slice(0, 2);
}

// Khối "Có thể bạn muốn xem thêm": mục nào chưa có thì tự ẩn
function buildExtraLinks(data, slug, project, docKey, siteUrl, lid) {
  const base = { utm_source: 'email', utm_medium: 'lead', utm_campaign: slug, lid };
  const items = [];
  for (const [k, d] of Object.entries(project.docs || {})) {
    if (k !== docKey && d && d.url) {
      items.push({ title: d.label, desc: 'Tài liệu khác của cùng dự án', url: withTracking(d.url, siteUrl, { ...base, utm_content: 'doc-' + k }) });
    }
  }
  if (project.video) {
    items.push({ title: `Video giới thiệu ${project.name}`, desc: 'Xem nhanh tổng quan dự án', url: withTracking(project.video, siteUrl, { ...base, utm_content: 'video' }) });
  }
  const a = project.areaArticle;
  if (a && a.url) {
    items.push({ title: a.title || 'Bài phân tích khu vực', desc: 'Bối cảnh vùng có dự án', url: withTracking(a.url, siteUrl, { ...base, utm_content: 'area' }) });
  }
  for (const r of pickRelated(data, slug, project)) {
    items.push({ title: r.p.name, desc: 'Dự án tham khảo cùng khu vực', url: withTracking(r.p.url, siteUrl, { ...base, utm_content: 'related-' + r.slug }) });
  }
  return items;
}

function customerEmail({ name, project, docLabel, docUrl, extras, zalo, siteUrl, calc, reopen }) {
  const useCalc = !!(calc && reopen);
  const btnLabel = useCalc ? 'Mở lại bảng tính của bạn' : docLabel;
  const btnUrl = useCalc ? reopen : docUrl;
  const summaryHtml = calc
    ? `<p style="margin:16px 0 6px;font-weight:700">Phương án bạn vừa tính</p>
       <table cellpadding="6" style="border-collapse:collapse;width:100%;font-size:14px">${[
         ...calc.inputs.map((i) => [i.l, i.v, false]),
         ...calc.results.map((r) => [r.l || 'Kết quả', r.v, true]),
       ].map(([l, v, b]) => `<tr style="border-bottom:1px solid #e3e7ea"><td style="color:#5b6770">${esc(l)}</td><td style="text-align:right${b ? ';font-weight:700' : ''}">${esc(v)}</td></tr>`).join('')}</table>`
    : '';
  const subject = `[${project.name}] ${docLabel} bạn yêu cầu – Nguyễn Anh Tú`;
  const extraHtml = extras.length
    ? `<hr style="border:0;border-top:1px solid #e3e7ea;margin:24px 0">
       <p style="margin:0 0 8px;font-weight:700">Có thể bạn muốn xem thêm</p>
       <ul style="margin:0;padding-left:18px">${extras
         .map((i) => `<li style="margin:0 0 8px"><a href="${esc(i.url)}" style="color:#0b5d56">${esc(i.title)}</a><br><span style="color:#5b6770;font-size:13px">${esc(i.desc)}</span></li>`)
         .join('')}</ul>`
    : '';
  const zaloLine = zalo
    ? `<p>Nếu bạn muốn trao đổi thêm về khu vực hoặc so sánh các dự án, cứ nhắn mình qua Zalo <b>${esc(zalo)}</b> nhé.</p>`
    : '';
  const html = `<!doctype html><html lang="vi"><body style="margin:0;background:#f4f6f7">
<div style="max-width:600px;margin:0 auto;background:#fff;padding:28px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f2933">
<p style="margin:0 0 14px"><b>Kính chào ${esc(name)},</b></p>
<p>Mình là <b>Nguyễn Anh Tú</b>, Project Director tại ERA Vietnam, hơn 10 năm làm việc và phân tích thị trường bất động sản Đông Nam Bộ.</p>
<p>Cảm ơn bạn đã quan tâm đến <b>${esc(project.name)}</b>. Mình gửi bạn ${useCalc ? 'bảng tính với phương án bạn vừa tính' : 'tài liệu bạn yêu cầu'}:</p>
${summaryHtml}
<p style="margin:18px 0"><a href="${esc(btnUrl)}" style="display:inline-block;background:#0b5d56;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:4px">${esc(btnLabel)}</a></p>
${extraHtml}
<hr style="border:0;border-top:1px solid #e3e7ea;margin:24px 0">
${zaloLine}
<p style="margin:18px 0 0">Trân trọng,<br><b>Nguyễn Anh Tú</b><br>Project Director | ERA Vietnam<br><a href="${esc(siteUrl)}" style="color:#0b5d56">nguyenanhtu.vn</a> · YouTube @nguyenanhtu.kienphat</p>
<p style="margin:22px 0 0;font-size:12px;color:#6b7680">Thông tin mang tính tham khảo tại thời điểm phát hành, không phải cam kết về giá hay chính sách bán hàng.<br>Không muốn nhận thêm thông tin? Bạn chỉ cần trả lời email này.</p>
</div></body></html>`;
  const text = [
    `Kính chào ${name},`,
    '',
    'Mình là Nguyễn Anh Tú, Project Director tại ERA Vietnam, hơn 10 năm làm việc và phân tích thị trường bất động sản Đông Nam Bộ.',
    `Cảm ơn bạn đã quan tâm đến ${project.name}. Tài liệu bạn yêu cầu:`,
    ...(calc ? [`Phương án bạn vừa tính: ${calcText(calc)}`] : []),
    `${btnLabel}: ${btnUrl}`,
    ...(extras.length ? ['', 'Có thể bạn muốn xem thêm:', ...extras.map((i) => `- ${i.title}: ${i.url}`)] : []),
    '',
    ...(zalo ? [`Cần trao đổi thêm, nhắn Zalo ${zalo}.`, ''] : []),
    'Trân trọng,',
    'Nguyễn Anh Tú | Project Director | ERA Vietnam',
    'Thông tin mang tính tham khảo, không phải cam kết về giá hay chính sách bán hàng. Không muốn nhận thêm thông tin, bạn chỉ cần trả lời email này.',
  ].join('\n');
  return { subject, html, text };
}

function notifyEmail({ lead, project, docLabel, docUrlTracked, temp, emailStatus, calc, reopen, pdfUrl, hasPdf, driveUrl }) {
  const zaloLink = `https://zalo.me/${lead.phone}`;
  const zaloMsg =
    `Chào ${lead.name}, mình là Tú (ERA Vietnam). Mình gửi bạn ${docLabel} của ${project.name}: ${reopen || docUrlTracked || '(tài liệu đang cập nhật)'}`;
  const rows = [
    ['Mã lead', lead.id],
    ['Tên', lead.name],
    ['Zalo/SĐT', lead.phone],
    ['Email', lead.email || '(không có)'],
    ['Kênh khách chọn', lead.channel === 'email' ? 'Email' : 'Zalo'],
    ['Dự án', project.name],
    ['Tài liệu', docLabel],
    ['Mục đích / Ngân sách', `${lead.purpose || 'chưa nêu'} / ${lead.budget || 'chưa nêu'}`],
    ['Nguồn', `${lead.utm.utm_source || 'trực tiếp'} / ${lead.utm.utm_campaign || '-'}`],
    ['Điểm quan tâm', `${lead.score} (${temp})`],
    ...(calc ? [['Phương án khách tính', calcText(calc)]] : []),
  ];
  const action =
    lead.channel === 'email'
      ? emailStatus.ok
        ? 'Email tài liệu đã tự gửi cho khách. Có thể nhắn Zalo hỏi thăm sau.'
        : 'EMAIL TỰ ĐỘNG LỖI. Hãy gửi tài liệu cho khách qua Zalo.'
      : 'Khách chọn Zalo. Gửi tài liệu qua Zalo sớm nhất có thể.';
  const subject = `🔔 Lead mới: ${lead.name} – ${project.name}`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1f2933;max-width:600px">
<table cellpadding="6" style="border-collapse:collapse;width:100%">${rows
    .map(([k, v]) => `<tr><td style="color:#5b6770;white-space:nowrap;vertical-align:top">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`)
    .join('')}</table>
<p style="margin:14px 0"><a href="${esc(zaloLink)}" style="background:#0b5d56;color:#fff;text-decoration:none;padding:10px 14px;border-radius:4px;font-weight:700">Mở Zalo của khách</a>${pdfUrl ? ` <a href="${esc(pdfUrl)}" style="background:#b8894a;color:#fff;text-decoration:none;padding:10px 14px;border-radius:4px;font-weight:700">Xuất PDF sẵn của khách</a>` : ''}</p>${hasPdf ? `<p style="margin:0 0 10px;font-size:14px"><b>File PDF phương án của khách đã đính kèm trong email này.</b> Tải về rồi gửi khách qua Zalo.${driveUrl ? ` Bản lưu trong Google Drive: <a href="${esc(driveUrl)}">mở file</a>.` : ''}</p>` : pdfUrl ? '<p style="margin:0 0 10px;color:#5b6770;font-size:13px">Chưa tạo được file PDF tự động. Bấm nút vàng: bảng tính tự điền số khách và mở hộp thoại in, chọn "Lưu dạng PDF".</p>' : ''}
<p><b>Việc cần làm:</b> ${esc(action)}</p>
<p style="margin:14px 0 4px;color:#5b6770">Tin nhắn Zalo gợi ý (sao chép và dán):</p>
<div style="background:#f4f6f7;padding:10px 12px;border-radius:4px">${esc(zaloMsg)}</div></div>`;
  const text = [...rows.map(([k, v]) => `${k}: ${v}`), '', `Mở Zalo: ${zaloLink}`, ...(pdfUrl ? [`Xuất PDF sẵn: ${pdfUrl}`] : []), `Việc cần làm: ${action}`, '', 'Tin nhắn Zalo gợi ý:', zaloMsg].join('\n');
  return { subject, html, text };
}

async function sendMail(env, { to, subject, html, text, replyTo, attachments }) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return { ok: false, error: 'mail_not_configured' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}), ...(attachments && attachments.length ? { attachments } : {}) }),
  });
  if (!res.ok) return { ok: false, error: `mail_${res.status}` };
  return { ok: true };
}

// Báo lead nhanh qua WhatsApp (CallMeBot). Cần biến WHATSAPP_PHONE (+84...) và WHATSAPP_APIKEY.
async function sendWhatsApp(env, text) {
  if (!env.WHATSAPP_PHONE || !env.WHATSAPP_APIKEY) return { ok: false, error: 'wa_not_configured' };
  const u = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(env.WHATSAPP_PHONE) + '&text=' + encodeURIComponent(text.slice(0, 1500)) + '&apikey=' + encodeURIComponent(env.WHATSAPP_APIKEY);
  const res = await fetch(u);
  return { ok: res.ok };
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
    return { ok: !!j.ok, error: j.ok ? undefined : 'sheet_rejected', pdfUrl: j.pdfUrl || '' };
  } catch {
    return { ok: false, error: 'sheet_bad_response' };
  }
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

  // Chống bot: ô ẩn bị điền hoặc gửi quá nhanh thì im lặng bỏ qua
  if (b.website) return json({ ok: true, emailed: false });
  if (Number(b.t) < 1500) return json({ ok: true, emailed: false });

  const name = String(b.name || '').trim().slice(0, 80);
  const phone = normPhone(b.phone);
  const email = String(b.email || '').trim().slice(0, 120);
  const channel = b.channel === 'email' ? 'email' : 'zalo';

  if (name.length < 2) return json({ ok: false, error: 'name' }, 400);
  if (!/^0\d{9}$/.test(phone)) return json({ ok: false, error: 'phone' }, 400);
  if (b.consent !== true) return json({ ok: false, error: 'consent' }, 400);
  if ((channel === 'email' || email) && !validEmail(email)) return json({ ok: false, error: 'email' }, 400);

  let data;
  try {
    data = await loadData(env, request);
  } catch {
    return json({ ok: false, error: 'config' }, 500);
  }
  const project = (data.projects || {})[b.project];
  if (!project) return json({ ok: false, error: 'project' }, 400);

  const docEntry = (project.docs || {})[b.doc];
  const hasDoc = !!(docEntry && docEntry.url);
  const docKey = hasDoc ? b.doc : 'general';
  const docLabel = hasDoc ? docEntry.label : 'Tài liệu dự án';
  if (channel === 'email' && !hasDoc) return json({ ok: false, error: 'no_doc_for_email' }, 400);

  const id = 'L' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  const utm = b.utm && typeof b.utm === 'object' ? b.utm : {};
  const calc = b.calcConsent === true ? cleanCalc(b.calc) : null; // chỉ nhận khi khách tick đồng ý riêng
  const pdfB64 = calc && typeof b.pdf === 'string' && /^JVBERi/.test(b.pdf) && b.pdf.length < 12000000 ? b.pdf : '';
  const score = Math.max(0, Math.min(200, (Number(b.score) || 0) + (calc ? 25 : 0)));
  const nz = (v) => Math.max(0, Math.min(999, Math.floor(Number(v) || 0)));
  const visits = nz(b.visits), interactions = nz(b.interactions), projectsViewed = nz(b.projectsViewed);
  const temp = score >= 60 ? 'Nóng' : score >= 30 ? 'Ấm' : 'Mới';
  const lead = {
    id, name, phone, email, channel,
    purpose: String(b.purpose || '').slice(0, 40),
    budget: String(b.budget || '').slice(0, 40),
    utm: {
      utm_source: String(utm.utm_source || '').slice(0, 80),
      utm_medium: String(utm.utm_medium || '').slice(0, 80),
      utm_campaign: String(utm.utm_campaign || '').slice(0, 80),
      utm_content: String(utm.utm_content || '').slice(0, 80),
    },
    score,
  };

  const docUrlTracked = hasDoc
    ? withTracking(docEntry.url, siteUrl, { utm_source: 'email', utm_medium: 'lead', utm_campaign: b.project, utm_content: 'doc-' + docKey, lid: id })
    : '';

  const reopen = reopenUrl(project, calc, siteUrl, { utm_source: 'email', utm_medium: 'lead', utm_campaign: b.project, utm_content: 'reopen-calc', lid: id });

  const sheetRow = {
    calc: calcText(calc),
    pdf: pdfB64,
    pdfName: `PhuongAn-${String(project.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-')}-${id}.pdf`,
    time: new Date().toISOString(),
    id, name, phone, email, channel,
    project: project.name, doc: docLabel,
    purpose: lead.purpose, budget: lead.budget,
    score, temp,
    area: (project.areaArticle && project.areaArticle.title) || project.region || '',
    visits, interactions, projectsViewed,
    medium: lead.utm.utm_medium,
    source: lead.utm.utm_source, campaign: lead.utm.utm_campaign,
    page: String(b.page || '').slice(0, 200),
    consent: 'Đã đồng ý (' + new Date().toISOString() + ')',
  };

  // Gửi email cho khách (nếu khách chọn email) và ghi Sheet song song
  const tasks = [appendSheet(env, sheetRow)];
  if (channel === 'email') {
    const extras = buildExtraLinks(data, b.project, project, docKey, siteUrl, id);
    const mail = customerEmail({ name, project, docLabel, docUrl: docUrlTracked, extras, zalo: (data.settings || {}).zaloPhone, siteUrl, calc, reopen });
    tasks.push(sendMail(env, { to: email, replyTo: env.NOTIFY_TO, ...mail }));
  }
  const settled = await Promise.allSettled(tasks);
  const sheetRes = settled[0].status === 'fulfilled' ? settled[0].value : { ok: false };
  const custRes = channel === 'email' ? (settled[1].status === 'fulfilled' ? settled[1].value : { ok: false }) : { ok: false };

  // Báo cho Tú sau cùng để ghi rõ email khách đã gửi được hay chưa
  const pdfUrl = reopenUrl(project, calc, siteUrl, { utm_source: 'owner', utm_medium: 'lead', utm_campaign: b.project, pdf: '1' });
  const note = notifyEmail({ lead, project, docLabel, docUrlTracked, temp, emailStatus: custRes, calc, reopen, pdfUrl, hasPdf: !!pdfB64, driveUrl: sheetRes.pdfUrl || '' });
  const waText = [
    `🔔 Lead ${temp}: ${name} – ${project.name}`,
    `SĐT: ${phone}${email ? ' | ' + email : ''}`,
    `Nhu cầu: ${lead.purpose || '-'} | Ngân sách: ${lead.budget || '-'}`,
    `Khu vực: ${sheetRow.area || '-'}`,
    `Quan tâm: ${score} điểm · ${visits} lần vào · ${interactions} tương tác · xem ${projectsViewed} dự án`,
    `Nhận: ${channel === 'email' ? 'Email' : 'Zalo'}${calc ? ' | Có phương án tính: ' + calcText(calc) : ''}`,
    `Zalo khách: https://zalo.me/${phone.replace(/^\+?84/, '0')}`,
    ...(sheetRes.pdfUrl ? [`File PDF phương án: ${sheetRes.pdfUrl}`] : pdfUrl ? [`PDF: ${pdfUrl}`] : []),
  ].join('\n');
  const waRes = await sendWhatsApp(env, waText).catch(() => ({ ok: false }));
  let notifyRes = { ok: false };
  if (env.NOTIFY_TO) {
    try {
      notifyRes = await sendMail(env, { to: env.NOTIFY_TO, ...note, attachments: pdfB64 ? [{ filename: sheetRow.pdfName, content: pdfB64 }] : undefined });
    } catch {
      notifyRes = { ok: false };
    }
  }

  // Lead không được mất: phải lưu được ít nhất một nơi
  if (!sheetRes.ok && !notifyRes.ok && !waRes.ok) return json({ ok: false, error: 'storage' }, 502);

  return json({ ok: true, id, emailed: channel === 'email' && custRes.ok });
}

export async function onRequest() {
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
