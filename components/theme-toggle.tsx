"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (resolvedTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.querySelectorAll(".hljs").forEach((el) => {
        el.setAttribute("data-dark-highlight", "true");
      });
    } else if (resolvedTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.querySelectorAll(".hljs").forEach((el) => {
        el.removeAttribute("data-dark-highlight");
      });
    }
  }, [resolvedTheme]);

  if (!mounted) {
    return <div className="fixed top-4 right-4 z-50 size-8" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        variant="ghost"
        size="icon"
        aria-label={isDark ? "다크 모드 활성화됨. 라이트 모드로 전환" : "라이트 모드 활성화됨. 다크 모드로 전환"}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        {isDark ? <Moon /> : <Sun />}
      </Button>
    </div>
  );
}
