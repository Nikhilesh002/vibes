import { useEffect, useRef, useState } from 'react';
import VideoJS from '@/components/custom/VideoJS';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { IVideoData } from '@/lib/types';
import { useParams } from 'react-router-dom';
import { axiosWithToken } from '@/lib/axiosWithToken';
import VideoInfo from './_components/VideoInfo';
import Comments from './_components/Comments';

function Video() {
  const { videoId } = useParams();

  const [videoData, setVideoData] = useState<IVideoData | null>(null);

  useEffect(() => {
    (async () => {
      const resp = await axiosWithToken.get(
        `${import.meta.env.VITE_API_URL}/video/${videoId}`,
      );
      setVideoData({
        video: resp.data.video,
        likeStatus: resp.data.likeStatus,
      });
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
      {videoData?.video ? (
        <div className="p-0.5">
          <div className="w-full border-2 border-gray-700 rounded-lg overflow-hidden shadow-2xl ">
            <VideoJS
              options={{
                ...videoJsOptions,
                sources: videoData.video.transcodedVideoUrl,
                poster: videoData.video.thumbnailUrl,
              }}
              onReady={handlePlayerReady}
            />
          </div>

          <div className="px-4 space-y-4">
            <VideoInfo videoData={videoData} setVideoData={setVideoData} />

            <Comments />
          </div>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

export default Video;
