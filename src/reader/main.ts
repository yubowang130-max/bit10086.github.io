import 'pdfjs-dist/web/pdf_viewer.css';
import './reader.css';
import { allMeta, blankMeta, kvGet, kvSet, putMeta, type PaperMeta, type Status } from './store';
import { canPickFolder, entriesFromFiles, permission, pickFolder, readNotesFile, scanFolder, writeNotesFile, type Entry } from './fs';

type PdfLib = typeof import('pdfjs-dist');
type ViewerLib = typeof import('pdfjs-dist/web/pdf_viewer.mjs');

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const ui = {
  app: $('app'),
  openFolder: $<HTMLButtonElement>('open-folder'),
  reconnect: $<HTMLButtonElement>('reconnect'),
  reconnectName: $('reconnect-name'),
  pickFiles: $<HTMLInputElement>('pick-files'),
  pickFilesLabel: $('pick-files-label'),
  folderName: $('folder-name'),
  search: $<HTMLInputElement>('search'),
  filters: $('filters'),
  files: $('files'),
  libFoot: $('lib-foot'),
  docTitle: $('doc-title'),
  find: $<HTMLInputElement>('find'),
  zoomIn: $<HTMLButtonElement>('zoom-in'),
  zoomOut: $<HTMLButtonElement>('zoom-out'),
  zoomLabel: $<HTMLButtonElement>('zoom-label'),
  pageInput: $<HTMLInputElement>('page-input'),
  pageTotal: $('page-total'),
  status: $<HTMLSelectElement>('status'),
  star: $<HTMLButtonElement>('star'),
  toggleLib: $<HTMLButtonElement>('toggle-lib'),
  toggleNotes: $<HTMLButtonElement>('toggle-notes'),
  theme: $<HTMLButtonElement>('theme-btn'),
  container: $<HTMLDivElement>('viewerContainer'),
  viewer: $<HTMLDivElement>('viewer'),
  textView: $('text-view'),
  empty: $('empty'),
  install: $<HTMLButtonElement>('install-btn'),
  notes: $<HTMLTextAreaElement>('notes-text'),
  quote: $<HTMLButtonElement>('quote-btn'),
  saveState: $('save-state'),
  notesFoot: $('notes-foot'),
  toast: $('toast'),
};

const state = {
  root: null as FileSystemDirectoryHandle | null,
  canWrite: false,
  entries: [] as Entry[],
  meta: new Map<string, PaperMeta>(),
  current: null as Entry | null,
  filter: 'all' as 'all' | Status | 'star',
  query: '',
};

/* ---------- small helpers ---------- */

let toastTimer = 0;
function toast(msg: string) {
  ui.toast.textContent = msg;
  ui.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => ui.toast.classList.remove('show'), 2600);
}

function metaFor(key: string): PaperMeta {
  let m = state.meta.get(key);
  if (!m) {
    m = blankMeta(key);
    state.meta.set(key, m);
  }
  return m;
}

function saveMeta(m: PaperMeta) {
  state.meta.set(m.key, m);
  putMeta(m).catch(() => toast('本地存储写入失败'));
}

