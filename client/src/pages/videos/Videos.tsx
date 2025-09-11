import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { axiosWithToken } from '@/lib/axiosWithToken';
import { formatViews, timeElapsed } from '@/lib/formatFuncs';
import { IVideo } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Videos() {
  const [videos, setVideos] = useState<IVideo[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const resp = await axiosWithToken.get(
        `${import.meta.env.VITE_API_URL}/video`,
      );
      console.log(resp.data.user);
      setVideos(resp.data.user.videoJobIds);
    })();
  }, []);

  const handleVideoClick = (video: IVideo) => {
    console.log('video clicked', video);
    navigate(`/video/${video._id}`);
  };

  return (
    <div className="p-1">
      <div className="flex flex-wrap gap-3 p-3">
        {videos.map((video: IVideo) => (
          <Card
            onClick={() => handleVideoClick(video)}
            className="w-96 hover:cursor-pointer"
            key={video._id}
          >
            <CardContent>
              {/* put video thumbnail */}
              <img src={video.thumbnailUrl} alt={video.title} className='w-96 h-48' />
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
