import { useEffect, useRef, useState } from 'react';
import VideoJS from '@/components/custom/VideoJS';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { IVideo } from '@/lib/types';
import { useParams } from 'react-router-dom';
import { axiosWithToken } from '@/lib/axiosWithToken';

function Video() {
  const { videoId } = useParams();

  const [video, setVideo] = useState<IVideo | null>(null);

  useEffect(() => {
    (async () => {
      const resp = await axiosWithToken.get(
        `${import.meta.env.VITE_API_URL}/video/${videoId}`,
      );
      setVideo(resp.data);
    })();
  }, [videoId]);

  const playerRef = useRef(null);

  if (!videoId) {
    return <div>No videoId provided</div>;
  }

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
    <div>
      {video ? (
        <VideoJS
          options={{
            ...videoJsOptions,
            sources: video.transcodedVideoUrl,
            poster: video.thumbnailUrl,
          }}
          onReady={handlePlayerReady}
        />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

export default Video;
