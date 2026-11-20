// Local file access. Chrome / Edge: File System Access API (folder is remembered).
// Other browsers: plain <input type="file"> (files are only kept for this session).

export interface Entry {
  key: string; // relative path, e.g. "LLM/attention.pdf"
  name: string;
  dir: string;
  kind: 'pdf' | 'text';
  size: number;
  modified: number;
  getFile: () => Promise<File>;
}

type PermMode = { mode: 'read' | 'readwrite' };
interface PermHandle {
  queryPermission(d: PermMode): Promise<PermissionState>;
  requestPermission(d: PermMode): Promise<PermissionState>;
}
type DirHandle = FileSystemDirectoryHandle & PermHandle & {
  values(): AsyncIterableIterator<FileSystemDirectoryHandle | FileSystemFileHandle>;
};

declare global {
  interface Window {
    showDirectoryPicker?: (o?: { id?: string; mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
  }
}

export const canPickFolder = typeof window.showDirectoryPicker === 'function';

const NOTES_DIR = '.paper-notes';
const SKIP = new Set([NOTES_DIR, 'node_modules', '.git', '.Trash']);

export function kindOf(name: string): Entry['kind'] | null {
  const n = name.toLowerCase();
  if (n.endsWith('.pdf')) return 'pdf';
  if (n.endsWith('.md') || n.endsWith('.markdown') || n.endsWith('.txt')) return 'text';
  return null;
}

export async function pickFolder(): Promise<FileSystemDirectoryHandle> {
  return window.showDirectoryPicker!({ id: 'paper-reader', mode: 'readwrite' });
}

export async function permission(handle: FileSystemDirectoryHandle, ask: boolean): Promise<'readwrite' | 'read' | 'none'> {
  const h = handle as DirHandle;
  if ((await h.queryPermission({ mode: 'readwrite' })) === 'granted') return 'readwrite';
  if (ask) {
    if ((await h.requestPermission({ mode: 'readwrite' })) === 'granted') return 'readwrite';
    if ((await h.requestPermission({ mode: 'read' })) === 'granted') return 'read';
  } else if ((await h.queryPermission({ mode: 'read' })) === 'granted') return 'read';
  return 'none';
}

export async function scanFolder(root: FileSystemDirectoryHandle, onProgress?: (n: number) => void): Promise<Entry[]> {
  const out: Entry[] = [];
  async function walk(dir: FileSystemDirectoryHandle, prefix: string, depth: number) {
    if (depth > 8) return;
    for await (const h of (dir as DirHandle).values()) {
      if (h.name.startsWith('.') || SKIP.has(h.name)) continue;
      if (h.kind === 'directory') {
        await walk(h as FileSystemDirectoryHandle, prefix + h.name + '/', depth + 1);
      } else {
        const kind = kindOf(h.name);
        if (!kind) continue;
        const fh = h as FileSystemFileHandle;
        const f = await fh.getFile();
        out.push({
          key: prefix + h.name,
          name: h.name,
          dir: prefix.replace(/\/$/, ''),
          kind,
          size: f.size,
          modified: f.lastModified,
          getFile: () => fh.getFile(),
        });
        onProgress?.(out.length);
      }
    }
  }
  await walk(root, '', 0);
  return out;
}

export function entriesFromFiles(files: FileList): Entry[] {
  const out: Entry[] = [];
  for (const f of Array.from(files)) {
    const kind = kindOf(f.name);
    if (!kind) continue;
    const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
    const parts = rel.split('/');
    if (parts.length > 1) parts.shift(); // drop the picked folder's own name
    const key = parts.join('/');
    out.push({
      key,
      name: f.name,
      dir: parts.slice(0, -1).join('/'),
      kind,
      size: f.size,
      modified: f.lastModified,
      getFile: async () => f,
    });
  }
  return out;
}

function notesFileName(key: string): string {
  return key.replace(/[\\/]/g, ' ⁄ ').replace(/\.(pdf|md|markdown|txt)$/i, '') + '.md';
}

export async function readNotesFile(root: FileSystemDirectoryHandle, key: string): Promise<{ text: string; modified: number } | null> {
  try {
    const dir = await root.getDirectoryHandle(NOTES_DIR);
    const fh = await dir.getFileHandle(notesFileName(key));
    const f = await fh.getFile();
    return { text: await f.text(), modified: f.lastModified };
  } catch {
    return null;
  }
}

export async function writeNotesFile(root: FileSystemDirectoryHandle, key: string, text: string): Promise<void> {
  const dir = await root.getDirectoryHandle(NOTES_DIR, { create: true });
  const fh = await dir.getFileHandle(notesFileName(key), { create: true });
  const w = await (fh as FileSystemFileHandle & { createWritable(): Promise<FileSystemWritableFileStream> }).createWritable();
  await w.write(text);
  await w.close();
}
