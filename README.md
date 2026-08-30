# ARTIME Multi-Tier Catalog Website — Setup Guide

## What's inside
- `index.html` — the customer-facing page. Visitor enters a code → sees the catalog priced for their tier.
- `admin.html` — your editing panel. Change prices, edit/add/remove products, upload images.
- `data.json` — all product data (prices, descriptions, images) and the 5 access codes. This is what admin.html edits.
- `images/` — all product photos (extracted and compressed from your PPT) + logo.
- `styles.css`, `app.js`, `admin.js` — the site's design and logic.

All 50 products from your PPT (4 finishes × 4 patterns × sizes) are already loaded in, each with its 3 images
(main photo + 2 detail shots) and description. Every tier currently shows the same MRP from your PPT — go into
the admin panel to set the real price for each customer type.

## Step 1 — Put it on GitHub Pages
1. Copy every file in this folder into your existing repo: `ARTIME2002/catalog` (replace what's there).
2. Commit and push. Your site will be live at `https://artime2002.github.io/catalog/` within a minute or two.

## Step 2 — Try the customer view
Open the site link and enter one of these codes (change them later in admin):

| Customer type | Access code |
|---|---|
| Retail | `retail2026` |
| Distributor | `distributor2026` |
| Wholesale | `wholesale2026` |
| Export | `export2026` |
| VIP | `vip2026` |

## Step 3 — Set up the admin panel
Go to `https://artime2002.github.io/catalog/admin.html`.

Default admin password: `artime@admin2026` — **change this first thing**, in the "Admin password" box, then hit
Save.

To let the admin panel publish your edits back to the website, it needs a **GitHub personal access token**
(a one-time, 2-minute setup):
1. On GitHub: click your profile picture → **Settings** → **Developer settings** → **Personal access tokens** →
   **Fine-grained tokens** → **Generate new token**.
2. Give it a name like "ARTIME catalog admin".
3. Under **Repository access**, choose **Only select repositories** → pick `catalog`.
4. Under **Permissions** → **Repository permissions**, set **Contents** to **Read and write**. Leave everything
   else as-is.
5. Generate the token and copy it (starts with `github_pat_...`). You won't see it again — if you lose it, just
   make a new one.
6. Paste it into the **GitHub token** field in the admin panel. It's only kept in that browser tab, never saved
   anywhere — you'll need to paste it in again each time you open admin.html.

Once that's filled in (along with username `ARTIME2002` and repo `catalog`, already pre-filled), every "Save
changes to website" click publishes your edits live.

## What you can do in admin
- Edit price, title, description, size, finish, pattern, and highlights for any product.
- Set 5 different prices per product (one per customer type).
- Rename the 5 customer types and change their access codes.
- Upload new photos for any product (they're auto-resized so the site stays fast).
- Add a brand-new product, or mark one inactive (hides it without deleting) / delete it.
- Change the admin password.

## Good to know
- This uses a simple shared password per customer type, not individual logins — it's meant to keep casual
  visitors from seeing your other price tiers, not as bank-grade security. Anyone with real technical know-how
  who opens the page's source code could find `data.json`. Don't put anything in there you'd be upset to have
  leaked.
- Free forever on GitHub Pages — no hosting cost, no expiry.
- If a save fails, the message will tell you why (usually a wrong token or repo name) — nothing is lost, just
  fix and try again.
