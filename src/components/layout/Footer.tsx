"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-10">
      <div className="container flex flex-col items-center justify-between gap-4 px-4 md:px-6 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:items-start">
          <Link
            href="/"
            className="flex items-center space-x-2 font-bold text-xl"
          >
            <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-lg p-1.5">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-primary font-extrabold">KenRead</span>
          </Link>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            Free manga reading website with a large collection of manga.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-8">
          <nav className="flex flex-col items-center gap-2 md:flex-row md:gap-6">
            <Link
              href="/about"
              className="text-sm font-medium hover:text-primary"
            >
              About
            </Link>
            <Link
              href="/dmca"
              className="text-sm font-medium hover:text-primary"
            >
              DMCA
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium hover:text-primary"
            >
              Contact
            </Link>
          </nav>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} KenRead. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
