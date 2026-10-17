// Optional snapshots migrate with the private document, never as public assets.
export function validateExtras(document) {
  const fail = () => { throw new Error('课程快照或博士调研数据格式无效。'); };
  const str = (v, max = 10000) => typeof v === 'string' && v.length <= max;
  const id = v => str(v, 100) && /^[A-Za-z0-9_-]+$/.test(v) && !['__proto__','constructor','prototype'].includes(v);
  const arr = v => Array.isArray(v) && v.length <= 10000;
  const obj = v => v && typeof v === 'object' && !Array.isArray(v);
  const date = v => v === null || v === '' || (str(v, 40) && Number.isFinite(Date.parse(v)));
  const number = v => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  const link = v => !v || (str(v) && /^https?:\/\//i.test(v));
  if (document.integrations !== undefined) {
    if (!obj(document.integrations)) fail();
    const n = document.integrations.ntulearn;
    if (n !== undefined) {
      if (!obj(n) || !arr(n.items) || !date(n.fetchedAt) || !obj(n.courseNames)) fail();
      for (const [key, value] of Object.entries(n.courseNames)) if (!id(key) || !str(value, 300)) fail();
      for (const r of n.items) if (!obj(r) || !str(r.course) || !str(r.name) || !str(r.status, 100) || !date(r.due) || !(r.score === null || number(r.score)) || !(r.max === null || number(r.max))) fail();
    }
    const p = document.integrations.phd;
    if (p !== undefined) {
      if (!obj(p) || !str(p.updated, 50) || !arr(p.dirs) || !p.dirs.every(d => str(d,100)) || !arr(p.schools)) fail();
      for (const s of p.schools) {
        if (!obj(s) || !id(s.id) || !str(s.name,200) || !link(s.site) || !arr(s.mentors) || !arr(s.timeline) || !arr(s.xhs) || (s.note !== undefined && !str(s.note))) fail();
        if (s.links !== undefined && (!arr(s.links) || s.links.some(l=>!obj(l)||!str(l.label)||!link(l.url)))) fail();
        for (const m of s.mentors) if (!obj(m) || !id(m.id) || !str(m.name,200) || !str(m.unit,500) || !arr(m.topics) || !m.topics.every(t=>str(t,100)) || !str(m.evidence) || !link(m.url) || !['yes','lead','unknown','no'].includes(m.recruit) || typeof m.verified !== 'boolean') fail();
        for (const t of s.timeline) if (!obj(t) || !str(t.label) || !str(t.date) || !str(t.note) || typeof t.verified !== 'boolean') fail();
        for (const x of s.xhs) if (!obj(x) || !str(x.title) || !str(x.date) || !link(x.url)) fail();
      }
    }
  }
  if (document.phdPicks !== undefined) {
    if (!obj(document.phdPicks)) fail();
    for (const [key,p] of Object.entries(document.phdPicks)) if (!id(key) || !obj(p) || (p.s !== undefined && !['','想联系','已联系','已回复','暂缓'].includes(p.s)) || (p.n !== undefined && !str(p.n,200))) fail();
  }
  return document;
}
