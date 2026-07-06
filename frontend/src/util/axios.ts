/**
 * Wrap over axios to provide bare-minimum functionality
 * Allows us to add/manage interceptors and handlers on a global level if needed
 */
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";

// Globals
import * as globals from '@/util/globals'

export type CustomAxiosConfig<T> = Omit<
  AxiosRequestConfig<T>,
  "url" | "method"
> & {
  url: string;
  payload?: T;
};

export type AxiosObject = {
  get<REQ, RES>(
    config: CustomAxiosConfig<REQ>
  ): Promise<AxiosResponse<RES, REQ>>;
  post<REQ, RES>(
    config: CustomAxiosConfig<REQ>
  ): Promise<AxiosResponse<RES, REQ>>;
  put<REQ, RES>(
    config: CustomAxiosConfig<REQ>
  ): Promise<AxiosResponse<RES, REQ>>;
  delete<REQ, RES>(
    config: CustomAxiosConfig<REQ>
  ): Promise<AxiosResponse<RES, REQ>>;
  patch<REQ, RES>(
    config: CustomAxiosConfig<REQ>
  ): Promise<AxiosResponse<RES, REQ>>;
};

export const getClient = (
  baseURL: string,
  timeout: number = 180000
): AxiosObject => {
  const client: AxiosInstance = axios.create({
    baseURL,
    timeout,
    headers: {
      wm_platform: "dashboard",
      wm_lang: "en",
      wm_web_version: import.meta.env.VITE_APP_WEB_BUILD_VERSION,
    },
  });

  const axiosClient: AxiosObject = {
    get: (config) => {
      const { url, payload, ...rest } = config;
      const wmViewAsId = globals.get(globals.keys.loggedInSellerId);
      if (wmViewAsId) {
        client.defaults.headers.wm_viewas = wmViewAsId;
      } else {
        delete client.defaults.headers["wm_viewas"];
      }

      return client.request({
        url: url,
        method: "GET",
        params: payload,
        responseType: "json",
        ...rest,
      });
    },
    post: (config) => {
      const { url, payload, ...rest } = config;
      const wmViewAsId = globals.get(globals.keys.loggedInSellerId);
      if (wmViewAsId) {
        client.defaults.headers.wm_viewas = wmViewAsId;
      } else {
        delete client.defaults.headers["wm_viewas"];
      }
      return client.request({
        url: url,
        method: "POST",
        data: payload,
        responseType: "json",
        ...rest,
      });
    },
    put: (config) => {
      const { url, payload, ...rest } = config;
      const wmViewAsId = globals.get(globals.keys.loggedInSellerId);
      if (wmViewAsId) {
        client.defaults.headers.wm_viewas = wmViewAsId;
      } else {
        delete client.defaults.headers["wm_viewas"];
      }
      return client.request({
        url: url,
        method: "PUT",
        data: payload,
        responseType: "json",
        ...rest,
      });
    },
    patch: (config) => {
      const { url, payload, ...rest } = config;
      const wmViewAsId = globals.get(globals.keys.loggedInSellerId);
      if (wmViewAsId) {
        client.defaults.headers.wm_viewas = wmViewAsId;
      } else {
        delete client.defaults.headers["wm_viewas"];
      }
      return client.request({
        url: url,
        method: "PATCH",
        data: payload,
        responseType: "json",
        ...rest,
      });
    },
    delete: (config) => {
      const { url, payload, ...rest } = config;
      const wmViewAsId = globals.get(globals.keys.loggedInSellerId);
      if (wmViewAsId) {
        client.defaults.headers.wm_viewas = wmViewAsId;
      } else {
        delete client.defaults.headers["wm_viewas"];
      }
      return client.request({
        url: url,
        method: "DELETE",
        data: payload,
        responseType: "json",
        ...rest,
      });
    },
  };
  return axiosClient;
};

//The base path will be dynamic in future for multiple micro services
export const client = getClient(import.meta.env.VITE_APP_API_BASE_PATH + "");

export const clientUploadingLarge = getClient(
  import.meta.env.VITE_APP_API_BASE_PATH + "",
  180000
);
