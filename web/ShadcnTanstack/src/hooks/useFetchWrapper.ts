/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import ky, { KyResponse, Options } from 'ky';
import { useNavigate } from 'react-router-dom';

import { useUserContext } from '@/context/UserContext';

import config from '@/config';

import { paths } from '@/common/constants';
import { ServerError } from '@/common/errors/ServerError';

const useFetchWrapper = () => {
  const navigate = useNavigate();
  const userContext = useUserContext();

  const getAccessToken = () => localStorage.getItem('accessToken') || '';

  const getBearerToken = () => `Bearer ${getAccessToken()}`;

  const forceLogout = () => {
    userContext?.setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const authHeader = () => {
    const isLoggedIn = !!getAccessToken();
    return isLoggedIn ? { Authorization: getBearerToken() } : {};
  };

  const handleResponse = (response: KyResponse) => {
    return response.text().then((text: string) => {
      let data;

      try {
        data = text ? JSON.parse(text) : {};
      } catch (error) {
        data = text;
      }

      if (!response.ok) {
        data.httpErrorCode = response.status;
        data.httpErrorType = response.statusText;

        return Promise.reject(new ServerError(response.statusText, response.status));
      }

      return data;
    });
  };

  const request =
    (method: string) =>
    (url: string, options: Options = {}) => {
      const extendedOptions = {
        ...options,
        method,
        prefixUrl: options.prefixUrl || config.apiUrl,
        headers: { ...options.headers, ...authHeader() },
        throwHttpErrors: false,
      };
      return ky(url, extendedOptions)
        .then(handleResponse)
        .catch(async (error: ServerError) => {
          if ([401, 403].includes(error.statusCode)) {
            forceLogout();
            await navigate(paths.LOGIN);
          }

          throw new ServerError(error.message);
        });
    };

  return {
    get: request('get'),
    post: request('post'),
    put: request('put'),
    patch: request('patch'),
    delete: request('delete'),
  };
};

export default useFetchWrapper;
