import Redis from "ioredis";
import { createDockerContainer } from "./spawnContainer";
import { IProcessJob } from "../types";
import { atomicDecrement, atomicIncrement } from "../utils/redis/atomicCounter";

export const MAX_CONCURRENT_JOBS_CNT = 2;

let redis: Redis;

export const videoJobConsumer = async () => {
  try {
    redis = new Redis(process.env.REDIS_URL ?? "REDIS_URL");
    console.log("Video job consumer started.......");
    while (true) {
      try {
        const newJob = await redis.blpop("VIDEO_TRANSCODING_PENDING", 0);
        let newJobData: IProcessJob;

        if (newJob) {
          console.log("Got new job: ", newJob);
          newJobData = JSON.parse(newJob[1]);
        } else {
          console.error("Failed to get job");
          throw new Error("Failed to get job");
        }

        // atomic increment of cnt
        const success = await atomicIncrement(
          redis,
          "VIDEO_TRANSCODING_JOBS_COUNT",
          MAX_CONCURRENT_JOBS_CNT
        );

        if (success) {
          // if incr done(cap avail to run new container)
          console.log("Counter incremented successfully!");
          await processJob(newJobData);
        } else {
          console.log("Waiting for running jobs to complete........");
          // incr failed(no cap avail)
          const doneJob = await redis.blpop("VIDEO_TRANSCODING_DONE", 0);
          if (!doneJob) {
            // running max no of containers
            console.log("No free instances");

            // wait 5 more mins
            await new Promise((resolve) => setTimeout(resolve, 10 * 60 * 1000)); // 5 mins
          }

          console.log(`Previous job: ${doneJob}`);

          const success = await atomicIncrement(
            redis,
            "VIDEO_TRANSCODING_JOBS_COUNT",
            MAX_CONCURRENT_JOBS_CNT
          );

          if (success) {
            // updated in db <- in container
            await processJob(newJobData);
          } else {
            // push back to queue
            await redis.rpush(
              "VIDEO_TRANSCODING_PENDING",
              JSON.stringify(newJobData)
            );

            // wait 5 more mins
            await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000)); // 5 mins
          }
        }
      } catch (error) {
        console.error("Error consuming job:", error);
        await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000)); // 5 mins
      }
    }
  } catch (error) {
    console.error("cant connect to redis");
  }
};

const processJob = async (jobData: IProcessJob) => {
  try {
    // found a newJob  -> spin a new docker container
    await createDockerContainer(jobData);
  } catch (error) {
    console.log("Failed to spawn new container: ", error);
    await atomicDecrement(redis, "VIDEO_TRANSCODING_JOBS_COUNT");
  }
};
