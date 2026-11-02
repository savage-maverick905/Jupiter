// Jupiter admin page: sign-up switch, users (disable / enable), audit log. The server checks admin rights on every call.
import { h, api, toast } from '/shared/ui.js';
const root = document.getElementById('root');
const when = (iso) => (iso ? new Date(iso).toLocaleString() : 'never');
let me = null, tab = 'users';

async function start() {
  try { me = await api('GET', '/api/auth/me'); }
  catch (e) { return gate(e.status === 401 ? 'Sign in to Jupiter with an admin account first.' : e.message); }
  if (!me.isAdmin) return gate('This page is for admins only.');
  render();
}
function gate(text) {
  root.replaceChildren(h('div', { class: 'msg' }, h('p', {}, text), h('a', { class: 'btn', href: '/apps/jupiter/' }, 'Open Jupiter')));
}
function shell(...kids) {
  const t = (id, label) => h('button', { class: `btn ${tab === id ? '' : 'ghost'}`, onclick: () => { tab = id; render(); } }, label);
  root.replaceChildren(
    h('header', {}, h('img', { src: '/apps/jupiter/icons/icon-192.png', alt: '' }), h('h1', {}, 'Jupiter admin'), h('a', { class: 'btn ghost small', href: '/apps/jupiter/' }, 'Back to app')),
    h('div', { class: 'tabs' }, t('users', 'Users'), t('log', 'Activity')), ...kids, h('p', { class: 'builtby' }, 'Built by Hie'));
}
async function render() { shell(h('div', { class: 'msg' }, 'Loading…')); try { await (tab === 'users' ? users() : log()); } catch (e) { shell(h('div', { class: 'msg' }, e.message)); } }

async function users() {
  const [{ users: list }, cfg] = await Promise.all([api('GET', '/api/users'), api('GET', '/api/admin/signup')]);
  const open = cfg.signupEnabled;
  const active = list.filter((u) => u.status === 'active').length;
  const row = (u) => {
    const self = u.id === me.user.id, admin = u.roleId === 'admin';
    return h('div', { class: 'row' }, h('div', { class: 'meta' }, h('b', {}, u.displayName), h('small', {}, `${u.email} · joined ${when(u.createdAt)} · last sign-in ${when(u.lastLoginAt)}`)),
      admin ? h('span', { class: 'pill adm' }, 'Admin') : null, u.status !== 'active' ? h('span', { class: 'pill off' }, 'Disabled') : null,
      self || admin ? null : h('button', { class: 'btn ghost small', onclick: async () => {
        const off = u.status === 'active';
        if (off && !confirm(`Disable ${u.email}? They will be signed out and cannot use Jupiter until re-enabled. Their music is not deleted.`)) return;
        try { await api('PATCH', `/api/users/${u.id}`, { status: off ? 'disabled' : 'active' }); toast(off ? 'Account disabled' : 'Account enabled'); render(); } catch (e) { toast(e.message); }
      } }, u.status === 'active' ? 'Disable' : 'Enable'));
  };
  shell(
    h('div', { class: 'stats' }, h('div', { class: 'stat' }, h('b', {}, String(list.length)), h('span', {}, 'Accounts')), h('div', { class: 'stat' }, h('b', {}, String(active)), h('span', {}, 'Active')),
      h('div', { class: 'stat' }, h('b', {}, open ? 'Open' : 'Closed'), h('span', {}, 'Public sign-up'))),
    h('button', { class: 'btn ghost wide', onclick: async () => { try { await api('PUT', '/api/admin/signup', { signupEnabled: !open }); toast(open ? 'Sign-up closed' : 'Sign-up opened'); render(); } catch (e) { toast(e.message); } } }, open ? 'Close public sign-up' : 'Open public sign-up'),
    ...list.map(row));
}
async function log() {
  const { entries } = await api('GET', '/api/audit?limit=100');
  shell(...(entries.length ? entries.map((e) => h('div', { class: 'row' }, h('div', { class: 'meta' }, h('b', {}, e.action), h('small', {}, `${when(e.at)}${e.targetType ? ` · ${e.targetType}` : ''}`)))) : [h('div', { class: 'msg' }, 'Nothing yet.')]));
}
start();
