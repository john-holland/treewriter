#!/usr/bin/env node
/**
 * Pack Treewriter for UCC download. No Unity binaries.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const dist = path.join(root, "dist");
const stage = path.join(dist, "treewriter-pack");
fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });

function copy(src, dest) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      if (name === "node_modules" || name === "dist") continue;
      copy(path.join(src, name), path.join(dest, name));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

copy(path.join(root, "electron"), path.join(stage, "electron"));
copy(path.join(root, "renderer"), path.join(stage, "renderer"));
copy(path.join(root, "package.json"), path.join(stage, "package.json"));
if (fs.existsSync(path.join(root, "README.md"))) {
  copy(path.join(root, "README.md"), path.join(stage, "README.md"));
}

const zipName = "treewriter-" + pkg.version + ".zip";
const zipPath = path.join(dist, zipName);
fs.rmSync(zipPath, { force: true });
const tar = spawnSync("tar", ["-a", "-cf", zipPath, "-C", dist, "treewriter-pack"], { stdio: "inherit" });
if (tar.status !== 0) {
  console.error("pack failed: tar exit " + tar.status);
  process.exit(tar.status || 1);
}
console.log("wrote " + zipPath);
