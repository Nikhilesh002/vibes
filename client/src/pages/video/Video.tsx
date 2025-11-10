import { useCallback, useRef } from 'react';
import VideoJS from '@/components/custom/VideoJS';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { IVideoData } from '@/lib/types';
import { useParams } from 'react-router-dom';
import { axiosWithToken } from '@/lib/axiosWithToken';
import VideoInfo from './_components/VideoInfo';
import Comments from './_components/Comments';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

function Video() {
  const { videoId } = useParams();
  const queryClient = useQueryClient();
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

  const handleLike = useCallback(async (): Promise<IVideoData | null> => {
    if (!videoData) return null;
    // API call for like
    try {
      await axiosWithToken.put(
        `${import.meta.env.VITE_API_URL}/video/${videoData.video._id}/like`,
      );

      return videoData; // Actual updated data will be handled via cache update
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Error liking video');
      return null;
    }
  }, [videoData]);

  const handleDislike = useCallback(async (): Promise<IVideoData | null> => {
    if (!videoData) return null;
    // API call for dislike
    try {
      await axiosWithToken.put(
        `${import.meta.env.VITE_API_URL}/video/${videoData.video._id}/dislike`,
      );

      return videoData;
    } catch (error) {
      console.error('Dislike error:', error);
      toast.error('Error disliking video');
      return null;
    }
  }, [videoData]);

  const mutation = useMutation({
    mutationFn: async (
      buttonType: 'LIKE' | 'DISLIKE',
    ): Promise<IVideoData | null> => {
      return buttonType === 'LIKE' ? await handleLike() : await handleDislike();
    },
    onMutate: async (buttonType) => {
      if (!videoData) return {};
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: ['video-data', videoId ?? ''],
      });

      // Snapshot the previous value
      const previousVideoData = queryClient.getQueryData<IVideoData>([
        'video-data',
        videoId,
      ]);

      // Compute the optimistic update based on the button clicked
      const updatedVideoData = { ...videoData };
      if (buttonType === 'LIKE') {
        if (videoData.likeStatus === 'DISLIKED') {
          updatedVideoData.likeStatus = 'LIKED';
          updatedVideoData.video.likes += 1;
          updatedVideoData.video.dislikes -= 1;
        } else if (videoData.likeStatus === 'NONE') {
          updatedVideoData.likeStatus = 'LIKED';
          updatedVideoData.video.likes += 1;
        } else if (videoData.likeStatus === 'LIKED') {
          updatedVideoData.likeStatus = 'NONE';
          updatedVideoData.video.likes -= 1;
        }
      } else if (buttonType === 'DISLIKE') {
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
      }

      // Optimistically update the cache
      queryClient.setQueryData(['video-data', videoId], updatedVideoData);

      return { previousVideoData };
    },
    onError: (err, buttonType, context: any) => {
      // Roll back the changes if mutation fails
      if (context.previousVideoData) {
        queryClient.setQueryData(
          ['video-data', videoId],
          context.previousVideoData,
        );
      }
      console.error(err);
      toast.error(
        `Error ${buttonType === 'LIKE' ? 'liking' : 'disliking'} video`,
      );
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data sync
      queryClient.invalidateQueries({
        queryKey: ['video-data', videoId ?? ''],
      });
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
          <div className="px-56 border-2 border-gray-700 rounded-lg shadow-2xl ">
            <VideoJS
              options={{
                ...videoJsOptions,
                sources: videoData.video.transcodedVideoUrl,
                poster: videoData.video.thumbnailUrl,
              }}
              onReady={handlePlayerReady}
            />
          </div>

          <div className="flex gap-8 px-5">
            <div className="w-2/3">
              <VideoInfo videoData={videoData} mutation={mutation} />
              <Comments videoId={videoData.video._id} />
            </div>
            <div className="w-1/3 p-2 mt-4 border rounded-lg">
              Recommendations comming soon...
            </div>
          </div>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

export default Video;
