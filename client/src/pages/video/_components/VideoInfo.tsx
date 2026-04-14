import { Button } from '@/components/ui/button';
import { formatViews } from '@/lib/formatFuncs';
import type { IVideoData } from '@/lib/types';
import type { UseMutationResult } from '@tanstack/react-query';
import { Download, Share2, ThumbsDown, ThumbsUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface VideoInfoProps {
  videoData: IVideoData;
  mutation: UseMutationResult<
    IVideoData | null,
    Error,
    'LIKE' | 'DISLIKE',
    unknown
  >;
}

export default function VideoInfo({ videoData, mutation }: VideoInfoProps) {
  if (!videoData || !videoData.video) {
    return <div>Loading...</div>;
  }

  const handleSubscribe = () => {
    alert('Subscribe feature coming soon!');
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Title */}
      <h1 className="text-xl font-semibold leading-tight">{videoData.video.title}</h1>

      {/* Creator + Actions row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Creator info */}
        <div className="flex items-center gap-3">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              videoData.video.creatorName,
            )}&background=random&size=40`}
            alt={videoData.video.creatorName}
            className="h-10 w-10 rounded-full"
          />
          <div>
            <p className="text-sm font-medium leading-none">{videoData.video.creatorName}</p>
          </div>
          <Button size="sm" className="ml-2 rounded-full" onClick={handleSubscribe}>
            Subscribe
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Like / Dislike pill */}
          <div className="inline-flex items-center overflow-hidden rounded-full border border-border">
            <button
              onClick={() => mutation.mutate('LIKE')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm transition-colors hover:bg-accent"
            >
              <ThumbsUp
                className="h-4 w-4"
                fill={videoData.likeStatus === 'LIKED' ? 'currentColor' : 'none'}
              />
              <span>{formatViews(videoData.video.likes)}</span>
            </button>
            <div className="h-5 w-px bg-border" />
            <button
              onClick={() => mutation.mutate('DISLIKE')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm transition-colors hover:bg-accent"
            >
              <ThumbsDown
                className="h-4 w-4"
                fill={videoData.likeStatus === 'DISLIKED' ? 'currentColor' : 'none'}
              />
              <span>{formatViews(videoData.video.dislikes)}</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Link copied to clipboard!');
            }}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => alert('Download feature coming soon!')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Description card */}
      <div className="rounded-xl bg-muted/50 p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <span>{formatViews(videoData.video.views)} views</span>
          <span className="text-muted-foreground">&#183;</span>
          <span className="text-muted-foreground">
            {videoData.video.status === 'PENDING'
              ? 'Processing...'
              : new Date(videoData.video.completedAt).toDateString()}
          </span>
          {videoData.video.tags && videoData.video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {videoData.video.tags.map((tag, index) => (
                <span key={index} className="text-primary/80">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {videoData.video.description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {videoData.video.description}
          </p>
        )}
      </div>
    </div>
  );
}
