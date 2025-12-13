/* Parking tool frontend (vanilla JS)
   1) Set API_BASE to your Apps Script Web App URL.
   2) Host on GitHub Pages (static).
*/
const API_BASE = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'; // e.g. https://script.google.com/macros/s/XXXXX/exec

const VIEWS = {
  disclaimer: 'viewDisclaimer',
  menu: 'viewMenu',
  release: 'viewRelease',
  occupy: 'viewOccupy',
  query: 'viewQuery',
};

const qs = (id) => document.getElementById(id);

function show(viewKey) {
  Object.values(VIEWS).forEach(id => qs(id).classList.add('hidden'));
  qs(VIEWS[viewKey]).classList.remove('hidden');
  location.hash = viewKey;
}

function setMsg(el, kind, text) {
  el.classList.remove('ok','warn','bad');
  if (kind) el.classList.add(kind);
  el.textContent = text || '';
}

function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function ensureApiBase() {
  if (!API_BASE || API_BASE.includes('PASTE_YOUR')) {
    alert('請先在 app.js 設定 API_BASE（Apps Script Web App URL）');
    return false;
  }
  return true;
}

async function apiGet(params) {
  if (!ensureApiBase()) throw new Error('API_BASE not set');

  const url = new URL(API_BASE);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

async function ensureInit(date) {
  // Always try init; initDate is idempotent (won't duplicate)
  const r = await apiGet({ action: 'init', date });
  return r;
}

async function query(date) {
  return await apiGet({ action: 'query', date });
}

function normalizeRows(rows) {
  // rows may be {ok,message} on error; keep consistent
  return Array.isArray(rows) ? rows : [];
}

function rowStatusLabel(r) {
  if (!r) return '—';
  if (r.Status === 'Available') return '可用（已釋出）';
  if (r.Status === 'Occupied') return '已使用';
  if (r.Status === 'Base') return '原車位';
  return String(r.Status || '');
}

function safeStr(x) {
  if (x === null || x === undefined) return '';
  return String(x);
}

function bySlot(a,b) {
  return Number(a.Slot) - Number(b.Slot);
}

async function loadAvailableSlots(date) {
  const sel = qs('occupySlot');
  sel.innerHTML = '';
  sel.disabled = true;

  try {
    await ensureInit(date);
    const rows = normalizeRows(await query(date)).sort(bySlot);
    const avail = rows.filter(r => r.Status === 'Available');

    if (avail.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '目前無可用車位';
      sel.appendChild(opt);
      sel.disabled = true;
      return;
    }

    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = '請選擇車位';
    opt0.disabled = true;
    opt0.selected = true;
    sel.appendChild(opt0);

    for (const r of avail) {
      const opt = document.createElement('option');
      opt.value = r.Slot;
      opt.textContent = `車位 ${r.Slot}`;
      sel.appendChild(opt);
    }
    sel.disabled = false;
  } catch (err) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '載入失敗（請稍後重試）';
    sel.appendChild(opt);
    sel.disabled = true;
  }
}

