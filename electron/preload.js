const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("TREEWRITER", {
  desktop: true,
  getSettings: () => ipcRenderer.invoke("tw-settings-get"),
  saveSettings: (patch) => ipcRenderer.invoke("tw-settings-save", patch),
  installWebgl: () => ipcRenderer.invoke("tw-install-webgl"),
});
