import { axiosWithToken } from '@/lib/axiosWithToken';
import { formatViews, timeElapsed } from '@/lib/formatFuncs';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, PlayCircle } from 'lucide-react';
import type { IVideo } from '@/lib/types';
import { useEffect, useRef } from 'react';

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

interface VideosPage {
  videos: IVideo[];
  nextCursor: string | null;
}

function Videos() {
  const navigate = useNavigate();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isPending,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<VideosPage>({
    queryKey: ['get-videos'],
    queryFn: async ({ pageParam }): Promise<VideosPage> => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam as string);
      params.set('limit', '20');

      const resp = await axiosWithToken.get(
        `${import.meta.env.VITE_API_URL}/video?${params.toString()}`,
      );
      return { videos: resp.data.videos, nextCursor: resp.data.nextCursor };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 2,
  });

  // IntersectionObserver — triggers fetchNextPage when sentinel enters viewport
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const videos = data?.pages.flatMap((page) => page.videos) ?? [];

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

  if (videos.length === 0) {
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
            onClick={() => navigate(`/video/${video._id}`)}
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

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {isFetchingNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

export default Videos;
