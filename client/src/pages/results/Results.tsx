import { axiosWithToken } from '@/lib/axiosWithToken';
import { formatViews, timeElapsed } from '@/lib/formatFuncs';
import type { IVideo } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

function ResultSkeleton() {
  return (
    <div className="flex animate-pulse gap-4">
      <div className="aspect-video w-64 shrink-0 rounded-lg bg-muted" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-3 w-1/3 rounded bg-muted" />
      </div>
    </div>
  );
}

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get('query') || '';

  const {
    isPending,
    isError,
    data: videos,
    error,
  } = useQuery({
    queryKey: ['search-videos', query],
    queryFn: async (): Promise<IVideo[]> => {
      const resp = await axiosWithToken.get(
        `${import.meta.env.VITE_API_URL}/video/search?q=${encodeURIComponent(query)}`,
      );
      return resp.data.videos;
    },
    enabled: !!query,
    staleTime: 1000 * 60 * 2,
  });

  if (!query) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Search className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Enter a search term to find videos</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="py-8">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">
            Results for <span className="text-muted-foreground">"{query}"</span>
          </h1>
        </div>
        <div className="mt-6 space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <ResultSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
        <p className="text-lg font-medium text-destructive">Search failed</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">
          Results for <span className="text-muted-foreground">"{query}"</span>
        </h1>
      </div>

      {!videos || videos.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <Search className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No videos found for "{query}"
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {videos.map((video: IVideo) => (
            <article
              key={video._id}
              onClick={() => navigate(`/video/${video._id}`)}
              className="group flex cursor-pointer gap-4 rounded-xl p-2 transition-colors hover:bg-muted/50"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video w-64 shrink-0 overflow-hidden rounded-lg bg-muted">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {video.status === 'PENDING' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <span className="text-xs font-medium text-muted-foreground">Processing...</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 py-1">
                <h3 className="line-clamp-2 text-base font-medium group-hover:text-foreground">
                  {video.title}
                </h3>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{formatViews(video.views)} views</span>
                  <span>&#183;</span>
                  <span>
                    {video.status === 'PENDING'
                      ? 'Processing...'
                      : timeElapsed(video.completedAt)}
                  </span>
                </div>
                {video.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {video.description}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Results;
