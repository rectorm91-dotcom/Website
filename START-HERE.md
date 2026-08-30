# Upload and deploy rtcarter1.com

This package contains the complete website, backend API routes, images, tests, and deployment configuration. One Railway Node.js service runs both the website and its backend. A separate backend service, GitHub Pages, or Cloudflare Pages deployment is not required.

## 1. Extract and upload to your private GitHub repository

1. Extract `rtcarter1-website.zip` on your computer.
2. Create or open your private GitHub repository.
3. Upload the extracted contents, **not the ZIP file itself**. `package.json`, `package-lock.json`, and `railway.json` must be at the repository root, alongside the `app` and `public` folders.
4. Include the dotfiles and the `.openai` folder. In particular, `.openai/hosting.json` is non-secret build configuration imported by this project; do not omit it. Upload `.env.example`, but never a real `.env` or `.env.local` file.
5. Commit the files. If the browser upload omits hidden files or folders, use Git or GitHub Desktop to add the extracted project instead.

Your repository can stay private. The deployed website and its public profile API responses will still be publicly accessible.

## 2. Deploy with Railway

1. In Railway, create a project/service from your GitHub repository. Give Railway access to that specific private repository when prompted.
2. Use the repository root as the service root directory.
3. The included `railway.json` selects Railpack, installs the locked dependencies including the build/runtime tooling, builds the app, and starts it with `npm start`. It also checks `/` for deployment health.
4. Do not replace the start command with a static-file server: the `/api` routes need the Node.js server. Do not enable dependency pruning; the current runtime uses packages in `devDependencies`.
5. Optionally add `INFINITE_FLIGHT_API_KEY` in Railway's service Variables to enable real flight statistics. Without a key, the website works and displays the statistics-unavailable state. Do not put the key in GitHub.
6. Let Railway supply `PORT`. The application listens on that port and binds to `0.0.0.0`.
7. Deploy, generate a Railway public domain, and open it to verify the homepage before changing your custom domain.

For reference, the configured commands are:

```text
Build: npm ci --include=dev && npm run build
Start: npm start
Health check: /
```

See [Railway configuration documentation](https://docs.railway.com/config-as-code/reference) and [Railpack Node.js documentation](https://railpack.com/languages/node/).

## 3. Connect rtcarter1.com through Cloudflare DNS

1. Add `rtcarter1.com` under the Railway service's custom domains.
2. In Cloudflare DNS, create the exact DNS record Railway provides. Do not guess an IP address or point the domain at localhost. Replace an existing conflicting record only when you intend to switch the domain to this website.
3. Use DNS-only while verifying the domain and provisioning its certificate. Cloudflare supports CNAME flattening for the root domain.
4. Wait for Railway to show the domain and HTTPS certificate as ready, then test `https://rtcarter1.com`.
5. If you later enable Cloudflare's proxy, use Full (strict) SSL/TLS. Do not use Flexible mode. Do not add a cache-everything rule for `/api/*`; those routes already set their own cache headers.
6. Add `www.rtcarter1.com` separately if you want it, and configure a redirect to your preferred address.

Follow the domain instructions Railway shows for your service: [Railway custom domains](https://docs.railway.com/networking/domains/working-with-domains).

## Local development

Install Node.js 22.13 or newer, open a terminal in the extracted folder, and run:

```bash
npm install
npm run dev
```

Open the localhost address printed by the server, normally `http://localhost:3000`.

To test production locally:

```bash
npm run build
npm start
```

The detailed README covers editable content, API behavior, credentials, original icon assets, particle settings, and verification. Generated output and dependencies are intentionally excluded from the ZIP; installation and the build recreate them.
