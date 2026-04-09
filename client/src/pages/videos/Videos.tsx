import { axiosWithToken } from '@/lib/axiosWithToken';
import { formatViews, timeElapsed } from '@/lib/formatFuncs';
import { IVideo } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlayCircle } from 'lucide-react';

function VideoCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video w-full rounded-xl bg-muted" />
      <div className="mt-3 space-y-2 px-0.5">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    </div>
  );
}

function Videos() {
  const navigate = useNavigate();

  const {
    isPending,
    isError,
    data: videos,
    error,
  } = useQuery({
    queryKey: ['get-videos'],
    queryFn: async (): Promise<IVideo[]> => {
      const resp = await axiosWithToken.get(
        `${import.meta.env.VITE_API_URL}/video`,
      );

      return resp.data.videos;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const handleVideoClick = (video: IVideo) => {
    navigate(`/video/${video._id}`);
  };

  if (isPending) {
    return (
      <div className="py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <p className="text-lg font-medium text-destructive">Something went wrong</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <PlayCircle className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-lg font-medium">No videos yet</p>
        <p className="text-sm text-muted-foreground">Be the first to upload a video!</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video: IVideo) => (
          <article
            onClick={() => handleVideoClick(video)}
            className="group cursor-pointer"
            key={video._id}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {video.status === 'PENDING' && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                    Processing...
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="mt-3 px-0.5">
              <h3 className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-foreground">
                {video.title}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{formatViews(video.views)} views</span>
                <span>&#183;</span>
                <span>
                  {video.status === 'PENDING'
                    ? 'Processing...'
                    : timeElapsed(video.completedAt)}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default Videos;
