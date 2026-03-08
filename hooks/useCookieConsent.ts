"use client";

import Cookies from "js-cookie";
import { useCallback, useState } from "react";

export function useCookieConsent() {
  const [consented, setConsented] = useState<boolean | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return Cookies.get("cookieConsent") === "true";
    } catch {
      return false;
    }
  });
  const [mounted] = useState(() => typeof window !== "undefined");

  const acceptConsent = useCallback(() => {
    Cookies.set("cookieConsent", "true", {
      expires: 365,
      path: "/",
      sameSite: "lax",
    });
    setConsented(true);
  }, []);

  const revokeConsent = useCallback(() => {
    Cookies.remove("cookieConsent", { path: "/" });
    setConsented(false);
  }, []);

  return { consented, mounted, acceptConsent, revokeConsent };
}

