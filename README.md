# Temporary public Nginx website

## Setup
1. Create a GitHub repository. For this demo, do not put private files or secrets in it.
2. Upload the contents of this folder, preserving `.github/workflows/main.yml` and `site/index.html`.
3. Open **Actions** → **Temporary Public Nginx Website** → **Run workflow**.
4. Open the running job logs and find `YOUR TEMPORARY PUBLIC WEBSITE`.
5. Open the `https://....trycloudflare.com` URL.

The URL is temporary and changes on each run. It works only while the GitHub Actions job is running. Cancel the workflow to stop public access. This is a demo/preview, not permanent hosting. GitHub-hosted runner availability and usage limits apply.

## Customize
Edit `site/index.html` and commit the change. The workflow copies that file into Nginx's web root.

## Safety
The tunnel URL is public: anyone who has it can visit the page. Do not publish private data, credentials, admin panels, or sensitive files. The workflow uses Cloudflare Quick Tunnel for a temporary preview and does not configure a permanent domain.
