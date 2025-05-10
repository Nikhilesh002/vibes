import axios from "axios";

export const axiosWithToken = axios.create({
  withCredentials: true,
});