function fmtSize(n: number) {
  return n > 1 << 20 ? (n / (1 << 20)).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const STATUS_LABEL: Record<Status, string> = { unread: '未读', reading: '在读', done: '已读' };

/* ---------- theme & layout ---------- */

function applyTheme(t: string) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#171816' : '#f4f3ef');
}
applyTheme(localStorage.getItem('reader-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
ui.theme.onclick = () => {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('reader-theme', t);
  applyTheme(t);
};


// Wide screens: panels collapse in the grid (remembered).
// Narrow screens: panels are hidden by default and open as overlays.
const narrowLib = matchMedia('(max-width: 760px)');
const narrowNotes = matchMedia('(max-width: 1100px)');
function togglePanel(cls: 'no-lib' | 'no-notes') {
  const narrow = cls === 'no-lib' ? narrowLib.matches : narrowNotes.matches;
  if (narrow) {
    const overlay = cls === 'no-lib' ? 'show-lib' : 'show-notes';
    ui.app.classList.remove(overlay === 'show-lib' ? 'show-notes' : 'show-lib');
    ui.app.classList.toggle(overlay);
    return;
  }
  ui.app.classList.toggle(cls);
  localStorage.setItem('reader-layout', [...ui.app.classList].filter((c) => c.startsWith('no-')).join(' '));
  setTimeout(() => pdfViewer && pdfViewer.currentScaleValue && refit(), 220);
}
const savedLayout = localStorage.getItem('reader-layout');
if (savedLayout) ui.app.classList.add(...savedLayout.split(' ').filter((c) => c === 'no-lib' || c === 'no-notes'));
ui.toggleLib.onclick = () => togglePanel('no-lib');
ui.toggleNotes.onclick = () => togglePanel('no-notes');

/* ---------- library list ---------- */

function renderList() {
  const q = state.query.trim().toLowerCase();
  const list = state.entries.filter((e) => {
    const m = state.meta.get(e.id);
    if (state.filter === 'star' && !m?.star) return false;
    if (state.filter !== 'all' && state.filter !== 'star' && (m?.status ?? 'unread') !== state.filter) return false;
    return !q || e.key.toLowerCase().includes(q);
  });

  const recent = state.entries
    .filter((e) => (state.meta.get(e.id)?.lastOpened ?? 0) > 0)
    .sort((a, b) => state.meta.get(b.id)!.lastOpened - state.meta.get(a.id)!.lastOpened)
    .slice(0, 5);

  const groups = new Map<string, Entry[]>();
  for (const e of list) {
    if (!groups.has(e.dir)) groups.set(e.dir, []);
    groups.get(e.dir)!.push(e);
  }
  const item = (e: Entry) => {
    const m = state.meta.get(e.id);
    const st = m?.status ?? 'unread';
    const pct = m && m.page > 1 ? ` · 第 ${m.page} 页` : '';
    return `<li><button class="file ${state.current?.id === e.id ? 'active' : ''}" data-id="${escapeHtml(e.id)}" title="${escapeHtml(e.key)}">
      <span class="dot ${st}" aria-label="${STATUS_LABEL[st]}"></span>
      <span class="fname">${m?.star ? '<b class="starred">★</b> ' : ''}${escapeHtml(e.name.replace(/\.pdf$/i, ''))}</span>
      <span class="fmeta">${e.kind === 'pdf' ? 'PDF' : 'TXT'} · ${fmtSize(e.size)}${pct}</span>
    </button></li>`;
  };

  let html = '';
  if (!q && state.filter === 'all' && recent.length) {
    html += `<li class="group">最近阅读</li>` + recent.map(item).join('');
  }
  for (const dir of [...groups.keys()].sort((a, b) => a.localeCompare(b, 'zh'))) {
    const files = groups.get(dir)!.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
    html += `<li class="group">${escapeHtml(dir || '根目录')} <span>${files.length}</span></li>` + files.map(item).join('');
  }
  if (!state.entries.length) html = '';
  else if (!list.length) html = `<li class="none">没有匹配的文件</li>`;
  ui.files.innerHTML = html;

  const done = state.entries.filter((e) => state.meta.get(e.id)?.status === 'done').length;
  ui.libFoot.textContent = state.entries.length
    ? `${state.entries.length} 个文件 · 已读 ${done} · 文件不会上传`
    : '文件只在你的电脑上读取，不会上传。';
}

ui.files.addEventListener('click', (ev) => {
  const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>('button.file');
  if (!btn) return;
  const e = state.entries.find((x) => x.id === btn.dataset.id);
  if (e) openEntry(e);
  ui.app.classList.remove('show-lib');
});
ui.search.addEventListener('input', () => {
  state.query = ui.search.value;
  renderList();
});
ui.filters.addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!b) return;
  state.filter = b.dataset.f as typeof state.filter;
  ui.filters.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  renderList();
});

/* ---------- folders ---------- */

// Give every folder a persistent id so two folders with the same file names never share notes.
async function rootIdFor(root: FileSystemDirectoryHandle): Promise<string> {
  const roots = (await kvGet<{ id: string; handle: FileSystemDirectoryHandle }[]>('roots')) || [];
  for (const r of roots) if (await r.handle.isSameEntry(root)) return r.id;
  const id = 'dir-' + crypto.randomUUID().slice(0, 8);
  roots.push({ id, handle: root });
  await kvSet('roots', roots);
  return id;
}

async function loadFolder(root: FileSystemDirectoryHandle, mode: 'readwrite' | 'read') {
  await flushNotes(); // save the open paper's notes into its own folder before switching
  const rootId = await rootIdFor(root);
  state.root = root;
  state.canWrite = mode === 'readwrite';
  ui.reconnect.hidden = true;
  ui.folderName.textContent = `📁 ${root.name}` + (state.canWrite ? '' : '（只读，笔记仅存在浏览器里）');
  ui.files.innerHTML = '<li class="none">正在扫描…</li>';
  state.entries = (await scanFolder(root, rootId, (n) => {
    if (n % 25 === 0) ui.files.innerHTML = `<li class="none">正在扫描… 已找到 ${n} 个</li>`;
  })).map((e) => ({ ...e, canWrite: mode === 'readwrite' }));
  renderList();
  const last = await kvGet<string>('lastOpened');
  const e = last && state.entries.find((x) => x.id === last);
  if (e && !state.current) openEntry(e);
}

