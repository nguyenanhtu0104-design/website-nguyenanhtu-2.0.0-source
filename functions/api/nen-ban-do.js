// Cloudflare Pages Function: GET /api/nen-ban-do
// Cho sa bàn biết đang dùng ảnh nền nào để ghi nguồn cho đúng.
export const onRequestGet = ({ env }) => {
  const rieng = !!((env.ARCGIS_API_KEY || '').trim() || (env.NEN_TILE_URL || '').trim());
  const kieu = (env.NEN_KIEU || '').trim() || (rieng ? 've-tinh' : 'duong-pho');
  return new Response(JSON.stringify({
    kieu,
    ghiNhan: (env.NEN_GHI_NHAN || '').trim()
      || (rieng ? 'Ảnh vệ tinh: Esri, Vantor, Earthstar Geographics và cộng đồng GIS'
                : '© những người đóng góp OpenStreetMap'),
    rieng,
  }), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' } });
};
