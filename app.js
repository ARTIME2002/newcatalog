// Set this to your deployed Cloudflare Worker URL
const API_BASE = "https://artime-catalog.thetimesandcraftexport.workers.dev";
const WHATSAPP_NUMBER = "917229922002"; // country code + number, no + or spaces

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
