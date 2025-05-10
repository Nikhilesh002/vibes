import dotenv from "dotenv";

dotenv.config();

export let envs = {
  jwtSecret: process.env.JWT_SECRET ?? "",
  nodeEnv: process.env.NODE_ENV ?? "production",
  port: process.env.PORT ?? 3000,

  mongodbUri: "",
  redisUrl: "",
  accessKeyId: "",
  secretAccessKey: "",
  awsRegion: "",
  awsEndpointUrl: "",

  azureBlobConnStr: process.env.AZURE_STORAGE_CONNECTION_STRING ?? "",
  destinationContainer: process.env.DEST_CONTAINER_NAME ?? "finalbucket",
  dockerPat: process.env.DOCKER_PAT,
};

if (envs.nodeEnv === "local") {
  envs.mongodbUri = process.env.LOCAL_MONGODB_URI ?? "";
  envs.redisUrl = process.env.LOCAL_REDIS_URL ?? "";

  envs.accessKeyId = process.env.LOCAL_AWS_ACCESS_KEY_ID ?? "";
  envs.secretAccessKey = process.env.LOCAL_AWS_SECRET_ACCESS_KEY ?? "";
  envs.awsRegion = process.env.LOCAL_AWS_REGION ?? "";
  envs.awsEndpointUrl = process.env.LOCAL_AWS_ENDPOINT_URL ?? "";
} else {
  envs.mongodbUri = process.env.MONGODB_URI ?? "";
  envs.redisUrl = process.env.REDIS_URL ?? "";

  envs.accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? "";
  envs.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? "";
  envs.awsRegion = process.env.AWS_REGION ?? "";
  envs.awsEndpointUrl = process.env.AWS_ENDPOINT_URL ?? "";
}
