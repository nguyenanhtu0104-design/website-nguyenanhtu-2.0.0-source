import re, json
from common import *
t=open('/home/claude/stripped.html').read()
x=t.find('<div class="chapters">'); y=t.find('end chapters')
navhtml=t[x:y]
chs=[]
for m in re.finditer(r'<!-- CH (\d+) — ([^>]*)-->\s*<div class="chapter" data-ch="(\d)">(.*?)(?=<!-- CH |\Z)', navhtml, re.S):
    body=m.group(4)
    g=lambda cls: text(re.search(r'class="'+cls+r'">(.*?)</div>',body,re.S).group(1))
    ch={'ch':int(m.group(3)),'num':g('ch-num'),'icon':g('ch-icon'),'title':g('ch-title'),'tagline':g('ch-tagline'),'badge':g('ch-badge'),'items':[]}
    cb=body[body.find('<div class="ch-body">'):]
    # iterate art-rows and chip rows in order
    for r in re.finditer(r'<div class="art-row" onclick="openPanel\(\'([^\']+)\'\)"( style="[^"]*")?>(.*?)<div class="art-arrow">›</div></div>|<div style="padding:0 16px 10px 54px;margin-top:-2px">(.*?)</div>\n', cb, re.S):
        if r.group(1):
            inner=r.group(3)
            it={'id':r.group(1),'highlight':bool(r.group(2)),'title':text(re.search(r'class="art-title">(.*?)</div>',inner,re.S).group(1)),'sub':text(re.search(r'class="art-sub">(.*?)</div>',inner,re.S).group(1))}
            n=re.search(r"width:22px;flex-shrink:0\">(\d+)</div>",inner)
            if n: it['num']=n.group(1)
            it['star']='⭐' in inner
            ch['items'].append(it)
        else:
            chips=[{'id':c.group(1),'star':'rgba(200,153,58,.55)' in c.group(2),'label':text(c.group(3)).replace('⭐','').strip()} for c in re.finditer(r'<span onclick="openPanel\(\'([^\']+)\'\)" style="([^"]*)">(.*?)</span>',r.group(4))]
            ch['items'][-1]['projects']=chips
    chs.append(ch)
json.dump(chs,open('nav.json','w'),ensure_ascii=False,indent=1)
for c in chs: print(c['ch'],c['title'],len(c['items']),sum(len(i.get('projects',[])) for i in c['items']))
