export {};

declare global {
  interface KeyPair<T> {
    [key: string]: T;
  }
}
