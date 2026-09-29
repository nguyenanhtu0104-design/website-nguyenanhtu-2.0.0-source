"""One-time migration CamNangBDS v57 (single-file) -> 2.0 project."""
import re, json, os, io, base64, hashlib, collections, shutil
from PIL import Image
from common import *
ROOT='/home/claude/camnangbds'
SRC='/mnt/user-data/uploads/CamNangBDS_v57.html'
A=json.load(open('/home/claude/art.json')); SL=json.load(open('/home/claude/sidx.json')); S={x['panel']:x for x in SL}
nav=json.load(open('nav.json'))
raw=open(SRC,encoding='utf-8').read()
TODAY='2026-09-28'
CAT={1:'phap-luat',2:'chien-luoc-quy-hoach',3:'tu-duy-dau-tu',4:'du-an-chon-loc',5:'nha-phat-trien'}

# ---------- metadata ----------
navinfo={}
for c in nav:
    for it in c['items']:
        navinfo[it['id']]={'ch':c['ch'],'label':it['title'].replace('⭐','').strip(),'sub':it['sub']}
        for p in it.get('projects',[]): navinfo[p['id']]={'ch':c['ch'],'label':p['label'],'parent':it['id']}
edges={k:[r for r in dict.fromkeys(re.findall(r"openPanel\('([^']+)'\)",v['html'])) if r!=k] for k,v in A.items()}
ch={k:v['ch'] for k,v in navinfo.items()}; parent={k:v.get('parent') for k,v in navinfo.items()}
q=list(navinfo)
while q:
    k=q.pop(0)
    for r in edges[k]:
        if r not in ch: ch[r]=ch[k]; parent[r]=k; q.append(r)
for k in A:
    if k in S and S[k].get('ch'): ch[k]=S[k]['ch']
ORPH={'trainghi_hub','trainghi_jacobs','trainghi_alexander','trainghi_speck1','trainghi_speck2','trainghi_montgomery','trainghi_shoup','cu_lao_hiep_phuoc','essensia','hamonie','pmh2'}
for k in ORPH: ch.setdefault(k, 2 if k.startswith('trainghi') else 4)
def h1parts(h):
    m=re.search(r'<h1[^>]*>(.*?)</h1>',h,re.S).group(1); p=re.split(r'<br\s*/?>',m,1)
    return text(p[0]), (text(p[1]).lstrip('—– ').strip() if len(p)>1 else '')
def desc(h):
    for pat in [r'<p class="p-lead"[^>]*>(.*?)</p>', r'<p class="zone-role"[^>]*>(.*?)</p>', r'<p class="p-p"[^>]*>(.*?)</p>', r"<div class='p-call'.*?<p>(.*?)</p>", r'<p[^>]*>(.*?)</p>']:
        m=re.search(pat,h,re.S)
        if m and len(text(m.group(1)))>40: return text(m.group(1))
    return text(h)[:300]
def trunc(s,n=158):
    if len(s)<=n: return s
    s=s[:n]; return s[:s.rfind(' ')].rstrip(' ,;:—-·')+'…'
def cleankw(s):
    s=re.sub(r'<img[^>]*>|<[^>]+>|data:image[^\s"\']*',' ',s); s=re.sub(r'\\+"?',' ',s)
    return re.sub(r'\s+',' ',s).strip()[:700]
STUB='Nội dung đang được cập nhật'
M=[]
for k,v in A.items():
    h=v['html']; h1m,h1s=h1parts(h); ih,h1c=strip_icon(h1m)
    if k in navinfo: icon,title=strip_icon(navinfo[k]['label']); sub=navinfo[k].get('sub') or (S[k]['sub'] if k in S else h1s)
    elif k in S: icon,title=strip_icon(S[k]['title']); sub=S[k]['sub']
    else: icon,title=ih,h1c; sub=h1s
    if k in navinfo and not navinfo[k].get('sub'):  # project chip: prefer SIDX sub or h1 sub
        sub=(S[k]['sub'] if k in S else '') or h1s
    icon=icon or ih or (strip_icon(S[k]['title'])[0] if k in S else '')
    status='archived' if k in ORPH else ('stub' if STUB in h else 'published')
    kw=cleankw(S[k]['kw']) if k in S else cleankw(h1m+' '+h1s+' '+text(h)[:500])
    seo=h1c if len(h1c)>len(title) else title
    M.append(dict(id=k,title=title,icon=icon,subtitle=sub,ch=ch[k],parentId=parent.get(k),status=status,
        section=v['sec'],accent=v['hex'],description=trunc(desc(h)),seoTitle=seo,h1full=(h1c+' '+h1s).strip(),kw=kw))
