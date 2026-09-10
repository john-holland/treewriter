# treewriter

System Drawer analogue for Minecraftuuuum. Electron shell that starts the sibling **minecraftuuuum** Spring UCC and opens every page (Home, Servers, Lemmas, Implement, Blocks, Video animation, PixelLight) plus a Cave shell. UCC requires login. Web users download this pack (`npm run pack` → `dist/treewriter-*.zip`, no Unity binaries) from `/api/treewriter/download`. Desktop sets `window.TREEWRITER` and can install a user-owned Unity WebGL player into the iframe slot.

Continue + LM Studio Codestral is the default model path. Cursor is an optional fee platform only — see `.continue/config.json` and `optionalFeePlatforms.cursor` in settings.

Requests to UCC send `X-Tenant-ID: minecraftuuuum`.

```text
npm install
npm run build
npm run pack
npm start
```

`npm run build` asks UCC (`/api/treewriter/build`) whether any lemma is flagged **causes warnings** or **causes errors**. Warnings print; errors fail the build. Toggle those on the UCC lemma modal (warnings) or `/lemma-builds-admin` (errors).

Expects UCC at `http://127.0.0.1:5050`. Set `MINECRAFTUUUUM_JAR` to a built Spring Boot jar, or `MINECRAFTUUUUM_DIR` (default `../minecraftuuuum` from this repo).
