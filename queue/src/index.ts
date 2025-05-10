import { videoJobConsumer } from "./pending/videoJobConsumer";
import dotenv from "dotenv";

async function main() {
  dotenv.config();
  try {
    console.log("My queuing system started......");
    await videoJobConsumer();
  } catch (error) {
    console.error("Error occured: ", error);
  }
}

main();
