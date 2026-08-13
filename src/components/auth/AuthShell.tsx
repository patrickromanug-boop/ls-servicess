import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="page-grid mx-auto w-full max-w-md flex-1 px-4 py-14 sm:py-20">
      <p className="eyebrow">LS Services account</p>
      <h1 className="mt-2 text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
      <div className="border-border mt-7 rounded-3xl border bg-card p-6 shadow-lg shadow-brand/5">{children}</div>
    </main>
  );
}

export function GoogleButton({ onClick, label = "Continue with Google" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border hover:bg-muted flex w-full items-center justify-center gap-2.5 rounded-xl border py-3 text-sm font-semibold transition-colors"
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.3-2.1 3.8-5.1 3.8-8.6z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.2 0 5.9-1 7.7-2.9l-3.7-2.8c-1 .7-2.3 1.2-4 1.2-3.1 0-5.8-2-6.7-4.9l-.1.1-3.6 2.8v.1C3.5 21.3 7.4 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.3 14.6c-.3-.8-.4-1.6-.4-2.6 0-.9.2-1.8.4-2.6V9.3L1.6 6.5C.6 8.2 0 10 0 12s.6 3.8 1.6 5.5l3.7-2.9z"
        />
        <path
          fill="#EA4335"
          d="M12 4.7c2.2 0 3.7.9 4.6 1.7l3.3-3.2C17.9 1.2 15.2 0 12 0 7.4 0 3.5 2.7 1.6 6.5l3.7 2.9C6.2 6.6 8.9 4.7 12 4.7z"
        />
      </svg>
      {label}
    </button>
  );
}
