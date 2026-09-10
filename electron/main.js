const { app, BrowserWindow, shell, session, ipcMain } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

const UCC = process.env.UCC_URL || "http://127.0.0.1:5050";
const TENANT = process.env.MINECRAFTUUUUM_TENANT || "minecraftuuuum";
const SETTINGS_DIR = path.join(app.getPath("home"), ".treewriter");
const SETTINGS_FILE = path.join(SETTINGS_DIR, "settings.json");
let child;

function minecraftuuuumDir() {
  return process.env.MINECRAFTUUUUM_DIR || path.resolve(__dirname, "..", "..", "minecraftuuuum");
}

function defaultWebglBuildDir() {
  return path.join(minecraftuuuumDir(), "spring-server", "src", "main", "resources", "static", "continuuuum_editor", "Build");
}

function readSettings() {
  let stored = {};
  try {
    stored = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
  } catch (e) {
    stored = {};
  }
  return {
    unityEditorPath: stored.unityEditorPath || "",
    unityHubPath: stored.unityHubPath || "",
    unityHubInstallerPath: stored.unityHubInstallerPath || "",
    webglBuildDir: stored.webglBuildDir || "",
    webglSourceDir: stored.webglSourceDir || "",
  };
}

function writeSettings(next) {
  fs.mkdirSync(SETTINGS_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2));
  return next;
}

function waitForUcc(tries) {
  return new Promise((resolve) => {
    const probe = () => {
      http.get(UCC + "/api/settings", (res) => {
        res.resume();
        resolve();
      }).on("error", () => {
        if (tries-- <= 0) resolve();
        else setTimeout(probe, 500);
      });
    };
    probe();
  });
}

function startSpring() {
  if (process.env.MINECRAFTUUUUM_JAR) {
    child = spawn("java", ["-jar", process.env.MINECRAFTUUUUM_JAR], { stdio: "inherit", shell: true });
    return;
  }
  const dir = minecraftuuuumDir();
  const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
  child = spawn(gradlew, [":spring-server:bootRun"], { cwd: dir, stdio: "inherit", shell: true });
}

function attachTenantHeader() {
  session.defaultSession.webRequest.onBeforeSendHeaders({ urls: [UCC.replace(/\/$/, "") + "/*"] }, (details, callback) => {
    details.requestHeaders["X-Tenant-ID"] = TENANT;
    details.requestHeaders["X-Treewriter"] = "1";
    callback({ requestHeaders: details.requestHeaders });
  });
}

function windowPrefs() {
  return {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,
    nodeIntegration: false,
  };
}

function openWindow(route, title) {
  const win = new BrowserWindow({ width: 1100, height: 800, title, webPreferences: windowPrefs() });
  win.loadURL(UCC + route);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function openHub() {
  const win = new BrowserWindow({ width: 720, height: 640, title: "treewriter", webPreferences: windowPrefs() });
  win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

function exists(p) {
  return !!(p && fs.existsSync(p));
}

function installWebgl() {
  const settings = readSettings();
  const outDir = settings.webglBuildDir || defaultWebglBuildDir();
  const editor = settings.unityEditorPath;
  const hub = settings.unityHubPath;
  const installer = settings.unityHubInstallerPath;
  const source = settings.webglSourceDir;

  if (exists(source)) {
    copyDir(source, outDir);
    return { ok: true, webglBuildDir: outDir, message: "copied WebGL source into " + outDir };
  }
  if (exists(editor) && fs.statSync(editor).isFile()) {
    const args = ["-quit", "-batchmode", "-nographics", "-buildTarget", "WebGL", "-logFile", "-"];
    spawn(editor, args, { stdio: "inherit", shell: true, detached: true }).unref();
    return { ok: true, webglBuildDir: outDir, message: "launched Unity Editor batch WebGL build; export into " + outDir };
  }
  if (exists(installer) && !exists(hub) && !exists(editor)) {
    shell.openPath(installer);
    return { ok: true, webglBuildDir: outDir, message: "launched user-owned Unity Hub installer" };
  }
  if (exists(hub) || exists(editor)) {
    return { ok: true, webglBuildDir: outDir, message: "Unity path remembered. Point webglSourceDir at a pre-exported Build or run a batch build into " + outDir };
  }
  return { ok: false, webglBuildDir: outDir, message: "Set a Unity Editor path, a Hub installer you already downloaded, or a pre-exported WebGL folder." };
}

ipcMain.handle("tw-settings-get", () => {
  const s = readSettings();
  s.defaultWebglBuildDir = defaultWebglBuildDir();
  return s;
});
ipcMain.handle("tw-settings-save", (_e, patch) => {
  const next = Object.assign(readSettings(), patch || {});
  return writeSettings(next);
});
ipcMain.handle("tw-install-webgl", () => installWebgl());

app.whenReady().then(async () => {
  attachTenantHeader();
  startSpring();
  await waitForUcc(40);
  openHub();
  openWindow("/", "treewriter — Home");
  openWindow("/library", "treewriter — Servers");
  openWindow("/lemma-library", "treewriter — Lemmas");
  openWindow("/lemma-implementation", "treewriter — Implement");
  openWindow("/lemma-wrap", "treewriter — Wrap");
  openWindow("/block-recipes", "treewriter — Blocks");
  openWindow("/video-generation", "treewriter — Video animation");
  openWindow("/pixellight", "treewriter — PixelLight");
});

app.on("window-all-closed", () => {
  if (child) child.kill();
  app.quit();
});
