import { useCallback, useRef } from 'react';
import VideoJS from '@/components/custom/VideoJS';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import type { IVideoData } from '@/lib/types';
import { useParams } from 'react-router-dom';
import { axiosWithToken } from '@/lib/axiosWithToken';
import VideoInfo from './_components/VideoInfo';
import Comments from './_components/Comments';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

function VideoSkeleton() {
  return (
    <div className="animate-pulse py-6">
      <div className="aspect-video w-full rounded-xl bg-muted" />
      <div className="mt-4 space-y-3">
        <div className="h-6 w-2/3 rounded bg-muted" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

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
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        No video ID provided
      </div>
    );
  }

  if (isPending) {
    return <VideoSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
        <p className="text-lg font-medium text-destructive">Failed to load video</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
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
    <div className="py-6">
      {videoData?.video ? (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Player */}
            <div className="overflow-hidden rounded-xl bg-black">
              <VideoJS
                options={{
                  ...videoJsOptions,
                  sources: videoData.video.transcodedVideoUrl,
                  poster: videoData.video.thumbnailUrl,
                }}
                onReady={handlePlayerReady}
                sasToken={videoData.streamingSasToken}
              />
            </div>

            {/* Video info */}
            <VideoInfo videoData={videoData} mutation={mutation} />

            {/* Comments */}
            <Comments videoId={videoData.video._id} />
          </div>

          {/* Sidebar — recommendations */}
          <aside className="w-full shrink-0 lg:w-80 xl:w-96">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground">Recommendations</h3>
              <p className="mt-2 text-sm text-muted-foreground/60">Coming soon...</p>
            </div>
          </aside>
        </div>
      ) : (
        <VideoSkeleton />
      )}
    </div>
  );
}

export default Video;
