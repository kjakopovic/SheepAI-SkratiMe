import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

// Define available microservices
export type ServiceName = 'auth' | 'news';

// Map services to their environment variables
const BASE_URLS: Record<ServiceName, string> = {
  auth: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3001',
  news: import.meta.env.VITE_NEWS_API_URL || 'http://localhost:3002',
};

// Create a generic API function
const apiRequest = async <T>(
  service: ServiceName,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  const baseURL = BASE_URLS[service];

  if (!baseURL) {
    throw new Error(`Base URL for service "${service}" is not defined.`);
  }

  // Create axios instance (you can add interceptors here later if needed)
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth token if it exists
  const token = localStorage.getItem('accessToken');
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response: AxiosResponse<T> = await instance.request({
      url,
      method,
      data,
      ...config,
    });
    return response.data;
  } catch (error: any) {
    // Standardize error handling or rethrow
    throw error.response?.data || error;
  }
};

// Export convenience methods
export const api = {
  get: <T>(service: ServiceName, url: string, config?: AxiosRequestConfig) => 
    apiRequest<T>(service, 'GET', url, undefined, config),

  post: <T>(service: ServiceName, url: string, data: unknown, config?: AxiosRequestConfig) => 
    apiRequest<T>(service, 'POST', url, data, config),

  put: <T>(service: ServiceName, url: string, data: unknown, config?: AxiosRequestConfig) => 
    apiRequest<T>(service, 'PUT', url, data, config),

  delete: <T>(service: ServiceName, url: string, config?: AxiosRequestConfig) => 
    apiRequest<T>(service, 'DELETE', url, undefined, config),
};
