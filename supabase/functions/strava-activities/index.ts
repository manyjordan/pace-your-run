import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { jwtDecode } from "https://esm.sh/jwt-decode@4.0.0";

interface DecodedJWT {
  sub: string;
}

interface StravaTokenRow {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: Record<string, unknown>;
}

interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: Record<string, unknown>;
}

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_CLIENT_ID = Deno.env.get("STRAVA_CLIENT_ID");
const STRAVA_CLIENT_SECRET = Deno.env.get("STRAVA_CLIENT_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function refreshTokenIfNeeded(token: StravaTokenRow): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (token.expires_at > now + 120) {
    return token.access_token;
  }

  try {
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: STRAVA_CLIENT_ID!,
        client_secret: STRAVA_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refresh_token,
      }),
    });

    if (!response.ok) {
      console.error("Token refresh failed:", response.status);
      return token.access_token;
    }

    const newData = (await response.json()) as StravaTokenResponse;

    await supabase
      .from("strava_tokens")
      .update({
        access_token: newData.access_token,
        refresh_token: newData.refresh_token,
        expires_at: newData.expires_at,
        athlete: newData.athlete,
      })
      .eq("user_id", token.user_id);

    return newData.access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return token.access_token;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ connected: false, activities: [] }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const token = authHeader.substring(7);

  let userId: string;
  try {
    const decoded = jwtDecode<DecodedJWT>(token);
    userId = decoded.sub;
  } catch {
    return new Response(
      JSON.stringify({ connected: false, activities: [] }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Get token from database
    const { data: tokenData, error: dbError } = await supabase
      .from("strava_tokens")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (dbError || !tokenData) {
      return new Response(
        JSON.stringify({ connected: false, activities: [] }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Refresh token if needed
    const accessToken = await refreshTokenIfNeeded(tokenData as StravaTokenRow);

    // Fetch activities from Strava
    const url = new URL(`${STRAVA_API_BASE}/athlete/activities`);
    url.searchParams.set("per_page", "100");

    const activitiesResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!activitiesResponse.ok) {
      console.error("Strava API error:", activitiesResponse.status);
      return new Response(
        JSON.stringify({
          connected: true,
          athlete: tokenData.athlete,
          activities: [],
          error: "Unable to fetch Strava activities",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const activities = await activitiesResponse.json();

    return new Response(
      JSON.stringify({
        connected: true,
        athlete: tokenData.athlete,
        activities: Array.isArray(activities) ? activities : [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        connected: false,
        activities: [],
        error: "Unexpected error while fetching activities",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
