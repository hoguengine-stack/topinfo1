import express from "express";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000');

  app.use(express.json());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "pos-management-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,
        sameSite: "none",
        httpOnly: true,
        maxAge: 9999 * 365 * 24 * 60 * 60 * 1000, // 9999 years
      },
    })
  );

  // Google OAuth URLs
  const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
  const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
  const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

  app.get("/api/auth/google/url", (req, res) => {
    const host = req.get("host");
    const forwardedHost = req.headers["x-forwarded-host"];
    console.log("Auth Request - Host:", host, "Forwarded Host:", forwardedHost);

    let rootUrl = process.env.APP_URL;
    if (!rootUrl) {
      // Fallback to host header if APP_URL is missing
      rootUrl = `https://${host}`;
      console.warn("APP_URL environment variable is missing. Falling back to:", rootUrl);
    }
    
    // Remove trailing slash if exists to prevent double slashes
    rootUrl = rootUrl.replace(/\/$/, "");
    
    const redirectUri = `${rootUrl}/auth/google/callback`;
    console.log("Generated Redirect URI for Google:", redirectUri);

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID is missing!");
      return res.status(500).json({ error: "GOOGLE_CLIENT_ID is not set in environment variables" });
    }

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

    res.json({ url: `${GOOGLE_AUTH_URL}?${params.toString()}` });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    let rootUrl = process.env.APP_URL || `https://${req.get("host")}`;
    rootUrl = rootUrl.replace(/\/$/, "");
    const redirectUri = `${rootUrl}/auth/google/callback`;

    try {
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenResponse.json();
      if (tokens.error) throw new Error(tokens.error_description);

      const userResponse = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      const userData = await userResponse.json();
      (req.session as any).user = userData;

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(userData)} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>인증 성공! 창이 자동으로 닫힙니다.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("OAuth Error:", error);
      res.status(500).send(`Authentication failed: ${error.message}`);
    }
  });

  app.get("/api/auth/me", (req, res) => {
    res.json((req.session as any).user || null);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
