import React from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App';

export interface Env {
  ASSETS?: Fetcher;
}

function renderHtmlDocument(title: string, bodyHtml: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body>
  <div id="root">${bodyHtml}</div>
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

    if (url.pathname === '/' && request.method === 'GET') {
      const html = renderToString(React.createElement(App));
      return renderHtmlDocument('TapToSpell 2', html);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};

