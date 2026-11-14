import { spawn } from "node:child_process";
import process from "node:process";

const LOCAL_PORT = 3210;
const START_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 10_000;

const configuredBaseUrl = process.env.SMOKE_BASE_URL?.trim();
const baseUrl = (configuredBaseUrl || `http://127.0.0.1:${LOCAL_PORT}`).replace(
  /\/$/,
  "",
);

const checks = [
  {
    path: "/",
    status: 200,
    contentType: "text/html",
    includes: [
      "Log in to LinkUp",
      "LinkUp | Discover Events at Your School",
      'rel="canonical"',
      'property="og:image"',
    ],
  },
  {
    path: "/signup",
    status: 200,
    contentType: "text/html",
    includes: ["Create your account"],
  },
  {
    path: "/request-school",
    status: 200,
    contentType: "text/html",
    includes: ["Request your school"],
  },
  {
    path: "/beta",
    status: 200,
    contentType: "text/html",
    includes: ["Help test LinkUp before launch"],
  },
  {
    path: "/robots.txt",
    status: 200,
    contentType: "text/plain",
    includes: ["User-Agent: *", "Disallow: /api/", "Sitemap:"],
  },
  {
    path: "/sitemap.xml",
    status: 200,
    contentType: "application/xml",
    includes: [
      "https://link-up-v1.vercel.app",
      "https://link-up-v1.vercel.app/signup",
    ],
  },
  {
    path: "/opengraph-image",
    status: 200,
    contentType: "image/png",
  },
  {
    path: "/smoke-test-missing-page",
    status: 404,
    contentType: "text/html",
    includes: ["This page didn&#x27;t make the guest list."],
    excludes: ["Sign out"],
  },
];

let server;
const serverOutput = [];

function recordServerOutput(chunk) {
  serverOutput.push(...chunk.toString().split("\n").filter(Boolean));
  if (serverOutput.length > 40) serverOutput.splice(0, serverOutput.length - 40);
}

function startLocalServer() {
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(LOCAL_PORT),
    ],
    {
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  server.stdout.on("data", recordServerOutput);
  server.stderr.on("data", recordServerOutput);
}

async function waitForServer() {
  const deadline = Date.now() + START_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (server?.exitCode !== null) {
      throw new Error(`Next.js exited before it became ready (code ${server.exitCode}).`);
    }

    try {
      const response = await fetch(`${baseUrl}/`, {
        signal: AbortSignal.timeout(1_500),
      });
      if (response.status < 500) return;
    } catch {
      // The production server may still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Next.js did not become ready within ${START_TIMEOUT_MS / 1_000}s.`);
}

async function runCheck(check) {
  const response = await fetch(`${baseUrl}${check.path}`, {
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const contentType = response.headers.get("content-type") || "";
  const body = check.contentType.startsWith("image/")
    ? ""
    : await response.text();
  const problems = [];

  if (response.status !== check.status) {
    problems.push(`expected status ${check.status}, received ${response.status}`);
  }

  if (!contentType.toLowerCase().includes(check.contentType)) {
    problems.push(
      `expected content-type containing ${check.contentType}, received ${contentType || "none"}`,
    );
  }

  for (const marker of check.includes || []) {
    if (!body.includes(marker)) problems.push(`missing marker: ${marker}`);
  }

  for (const marker of check.excludes || []) {
    if (body.includes(marker)) problems.push(`unexpected marker: ${marker}`);
  }

  if (problems.length > 0) {
    throw new Error(`${check.path}: ${problems.join("; ")}`);
  }

  console.log(`✓ ${check.path} (${response.status}, ${contentType.split(";")[0]})`);
}

async function stopServer() {
  if (!server || server.exitCode !== null) return;

  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);

  if (server.exitCode === null) server.kill("SIGKILL");
}

try {
  if (!configuredBaseUrl) {
    startLocalServer();
    await waitForServer();
  }

  console.log(`Running public-route smoke tests against ${baseUrl}`);
  for (const check of checks) await runCheck(check);
  console.log(`Public-route smoke tests passed (${checks.length}/${checks.length}).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  if (serverOutput.length > 0) {
    console.error("\nRecent Next.js output:\n" + serverOutput.join("\n"));
  }
  process.exitCode = 1;
} finally {
  await stopServer();
}
