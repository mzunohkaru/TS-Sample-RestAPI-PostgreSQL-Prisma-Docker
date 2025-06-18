import axios, { AxiosRequestConfig } from "axios";

export const instance = axios.create({
  baseURL: "https://api.example.com",
});

export const makeRequest = async <T>(
  config: AxiosRequestConfig,
): Promise<T> => {
  try {
    const response = await axios({
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...config,
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw new Error(`${error}`);
  }
};

export const getFetcher = <T, U>(
  url: string,
  params: U,
  config: AxiosRequestConfig,
): Promise<T> => {
  return makeRequest<T>({ ...{ method: "GET", url, params, ...config } });
};

export const postFetcher = <T, U>(
  url: string,
  data: U,
  config: AxiosRequestConfig,
): Promise<T> => {
  return makeRequest<T>({ ...{ method: "POST", url, data, ...config } });
};

export const putFetcher = <T, U>(
  url: string,
  data: U,
  config: AxiosRequestConfig,
): Promise<T> => {
  return makeRequest<T>({ ...{ method: "PUT", url, data, ...config } });
};

export const deleteFetcher = <T, U>(
  url: string,
  data: U,
  config: AxiosRequestConfig,
): Promise<T> => {
  return makeRequest<T>({ ...{ method: "DELETE", url, data, ...config } });
};
