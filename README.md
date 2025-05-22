# π pipress

🗿 Tiny server to host [pi0.io](https://pi0.io) (or anything else!)

## 💡How it works?

Idea is simple, Turn any base url with raw Markdown, HTML and Assets into a website!

Check the [source code](./server/index.ts).

Website contents can be hosted anywhere, such as from `https://raw.pi0.io`.

When opening a URL like `/about`, the server fetches `https://raw.pi0.io/about.md` and renders Markdown to HTML using [md4w](https://github.com/ije/md4w).

The web server then uses `https://raw.pi0.io/index.html` as an HTML template, replacing the `{{ content }}` placeholder with the rendered markdown content.

Any other URL ending with an extension, will be directly fetched and served as static asset with proper mime type.

## 🧩 Stack

- **Server:** [srvx](https://srvx.h3.dev)
- **Markdown Renderer:** [ije/md4w](https://github.com/ije/md4w)
- **Code highlighter:** [highlightjs](https://highlightjs.org/)
