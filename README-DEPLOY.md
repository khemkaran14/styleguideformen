# Deploying The Ultimate Style Guide for Men to a Hostinger VPS

This puts the guide on a subdomain such as **men.yourdomain.com** with HTTPS, member accounts (sign up, sign in, forgot password), saved looks and the admin area. Setup takes about 15 minutes.

**What you need**
- A Hostinger VPS (KVM plan) running **Ubuntu 22.04 or 24.04**. In hPanel go to **VPS → your server → Overview** to find its **IP address** and **root password** (or set an SSH key).
- A domain you can edit DNS for (in Hostinger hPanel, or wherever the domain is registered)

Everything else (Node.js 22, Nginx, the free HTTPS certificate) is installed by the setup script. The site runs on its own port behind Nginx, so it won't interfere with other sites already on the server.

> **Already running the women’s guide (styleguideforwomen) on this VPS?** Follow exactly the same steps. The men’s site uses its own service (`styleguidemen`), folders (`/var/www/styleguidemen`, `/var/lib/styleguidemen`), settings file (`/etc/styleguidemen.env`), Nginx site and port (3011), so the two sites run side by side without touching each other. Use a different subdomain, for example `men.livelifetricks.com`.

> If you picked a Hostinger OS template with a control panel (CyberPanel, OpenLiteSpeed, cPanel…), something already owns port 80 and the script will stop and tell you. Use a plain **Ubuntu 24.04** template, or ask for a version of these steps for your panel.

---

## 1. Point the subdomain at your VPS

**Domain at Hostinger:** hPanel → **Domains** → your domain → **DNS / Nameservers** → **Add record**.
**Domain elsewhere:** open that registrar's (or Cloudflare's) DNS settings.

Add one record:

| Type | Name | Points to | TTL |
|---|---|---|---|
| A | `men` | your VPS IP, e.g. `203.0.113.10` | default |

Use any name you like instead of `men`. If you use **Cloudflare**, set the cloud icon to **DNS only** (grey) until step 3 has finished; afterwards you can switch it back to proxied with SSL mode **Full (strict)**.

Check it's live (can take a few minutes):

```bash
ping men.yourdomain.com
```

The reply should show your VPS IP.

**Hostinger firewall:** if you turned on the firewall in hPanel (**VPS → Security → Firewall**), add rules that accept **TCP 22, 80 and 443**.

## 2. Get the code onto the VPS

Connect to the server (hPanel also has a **Browser terminal** button on the VPS page):

```bash
ssh root@YOUR_VPS_IP
```

Then clone the repository:

```bash
apt-get update && apt-get install -y git
git clone https://github.com/khemkaran14/styleguideformen.git ~/styleguideformen
cd ~/styleguideformen
```

If the repository is private, GitHub will ask you to sign in. Use your GitHub username and a **personal access token** (GitHub → Settings → Developer settings → Fine-grained tokens, with read access to this repo) as the password. Or add a deploy key and clone with `git@github.com:khemkaran14/styleguideformen.git`.

## 3. Run the setup script

Replace the values with your own:

```bash
sudo DOMAIN=men.yourdomain.com \
     EMAIL=you@example.com \
     ADMIN_EMAIL=you@example.com \
     bash deploy/setup.sh
```

- `DOMAIN`: the full subdomain from step 1
- `EMAIL`: where Let's Encrypt sends certificate notices
- `ADMIN_EMAIL`: the email you'll sign up with. That account becomes the admin. You can list several, separated by commas. Only these emails can become admin.

**Optional: site name, contact email and Google verification.** Add any of these to the command:
- `SITE_NAME='Signora Styles'` changes the name in page titles, legal pages and emails (default: The Ultimate Style Guide)
- `CONTACT_EMAIL=hello@yourdomain.com` is shown on the Contact and Privacy pages, and contact-form messages are emailed there (when email is set up)
- `GOOGLE_SITE_VERIFICATION=abc123` is the code from Google Search Console (see “Get found on Google” below)

**Optional: password-reset emails.** To let members reset a forgotten password by email, add your mailbox's SMTP details to the same command. With a Hostinger email account (hPanel → **Emails**) it looks like this:

```bash
sudo DOMAIN=men.yourdomain.com EMAIL=you@example.com ADMIN_EMAIL=you@example.com \
     SMTP_HOST=smtp.hostinger.com SMTP_PORT=465 \
     SMTP_USER=hello@yourdomain.com SMTP_PASS='your mailbox password' \
     bash deploy/setup.sh
```

Any SMTP provider works (Brevo, Mailgun, Gmail with an app password, Amazon SES). Without it, the site still works: members click **Forgot your password?** and are told to ask the admin, who can create a reset link in one click (see below).

When it finishes you'll see **Done! Open https://men.yourdomain.com**.

## 4. Create your admin account

Open the site, click **Sign in → Create an account**, and sign up with your `ADMIN_EMAIL`. The **Admin** link then appears in the menu. From there you can:
- see members, when they joined and were last active, their style and how much they've saved, and download everyone as CSV
- create a **password reset link** for a member who is locked out (works once, for 24 hours)
- make other members admins, or delete accounts
- post an announcement banner, choose the front-page looks, and hide looks

