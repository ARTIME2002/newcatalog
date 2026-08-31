let DATA = null;
let ADMIN_PW = null;
let dataDirty = false;

async function tryLogin() {
  const pw = document.getElementById('pwInput').value.trim();
  const errEl = document.getElementById('gateError');
  errEl.textContent = '';
  errEl.textContent = 'Checking…';
  try {
    const res = await apiPost('/admin/get', { adminPassword: pw });
    if (!res.ok) { errEl.textContent = res.error || 'Incorrect password.'; return; }
    DATA = res.data;
    ADMIN_PW = pw;
    document.getElementById('gateWrap').style.display = 'none';
    document.getElementById('adminWrap').style.display = 'block';
    renderTierSettings();
    renderProducts();
  } catch (e) {
    errEl.textContent = 'Could not reach the server.';
  }
}

function setStatus(msg, kind) {
  const el = document.getElementById('statusLine');
  el.textContent = msg;
  el.className = 'status-line' + (kind ? ' ' + kind : '');
}
function markDirty() { dataDirty = true; setStatus('You have unsaved changes.', ''); }

/* ---------- Tier settings ---------- */
function renderTierSettings() {
  const wrap = document.getElementById('tierSettings');
  wrap.innerHTML = Object.keys(DATA.tierLabels).map(t => `
    <div class="field">
      <label>${t} — display name</label>
      <input value="${DATA.tierLabels[t]}" onchange="DATA.tierLabels['${t}']=this.value; markDirty();">
    </div>
    <div class="field">
      <label>${t} — access code</label>
      <input value="${DATA.passwords[t]}" onchange="DATA.passwords['${t}']=this.value; markDirty();">
    </div>
  `).join('');
  document.getElementById('adminPwField').value = DATA.adminPassword;
  document.getElementById('adminPwField').onchange = function() { DATA.adminPassword = this.value; markDirty(); };
}

/* ---------- Products ---------- */
function renderProducts() {
  document.getElementById('prodCount').textContent = DATA.products.length;
  const list = document.getElementById('productList');
  list.innerHTML = DATA.products.map((p, idx) => productCard(p, idx)).join('');
}

function productCard(p, idx) {
  const imgs = p.images;
  const slots = [0,1,2].map(i => `
    <div class="imgbox">
      <img src="${imgs[i] || ''}" onerror="this.style.opacity=0.15">
      <div class="lbl">${i===0?'Main':'Detail '+i}</div>
    </div>`).join('');

  const imgFields = [0,1,2].map(i => `
    <div class="field full">
      <label>Image ${i+1} link/path</label>
      <input value="${escAttr(imgs[i]||'')}" oninput="p_(${idx}).images[${i}]=this.value; markDirty(); this.previousElementSibling ? null:null;" onblur="refreshThumb(${idx})">
    </div>`).join('');

  return `
  <div class="admin-card ${p.active ? '' : 'inactive'}" id="card-${idx}">
    <div class="admin-card-top">
      <div class="admin-imgs" id="imgs-${idx}">${slots}</div>
      <div class="admin-fields">
        <div class="field full"><label>Title</label>
          <input value="${escAttr(p.title)}" oninput="p_(${idx}).title=this.value; markDirty();"></div>
        <div class="field"><label>Code</label>
          <input value="${escAttr(p.code)}" oninput="p_(${idx}).code=this.value; markDirty();"></div>
        <div class="field"><label>Size</label>
          <input value="${escAttr(p.size)}" oninput="p_(${idx}).size=this.value; markDirty();"></div>
        <div class="field"><label>Finish</label>
          <input value="${escAttr(p.finish)}" oninput="p_(${idx}).finish=this.value; markDirty();"></div>
        <div class="field"><label>Pattern</label>
          <input value="${escAttr(p.pattern)}" oninput="p_(${idx}).pattern=this.value; markDirty();"></div>
        <div class="field full"><label>Description</label>
          <textarea rows="2" oninput="p_(${idx}).description=this.value; markDirty();">${escHtml(p.description)}</textarea></div>
        <div class="field full"><label>Highlights (one per line)</label>
          <textarea rows="3" oninput="p_(${idx}).highlights=this.value.split('\\n').map(s=>s.trim()).filter(Boolean); markDirty();">${p.highlights.join('\n')}</textarea></div>
        ${imgFields}
      </div>
    </div>
    <div class="price-grid">
      ${Object.keys(DATA.tierLabels).map(t => `
        <div class="field">
          <label>${DATA.tierLabels[t]}</label>
          <input type="number" value="${p.prices[t]}" oninput="p_(${idx}).prices['${t}']=Number(this.value); markDirty();">
        </div>`).join('')}
    </div>
    <div class="admin-card-controls">
      <label class="toggle-row"><input type="checkbox" ${p.active ? 'checked' : ''} onchange="p_(${idx}).active=this.checked; document.getElementById('card-${idx}').classList.toggle('inactive', !this.checked); markDirty();"> Active (visible in catalog)</label>
      <button class="btn btn-danger" onclick="removeProduct(${idx})">Delete product</button>
    </div>
  </div>`;
}

function refreshThumb(idx) {
  const imgs = p_(idx).images;
  const box = document.getElementById(`imgs-${idx}`);
  box.innerHTML = [0,1,2].map(i => `
    <div class="imgbox">
      <img src="${imgs[i] || ''}" onerror="this.style.opacity=0.15">
      <div class="lbl">${i===0?'Main':'Detail '+i}</div>
    </div>`).join('');
}

function p_(idx) { return DATA.products[idx]; }
function escAttr(s) { return (s||'').replace(/"/g,'&quot;'); }
function escHtml(s) { return (s||'').replace(/</g,'&lt;'); }

function addProduct() {
  DATA.products.unshift({
    code: 'ART-NEW-' + Date.now().toString().slice(-5),
    finish: 'Brass', pattern: 'Heritage Floral Engraving', size: '6*4*6 inches',
    title: 'New Product', description: '', highlights: [],
    images: [null, null, null],
    prices: Object.fromEntries(Object.keys(DATA.tierLabels).map(t => [t, 0])),
    active: true
  });
  markDirty();
  renderProducts();
}

function removeProduct(idx) {
  if (!confirm('Delete "' + DATA.products[idx].title + '"? This cannot be undone after you save.')) return;
  DATA.products.splice(idx, 1);
  markDirty();
  renderProducts();
}

/* ---------- Save ---------- */
async function saveAll() {
  setStatus('Saving…', '');
  try {
    const res = await apiPost('/admin/save', { adminPassword: ADMIN_PW, data: DATA });
    if (!res.ok) { setStatus('Failed: ' + res.error, 'err'); return; }
    if (DATA.adminPassword !== ADMIN_PW) ADMIN_PW = DATA.adminPassword;
    dataDirty = false;
    setStatus('✓ Saved! Changes are live immediately.', 'ok');
  } catch (e) {
    setStatus('Failed: could not reach the server.', 'err');
  }
}

window.addEventListener('beforeunload', function (e) {
  if (dataDirty) { e.preventDefault(); e.returnValue = ''; }
});
