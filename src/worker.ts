import React from 'react';
import { renderToString } from 'react-dom/server';
import { App, deriveInitialRouteState, type InitialRouteState } from './App';
import {
  type PageSeoMetadata,
  SITE_NAME,
  buildJsonLd,
  generateRobotsTxt,
  generateSitemapXml,
  generateWebManifest,
  getAllSeoPages,
  resolveSeoForPathname,
} from './lib/seo';

export interface Env {
  ASSETS?: Fetcher;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ec4899"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#bg)"/>
  <text x="64" y="88" font-family="Nunito, Arial, sans-serif" font-size="76" font-weight="900" text-anchor="middle" fill="#ffffff">A</text>
</svg>`;

const OG_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="titleGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f472b6"/>
      <stop offset="50%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#818cf8"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#0f172a"/>
  <rect x="40" y="40" width="1120" height="550" rx="36" fill="#1e293b" stroke="#334155" stroke-width="4"/>
  <text x="600" y="240" font-family="Nunito, Arial, sans-serif" font-size="108" font-weight="900" text-anchor="middle" fill="url(#titleGrad)">TapToSpell!</text>
  <text x="600" y="340" font-family="Nunito, Arial, sans-serif" font-size="40" font-weight="700" text-anchor="middle" fill="#e2e8f0">Interactive Spelling &amp; Vocabulary Game</text>
  <text x="600" y="420" font-family="Nunito, Arial, sans-serif" font-size="32" font-weight="600" text-anchor="middle" fill="#94a3b8">Grades 1–6 Curriculum • High School 7 Topic Categories • 3,875+ Words</text>
</svg>`;

export function renderHtmlDocument(
  titleOrPage: string | PageSeoMetadata,
  bodyHtml: string,
  origin: string = 'https://taptospell.com',
  initialState?: InitialRouteState
): Response {
  const defaultPage = getAllSeoPages()[0];
  const page: PageSeoMetadata =
    typeof titleOrPage === 'string'
      ? { ...defaultPage, title: titleOrPage }
      : titleOrPage;

  const baseOrigin = origin.replace(/\/+$/, '');
  const canonicalUrl = `${baseOrigin}${page.path === '/' ? '/' : page.path}`;
  const ogImageUrl = `${baseOrigin}/og-image.svg`;
  const jsonLd = buildJsonLd(page, baseOrigin);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${escapeHtmlAttr(page.title)}</title>
  <meta name="description" content="${escapeHtmlAttr(page.description)}" />
  <meta name="keywords" content="${escapeHtmlAttr(page.keywords.join(', '))}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="author" content="${escapeHtmlAttr(SITE_NAME)}" />
  <meta name="application-name" content="${escapeHtmlAttr(SITE_NAME)}" />
  <meta name="theme-color" content="#0f172a" />
  <link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtmlAttr(SITE_NAME)}" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:title" content="${escapeHtmlAttr(page.title)}" />
  <meta property="og:description" content="${escapeHtmlAttr(page.description)}" />
  <meta property="og:url" content="${escapeHtmlAttr(canonicalUrl)}" />
  <meta property="og:image" content="${escapeHtmlAttr(ogImageUrl)}" />
  <meta property="og:image:alt" content="${escapeHtmlAttr(page.heading)} — TapToSpell Educational Spelling Game" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtmlAttr(page.title)}" />
  <meta name="twitter:description" content="${escapeHtmlAttr(page.description)}" />
  <meta name="twitter:image" content="${escapeHtmlAttr(ogImageUrl)}" />
  <link rel="stylesheet" href="/styles.css" />
  <script id="seo-json-ld" type="application/ld+json">${jsonLd}</script>
</head>
<body class="bg-slate-900 text-white h-[100dvh] w-screen overflow-hidden flex flex-col relative">
  <div id="root" class="flex-1 w-full h-full flex flex-col overflow-hidden relative">${bodyHtml}</div>
  ${initialState ? `<script id="__INITIAL_STATE__" type="application/json">${JSON.stringify(initialState).replace(/</g, '\\u003c')}</script>` : ''}
  <script type="module" src="/app.js"></script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = url.origin;

    if (request.method === 'GET' || request.method === 'HEAD') {
      if (url.pathname === '/robots.txt') {
        return new Response(generateRobotsTxt(origin), {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }

      if (url.pathname === '/sitemap.xml') {
        return new Response(generateSitemapXml(origin), {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }

      if (url.pathname === '/manifest.webmanifest') {
        return new Response(generateWebManifest(), {
          headers: {
            'Content-Type': 'application/manifest+json; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }

      if (url.pathname === '/favicon.svg') {
        return new Response(FAVICON_SVG, {
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }

      if (url.pathname === '/og-image.svg') {
        return new Response(OG_IMAGE_SVG, {
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }

      const seoPage = resolveSeoForPathname(url.pathname);
      if (seoPage) {
        const routeState = deriveInitialRouteState(seoPage.path);
        const html = renderToString(React.createElement(App, { initialRoute: routeState }));
        return renderHtmlDocument(seoPage, html, origin, routeState);
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
