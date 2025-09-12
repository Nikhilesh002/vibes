import { Button } from '@/components/ui/button';
import { formatViews } from '@/lib/formatFuncs';
import { IVideoData } from '@/lib/types';
import { UseMutationResult } from '@tanstack/react-query';
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
    <div className="">
      <div className="flex-col">
        <div className="">
          <h1 className="text-2xl font-bold mb-1">{videoData.video.title}</h1>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="">
            <span className="mr-2 font-semibold">{videoData.video.userId}</span>
            <Button className="text-sm rounded-3xl" onClick={handleSubscribe}>
              Subscribe
            </Button>
          </div>

          <div className="flex space-x-4 ml-auto text-sm text-gray-200">
            <div className="bg-gray-800 border border-gray-700 rounded-md">
              <button
                onClick={() => mutation.mutate('LIKE')}
                className="p-2 cursor-pointer"
              >
                <ThumbsUp
                  fill={videoData.likeStatus === 'LIKED' ? 'white' : 'none'}
                  className={`inline-block mr-1 w-5 h-5 `}
                />
                <span>{videoData.video.likes}</span>
              </button>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-md">
              <button
                onClick={() => mutation.mutate('DISLIKE')}
                className="p-2 cursor-pointer"
              >
                <ThumbsDown
                  fill={videoData.likeStatus === 'DISLIKED' ? 'white' : 'none'}
                  className="inline-block mr-1 w-5 h-5"
                />
                <span>{videoData.video.dislikes}</span>
              </button>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-md">
              <button
                className="p-2 cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied to clipboard!');
                }}
              >
                <Share2 className="inline-block w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-md hover:cursor-pointer">
              <button
                className="hover:cursor-pointer p-2"
                onClick={() => {
                  alert('Download feature coming soon!');
                }}
              >
                <Download className="inline-block w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border bg-gray-800 border-gray-700 rounded-md p-4 mt-4 shadow-lg">
        <div className="text-gray-400 flex space-x-3 font-medium text-sm">
          <div className="">
            <span className="">{formatViews(videoData.video.views)} views</span>
          </div>

          <div className="">
            <p className="">
              {new Date(videoData.video.completedAt).toDateString()}
            </p>
          </div>

          <div className="">
            {videoData.video.tags && videoData.video.tags.length > 0 ? (
              videoData.video.tags.map((tag, index) => (
                <span key={index} className="mr-1 text-blue-500">
                  #{tag}
                </span>
              ))
            ) : (
              <></>
            )}
          </div>
        </div>

        <p className="mb-4">{videoData.video.description}</p>
      </div>
    </div>
  );
}
