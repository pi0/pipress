#!/bin/sh
//bin/true; (command -v bun && bun $0) || (command -v deno && deno -A $0)|| (command -v node && node $0) || exit 1

const sourceBase =
  process.env.PIPRESS_URL ||
  process.argv[2] ||
  new URL("../content/", import.meta.url);

const CONTENT_TTL = parseInt(process.env.PIPRESS_TTL || "1000", 10);
const STATIC_TTL = parseInt(process.env.PIPRESS_STATIC_TTL || "1000", 10);

// ----- HTTP Server -----

import { serve } from "srvx";

serve({
  async fetch(req) {
    const url = new URL(req.url);
    const ext = url.pathname.match(/\.([a-z0-9%]+)$/)?.[1];
    const path = url.pathname
      .replace(/^\/|\/$/g, "")
      .replace(/[^/a-zA-Z0-9-_.~]/g, "");
    return ext
      ? serveStatic(url.pathname, ext)
      : serveMarkdown(`${path || "index"}.md`);
  },
});

// ----- Static -----

import Mime from "mime";

async function serveStatic(path, ext) {
  const url = new URL(`./${path}`, sourceBase);
  const body = await cachedFetch(url, STATIC_TTL).then((res) =>
    res.ok ? res.body : undefined,
  );
  return body
    ? new Response(body, { headers: { "Content-Type": Mime.getType(ext) } })
    : new Response(null, { status: 404 });
}
// ----- Markdown -----

import { init as initmd4w, mdToHtml, setCodeHighlighter } from "md4w";
import hljs from "highlight.js";

await initmd4w("fast");

setCodeHighlighter(
  (language, code) =>
    `<pre><code>${hljs.highlight(code, { language }).value}</code></pre>`,
);

async function serveMarkdown(path) {
  const url = new URL(`./${path}`, sourceBase);

  const [md, template] = await Promise.all(
    [
      cachedFetch(new URL(path, sourceBase), CONTENT_TTL),
      cachedFetch(new URL("index.html", sourceBase), CONTENT_TTL),
    ].map((p) => p.then((res) => (res.ok ? res.text() : ""))),
  );

  const mdHtml = mdToHtml(md || "(404)");

  return new Response(
    renderTemplate(template, {
      content: mdHtml,
      contentURL: url.toString(),
    }),
    {
      status: md ? 200 : 404,
      headers: { "Content-Type": "text/html" },
    },
  );
}

function renderTemplate(tmpl, vars) {
  return tmpl.replace(
    /\{\{([a-zA-Z0-9_]+)\}\}/g,
    (_, name) => vars[name] || "",
  );
}

// ----- Cache -----

const caches = new Map();

async function cachedFetch(url, ttl = 1000) {
  url = url.toString();
  const cached = caches.get(url);
  if (cached) {
    if (cached.time > Date.now() - ttl) {
      return cached.promise.then((res) => res.clone());
    } else {
      caches.delete(url);
    }
  }
  const promise = fetch(url).catch((_err) => new Response("", { status: 500 }));
  caches.set(url, { promise, time: Date.now() });
  return promise.then((res) => res.clone());
}
