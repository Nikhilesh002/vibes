import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { axiosWithToken } from '@/lib/axiosWithToken';
import { formatViews, timeElapsed } from '@/lib/formatFuncs';
import { IVideo } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import SearchBar from './_components/SearchBar';
import { useQuery } from '@tanstack/react-query';

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
    staleTime: 1000 * 60 * 2, // 5 minutes
  });

  const handleVideoClick = (video: IVideo) => {
    console.log('video clicked', video);
    navigate(`/video/${video._id}`);
  };

  if (isPending) {
    return <span>Loading...</span>;
  }

  if (isError) {
    return <span>Error: {error.message}</span>;
  }

  return (
    <div className="p-1 flex flex-col">
      <div className="flex justify-center">
        <SearchBar />
      </div>

      <div className="flex flex-wrap gap-3 p-3">
        {videos.map((video: IVideo) => (
          <Card
            onClick={() => handleVideoClick(video)}
            className="w-96 hover:cursor-pointer"
            key={video._id}
          >
            <CardContent>
              {/* put video thumbnail */}
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-96 h-48"
              />
            </CardContent>

            <CardFooter className="flex-col ">
              <div className="">
                <p>{video.title}</p>
              </div>

              <div className="flex font-light text-gray-300 text-sm">
                <p>{formatViews(video.views)} views</p>
                <span className="mx-2">•</span>
                <p className="">{timeElapsed(video.completedAt)}</p>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Videos;
