import { useRef } from 'react';
import VideoJS from '@/components/custom/VideoJS';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { IVideoData } from '@/lib/types';
import { useParams } from 'react-router-dom';
import { axiosWithToken } from '@/lib/axiosWithToken';
import VideoInfo from './_components/VideoInfo';
import Comments from './_components/Comments';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

function Video() {
  const { videoId } = useParams();

  const playerRef = useRef(null);

  const {
    isError,
    error,
    isPending,
    data: videoData,
  } = useQuery({
    queryKey: ['video-data', videoId],
    queryFn: async (): Promise<IVideoData> => {
      const resp = await axiosWithToken.get(
        `${import.meta.env.VITE_API_URL}/video/${videoId}`,
      );

      return resp.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const handleLike = async () => {
    if (!videoData) return;

    const previousVideoData = { ...videoData };
    const updatedVideoData = { ...videoData };

    if (videoData.likeStatus === 'DISLIKED') {
      updatedVideoData.likeStatus = 'LIKED';
      updatedVideoData.video.likes += 1;
      updatedVideoData.video.dislikes -= 1;
    } else if (videoData.likeStatus === 'NONE') {
      updatedVideoData.likeStatus = 'LIKED';
      updatedVideoData.video.likes += 1;
    } else if (videoData.likeStatus === 'LIKED') {
      updatedVideoData.video.likes -= 1;
      updatedVideoData.likeStatus = 'NONE';
    }

    // make API call
    try {
      const resp = await axiosWithToken.put(
        `${import.meta.env.VITE_API_URL}/video/${videoData.video._id}/like`,
      );
      console.log({ resp });

      return updatedVideoData;
    } catch (error) {
      console.error('Error liking video', error);
      // revert UI update on error
      toast.error('Error liking video');
      return previousVideoData;
    }
  };

  const handleDislike = async () => {
    if (!videoData) return;

    const previousVideoData = { ...videoData };
    const updatedVideoData = { ...videoData };

    if (videoData.likeStatus === 'LIKED') {
      updatedVideoData.likeStatus = 'DISLIKED';
      updatedVideoData.video.likes -= 1;
      updatedVideoData.video.dislikes += 1;
    } else if (videoData.likeStatus === 'NONE') {
      updatedVideoData.likeStatus = 'DISLIKED';
      updatedVideoData.video.dislikes += 1;
    } else if (videoData.likeStatus === 'DISLIKED') {
      updatedVideoData.likeStatus = 'NONE';
      updatedVideoData.video.dislikes -= 1;
    }

    // make API call
    try {
      const resp = await axiosWithToken.put(
        `${import.meta.env.VITE_API_URL}/video/${videoData.video._id}/dislike`,
      );
      console.log({ resp });

      return updatedVideoData;
    } catch (error) {
      console.error('Error disliking video', error);
      // revert UI update on error
      toast.error('Error disliking video');

      return previousVideoData;
    }
  };

  const mutation = useMutation({
    mutationFn: async (buttonType: 'LIKE' | 'DISLIKE') => {
      if (buttonType === 'LIKE') {
        return await handleLike();
      } else if (buttonType === 'DISLIKE') {
        return await handleDislike();
      }
      return videoData;
    },
  });

  if (!videoId) {
    return <div>No videoId provided</div>;
  }

  if (isPending) {
    return <span>Loading...</span>;
  }

  if (isError) {
    return <span>Error: {error.message}</span>;
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
            <VideoInfo videoData={videoData} mutation={mutation} />

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