---

## Get found on Google

The site already has everything Google needs: a page for every look and occasion, a sitemap at `/sitemap.xml`, `robots.txt`, page titles and descriptions, share images and structured data. To tell Google about it:

1. Go to [Google Search Console](https://search.google.com/search-console) and click **Add property**.
2. Choose **URL prefix** and enter `https://men.livelifetricks.com` (your subdomain).
3. Pick **HTML tag** as the verification method. Copy only the code inside `content="..."`.
4. On the VPS, add it to the settings and restart:
   ```bash
   echo 'GOOGLE_SITE_VERIFICATION=paste-the-code-here' | sudo tee -a /etc/styleguidemen.env
   sudo systemctl restart styleguidemen
   ```
5. Back in Search Console, click **Verify**.
6. Open **Sitemaps** in the left menu, enter `sitemap.xml` and click **Submit**.

Google usually starts showing pages within a few days to a few weeks. Search Console’s **Pages** report shows what has been indexed. You can do the same for Bing at [Bing Webmaster Tools](https://www.bing.com/webmasters), which can import straight from Search Console.

**Before you promote the site**, read the Privacy policy (`/privacy`) and Terms of use (`/terms`). They are written for this site (accounts, no ads or trackers, hosting at Hostinger, Indian law), but they are a starting point, not legal advice. Have them checked if you add things like ads, analytics or selling products.

## Adding the model photos (optional)

The site works straight away with its own drawn illustrations. To use photos of a model instead:

1. Follow `docs/chatgpt-photo-prompts.md` to create the photo package in ChatGPT (outfits, hairstyles and beards, named exactly as listed).
2. Send the zip(s) to Claude in this project, or, on a computer with Node.js, run `npm i -D playwright && npx playwright install chromium`, then `npm run photos -- path/to/package.zip`. Photos are resized, named and used everywhere automatically; anything missing keeps its illustration.
3. Commit and push, then update the VPS (below).

## Updating to a new version

After new code is pushed to GitHub, on the VPS:

```bash
cd ~/styleguideformen && sudo bash deploy/update.sh
```

It pulls the latest code, backs up the database first, and keeps all members and saved looks.

### Automatic deploys (optional)

The repo has a GitHub Action (`.github/workflows/ci.yml`) that tests every push. It can also deploy to the VPS automatically whenever `main` changes:

1. On your own computer, make a key just for deploys: `ssh-keygen -t ed25519 -f deploy_key -N ""`
2. On the VPS, add the public half: `cat >> ~/.ssh/authorized_keys` and paste the contents of `deploy_key.pub`, then press Ctrl+D.
3. In GitHub, open the repo → **Settings → Secrets and variables → Actions** and add:
   - `VPS_HOST`: the VPS IP
   - `VPS_USER`: `root` (or your sudo user, if it has passwordless sudo)
   - `VPS_SSH_KEY`: the full contents of the private `deploy_key` file
   - `VPS_APP_PATH` (only if you cloned somewhere other than `~/styleguideformen`)

Until those secrets exist the deploy step is skipped and only the tests run.

## Day-to-day commands

| Task | Command |
|---|---|
| Is it running? | `sudo systemctl status styleguidemen` |
| Restart | `sudo systemctl restart styleguidemen` |
| Live logs | `sudo journalctl -u styleguidemen -f` |
| Back up now | `cd /var/www/styleguidemen && sudo -u styleguidemen DATA_DIR=/var/lib/styleguidemen node scripts/backup.js` |
| Change admin emails, site name, contact or email settings | edit `/etc/styleguidemen.env`, then restart |
| Read contact-form messages | **Admin → Messages** on the site |

**Where things live**
- App files: `/var/www/styleguidemen` (copied from `~/styleguideformen` on each update)
- Database: `/var/lib/styleguidemen/styleguide.db`
- Backups: `/var/lib/styleguidemen/backups/`. One is made every night at 03:15 and the last 14 are kept. Copy them off the server now and then (Hostinger's VPS snapshots also help).
- Settings: `/etc/styleguidemen.env`
- Nginx site: `/etc/nginx/sites-available/styleguidemen.conf`

HTTPS certificates renew automatically (`sudo certbot renew --dry-run` tests it).

## Good to know

- **Accounts:** sign up with name, email and password (8+ characters). Members can change their password, edit their style profile, and delete their account from **My account**. Hearts and Dressing Room looks made before signing up are merged into the account.
- **Forgotten passwords:** with SMTP set up, members get an email link valid for 60 minutes. An admin can always create a 24-hour link from **Admin → Members → Reset link**. Links work once, and resetting signs the member out everywhere else.
- **Security built in:** passwords are hashed with scrypt, sessions use secure http-only cookies, sign-in and reset attempts are rate-limited, cross-site requests are blocked, and reset tokens are stored only as hashes. Only admins can read member data or change site settings.
- **Running it locally to try it:** `npm ci && COOKIE_SECURE=false PORT=3000 npm start`, then open http://127.0.0.1:3000. `bash scripts/smoke-test.sh` runs the automated checks.
- **Port already in use?** Add `PORT=3021` (any free port) to the setup command.
