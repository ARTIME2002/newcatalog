let DATA = null;
let dirtyImages = {}; // path -> {base64, message}
let dataDirty = false;

async function tryLogin() {
  const pw = document.getElementById('pwInput').value.trim();
  const errEl = document.getElementById('gateError');
  errEl.textContent = '';
  try {
    if (!DATA) DATA = await loadData();
    if (pw !== DATA.adminPassword) { errEl.textContent = 'Incorrect password.'; return; }
    document.getElementById('gateWrap').style.display = 'none';
    document.getElementById('adminWrap').style.display = 'block';
    renderTierSettings();
    renderProducts();
  } catch (e) {
    errEl.textContent = 'Could not load catalog data.';
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
      <img src="${imgs[i] || ''}" onerror="this.style.opacity=0.2">
      <div class="lbl">${i===0?'Main':'Detail '+i}</div>
      <input type="file" accept="image/*" onchange="onImageChange(${idx}, ${i}, this)">
    </div>`).join('');

  return `
  <div class="admin-card ${p.active ? '' : 'inactive'}" id="card-${idx}">
    <div class="admin-card-top">
      <div class="admin-imgs">${slots}</div>
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

/* ---------- Image handling ---------- */
function onImageChange(idx, slot, input) {
  const file = input.files[0];
  if (!file) return;
  const maxW = slot === 0 ? 900 : 500;
  resizeImageFile(file, maxW, 0.8).then(({base64, blobUrl}) => {
    const p = p_(idx);
    const code = p.code || ('product-' + idx);
    const path = `images/products/${code}-${slot+1}.jpg`;
    p.images[slot] = path;
    dirtyImages[path] = base64;
    document.querySelector(`#card-${idx} .admin-imgs .imgbox:nth-child(${slot+1}) img`).src = blobUrl;
    markDirty();
  });
}

function resizeImageFile(file, maxW, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * (maxW / w)); w = maxW; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ base64: dataUrl.split(',')[1], blobUrl: dataUrl });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------- Publish to GitHub ---------- */
async function githubPutFile(owner, repo, branch, token, path, base64Content, message) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g,'/')}`;
  let sha = undefined;
  const getRes = await fetch(url + `?ref=${branch}`, {
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' }
  });
  if (getRes.status === 200) {
    const j = await getRes.json();
    sha = j.sha;
  } else if (getRes.status !== 404) {
    const j = await getRes.json().catch(() => ({}));
    throw new Error(`GitHub error reading ${path}: ${j.message || getRes.status}`);
  }
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' },
    body: JSON.stringify({ message, content: base64Content, sha, branch })
  });
  if (!putRes.ok) {
    const j = await putRes.json().catch(() => ({}));
    throw new Error(`GitHub error saving ${path}: ${j.message || putRes.status}`);
  }
}

async function saveAll() {
  const owner = document.getElementById('ghOwner').value.trim();
  const repo = document.getElementById('ghRepo').value.trim();
  const branch = document.getElementById('ghBranch').value.trim() || 'main';
  const token = document.getElementById('ghToken').value.trim();
  if (!owner || !repo || !token) {
    setStatus('Please fill in GitHub username, repo, and token before saving.', 'err');
    return;
  }
  setStatus('Publishing changes…', '');
  try {
    const imgPaths = Object.keys(dirtyImages);
    for (let i = 0; i < imgPaths.length; i++) {
      setStatus(`Uploading image ${i+1} of ${imgPaths.length}…`, '');
      await githubPutFile(owner, repo, branch, token, imgPaths[i], dirtyImages[imgPaths[i]], `Update product image ${imgPaths[i]}`);
    }
    setStatus('Saving product data…', '');
    const dataB64 = btoa(unescape(encodeURIComponent(JSON.stringify(DATA, null, 2))));
    await githubPutFile(owner, repo, branch, token, 'data.json', dataB64, 'Update catalog data via admin panel');

    dirtyImages = {};
    dataDirty = false;
    setStatus('✓ Published! Changes are live in a minute or two.', 'ok');
  } catch (e) {
    setStatus('Failed: ' + e.message, 'err');
  }
}

window.addEventListener('beforeunload', function (e) {
  if (dataDirty) { e.preventDefault(); e.returnValue = ''; }
});
