import { Button } from '@/components/ui/button';
import { axiosWithToken } from '@/lib/axiosWithToken';
import { formatViews } from '@/lib/formatFuncs';
import type { IVideoData } from '@/lib/types';
import type { RootState } from '@/redux/store';
import type { UseMutationResult } from '@tanstack/react-query';
import { Download, Share2, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);
  const navigate = useNavigate();
  const userData = useSelector((state: RootState) => state.user);

  const creatorId = videoData?.video?.userId;
  const isOwner = userData.user?.username === videoData?.video?.creatorName;

  // Fetch subscriber count
  useEffect(() => {
    if (!creatorId) return;
    axiosWithToken
      .get(`${import.meta.env.VITE_API_URL}/subscription/creator/${creatorId}/count`)
      .then((res) => {
        if (res.data.success) setSubCount(res.data.count);
      })
      .catch(() => {});
  }, [creatorId]);

  const handleSubscribe = useCallback(async () => {
    if (!creatorId) return;
    try {
      if (isSubscribed) {
        await axiosWithToken.delete(`${import.meta.env.VITE_API_URL}/subscription`, {
          data: { creatorId },
        });
        setIsSubscribed(false);
        setSubCount((c) => Math.max(0, c - 1));
        toast.success('Unsubscribed');
      } else {
        await axiosWithToken.post(`${import.meta.env.VITE_API_URL}/subscription`, {
          creatorId,
        });
        setIsSubscribed(true);
        setSubCount((c) => c + 1);
        toast.success('Subscribed!');
      }
    } catch (error: any) {
      // "Already subscribed" means state was out of sync — correct it
      if (error?.response?.data?.message === 'Already subscribed to this creator') {
        setIsSubscribed(true);
      } else {
        toast.error('Failed to update subscription');
      }
    }
  }, [creatorId, isSubscribed]);

  const handleDeleteVideo = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this video? This cannot be undone.')) return;
    try {
      await axiosWithToken.delete(
        `${import.meta.env.VITE_API_URL}/video/${videoData.video._id}`,
      );
      toast.success('Video deleted');
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete video');
    }
  }, [videoData?.video?._id, navigate]);

  if (!videoData || !videoData.video) {
    return <div>Loading...</div>;
  }

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
            {subCount > 0 && (
              <p className="text-xs text-muted-foreground">{formatViews(subCount)} subscribers</p>
            )}
          </div>
          <Button
            size="sm"
            variant={isSubscribed ? 'outline' : 'default'}
            className="ml-2 rounded-full"
            onClick={handleSubscribe}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
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

          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleDeleteVideo}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
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
              : videoData.video.status === 'FAILED'
                ? 'Transcoding failed'
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
