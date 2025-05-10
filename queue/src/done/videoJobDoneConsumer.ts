// import Redis from "ioredis";
// import { containerClient } from "../azure/containerClient";
// import { logger } from "../utils/logger";
// import { atomicDecrement } from "../utils/redis/atomicCounter";
// import { envs } from "../configs/envs";

// const redis = new Redis(envs.redisUrl);

// // az bills even if container grp is idle, u need to delete it
// // watch for exit of container
// export const videoJobDoneConsumer = async () => {
//   while (true) {
//     try {
//       const resp = await redis.blpop("VIDEO_TRANSCODING_DONE");
//       if (!resp) continue;

//       const jobDoneData = JSON.parse(resp[1]);

//       // delete container grp
//       await containerClient.containerGroups.beginDeleteAndWait(
//         jobDoneData.resourceGroupName,
//         jobDoneData.containerGroupName
//       );

//       // decr running container cnt
//       const decrResp = await atomicDecrement(
//         redis,
//         "VIDEO_TRANSCODING_JOBS_COUNT"
//       );
//       console.log("Count decr resp: ", decrResp);

//       // exit
//       // update in db?? needed?
//       console.log("Container deleted. job id: ", jobDoneData.videoJobId);
//     } catch (error) {
//       console.error("Failed to delete container: ", error);
//     }
//   }
// };
