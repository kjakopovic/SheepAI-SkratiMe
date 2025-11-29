export {};

declare global {
  interface Paths {
    DASHBOARD: string;

    LOGIN: string;

    API: Record<string, string>;

    build: (path: string, ...params: string[]) => string;
  }
}
