import Valkey from "ioredis";
// import { envs } from "../../configs";

export const makeRedisClient = () => {
  return new Valkey();
};
