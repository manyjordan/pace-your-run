import dotenv from "dotenv";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TOKEN_FILE = join(__dirname, ".strava-session.local.json");
const PORT = 3000;

dotenv.config({ path: join(__dirname, ".env.local") });
dotenv.config();

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(data));
}

function readSession() {
  if (!existsSync(TOKEN_FILE)) return null;
  try {
    return JSON.parse(readFileSync(TOKEN_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writeSession(data) {
  writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2));
}

function getAppOrigin(req) {
  const origin = req.headers.origin;
  if (origin) return origin;

  const referer = req.headers.referer;
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return "http://localhost:8080";
    }
  }

  return "http://localhost:8080";
}

async function fetchStravaJson(path, accessToken) {
  const response = await fetch(`https://www.strava.com/api/v3${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  return { response, data };
}

async function exchangeToken(params) {
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  const data = await response.json();
  return { response, data };
}

async function getValidSession() {
  const session = readSession();
  if (!session?.access_token) return null;

  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at > now + 120) {
    return session;
  }

  if (!session.refresh_token) return session;

  const { response, data } = await exchangeToken({
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: session.refresh_token,
  });

  if (!response.ok || data.errors || !data.access_token) {
    return session;
  }

  const refreshedSession = {
    ...session,
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? session.refresh_token,
    expires_at: data.expires_at ?? session.expires_at,
    athlete: data.athlete ?? session.athlete,
  };

  writeSession(refreshedSession);
  return refreshedSession;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  if (url.pathname === "/api/auth/status" && req.method === "GET") {
    const session = readSession();
    return sendJson(res, 200, {
      connected: Boolean(session?.access_token),
      athlete: session?.athlete ?? null,
    });
  }

  if (url.pathname === "/api/auth/callback" && req.method === "GET") {
    const appOrigin = getAppOrigin(req);
    const code = url.searchParams.get("code");
    if (!code) {
      res.writeHead(302, { Location: `${appOrigin}/settings?strava=missing_code` });
      return res.end();
    }

    try {
      const { response, data } = await exchangeToken({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      });

      if (!response.ok || data.errors) {
        res.writeHead(302, { Location: `${appOrigin}/settings?strava=error` });
        return res.end();
      }

      writeSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        athlete: data.athlete,
      });

      res.writeHead(302, { Location: `${appOrigin}/settings?strava=connected` });
      return res.end();
    } catch {
      res.writeHead(302, { Location: `${appOrigin}/settings?strava=error` });
      return res.end();
    }
  }

  if (url.pathname === "/api/auth/logout" && req.method === "POST") {
    writeSession({});
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === "/api/strava/activities" && req.method === "GET") {
    const session = await getValidSession();

    if (!session?.access_token) {
      return sendJson(res, 200, {
        connected: false,
        athlete: null,
        activities: [],
      });
    }

    try {
      const allHistory = url.searchParams.get("all_history") === "1";
      const perPage = Number(url.searchParams.get("per_page") || (allHistory ? "100" : "30"));
      const page = Number(url.searchParams.get("page") || "1");

      let activities = [];

      if (allHistory) {
        let currentPage = page;
        let keepFetching = true;

        while (keepFetching) {
          const { response, data } = await fetchStravaJson(
            `/athlete/activities?per_page=${perPage}&page=${currentPage}`,
            session.access_token,
          );

          if (!response.ok || !Array.isArray(data)) {
            return sendJson(res, 502, {
              connected: true,
              athlete: session.athlete ?? null,
              activities: [],
              error: "Unable to fetch Strava activities",
            });
          }

          activities.push(...data);
          keepFetching = data.length === perPage;
          currentPage += 1;
        }
      } else {
        const { response, data } = await fetchStravaJson(
          `/athlete/activities?per_page=${perPage}&page=${page}`,
          session.access_token,
        );

        activities = data;

        if (!response.ok || !Array.isArray(activities)) {
          return sendJson(res, 502, {
            connected: true,
            athlete: session.athlete ?? null,
            activities: [],
            error: "Unable to fetch Strava activities",
          });
        }
      }

      if (!Array.isArray(activities)) {
        return sendJson(res, 502, {
          connected: true,
          athlete: session.athlete ?? null,
          activities: [],
          error: "Unable to fetch Strava activities",
        });
      }

      return sendJson(res, 200, {
        connected: true,
        athlete: session.athlete ?? null,
        activities,
      });
    } catch {
      return sendJson(res, 500, {
        connected: true,
        athlete: session.athlete ?? null,
        activities: [],
        error: "Unexpected error while fetching activities",
      });
    }
  }

  const detailMatch = url.pathname.match(/^\/api\/strava\/activities\/(\d+)\/details$/);
  if (detailMatch && req.method === "GET") {
    const session = await getValidSession();

    if (!session?.access_token) {
      return sendJson(res, 200, {
        connected: false,
        activity: null,
        streams: null,
      });
    }

    try {
      const activityId = detailMatch[1];
      const [{ response: activityResponse, data: activity }, { response: streamsResponse, data: streams }] =
        await Promise.all([
          fetchStravaJson(`/activities/${activityId}`, session.access_token),
          fetchStravaJson(
            `/activities/${activityId}/streams?keys=time,distance,heartrate,velocity_smooth,altitude&key_by_type=true`,
            session.access_token,
          ),
        ]);

      if (!activityResponse.ok || !activity?.id) {
        return sendJson(res, 502, {
          connected: true,
          activity: null,
          streams: null,
          error: "Unable to fetch Strava activity details",
        });
      }

      return sendJson(res, 200, {
        connected: true,
        athlete: session.athlete ?? null,
        activity,
        streams: streamsResponse.ok ? streams : null,
      });
    } catch {
      return sendJson(res, 500, {
        connected: true,
        activity: null,
        streams: null,
        error: "Unexpected error while fetching activity details",
      });
    }
  }

  return sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Strava auth server running on http://localhost:${PORT}`);
});