function fillTable(rows) {
  const body = qs('tblBody');
  body.innerHTML = '';

  const sorted = rows.slice().sort(bySlot);

  if (!sorted.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="4" class="muted">查無資料（可能尚未初始化該日期）</td>`;
    body.appendChild(tr);
    return;
  }

  // ensure slots 1..6 exist in display
  const by = new Map(sorted.map(r => [String(r.Slot), r]));
  for (let s=1; s<=6; s++) {
    const r = by.get(String(s));
    const tr = document.createElement('tr');

    if (!r) {
      tr.innerHTML = `<td>${s}</td><td class="muted">—</td><td class="muted">—</td><td class="muted">—</td>`;
      body.appendChild(tr);
      continue;
    }

    const who = (r.Status === 'Occupied')
      ? `${safeStr(r.Department)} / ${safeStr(r.Name)} / ${safeStr(r.Ext)}`
      : (r.Status === 'Base')
        ? `（原）${safeStr(r.Name)}`
        : (r.Status === 'Available')
          ? '（空）已釋出'
          : safeStr(r.Name);

    const plate = (r.Status === 'Occupied') ? safeStr(r.Plate) : '';

    tr.innerHTML = `
      <td>${safeStr(r.Slot)}</td>
      <td>${rowStatusLabel(r)}</td>
      <td>${who || ''}</td>
      <td>${plate || ''}</td>
    `;
    body.appendChild(tr);
  }
}

function wire() {
  // Top home button
  qs('btnHome').addEventListener('click', () => {
    if (localStorage.getItem('parking.accepted') === 'true') show('menu');
    else show('disclaimer');
  });

  // Disclaimer
  const chk = qs('chkAccept');
  const btnAccept = qs('btnAccept');

  chk.addEventListener('change', () => {
    btnAccept.disabled = !chk.checked;
  });
  btnAccept.addEventListener('click', () => {
    localStorage.setItem('parking.accepted', 'true');
    show('menu');
  });

  // Menu buttons
  document.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => show(btn.dataset.go));
  });

  // Back buttons
  document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => show('menu'));
  });

  // Default dates
  const t = todayStr();
  qs('releaseDate').value = t;
  qs('occupyDate').value = t;
  qs('queryDate').value = t;

  // Release
  qs('btnRelease').addEventListener('click', async () => {
    const date = qs('releaseDate').value;
    const owner = qs('releaseOwner').value;
    const msg = qs('releaseMsg');

    setMsg(msg, null, '');

    if (!date) return setMsg(msg, 'warn', '請先選日期');
    if (!owner) return setMsg(msg, 'warn', '請先選姓名');

    try {
      await ensureInit(date);
      const r = await apiGet({ action: 'release', date, owner });
      if (r && r.ok) setMsg(msg, 'ok', r.message || '已釋出');
      else setMsg(msg, 'bad', (r && r.message) ? r.message : '釋出失敗');
    } catch (err) {
      setMsg(msg, 'bad', `釋出失敗：${err.message || err}`);
    }
  });

  qs('btnReleaseCheck').addEventListener('click', async () => {
    // quick jump to query view with same date
    const date = qs('releaseDate').value || todayStr();
    qs('queryDate').value = date;
    show('query');
    await runQuery();
  });

  // Occupy: load slots when date changes
  qs('occupyDate').addEventListener('change', async () => {
    const date = qs('occupyDate').value;
    if (!date) return;
    await loadAvailableSlots(date);
  });

  qs('btnOccupyRefresh').addEventListener('click', async () => {
    const date = qs('occupyDate').value;
    if (!date) return;
    await loadAvailableSlots(date);
  });

  qs('btnOccupy').addEventListener('click', async () => {
    const date = qs('occupyDate').value;
    const slot = qs('occupySlot').value;
    const department = qs('occupyDept').value.trim();
    const name = qs('occupyName').value.trim();
    const ext = qs('occupyExt').value.trim();
    const plate = qs('occupyPlate').value.trim();
    const msg = qs('occupyMsg');

    setMsg(msg, null, '');

    if (!date) return setMsg(msg, 'warn', '請先選日期');
    if (!slot) return setMsg(msg, 'warn', '目前無可用車位或尚未選車位');
    if (!department || !name || !ext || !plate) return setMsg(msg, 'warn', '請完整填寫：部門 / 姓名 / 分機 / 車號');

    try {
      await ensureInit(date);
      const r = await apiGet({
        action: 'occupy',
        date,
        slot,
        department,
        name,
        ext,
        plate
      });

      if (r && r.ok) {
        setMsg(msg, 'ok', r.message || '已登記使用');
        // refresh available list after occupy
        await loadAvailableSlots(date);
        qs('occupySlot').value = '';
      } else {
        setMsg(msg, 'bad', (r && r.message) ? r.message : '登記失敗');
      }
    } catch (err) {
      setMsg(msg, 'bad', `登記失敗：${err.message || err}`);
    }
  });

  // Query
  async function runQuery() {
    const date = qs('queryDate').value;
    const msg = qs('queryMsg');
    setMsg(msg, null, '');

    if (!date) return setMsg(msg, 'warn', '請先選日期');

    try {
      await ensureInit(date);
      const rows = normalizeRows(await query(date));
      setMsg(msg, 'ok', `已載入 ${date} 的車位狀態`);
      fillTable(rows);
    } catch (err) {
      setMsg(msg, 'bad', `查詢失敗：${err.message || err}`);
      fillTable([]);
    }
  }

  // expose for quick button usage
  window.runQuery = runQuery;

  qs('btnQuery').addEventListener('click', runQuery);

  // initial available slots for today on occupy view (when user opens it later it will refresh anyway)
  loadAvailableSlots(t).catch(()=>{});
}

function boot() {
  // Route
  const accepted = localStorage.getItem('parking.accepted') === 'true';
  const hash = (location.hash || '').replace('#','');

  if (!accepted) show('disclaimer');
  else if (hash && VIEWS[hash]) show(hash);
  else show('menu');

  wire();
}

document.addEventListener('DOMContentLoaded', boot);
