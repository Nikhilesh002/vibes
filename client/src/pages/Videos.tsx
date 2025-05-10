import VideoJS from "@/components/custom/VideoJS";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { axiosWithToken } from "@/lib/axiosWithToken";
import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

function Videos() {
  const [videos, setVideos] = useState<any>([]);

  useEffect(() => {
    (async () => {
      const resp = await axiosWithToken.get(
        `${import.meta.env.VITE_API_URL}/video`
      );
      console.log(resp.data.user);
      setVideos(resp.data.user.videoJobIds);
    })();
  }, []);

  const playerRef = useRef(null);

  const videoJsOptions = {
    autoplay: false,
    controls: true,
    responsive: true,
    fluid: true,
  };

  const handlePlayerReady = (player: any) => {
    playerRef.current = player;

    // You can handle player events here, for example:
    player.on("waiting", () => {
      videojs.log("player is waiting");
    });

    player.on("dispose", () => {
      videojs.log("player will dispose");
    });
  };

  return (
    <div className="p-1">
      <h1 className="text-xl font-semibold">Your Videos here: </h1>
      <div className="flex flex-wrap gap-3 p-3">
        {videos.map((video: any) => (
          <Card onClick={() => {}} className="w-80" key={video}>
            <CardHeader>
              <CardTitle>Video</CardTitle>
              <CardDescription>Video Description</CardDescription>
            </CardHeader>

            <CardContent>
              <p>{video.blobName}</p>
              <p>{video.completedAt}</p>
              {/* put video thumbnail */}
              <VideoJS
                options={{
                  ...videoJsOptions,
                  sources:
                    video.transcodedVideoUrl === ""
                      ? video.transcodedVideoUrls[0]
                      : video.transcodedVideoUrl,
                }}
                onReady={handlePlayerReady}
              />
            </CardContent>

            <CardFooter>
              <p>{video.status}</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Videos;
