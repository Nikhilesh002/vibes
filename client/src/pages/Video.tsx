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
        <div className="p-0.5">
          <div className="w-full border-2 border-gray-700 rounded-lg overflow-hidden shadow-2xl ">
            <VideoJS
              options={{
                ...videoJsOptions,
                sources: video.transcodedVideoUrl,
                poster: video.thumbnailUrl,
              }}
              onReady={handlePlayerReady}
            />
          </div>

          <div className="border bg-gray-800 border-gray-700 rounded-md p-4 mt-4 shadow-lg">
            <h1 className="text-2xl font-bold mb-1">{video.title}</h1>

            <div className="text-gray-400 flex space-x-3 font-medium text-sm">
              <div className="">
                <span className="">{5} views</span>
              </div>

              <div className="">
                <p className="">{new Date(video.completedAt).toDateString()}</p>
              </div>

              <div className="">
                {video.tags && video.tags.length > 0 ? (
                  video.tags.map((tag, index) => (
                    <span key={index} className="mr-1 text-blue-500">
                      #{tag}
                    </span>
                  ))
                ) : (
                  <></>
                )}
              </div>
            </div>

            <p className="mb-4">{video.description}</p>
          </div>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

export default Video;
