import { Button } from '@/components/ui/button';
import { axiosWithToken } from '@/lib/axiosWithToken';
import { IVideoData } from '@/lib/types';
import { Download, Share2, ThumbsDown, ThumbsUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface VideoInfoProps {
  videoData: IVideoData;
  setVideoData: React.Dispatch<React.SetStateAction<IVideoData | null>>;
}

export default function VideoInfo({ videoData, setVideoData }: VideoInfoProps) {
  if (!videoData || !videoData.video) {
    return <div>Loading...</div>;
  }

  const handleSubscribe = () => {
    alert('Subscribe feature coming soon!');
  };

  const handleLike = async () => {
    // optimistically update UI
    if (!videoData) return;

    const previousVideoData = { ...videoData };

    if (videoData.likeStatus === 'DISLIKED') {
      setVideoData((prev) => {
        if (!prev) return prev;
        return {
          likeStatus: 'LIKED',
          video: {
            ...prev.video,
            likes: prev.video.likes + 1,
            dislikes: prev.video.dislikes - 1,
          },
        };
      });
    } else if (videoData.likeStatus === 'NONE') {
      setVideoData((prev) => {
        if (!prev) return prev;
        return {
          likeStatus: 'LIKED',
          video: {
            ...prev.video,
            likes: prev.video.likes + 1,
          },
        };
      });
    } else if (videoData.likeStatus === 'LIKED') {
      setVideoData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          likeStatus: 'NONE',
          video: {
            ...prev.video,
            likes: prev.video.likes - 1,
          },
        };
      });
    }

    // make API call
    try {
      const resp = await axiosWithToken.put(
        `${import.meta.env.VITE_API_URL}/video/${videoData.video._id}/like`,
      );
      console.log({ resp });
    } catch (error) {
      console.error('Error liking video', error);
      // revert UI update on error
      setVideoData(previousVideoData);
      toast.error('Error liking video');
    }
  };

  const handleDislike = async () => {
    // optimistically update UI
    if (!videoData) return;

    const previousVideoData = { ...videoData };

    if (videoData.likeStatus === 'LIKED') {
      setVideoData((prev) => {
        if (!prev) return prev;
        return {
          likeStatus: 'DISLIKED',
          video: {
            ...prev.video,
            likes: prev.video.likes - 1,
            dislikes: prev.video.dislikes + 1,
          },
        };
      });
    } else if (videoData.likeStatus === 'NONE') {
      setVideoData((prev) => {
        if (!prev) return prev;
        return {
          likeStatus: 'DISLIKED',
          video: {
            ...prev.video,
            dislikes: prev.video.dislikes + 1,
          },
        };
      });
    } else if (videoData.likeStatus === 'DISLIKED') {
      setVideoData((prev) => {
        if (!prev) return prev;
        return {
          likeStatus: 'NONE',
          video: {
            ...prev.video,
            dislikes: prev.video.dislikes - 1,
          },
        };
      });
    }

    // make API call
    try {
      const resp = await axiosWithToken.put(
        `${import.meta.env.VITE_API_URL}/video/${videoData.video._id}/dislike`,
      );
      console.log({ resp });
    } catch (error) {
      console.error('Error disliking video', error);
      // revert UI update on error
      setVideoData(previousVideoData);
      toast.error('Error disliking video');
    }
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
              <button onClick={handleLike} className="p-2 cursor-pointer">
                <ThumbsUp
                  fill={videoData.likeStatus === 'LIKED' ? 'white' : 'none'}
                  className={`inline-block mr-1 w-5 h-5 `}
                />
                <span>{videoData.video.likes}</span>
              </button>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-md">
              <button onClick={handleDislike} className="p-2 cursor-pointer">
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

            <div className="bg-gray-800 border border-gray-700 rounded-md p-2 hover:cursor-pointer">
              <button
                className="hover:cursor-pointer"
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
            <span className="">{videoData.video.views} views</span>
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
