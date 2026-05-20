import axiosInstance from './axiosInstance';

export async function callApiTest(endpoint, method = 'GET', body = null) {
  try {
    const config = { method, url: endpoint };
    if (body && method !== 'GET') config.data = body;
    const res = await axiosInstance(config);
    return { success: true, status: res.status, data: res.data };
  } catch (err) {
    return {
      success: false,
      status: err.response?.status ?? 0,
      data: err.response?.data ?? { message: err.message },
    };
  }
}
