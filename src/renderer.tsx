import "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { Style } from "hono/css";

declare module "hono" {
  interface ContextRenderer {
    (content: string | Promise<string>, props?: { title?: string }): Response;
  }
}

export const renderer = jsxRenderer(
  ({ children, title }) => {
    return (
      <html>
        <head>
          <link
            rel="stylesheet"
            href="https://unpkg.com/modern-css-reset/dist/reset.min.css"
          />
          <link rel="stylesheet" href="/static/style.css" />
          <script src="/static/profile-video.js" defer />
          <link
            rel="icon"
            href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text x=%2250%%22 y=%2250%%22 style=%22dominant-baseline:central;text-anchor:middle;font-size:90px;%22></text></svg>"
          />
          <title>{title}</title>
          <meta
            name="description"
            content="新美昂正の連絡先情報を提供する名刺サイトです。"
          />
          <meta
            name="keywords"
            content="新美昂正, 名刺, ビジネス,"
          />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <meta name="author" content="山田太郎" />
          <meta property="og:title" content="名刺 | Kosei Niimi" />
          <meta
            property="og:description"
            content="新美昂正の連絡先情報を提供する名刺サイトです。"
          />
          <meta property="og:url" content="" />
          <meta name="twitter:card" content="summary" />
          <meta
            name="apple-mobile-web-app-title"
            content="名刺 | Kosei Niimi"
          />
          <Style />
        </head>
        <body>{children}</body>
      </html>
    );
  },
  {
    docType: true,
  }
);
