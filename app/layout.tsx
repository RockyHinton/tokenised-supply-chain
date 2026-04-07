import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "SupplyChain Ledger Prototype",
  description:
    "A provenance prototype that prepares and submits supply-chain lifecycle events to a mock HCS-style ledger adapter."
};

const navigation = [
  { href: "/", label: "Dashboard" },
  { href: "/assets", label: "Assets" },
  { href: "/events/new", label: "Record Event" },
  { href: "/documents", label: "Documents" },
  { href: "/ledger/mock", label: "Mock Ledger" }
];

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-10">
          <header className="mb-8 rounded-xl2 border border-line/80 bg-white/80 p-6 shadow-panel backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">
                  SupplyChain Ledger Prototype
                </p>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Supply-chain provenance, structured for future Hedera submission
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate">
                    V1 simulates lifecycle events, HCS-style payload preparation, mock ledger
                    submission, and immutable-style audit visibility without touching the real network.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/assets/new"
                  className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-accent"
                >
                  Create Asset
                </Link>
                <Link
                  href="/events/new"
                  className="rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:border-accent hover:text-accent"
                >
                  Record Event
                </Link>
              </div>
            </div>
            <nav className="mt-6 flex flex-wrap gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-line bg-mist/50 px-4 py-2 text-sm text-slate transition hover:border-accent hover:text-accent"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