# slugs
by={}
for o in M:
    o['slug']=slugify(o['title']) or o['id'].replace('_','-')
cnt=collections.Counter(o['slug'] for o in M)
for o in M:
    if cnt[o['slug']]>1 and (o['id'] not in navinfo):
        o['slug']=slugify(o['h1full'],70)
        if o['status']=='archived': o['slug']=slugify(o['title'],50)+'-ban-luu-tru'
cnt=collections.Counter(o['slug'] for o in M)
assert all(c==1 for c in cnt.values()), [s for s,c in cnt.items() if c>1]
slug={o['id']:o['slug'] for o in M}
for o in M:
    o['parent']=slug.get(o['parentId']) if o['parentId'] else None
    o['relatedArticles']=[slug[r] for r in edges[o['id']]]

# ---------- images ----------
IMGDIR=f'{ROOT}/assets/images'; os.makedirs(IMGDIR+'/articles',exist_ok=True); os.makedirs(IMGDIR+'/site',exist_ok=True); os.makedirs(IMGDIR+'/og',exist_ok=True)
manifest={}
WIDTHS=[640,1280,2048]
def save_variants(img, key):
    folder=f'{IMGDIR}/articles/{key.split("/")[0]}'; os.makedirs(folder,exist_ok=True)
    name=key.split('/')[1]
    if img.mode not in ('RGB','RGBA'): img=img.convert('RGBA' if 'A' in img.getbands() or img.mode=='P' else 'RGB')
    W,H=img.size; vs=[w for w in WIDTHS if w<W] + ([min(W,2048)] if W<=2048 else [])
    vs=sorted(set(vs)) if vs else [W]
    if W>2048: vs=[640,1280,2048]
    for w in vs:
        im=img if w==W else img.resize((w,round(H*w/W)),Image.LANCZOS)
        im.save(f'{folder}/{name}-{w}.webp','WEBP',quality=80,method=6)
    manifest[key]={'w':W if W<=2048 else 2048,'h':H if W<=2048 else round(H*2048/W),'v':vs}
    return img
DATA_RE=re.compile(r'data:image/([a-z]+);base64,([A-Za-z0-9+/=]+)')
first_img={}
def process_images(slug_, h):
    n=[0]; heroimg=[None]
    def rep(m):
        tag=m.group(0); d=DATA_RE.search(tag)
        n[0]+=1; key=f'{slug_}/{n[0]:02d}'
        img=Image.open(io.BytesIO(base64.b64decode(d.group(2)))); img.load()
        img=save_variants(img,key)
        if n[0]==1: heroimg[0]=img
        tag=re.sub(r'\ssrc="data:image[^"]*"', f' data-img="{key}"', tag)
        return tag
    h=re.sub(r'<img\b[^>]*src="data:image[^"]*"[^>]*>', rep, h)
    return h, n[0], heroimg[0]

# ---------- links ----------
TAG_RE=re.compile(r'<(/?)(div|strong)\b[^>]*>')
def convert_links(h):
    opens=[m for m in re.finditer(r'<(div|strong)\b([^>]*?)\sonclick="openPanel\(\'([^\']+)\'\)"([^>]*)>',h)]
    pairs=[]
    for m in opens:
        tag=m.group(1); depth=0; pos=m.start()
        for t in re.finditer(r'<(/?)'+tag+r'\b[^>]*>',h[pos:]):
            depth+= -1 if t.group(1) else 1
            if depth==0: pairs.append((m, pos+t.start(), pos+t.end())); break
    reps=[]
    for m,cs,ce in pairs:
        nested=any(o.start()<m.start() and ce2>m.end() for o,_,ce2 in pairs if o is not m)
        tag=m.group(1); target=slug[m.group(3)]; href=f'/bai/{target}/'
        attrs=(m.group(2)+m.group(4))
        if nested:
            reps.append((m.start(),m.end(),f'<{tag}{attrs} data-href="{href}" role="link" tabindex="0">'))
            continue
        if tag=='div':
            if re.search(r'\sclass="',attrs): attrs=re.sub(r'\sclass="',' class="xl-b ',attrs,1)
            else: attrs=' class="xl-b"'+attrs
            reps.append((m.start(),m.end(),f'<a href="{href}"{attrs}>')); reps.append((cs,ce,'</a>'))
        else:
            reps.append((m.start(),m.end(),f'<a href="{href}" class="xl-i"><strong{attrs}>')); reps.append((cs,ce,'</strong></a>'))
    for s,e,r in sorted(reps,reverse=True): h=h[:s]+r+h[e:]
    return h, len(pairs), sum(1 for r in reps if 'data-href' in r[2])

