import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { jwtDecode } from "https://esm.sh/jwt-decode@4.0.0";

interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    profile: string;
  };
}

interface DecodedJWT {
  sub: string;
}

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_CLIENT_ID = Deno.env.get("STRAVA_CLIENT_ID");
const STRAVA_CLIENT_SECRET = Deno.env.get("STRAVA_CLIENT_SECRET");
const STRAVA_REDIRECT_URI = Deno.env.get("STRAVA_REDIRECT_URI");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REDIRECT_URI) {
  throw new Error("Missing Strava environment variables");
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return new Response(
      `<html><body>Error: Missing authorization code</body></html>`,
      {
        status: 400,
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  if (!state) {
    return new Response(
      `<html><body>Error: Missing state parameter</body></html>`,
      {
        status: 400,
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  try {
    // Decode JWT from state to get user_id
    let userId: string;
    try {
      const decoded = jwtDecode<DecodedJWT>(state);
      userId = decoded.sub;
    } catch {
      return new Response(
        `<html><body>Error: Invalid JWT state parameter</body></html>`,
        {
          status: 400,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Exchange code for Strava tokens
    const tokenResponse = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Strava token exchange failed:", tokenResponse.status);
      return new Response(
        `<html><body>Error: Failed to exchange authorization code with Strava</body></html>`,
        {
          status: 502,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    const stravaData = (await tokenResponse.json()) as StravaTokenResponse;

    if (!stravaData.access_token) {
      return new Response(
        `<html><body>Error: No access token received from Strava</body></html>`,
        {
          status: 502,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Upsert token into strava_tokens table
    const { error: upsertError } = await supabase
      .from("strava_tokens")
      .upsert(
        {
          user_id: userId,
          access_token: stravaData.access_token,
          refresh_token: stravaData.refresh_token,
          expires_at: stravaData.expires_at,
          athlete: stravaData.athlete,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Database upsert error:", upsertError);
      return new Response(
        `<html><body>Error: Failed to save Strava token</body></html>`,
        {
          status: 500,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Redirect to app with success status
    const redirectUrl = new URL("/", url.origin);
    redirectUrl.searchParams.set("strava", "connected");
    
    return new Response(
      `<html><body><script>window.location.href = "${redirectUrl.toString()}";</script></body></html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      `<html><body>Error: ${error instanceof Error ? error.message : "Unknown error"}</body></html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }
    );
  }
});
