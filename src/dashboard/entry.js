import { createClient } from '@supabase/supabase-js';
import { CloudStore } from './cloud-store.js';
import { projectConfig } from './project-config.js';
import './style.css';
import './auth.css';

const root = document.querySelector('#auth-root');
const app = document.querySelector('#dashboard-app');
const syncDialog = document.querySelector('#sync-dialog');
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const url = import.meta.env.VITE_SUPABASE_URL || projectConfig.url;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || projectConfig.publishableKey;
let client, store, loaded = false, loading = false;

function gate(title, detail, content = '') {
  root.hidden = false;
  app.hidden = true;
  root.innerHTML = `<div class="auth-card"><a class="auth-home" href="/">← 返回个人主页</a><div class="eyebrow">CHAPTER / PRIVATE WORKSPACE</div><h1>${escape(title)}</h1><p>${escape(detail)}</p>${content}<div class="auth-foot">你的学业、生活与下一章。</div></div>`;
}

function downloadPending() {
  if (!store?.pending) return;
  const blob = new Blob([JSON.stringify(store.pending.document, null, 2)], { type: 'application/json' });
  const objectURL = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectURL;
  link.download = `chapter-unsynced-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
}

function syncScreen(failure = null) {
  if (!syncDialog.open) syncDialog.showModal();
  if (!failure) {
    syncDialog.innerHTML = '<h2>正在保存到云端…</h2><p class="dialog-hint">请稍候，保存完成后可继续编辑。</p>';
    return;
  }
  const conflict = failure.message?.includes('CHAPTER_CONFLICT');
  syncDialog.innerHTML = `<h2>${conflict ? '另一台设备已有更新' : '这次更改尚未同步'}</h2><p class="dialog-hint">${conflict ? '为避免覆盖较新的记录，已停止保存。请先导出本次更改，再读取云端最新版本并重新整理。' : '网络或登录状态出现问题。当前更改仍留在此页面，可以重试；关闭页面前请导出备份。'}</p><div class="dialog-actions"><button class="button" id="pending-export">导出未同步更改</button>${conflict ? '' : '<button class="button primary" id="sync-retry">重试保存</button>'}<button class="button" id="sync-reload">读取云端版本</button></div>`;
  document.querySelector('#pending-export').onclick = downloadPending;
  document.querySelector('#sync-reload').onclick = () => {
    if (confirm('读取云端版本会放弃本页面未同步的更改。请先导出备份，是否继续？')) {
      store.pending = null;
      location.reload();
    }
  };
  const retry = document.querySelector('#sync-retry');
  if (retry) retry.onclick = async () => {
    syncScreen();
    try {
      await store.retry();
      location.reload();
    } catch (error) { syncScreen(error); }
  };
}

syncDialog.addEventListener('cancel', event => event.preventDefault());
window.addEventListener('beforeunload', event => {
  if (store?.pending) { event.preventDefault(); event.returnValue = ''; }
});
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });

async function showWorkspace() {
  if (loading || loaded) return;
  loading = true;
  gate('正在打开你的工作台', '验证账户并读取最新记录…');
  try {
    const { data: auth, error: authError } = await client.auth.getUser();
    if (authError || !auth.user) { login(); return; }
    const { data: allowed, error: permissionError } = await client.rpc('chapter_is_owner');
    if (permissionError) throw new Error('暂时无法验证工作台权限。请检查网络及数据库配置。');
    if (!allowed) {
      gate('这个账户没有访问权限', '工作台仅对已授权的个人账户开放。', '<button class="button" id="auth-logout">退出此账户</button>');
      document.querySelector('#auth-logout').onclick = logout;
      return;
    }
    const { data: record, error } = await client.from('chapter_state').select('document, revision').eq('owner_id', auth.user.id).maybeSingle();
    if (error) throw new Error('无法读取云端记录。没有切换到空白数据，请稍后重试。');
    store = new CloudStore(client, auth.user.id, record?.revision || 0);
    window.chapterCloud = {
      initial: record?.document || null,
      async save(document) {
        syncScreen();
        try {
          await store.save(document);
          syncDialog.close();
        } catch (error) {
          syncScreen(error);
          throw error;
        }
      },
      logout,
      onLoaded() {
        loaded = true;
        root.hidden = true;
        app.hidden = false;
      },
    };
    await import('./app.js');
  } catch (error) {
    gate('暂时无法打开工作台', error.message || '请检查网络后重试。', '<button class="button primary" id="auth-retry">重新加载</button>');
    document.querySelector('#auth-retry').onclick = () => location.reload();
  } finally { loading = false; }
}

async function logout() {
  if (store?.pending) return syncScreen(new Error('CHAPTER_PENDING'));
  gate('正在退出', '正在结束当前设备的登录会话…');
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) {
    gate('退出尚未完成', '请检查网络后重试。', '<button class="button" id="logout-retry">重试退出</button>');
    document.querySelector('#logout-retry').onclick = logout;
  } else { location.reload(); }
}

function login() {
  gate('欢迎回到你的这一章', '使用已授权的邮箱登录，继续你的学习与生活记录。', `<form id="login-form"><label class="form-field">邮箱<input name="email" type="email" autocomplete="email" required placeholder="你的登录邮箱"></label><button class="button primary" type="submit">发送登录邮件 →</button></form><p id="auth-message" role="status" aria-live="polite"></p><details><summary>邮件里有验证码？</summary><form id="otp-form"><label class="form-field">验证码<input name="token" inputmode="numeric" autocomplete="one-time-code" minlength="6" maxlength="10" required></label><button class="button" type="submit">验证并登录</button></form></details>${store?.pending ? '<button class="button" id="expired-export">先导出未同步更改</button>' : ''}`);
  const pendingExport = document.querySelector('#expired-export');
  if (pendingExport) pendingExport.onclick = downloadPending;
  document.querySelector('#login-form').onsubmit = async event => {
    event.preventDefault();
    const email = new FormData(event.target).get('email').trim();
    const button = event.target.querySelector('button');
    const status = document.querySelector('#auth-message');
    button.disabled = true;
    try {
      const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: new URL('/dashboard/', location.origin).href } });
      status.textContent = error ? '暂时无法发送。请确认使用已授权的邮箱，稍后重试。' : '若邮箱已获授权，登录邮件将发送到你的收件箱。请在此设备打开邮件链接，或输入邮件中的验证码。';
    } catch { status.textContent = '网络连接失败，请稍后重试。'; }
    finally { button.disabled = false; }
  };
  document.querySelector('#otp-form').onsubmit = async event => {
    event.preventDefault();
    const email = document.querySelector('#login-form input').value.trim();
    const token = new FormData(event.target).get('token').trim();
    const status = document.querySelector('#auth-message');
    if (!email) { status.textContent = '请先填写登录邮箱。'; return; }
    const button = event.target.querySelector('button');
    button.disabled = true;
    try {
      const { error } = await client.auth.verifyOtp({ email, token, type: 'email' });
      if (error) status.textContent = '验证码无效或已过期，请重新获取。';
      else if (loaded) location.reload();
      else await showWorkspace();
    } catch { status.textContent = '网络连接失败，请稍后重试。'; }
    finally { button.disabled = false; }
  };
}

// No configuration means a locked screen, never a local-storage fallback.
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key) || /REPLACE_ME/.test(key)) {
  gate('工作台即将就绪', '个人主页正常开放。私人工作台正在配置云端登录与存储，完成后即可在 Mac 和其他设备上继续使用。');
} else {
  client = createClient(url, key, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'chapter-auth-v1' } });
  client.auth.onAuthStateChange((event, session) => {
    if (loaded && (event === 'SIGNED_OUT' || (session && session.user.id !== store.ownerId))) {
      app.hidden = true;
      if (syncDialog.open) syncDialog.close();
      login();
    }
  });
  void showWorkspace();
}