os.makedirs(f'{ROOT}/content/articles',exist_ok=True)
stats=collections.Counter()
heroes={}
for o in M:
    h=A[o['id']]['html'].strip()+'\n'
    h,ni,hero=process_images(o['slug'],h); stats['imgs']+=ni
    h,nl,nf=convert_links(h); stats['links']+=nl; stats['fallback']+=nf
    assert 'openPanel' not in h, o['id']
    assert 'data:image' not in h
    open(f"{ROOT}/content/articles/{o['slug']}.html",'w',encoding='utf-8').write(h)
    o['images']=ni
    if ni: heroes[o['slug']]=hero
print(stats)

# ---------- site images ----------
bodyimgs=DATA_RE.findall(raw[:raw.find('<script>\n',40000)])
port=Image.open(io.BytesIO(base64.b64decode(bodyimgs[0][1]))).convert('RGB')
port.save(f'{IMGDIR}/site/tac-gia-nguyen-anh-tu.webp','WEBP',quality=82,method=6)
port.save(f'{IMGDIR}/site/tac-gia-nguyen-anh-tu.jpg','JPEG',quality=85)
av=Image.open(io.BytesIO(base64.b64decode(bodyimgs[1][1]))).convert('RGBA')
av.resize((96,96),Image.LANCZOS).save(f'{IMGDIR}/site/avatar-96.webp','WEBP',quality=85)
av.save(f'{IMGDIR}/site/avatar-220.png')
for k,hero in heroes.items(): hero.convert('RGB').save(f'/home/claude/mig/hero_{k}.jpg',quality=92)

# ---------- data ----------
os.makedirs(f'{ROOT}/data',exist_ok=True)
chapters={c['ch']:c for c in nav}
articles=[]
for o in M:
    c=chapters[o['ch']]
    tags=[CAT[o['ch']]]
    if o['parent'] and o['ch']==4: tags.append(o['parent'])
    if o['status']=='stub': tags.append('dang-cap-nhat')
    a=dict(id=o['id'],slug=o['slug'],status=o['status'],title=o['title'],subtitle=o['subtitle'],icon=o['icon'],
        category=CAT[o['ch']],parent=o['parent'],tags=tags,description=o['description'],
        thumbnail=f"{o['slug']}/01" if o['images'] else None, heroImage=f"{o['slug']}/01" if o['images'] else None,
        publishedDate=TODAY,updatedDate=TODAY,author='nguyen-anh-tu',content=f"content/articles/{o['slug']}.html",
        relatedArticles=o['relatedArticles'],seoTitle=o['seoTitle'],seoDescription=o['description'],
        ogImage=f"assets/images/og/{o['slug']}.jpg",section=o['section'],accent=o['accent'],searchKeywords=o['kw'],
        legacy={'source':'v57','panelId':o['id']})
    articles.append(a)
json.dump(articles,open(f'{ROOT}/data/articles.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
cats=[]
for c in nav:
    items=[]
    for it in c['items']:
        x={'article':slug[it['id']]}
        if it.get('num'): x['num']=it['num']
        if it.get('star'): x['star']=True
        if it.get('highlight'): x['highlight']=True
        if 'projects' in it: x['projects']=[dict(article=slug[p['id']],**({'star':True} if p['star'] else {})) for p in it['projects']]
        items.append(x)
    cats.append(dict(id=CAT[c['ch']],ch=c['ch'],num=c['num'],icon=c['icon'],title=c['title'],tagline=c['tagline'],badge=c['badge'],
                     layout='zones' if c['ch']==4 else 'list',items=items))
json.dump(cats,open(f'{ROOT}/data/categories.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
json.dump(manifest,open(f'{ROOT}/data/images.json','w'),indent=0)
print(len(articles),'articles', len(manifest),'images')
