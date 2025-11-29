export {};

declare global {
  interface Paths {
    DASHBOARD: string;
    REGISTER: string;
    LOGIN: string;
    SIGN_UP: string;
    ONBOARDING: string;

    API: Record<string, string>;

    build: (path: string, ...params: string[]) => string;
  }
}
