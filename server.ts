import dotenv from "dotenv";
import express from "express";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { STANDARD_PUBLIC_ROUTES } from "./src/utils/publicRoutes";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isStaticFileRequest(requestPath: string) {
  return requestPath.startsWith("/assets/") ||
    requestPath.startsWith("/downloads/") ||
    Boolean(path.extname(requestPath));
}

const knownAppPaths = new Set(
  STANDARD_PUBLIC_ROUTES.map((route) => route.path === "/" ? "/" : route.path.replace(/\/$/, "")),
);

function isKnownAppRoute(requestPath: string) {
  const normalized = requestPath === "/" ? "/" : requestPath.replace(/\/$/, "");
  return knownAppPaths.has(normalized);
}

async function startServer() {
  const app = express();
  const port = Number.parseInt(process.env.PORT || "3000", 10);

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      if (isStaticFileRequest(req.path)) {
        res.status(404).type("text/plain").send("Not Found");
        return;
      }
      const status = isKnownAppRoute(req.path) ? 200 : 404;
      res.status(status).sendFile(path.join(__dirname, "dist", status === 404 ? "404.html" : "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
    app.use(async (req, res, next) => {
      if (req.method !== "GET") {
        next();
        return;
      }
      if (isStaticFileRequest(req.path)) {
        res.status(404).type("text/plain").send("Not Found");
        return;
      }

      try {
        const template = await readFile(path.join(__dirname, "index.html"), "utf8");
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(isKnownAppRoute(req.path) ? 200 : 404).type("text/html").send(html);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exitCode = 1;
});
