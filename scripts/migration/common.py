import re, json, unicodedata, html as H
EMOJI_RE = re.compile('^[\\W_]+', re.U)
def strip_icon(t):
    t=t.strip()
    m=re.match(r'^([^\w\s]+(?:\ufe0f)?\s*)+', t, re.U)
    icon = m.group(0).strip() if m else ''
    return icon, t[len(m.group(0)):].strip() if m else t
def text(h):
    h=re.sub(r'<br\s*/?>',' ',h); h=re.sub(r'<[^>]+>','',h); return re.sub(r'\s+',' ',H.unescape(h)).strip()
def slugify(t, maxlen=60):
    t=t.replace('đ','d').replace('Đ','D')
    t=unicodedata.normalize('NFD',t); t=''.join(c for c in t if unicodedata.category(c)!='Mn')
    t=re.sub(r'&',' ',t.lower()); t=re.sub(r'[^a-z0-9]+','-',t).strip('-')
    if len(t)>maxlen:
        t=t[:maxlen]; t=t[:t.rfind('-')] if '-' in t else t
    return t