ui.openFolder.onclick = async () => {
  if (!canPickFolder) {
    ui.pickFiles.click();
    return;
  }
  try {
    const root = await pickFolder();
    await kvSet('root', root);
    await loadFolder(root, await permission(root, false) === 'readwrite' ? 'readwrite' : 'read');
  } catch (err) {
    if ((err as DOMException).name !== 'AbortError') toast('没能打开文件夹：' + (err as Error).message);
  }
};

ui.reconnect.onclick = async () => {
  const root = await kvGet<FileSystemDirectoryHandle>('root');
  if (!root) return;
  const mode = await permission(root, true);
  if (mode === 'none') return toast('需要允许访问才能读取文件夹');
  loadFolder(root, mode);
};

ui.pickFiles.addEventListener('change', async () => {
  if (!ui.pickFiles.files?.length) return;
  await flushNotes();
  state.root = null;
  state.canWrite = false;
  state.entries = entriesFromFiles(ui.pickFiles.files);
  ui.folderName.textContent = '本次会话选择的文件（笔记存在浏览器里）';
  renderList();
});

if (!canPickFolder) {
  // Firefox / Safari: let the button pick a whole folder through the classic file input.
  ui.pickFiles.setAttribute('webkitdirectory', '');
  ui.openFolder.textContent = '选择论文文件夹';
  ui.pickFilesLabel.hidden = true;
}

async function restore() {
  const [metas, root] = await Promise.all([allMeta(), canPickFolder ? kvGet<FileSystemDirectoryHandle>('root') : undefined]);
  for (const m of metas) state.meta.set(m.key, m);
  if (!root) return;
  const mode = await permission(root, false);
  if (mode !== 'none') return loadFolder(root, mode);
  ui.reconnectName.textContent = root.name;
  ui.reconnect.hidden = false;
  ui.folderName.textContent = '上次打开的文件夹需要你点一下授权';
}

/* ---------- PDF viewer ---------- */

let libs: { pdfjs: PdfLib; v: ViewerLib } | null = null;
let pdfViewer: InstanceType<ViewerLib['PDFViewer']> | null = null;
let eventBus: InstanceType<ViewerLib['EventBus']> | null = null;
let findController: InstanceType<ViewerLib['PDFFindController']> | null = null;
let currentDoc: { destroy(): Promise<void> } | null = null;

async function ensurePdf() {
  if (libs) return libs;
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  (globalThis as unknown as { pdfjsLib: PdfLib }).pdfjsLib = pdfjs;
  const v = await import('pdfjs-dist/web/pdf_viewer.mjs');
  eventBus = new v.EventBus();
  const linkService = new v.PDFLinkService({ eventBus, externalLinkTarget: 2 /* blank */ });
  findController = new v.PDFFindController({ eventBus, linkService });
  pdfViewer = new v.PDFViewer({
    container: ui.container,
    viewer: ui.viewer,
    eventBus,
    linkService,
    findController,
    removePageBorders: false,
  });
  linkService.setViewer(pdfViewer);

  eventBus.on('pagechanging', (e: { pageNumber: number }) => {
    ui.pageInput.value = String(e.pageNumber);
    if (state.current) {
      const m = metaFor(state.current.id);
      m.page = e.pageNumber;
      if (m.status === 'unread' && e.pageNumber > 1) {
        m.status = 'reading';
        ui.status.value = 'reading';
        renderList();
      }
      saveMetaSoon(m);
    }
  });
  eventBus.on('scalechanging', (e: { scale: number; presetValue?: string }) => {
    ui.zoomLabel.textContent = Math.round(e.scale * 100) + '%';
    if (state.current) {
      const m = metaFor(state.current.id);
      m.scale = e.presetValue || String(e.scale);
      saveMetaSoon(m);
    }
  });
  libs = { pdfjs, v };
  return libs;
}

let metaTimer = 0;
function saveMetaSoon(m: PaperMeta) {
  clearTimeout(metaTimer);
  metaTimer = window.setTimeout(() => saveMeta(m), 500);
}

function refit() {
  if (!pdfViewer) return;
  const v = pdfViewer.currentScaleValue;
  if (v === 'page-width' || v === 'page-fit' || v === 'auto') pdfViewer.currentScaleValue = v;
}
window.addEventListener('resize', () => {
  clearTimeout(metaTimer);
  refit();
});

