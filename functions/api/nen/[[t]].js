// Cloudflare Pages Function: GET /api/nen/{z}/{x}/{y}
// Ảnh nền cho sa bàn 3D. Đi qua server để khoá nhà cung cấp không lộ ra trình duyệt
// và để đổi nhà cung cấp chỉ bằng biến môi trường, không phải sửa mã.
//
// Biến môi trường (Cloudflare Pages → Settings → Environment variables):
//   ARCGIS_API_KEY khoá ArcGIS Location Platform. Đặt một biến này là có ảnh vệ tinh.
//   NEN_TILE_URL   (tuỳ chọn) mẫu đường dẫn ô ảnh của nhà cung cấp khác, dùng {z} {x} {y}.
//                  Không đặt gì → dùng OpenStreetMap (chỉ hợp cho lưu lượng nhỏ).
//   NEN_GHI_NHAN   dòng ghi nhận nguồn hiện dưới sa bàn.
//   NEN_KIEU       've-tinh' hoặc 'duong-pho' (mặc định suy từ hai biến trên).

const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const MOT_NGAY = 86400;

// Chỉ cần đặt ARCGIS_API_KEY là có ảnh vệ tinh; đường dẫn do đây lo.
// Thử lần lượt. Hỏng hết thì trả 502 chứ không lặng lẽ đưa ảnh OpenStreetMap ra,
// vì trang sẽ ghi nguồn sai; trang tự quay về OpenStreetMap và ghi đúng nguồn.
function nguon(env) {
  const key = (env.ARCGIS_API_KEY || '').trim();
  const rieng = (env.NEN_TILE_URL || '').trim();
  if (rieng) return [rieng];
  if (key) return [
    `https://static-map-tiles-api.arcgis.com/arcgis/rest/services/static-basemap-tiles-service/v1/arcgis/imagery/standard/static/tile/{z}/{y}/{x}?token=${key}`,
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=${key}`,
  ];
  return [OSM];
}

export async function onRequestGet(ctx) {
  const { request, env, params } = ctx;
  const p = Array.isArray(params.t) ? params.t : String(params.t || '').split('/');
  if (p.length !== 3) return new Response('Cần dạng /api/nen/{z}/{x}/{y}', { status: 404 });

  const z = Number(p[0]), x = Number(p[1]), y = Number(p[2].replace(/\.(png|jpg|jpeg|webp)$/i, ''));
  if (![z, x, y].every(Number.isInteger) || z < 0 || z > 22) return new Response('Ô ảnh không hợp lệ', { status: 400 });
  const n = 2 ** z;
  if (x < 0 || x >= n || y < 0 || y >= n) return new Response('Ô ảnh ngoài phạm vi', { status: 400 });

  const cache = caches.default;
  const khoaCache = new Request(new URL(`/api/nen/${z}/${x}/${y}`, request.url).toString(), { method: 'GET' });
  const sanCo = await cache.match(khoaCache);
  if (sanCo) return sanCo;

  let r = null;
  for (const mau of nguon(env)) {
    const dich = mau.replace(/\{z\}/g, z).replace(/\{x\}/g, x).replace(/\{y\}/g, y);
    try {
      const th = await fetch(dich, {
        headers: {
          // OSM yêu cầu nêu danh ứng dụng; nhà cung cấp khác bỏ qua tiêu đề này.
          'user-agent': 'nguyenanhtu.vn sa ban 3D (lien he qua nguyenanhtu.vn)',
          // Để khoá ArcGIS có thể khoá theo tên miền mà vẫn gọi được từ đây.
          referer: (env.SITE_URL || 'https://nguyenanhtu.vn') + '/',
          accept: 'image/avif,image/webp,image/png,image/jpeg,*/*',
        },
        cf: { cacheTtl: MOT_NGAY, cacheEverything: true },
      });
      if (th.ok && (th.headers.get('content-type') || '').startsWith('image/')) { r = th; break; }
    } catch { /* thử nguồn kế tiếp */ }
  }
  if (!r) return new Response('Không lấy được ô ảnh nền', { status: 502 });

  const res = new Response(r.body, {
    status: 200,
    headers: {
      'content-type': r.headers.get('content-type') || 'image/png',
      'cache-control': `public, max-age=${MOT_NGAY}, s-maxage=${MOT_NGAY * 7}, immutable`,
      'access-control-allow-origin': '*',
      'x-nen': (env.ARCGIS_API_KEY || env.NEN_TILE_URL) ? 'rieng' : 'osm',
    },
  });
  ctx.waitUntil(cache.put(khoaCache, res.clone()));
  return res;
}
