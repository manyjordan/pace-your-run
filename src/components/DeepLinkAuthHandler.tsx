import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { supabase } from "@/lib/supabase";

function parseTokensFromUrl(urlString: string): { access_token: string; refresh_token: string } | null {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return null;
  }

  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  const fromHash = new URLSearchParams(hash);
  let access = fromHash.get("access_token");
  let refresh = fromHash.get("refresh_token");

  if (!access || !refresh) {
    access = url.searchParams.get("access_token");
    refresh = url.searchParams.get("refresh_token");
  }

  if (access && refresh) {
    return { access_token: access, refresh_token: refresh };
  }
  return null;
}

/**
 * Handles native deep links (OAuth return + email confirmation) where the
 * WebView URL does not receive Supabase hash fragments.
 */
export function DeepLinkAuthHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove: (() => void) | undefined;

    void (async () => {
      const sub = await CapApp.addListener("appUrlOpen", async ({ url }) => {
        let parsed: URL;
        try {
          parsed = new URL(url);
        } catch {
          return;
        }

        const path = parsed.pathname || "";
        const hashHasToken = parsed.hash.includes("access_token");
        const isConfirmPath = path.includes("auth/confirm");
        const code = parsed.searchParams.get("code");

        if (!isConfirmPath && !hashHasToken && !code) {
          return;
        }

        const tokens = parseTokensFromUrl(url);
        if (tokens) {
          const { error } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          });
          if (!error) {
            navigate("/", { replace: true });
          }
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            navigate("/", { replace: true });
          }
        }
      });

      remove = () => {
        void sub.remove();
      };
    })();

    return () => {
      remove?.();
    };
  }, [navigate]);

  return null;
}
