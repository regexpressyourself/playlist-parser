import type { LoaderFunction, LinksFunction, MetaFunction } from "remix";
import { useCatch, Links, LiveReload, Outlet, Meta, Scripts } from "remix";
import { requireUserId } from "~/utils/session.server";
import marxStylesUrl from "./styles/marx.css";
import globalStylesUrl from "./styles/global.css";
import globalMediumStylesUrl from "./styles/global-medium.css";
import globalLargeStylesUrl from "./styles/global-large.css";
import navStylesUrl from "./styles/nav.css";
import progressBarStylesUrl from "./styles/progress-bar.css";

export const loader: LoaderFunction = async ({ request }) => {
  const allowedPaths = ["/", "/login"];
  let url = new URL(request.url);
  if (allowedPaths.includes(url.pathname)) {
    return {};
  }
  return requireUserId(request);
};

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: marxStylesUrl,
    },
    {
      rel: "stylesheet",
      href: globalStylesUrl,
    },
    {
      rel: "stylesheet",
      href: navStylesUrl,
    },
    {
      rel: "stylesheet",
      href: globalMediumStylesUrl,
      media: "print, (min-width: 640px)",
    },
    {
      rel: "stylesheet",
      href: globalLargeStylesUrl,
      media: "screen and (min-width: 1024px)",
    },
    {
      rel: "stylesheet",
      href: progressBarStylesUrl,
    },
  ];
};

export const meta: MetaFunction = () => {
  const description = "Search your playlists for a song";
  return {
    description,
    keywords: "Remix,Spotify,playlist",
    "twitter:image": "https://smessina.com/sm.png",
    "twitter:card": "summary_large_image",
    "twitter:creator": "@remix_run",
    "twitter:site": "@remix_run",
    "twitter:title": "Playlist Parser",
    "twitter:description": description,
    viewport: "width=device-width, initial-scale=1",
  };
};

function Document({
  children,
  title = "Playlist Parser",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <Meta />
        <title>{title}</title>
        <Links />
      </head>
      <body>
        {children}
        <Scripts />
        {process.env.NODE_ENV === "development" ? <LiveReload /> : null}
      </body>
    </html>
  );
}

export default function App() {
  return (
    <Document>
      <nav>
        <p className="title">
          <a href="/">
            Playlist <span>Parser!</span>
          </a>
        </p>
      </nav>
      <Outlet />
    </Document>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  return (
    <Document title={`${caught.status} ${caught.statusText}`}>
      <div className="error-container">
        <h1>
          {caught.status} {caught.statusText}
        </h1>
      </div>
    </Document>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return (
    <Document title="Uh-oh!">
      <div className="error-container">
        <h1>App Error</h1>
        <pre>{error.message}</pre>
      </div>
    </Document>
  );
}
