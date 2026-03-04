const axios = require("axios");

const WORKER = process.env.WORKER_BASE_URL;

const instance = axios.create({
  baseURL: WORKER,
  timeout: 10000,
});

exports.get = async (path) => {
  try {
    const res = await instance.get(path);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data || error.message);
  }
};

exports.post = async (path, data) => {
  try {
    const res = await instance.post(path, data);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data || error.message);
  }
};

exports.put = async (path, data) => {
  try {
    const res = await instance.put(path, data);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data || error.message);
  }
};

exports.delete = async (path) => {
  try {
    const res = await instance.delete(path);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data || error.message);
  }
};