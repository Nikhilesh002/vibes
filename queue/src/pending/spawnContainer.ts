import { IProcessJob } from "../types";
import { DefaultAzureCredential } from "@azure/identity";
import { ContainerInstanceManagementClient } from "@azure/arm-containerinstance";

// spawn-> nikhilesh002/vidmux-transcoder:latest
export async function createDockerContainer(jobData: IProcessJob) {
  const containerGroupName = `vidmux-transcoder-${Date.now()}`;
  const imageName = "docker.io/nikhilesh002/vidmux-transcoder:latest";

  const containerGroup = {
    confidentialComputeProperties: {
      ccePolicy:
        "eyJhbGxvd19hbGwiOiB0cnVlLCAiY29udGFpbmVycyI6IHsibGVuZ3RoIjogMCwgImVsZW1lbnRzIjogbnVsbH19",
    },
    containers: [
      {
        name: "vidmux-transcoder",
        image: imageName,
        command: [],
        environmentVariables: [
          {
            name: "AZURE_TEMP_STORAGE_ACC_NAME",
            value: process.env.AZURE_TEMP_STORAGE_ACC_NAME ?? "",
          },
          {
            name: "AZURE_PERMA_STORAGE_ACC_NAME",
            value: process.env.AZURE_PERMA_STORAGE_ACC_NAME ?? "",
          },
          {
            name: "SOURCE_VIDEO_URL",
            value: jobData.videoUrl,
          },
          {
            name: "DEST_CONTAINER_NAME",
            value: process.env.DEST_CONTAINER_NAME,
          },
          {
            name: "MONGODB_URI",
            value: process.env.MONGODB_URI,
          },
          {
            name: "VIDEO_JOB_ID",
            value: String(jobData.videoJobId),
          },
          {
            name: "AZURE_CLIENT_ID",
            value: process.env.AZURE_CLIENT_ID ?? "",
          },
          {
            name: "AZURE_TENANT_ID",
            value: process.env.AZURE_TENANT_ID ?? "",
          },
          {
            name: "AZURE_CLIENT_SECRET",
            value: process.env.AZURE_CLIENT_SECRET ?? "",
          },
          {
            name: "CONTAINERINSTANCE_SUBSCRIPTION_ID",
            value: process.env.CONTAINERINSTANCE_SUBSCRIPTION_ID ?? "",
          },
          {
            name: "CONTAINERINSTANCE_RESOURCE_GROUP",
            value: process.env.CONTAINERINSTANCE_RESOURCE_GROUP ?? "",
          },
          {
            name: "CONTAINERINSTANCE_CONTAINER_GROUP_NAME",
            value: containerGroupName,
          },
          {
            name: "REDIS_URI",
            value: process.env.REDIS_URL ?? "REDIS_URL",
          },
        ],
        ports: [{ port: 8000 }],
        resources: { requests: { cpu: 1, memoryInGB: 1 } },
        securityContext: {
          // capabilities: { add: ["CAP_NET_ADMIN"] },
          privileged: false,
        },
      },
    ],
    imageRegistryCredentials: [
      {
        server: "docker.io",
        username: "nikhilesh002",
        password: process.env.DOCKER_PAT ?? "DOCKER_PAT",
      },
    ],
    ipAddress: { type: "Public", ports: [{ port: 8000, protocol: "TCP" }] },
    location: "west us",
    osType: "Linux",
    restartPolicy: "Never",
    sku: "Confidential",
  };

  try {
    const credential = new DefaultAzureCredential();
    console.log({ credential });
    const containerClient = new ContainerInstanceManagementClient(
      credential,
      process.env.CONTAINERINSTANCE_SUBSCRIPTION_ID ?? "subId"
    );
    console.log({ containerClient });

    const result =
      await containerClient.containerGroups.beginCreateOrUpdateAndWait(
        process.env.CONTAINERINSTANCE_RESOURCE_GROUP ?? "",
        containerGroupName,
        containerGroup
      );

    console.log("Created container group: ", result);
  } catch (error) {
    console.error("Failed to start a new container: ", error);
  }
}
