// Set this to your deployed Cloudflare Worker URL after setup.
const API_BASE = "https://artime-catalog.YOUR-SUBDOMAIN.workers.dev";

function money(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

async function apiPost(path, body) {
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
}
