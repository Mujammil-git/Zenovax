import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/hooks/useAuth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold">404</h1>
        <p className="mt-3 text-muted-foreground">This page wandered off.</p>
        <Link to="/" className="inline-flex mt-6 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Go home</Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FlowSpace — Your mind, organized." },
      { name: "description", content: "All-in-one AI productivity OS. Tasks, notes, habits, money, and focus — beautifully unified." },
      { property: "og:title", content: "FlowSpace — Your mind, organized." },
      { name: "twitter:title", content: "FlowSpace — Your mind, organized." },
      { property: "og:description", content: "All-in-one AI productivity OS. Tasks, notes, habits, money, and focus — beautifully unified." },
      { name: "twitter:description", content: "All-in-one AI productivity OS. Tasks, notes, habits, money, and focus — beautifully unified." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0ebbb107-b30b-433e-a805-dcb7431b8976/id-preview-aa4976cb--4438ab9f-09f2-4343-9e48-fb11a63d8e03.lovable.app-1776751094931.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0ebbb107-b30b-433e-a805-dcb7431b8976/id-preview-aa4976cb--4438ab9f-09f2-4343-9e48-fb11a63d8e03.lovable.app-1776751094931.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: "10px" } }} />
    </AuthProvider>
  );
}
