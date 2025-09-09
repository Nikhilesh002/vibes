import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IUploadVideoForm } from '@/lib/types';
import { uploadData } from '@/lib/videoUpload';
import { ChangeEvent, FormEvent, useState } from 'react';
import toast from 'react-hot-toast';

function VideoUpload() {
  const [video, setVideo] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [videoData, setVideoData] = useState<IUploadVideoForm>({
    title: '',
    description: '',
    tags: [],
  });

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!video || !thumbnail) {
      toast.error('Select files!!');
      return;
    }

    try {
      await uploadData(video, videoData, thumbnail);

      setVideo(null);
      setThumbnail(null);
      toast.success('Transcoding started...');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An error occurred during upload.');
    }
  };

  const handleVideoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (!e.target.files || e.target.files.length === 0) {
      toast.error('Select files!!');
      return;
    }
    setVideo(e.target.files[0]);
  };

  const handleThumbnailChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (!e.target.files || e.target.files.length === 0) {
      toast.error('Select files!!');
      return;
    }
    setThumbnail(e.target.files[0]);
  };

  return (
    <div className="w-full h-screen flex justify-center  ">
      <div className="w-96 h-40 mt-40">
        <Card className="p-5">
          <form className="text-center space-y-3" onSubmit={handleUpload}>
            <h1 className="font-bold text-2xl">Upload video</h1>
            <div className="space-y-1.5">
              <Label htmlFor="title">Video Title: </Label>
              <Input
                id="title"
                placeholder="Enter title"
                onChange={(e) =>
                  setVideoData({ ...videoData, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Video Description: </Label>
              <Input
                placeholder="Enter description"
                id="description"
                onChange={(e) =>
                  setVideoData({ ...videoData, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags">Video Tags: </Label>
              <Input
                id="tags"
                placeholder="Enter comma seperated tags"
                onChange={(e) =>
                  setVideoData({
                    ...videoData,
                    tags: e.target.value.split(','),
                  })
                }
              />
            </div>

            <div className="">
              <Label htmlFor="video-upload">Choose Video: </Label>
              <Input
                id="video-upload"
                onChange={handleVideoChange}
                className="my-3"
                type="file"
              />
            </div>

            <div className="">
              <Label htmlFor="thumbnail-upload">Choose Thumbnail: </Label>
              <Input
                id="thumbnail-upload"
                onChange={handleThumbnailChange}
                className="my-3"
                type="file"
              />
            </div>

            <Button type="submit">Upload</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default VideoUpload;
