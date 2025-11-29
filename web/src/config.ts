/// <reference types="vite/client" />

interface Config {
  apiUrl: string;
}

export default {
  apiUrl: import.meta.env.VITE_APP_API_URL as string,
} satisfies Config;
