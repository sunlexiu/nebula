export {};

declare global {
  interface Window {
    treeConfigStore?: { getState: () => any };
  }
}