"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type ViolationType = "tab_switch" | "fullscreen_exit" | "keyboard_shortcut" | null;

export function useTabGuard(enabled: boolean = true) {
  const [violations, setViolations] = useState<{ count: number; lastType: ViolationType }>({ count: 0, lastType: null });
  const startedRef = useRef(false);

  const addViolation = useCallback((type: ViolationType) => {
    setViolations((prev) => ({ count: prev.count + 1, lastType: type }));
  }, []);

  useEffect(() => {
    if (!enabled) return;

    startedRef.current = true;

    // 1. Monitor Tab Switches (Visibility and Blur)
    const handleVisibilityChange = () => {
      if (document.hidden) addViolation("tab_switch");
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (!document.hidden && !document.fullscreenElement) {
           // We might just be out of focus. If we are in fullscreen, a blur might mean alt-tab.
           // To be safe and strict, an explicitly blurred window gets flagged.
           addViolation("tab_switch");
        }
      }, 200);
    };

    // 2. Monitor Fullscreen Escape
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        addViolation("fullscreen_exit");
      }
    };

    // 3. Monitor Keyboard Cheating Actions
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12 (DevTools)
      if (e.key === "F12") {
        e.preventDefault();
        addViolation("keyboard_shortcut");
        return;
      }
      
      // Check for Ctrl/Cmd combos
      if (e.ctrlKey || e.metaKey) {
        // Block C (Copy), V (Paste), X (Cut), P (Print), T (New Tab), N (New Window)
        const forbiddenKeys = ["c", "v", "x", "p", "t", "n"];
        if (forbiddenKeys.includes(e.key.toLowerCase())) {
          e.preventDefault();
          addViolation("keyboard_shortcut");
        }
      }

      // Block Alt shortcuts (like Alt+Left for back)
      if (e.altKey) {
        e.preventDefault();
        addViolation("keyboard_shortcut");
      }
    };

    // Prevent Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation("keyboard_shortcut"); // Or distinct context menu violation
    };

    // Prevent explicit drag/copy
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("keyboard_shortcut");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
    };
  }, [enabled, addViolation]);

  return {
    switchCount: violations.count,
    lastViolationType: violations.lastType,
    isViolated: violations.count > 0,
  };
}
