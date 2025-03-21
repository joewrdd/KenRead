"use client";

import Link from "next/link";
import { Search, Moon, Sun, Menu, BookOpen, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 max-w-full w-full">
        {/* Left side with logo and navigation */}
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="mr-2 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <Link
                href="/"
                className="flex items-center space-x-2 font-bold text-xl mb-6"
              >
                <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-lg p-1.5">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="text-primary font-extrabold">KenRead</span>
              </Link>
              <nav className="flex flex-col space-y-4">
                <Link
                  href="/latest"
                  className="block py-2 transition-colors hover:text-primary"
                >
                  Latest
                </Link>
                <Link
                  href="/popular"
                  className="block py-2 transition-colors hover:text-primary"
                >
                  Popular
                </Link>
                <Link
                  href="/bookmarks"
                  className="block py-2 transition-colors hover:text-primary"
                >
                  Bookmarks
                </Link>
                <Link
                  href="/history"
                  className="block py-2 transition-colors hover:text-primary"
                >
                  History
                </Link>
                {!user ? (
                  <>
                    <Link
                      href="/auth/login"
                      className="block py-2 transition-colors hover:text-primary"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="block py-2 transition-colors hover:text-primary"
                    >
                      Sign up
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="flex items-center py-2 text-sm font-medium text-left transition-colors hover:text-primary"
                    disabled={isLoggingOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? "Signing out..." : "Sign out"}
                  </button>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="flex items-center space-x-2 font-bold text-xl"
          >
            <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-lg p-1.5">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-primary font-extrabold">KenRead</span>
          </Link>

          <nav className="ml-8 hidden md:flex items-center space-x-8 text-sm font-medium">
            <Link
              href="/latest"
              className="transition-colors hover:text-primary"
            >
              Latest
            </Link>
            <Link
              href="/popular"
              className="transition-colors hover:text-primary"
            >
              Popular
            </Link>
            <Link
              href="/bookmarks"
              className="transition-colors hover:text-primary"
            >
              Bookmarks
            </Link>
            <Link
              href="/history"
              className="transition-colors hover:text-primary"
            >
              History
            </Link>
          </nav>
        </div>

        {/* Right side with search, auth, and theme toggle */}
        <div className="flex items-center space-x-3">
          <form
            onSubmit={handleSearch}
            className="hidden sm:flex w-full max-w-xs md:max-w-sm lg:max-w-md relative"
          >
            <Input
              type="search"
              placeholder="Search manga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-8 rounded-lg"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
              type="submit"
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </form>

          {!user ? (
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user.displayName || user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/bookmarks">My Bookmarks</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/history">Reading History</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-destructive focus:text-destructive"
                >
                  {isLoggingOut ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg sm:hidden"
            onClick={() => router.push("/search")}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
