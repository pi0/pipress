#!/bin/sh
//bin/true; (command -v bun && bun $0 $@) || (command -v deno && deno -A $0 $@)|| (command -v node && node $0 $@) || exit 1

// ----- Config -----

import { pathToFileURL } from "url";
import { resolve } from "path";

let BASE_URL = process.env.PIPRESS_URL || process.argv[2];

if (!BASE_URL) {
  console.error("Either set PIPRESS_URL or pass it as an argument");
  process.exit(1);
}
if (!BASE_URL.endsWith("/")) {
  BASE_URL += "/";
}

if (BASE_URL.startsWith(".")) {
  BASE_URL = pathToFileURL(resolve(BASE_URL)).href;
}

console.log(`🗿 Pipress [${BASE_URL}]`);

const CONTENT_TTL = parseInt(process.env.PIPRESS_TTL || "1000", 10);
const STATIC_TTL = parseInt(process.env.PIPRESS_STATIC_TTL || "1000", 10);

// ----- HTTP Server -----

import { serve } from "srvx";

serve({
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/.well-known/appspecific/com.chrome.devtools.json") {
      return Response.json({ "🖕": "🖕" });
    }

    const ext = url.pathname.match(/\.([a-z0-9%]+)$/)?.[1];
    const path = url.pathname
      .replace(/^\/|\/$/g, "")
      .replace(/[^/a-zA-Z0-9-_.~]/g, "");

    return ext
      ? serveStatic(path, ext)
      : serveMarkdown(`${path || "index"}.md`);
  },
});

// ----- Static -----

import Mime from "mime";

async function serveStatic(path, ext) {
  const url = new URL(path, BASE_URL);
  const body = await cachedFetch(url, STATIC_TTL).then((res) =>
    res.ok ? res.body : undefined,
  );
  return body
    ? new Response(body, { headers: { "Content-Type": Mime.getType(ext) } })
    : new Response(null, { status: 404 });
}
// ----- Markdown -----

import { init as initmd4w, mdToHtml, setCodeHighlighter } from "md4w";
import { createHighlighter } from "shiki";

await initmd4w("fast");

const highlighter = await createHighlighter({
  themes: ["dark-plus"],
  langs: ["javascript", "bash", "html", "css", "json", "yaml", "markdown"],
});

setCodeHighlighter(
  (lang, code) =>
    `<pre><code>${highlighter.codeToHtml(code, { lang, theme: "dark-plus" })}</code></pre>`,
);

async function serveMarkdown(path) {
  const [md, template] = await Promise.all(
    [
      cachedFetch(new URL(path, BASE_URL), CONTENT_TTL),
      cachedFetch(new URL("index.html", BASE_URL), CONTENT_TTL),
    ].map((p) => p.then((res) => (res.ok ? res.text() : ""))),
  );

  const mdHtml = mdToHtml(md || "(404)");

  return new Response(
    renderTemplate(template, {
      content: mdHtml,
      contentURL: new URL(path, BASE_URL).toString(),
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
  if (cached?.time > Date.now() - ttl) {
    return cached.promise.then((res) => res.clone());
  }
  console.log("Fetching", url);
  const promise = fetch(url).catch((_err) => new Response("", { status: 500 }));
  caches.set(url, { promise, time: Date.now() });
  return (cached?.promise || promise).then((res) => res.clone());
}
