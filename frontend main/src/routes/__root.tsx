import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="page-bg flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center fade-up">
        <div className="font-display text-8xl font-medium text-primary">404</div>
        <h2 className="mt-4 font-display text-xl text-ink">Page not found</h2>
        <p className="mt-2 text-sm text-ink-muted">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="btn-primary inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="page-bg flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center fade-up">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-2xl">⚠️</div>
        <h1 className="font-display text-xl text-ink">This page didn't load</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-primary inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-6 py-2.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#ff3f6c" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
