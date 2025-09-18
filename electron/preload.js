const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // future APIs can be exposed here
})
