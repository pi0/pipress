# π pipress

🗿 Tiny server to host [pi0.io](https://pi0.io) (or anything else!)

## 💡 How it works?

Idea is simple, Turn any base url with raw Markdown, HTML and Assets into a website!

Website contents can be hosted anywhere, such as from `https://raw.githubusercontent.com/pi0/pi0.io` ([pi0/pi0.io](https://github.com/pi0/pi0.io/).

When opening a URL like `/about`, the server fetches `{BASE_URL}/about.md` and renders Markdown to HTML using [md4w](https://github.com/ije/md4w).

The web server then uses `{BASE_URL}/index.html` as an HTML template, replacing the `{{ content }}` placeholder with the rendered markdown content.

Any other URL ending with an extension, will be directly fetched and served as static asset with proper mime type.

All remote content are cached with simple SWR strategy (stale 1 second).

Check the [source code](./server/index.mjs).

## ⚙️ Env variables

- `PIPRESS_URL`
- `PIPRESS_TTL` (default `1000`)
- `PIPRESS_STATIC_TTL` (default `1000`)

## 🧩 Stack

- **Server:** [srvx](https://srvx.h3.dev)
- **Markdown Renderer:** [ije/md4w](https://github.com/ije/md4w)
- **Code highlighter:** [shikijs](https://shiki.style/)