async function openEntry(e: Entry) {
  await flushNotes();
  state.current = e;
  const m = metaFor(e.id);
  m.lastOpened = Date.now();
  saveMeta(m);
  kvSet('lastOpened', e.id);
  ui.empty.hidden = true;
  ui.docTitle.textContent = e.name;
  document.title = e.name + ' · 论文阅读器';
  ui.status.value = m.status;
  ui.star.textContent = m.star ? '★' : '☆';
  renderList();
  loadNotes(e, m);

  let file: File;
  try {
    file = await e.getFile();
  } catch {
    toast('文件读取失败，可能被移动或删除了');
    return;
  }

  if (e.kind === 'text') {
    ui.container.hidden = true;
    ui.textView.hidden = false;
    ui.textView.textContent = await file.text();
    ui.pageTotal.textContent = '';
    ui.pageInput.value = '';
    return;
  }
  ui.textView.hidden = true;
  ui.container.hidden = false;

  const { pdfjs } = await ensurePdf();
  if (state.current !== e) return;
  const data = new Uint8Array(await file.arrayBuffer());
  await currentDoc?.destroy();
  const task = pdfjs.getDocument({ data });
  currentDoc = task;
  let doc;
  try {
    doc = await task.promise;
  } catch (err) {
    toast('PDF 打不开：' + (err as Error).message);
    return;
  }
  if (state.current !== e) return;
  pdfViewer!.setDocument(doc);
  (pdfViewer as unknown as { linkService: { setDocument(d: unknown): void } }).linkService.setDocument(doc);
  findController!.setDocument(doc);
  ui.pageTotal.textContent = `/ ${doc.numPages}`;
  eventBus!.on(
    'pagesinit',
    () => {
      pdfViewer!.currentScaleValue = m.scale || 'page-width';
      if (m.page > 1) pdfViewer!.currentPageNumber = Math.min(m.page, doc.numPages);
      ui.pageInput.value = String(pdfViewer!.currentPageNumber);
    },
    { once: true },
  );
  doc.getMetadata().then((md) => {
    const t = (md.info as { Title?: string })?.Title;
    if (t && t.length > 6 && state.current === e) ui.docTitle.innerHTML = `${escapeHtml(t)} <small>${escapeHtml(e.name)}</small>`;
  });
  ui.container.focus();
}

/* toolbar */
const SCALES = [0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3];
function zoom(dir: 1 | -1) {
  if (!pdfViewer?.pdfDocument) return;
  const cur = pdfViewer.currentScale;
  const next = dir > 0 ? SCALES.find((s) => s > cur + 0.01) : [...SCALES].reverse().find((s) => s < cur - 0.01);
  if (next) pdfViewer.currentScale = next;
}
ui.zoomIn.onclick = () => zoom(1);
ui.zoomOut.onclick = () => zoom(-1);
ui.zoomLabel.onclick = () => {
  if (pdfViewer?.pdfDocument) pdfViewer.currentScaleValue = pdfViewer.currentScaleValue === 'page-width' ? 'page-fit' : 'page-width';
};
ui.pageInput.addEventListener('change', () => {
  const n = parseInt(ui.pageInput.value, 10);
  if (pdfViewer?.pdfDocument && n >= 1 && n <= pdfViewer.pagesCount) pdfViewer.currentPageNumber = n;
});
ui.find.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Enter' || !eventBus) return;
  eventBus.dispatch('find', {
    source: null,
    type: 'again',
    query: ui.find.value,
    caseSensitive: false,
    entireWord: false,
    highlightAll: true,
    findPrevious: ev.shiftKey,
    matchDiacritics: false,
  });
});
ui.status.onchange = () => {
  if (!state.current) return;
  const m = metaFor(state.current.id);
  m.status = ui.status.value as Status;
  saveMeta(m);
  renderList();
};
ui.star.onclick = () => {
  if (!state.current) return;
  const m = metaFor(state.current.id);
  m.star = !m.star;
  ui.star.textContent = m.star ? '★' : '☆';
  saveMeta(m);
  renderList();
};

/* ---------- notes ---------- */

let notesTimer = 0;
let notesDirty = false;

async function loadNotes(e: Entry, m: PaperMeta) {
  ui.notes.disabled = false;
  ui.notes.value = m.notes;
  ui.saveState.textContent = '';
  ui.notesFoot.textContent = e.root && e.canWrite ? `同步到 .paper-notes/ 文件夹` : '保存在这个浏览器里';
  if (e.root) {
    const f = await readNotesFile(e.root, e.key);
    if (f && state.current === e && f.modified > m.notesUpdated && f.text !== m.notes) {
      ui.notes.value = f.text;
      m.notes = f.text;
      m.notesUpdated = f.modified;
      saveMeta(m);
    }
  }
}

