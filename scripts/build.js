#!/usr/bin/env node
/**
 * Treewriter build: consult UCC lemma flags.
 * Warnings print to stderr; any "lemma causes errors" fails the build.
 */
const http = require("http");
const https = require("https");

const UCC = (process.env.UCC_URL || "http://127.0.0.1:5050").replace(/\/$/, "");

function get(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { headers: { "X-Tenant-ID": process.env.MINECRAFTUUUUM_TENANT || "minecraftuuuum" } }, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        if (res.statusCode >= 400) {
          reject(new Error("UCC " + res.statusCode + " " + raw.slice(0, 200)));
          return;
        }
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error("invalid build JSON: " + e.message));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("UCC timeout — start Spring on " + UCC));
    });
  });
}

(async () => {
  const report = await get(UCC + "/api/treewriter/build");
  const warnings = report.warnings || [];
  const errors = report.errors || [];
  warnings.forEach((w) => {
    console.warn("warning: " + (w.message || w.term));
  });
  errors.forEach((e) => {
    console.error("error: " + (e.message || e.term));
  });
  if (errors.length) {
    console.error("treewriter build failed: " + errors.length + " lemma(s) cause errors");
    process.exit(1);
  }
  console.log("treewriter build ok" + (warnings.length ? " (" + warnings.length + " warning(s))" : ""));
})().catch((err) => {
  console.error("treewriter build failed: " + err.message);
  process.exit(1);
});
