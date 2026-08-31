const { app, BrowserWindow, shell, session } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

const UCC = process.env.UCC_URL || "http://127.0.0.1:5050";
const TENANT = process.env.MINECRAFTUUUUM_TENANT || "minecraftuuuum";
let child;

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
  const dir = process.env.MINECRAFTUUUUM_DIR || path.resolve(__dirname, "..", "..", "minecraftuuuum");
  const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
  child = spawn(gradlew, [":spring-server:bootRun"], { cwd: dir, stdio: "inherit", shell: true });
}

function attachTenantHeader() {
  session.defaultSession.webRequest.onBeforeSendHeaders({ urls: [UCC.replace(/\/$/, "") + "/*"] }, (details, callback) => {
    details.requestHeaders["X-Tenant-ID"] = TENANT;
    callback({ requestHeaders: details.requestHeaders });
  });
}

function openWindow(route, title) {
  const win = new BrowserWindow({ width: 1100, height: 800, title });
  win.loadURL(UCC + route);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function openHub() {
  const win = new BrowserWindow({ width: 720, height: 640, title: "treewriter" });
  win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

app.whenReady().then(async () => {
  attachTenantHeader();
  startSpring();
  await waitForUcc(40);
  openHub();
  openWindow("/library", "treewriter — Servers");
  openWindow("/lemma-library", "treewriter — Lemmas");
  openWindow("/lemma-implementation", "treewriter — Implement");
  openWindow("/block-recipes", "treewriter — Blocks");
  openWindow("/video-generation", "treewriter — Video animation");
  openWindow("/pixellight", "treewriter — PixelLight");
});

app.on("window-all-closed", () => {
  if (child) child.kill();
  app.quit();
});