async function flushNotes() {
  clearTimeout(notesTimer);
  if (!notesDirty || !state.current) return;
  notesDirty = false;
  const e = state.current;
  const m = metaFor(e.id);
  m.notes = ui.notes.value;
  m.notesUpdated = Date.now();
  saveMeta(m);
  if (e.root && e.canWrite) {
    try {
      await writeNotesFile(e.root, e.key, m.notes);
    } catch {
      ui.saveState.textContent = '写入文件失败，已存在浏览器';
      return;
    }
  }
  if (state.current === e) ui.saveState.textContent = '已保存 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

ui.notes.addEventListener('input', () => {
  notesDirty = true;
  ui.saveState.textContent = '编辑中…';
  clearTimeout(notesTimer);
  notesTimer = window.setTimeout(flushNotes, 800);
});
ui.notes.addEventListener('blur', () => void flushNotes());
window.addEventListener('pagehide', () => void flushNotes());
document.addEventListener('visibilitychange', () => document.hidden && void flushNotes());

function quoteSelection() {
  const selection = window.getSelection();
  const sel = selection?.toString().replace(/\s+/g, ' ').trim();
  if (!sel || !state.current) return toast('先在 PDF 里选中一段文字');
  const anchor = selection!.anchorNode;
  const pageEl = (anchor instanceof Element ? anchor : anchor?.parentElement)?.closest<HTMLElement>('.page');
  const page = pageEl?.dataset.pageNumber || pdfViewer?.currentPageNumber;
  const block = `\n> ${sel}${page ? ` （p.${page}）` : ''}\n\n`;
  const pos = ui.notes.selectionEnd || ui.notes.value.length;
  ui.notes.value = ui.notes.value.slice(0, pos) + block + ui.notes.value.slice(pos);
  ui.notes.focus();
  ui.notes.selectionStart = ui.notes.selectionEnd = pos + block.length;
  ui.notes.dispatchEvent(new Event('input'));
}
ui.quote.addEventListener('mousedown', (ev) => ev.preventDefault()); // keep the PDF selection
ui.quote.onclick = quoteSelection;

/* ---------- keyboard ---------- */

document.addEventListener('keydown', (ev) => {
  const t = ev.target as HTMLElement;
  const typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT';
  if ((ev.ctrlKey || ev.metaKey) && ev.key === 'f' && state.current?.kind === 'pdf') {
    ev.preventDefault();
    ui.find.focus();
    ui.find.select();
    return;
  }
  if (typing) {
    if (ev.key === 'Escape') t.blur();
    return;
  }
  if (ev.key === '/') {
    ev.preventDefault();
    ui.search.focus();
  } else if (ev.key === '[') togglePanel('no-lib');
  else if (ev.key === ']') togglePanel('no-notes');
  else if (ev.key === '+' || ev.key === '=') zoom(1);
  else if (ev.key === '-') zoom(-1);
  else if (ev.key === 'q' || ev.key === 'Q') quoteSelection();
});

/* ---------- PWA ---------- */

function openLooseFile(f: File) {
  const e = entriesFromFiles([f] as unknown as FileList)[0];
  if (!e) return toast('只支持 PDF / Markdown / TXT');
  if (!state.entries.some((x) => x.id === e.id)) state.entries.push(e);
  openEntry(e);
}

// Installed app set as the PDF handler: open the double-clicked file.
const lq = (window as unknown as { launchQueue?: { setConsumer(cb: (p: { files: FileSystemFileHandle[] }) => void): void } }).launchQueue;
lq?.setConsumer(async (params) => {
  for (const h of params.files) openLooseFile(await h.getFile());
});

// Drag a PDF onto the window to read it straight away.
document.addEventListener('dragover', (ev) => ev.preventDefault());
document.addEventListener('drop', (ev) => {
  ev.preventDefault();
  const f = ev.dataTransfer?.files?.[0];
  if (f) openLooseFile(f);
});

let installEvent: (Event & { prompt(): Promise<void> }) | null = null;
window.addEventListener('beforeinstallprompt', (ev) => {
  ev.preventDefault();
  installEvent = ev as typeof installEvent;
  ui.install.hidden = false;
});
ui.install.onclick = async () => {
  await installEvent?.prompt();
  ui.install.hidden = true;
};
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/reader/sw.js', { scope: '/reader/' }).catch(() => {});
}

// Ask the browser not to evict our IndexedDB (notes, reading positions).
navigator.storage?.persist?.().catch(() => {});

restore().catch((err) => toast('初始化失败：' + (err as Error).message));
