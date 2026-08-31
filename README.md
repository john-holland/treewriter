# treewriter

System Drawer analogue for Minecraftuuuum. Electron shell that starts the sibling **minecraftuuuum** Spring UCC and opens every page (Servers, Lemmas, Implement, Blocks, Video animation, PixelLight) plus a Cave shell.

Continue + LM Studio Codestral is the default model path. Cursor is an optional fee platform only — see `.continue/config.json` and `optionalFeePlatforms.cursor` in settings.

Requests to UCC send `X-Tenant-ID: minecraftuuuum`.

```text
npm install
npm start
```

Expects UCC at `http://127.0.0.1:5050`. Set `MINECRAFTUUUUM_JAR` to a built Spring Boot jar, or `MINECRAFTUUUUM_DIR` (default `../minecraftuuuum` from this repo).
