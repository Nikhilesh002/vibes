import VideoJS from '@/components/custom/VideoJS';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { axiosWithToken } from '@/lib/axiosWithToken';
import { formatDescription, timeElapsed } from '@/lib/formatFuncs';
import { IVideo } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

function Videos() {
  const [videos, setVideos] = useState<IVideo[]>([]);

  useEffect(() => {
    (async () => {
      const resp = await axiosWithToken.get(
        `${import.meta.env.VITE_API_URL}/video`,
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
    player.on('waiting', () => {
      videojs.log('player is waiting');
    });

    player.on('dispose', () => {
      videojs.log('player will dispose');
    });
  };

  return (
    <div className="p-1">
      <h1 className="text-xl font-semibold">Your Videos here: </h1>
      <div className="flex flex-wrap gap-3 p-3">
        {videos.map((video: IVideo) => (
          <Card onClick={() => {}} className="w-80" key={video._id}>
            <CardHeader>
              <CardTitle>{video.title}</CardTitle>
              <CardDescription>
                {formatDescription(video.description)}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* put video thumbnail */}
              <VideoJS
                options={{
                  ...videoJsOptions,
                  sources: video.transcodedVideoUrl,
                  poster: video.thumbnailUrl,
                }}
                onReady={handlePlayerReady}
              />
            </CardContent>

            <CardFooter className="flex flex-col">
              <p>{video.status}</p>
              <p className="font-light text-gray-300 text-sm">
                {timeElapsed(video.completedAt)}
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Videos;
