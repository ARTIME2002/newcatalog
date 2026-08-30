// Shared helpers for loading catalog data
async function loadData() {
  const res = await fetch('data.json?t=' + Date.now());
  if (!res.ok) throw new Error('Could not load catalog data');
  return res.json();
}

function money(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}
