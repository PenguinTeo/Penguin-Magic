declare global {
  interface Window {
    electron: {
      getAppVersion: () => Promise<string>;
      getAppPath: () => Promise<string>;
    };
  }
}

export {};
