import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { axiosWithToken } from '@/lib/axiosWithToken';
import { IUploadVideoForm } from '@/lib/types';
import { buildBlobName } from '@/utils/azureBlob/buildBlobName';
import { getBlobSASClient } from '@/utils/azureBlob/client';
import { ChangeEvent, FormEvent, useState } from 'react';
import toast from 'react-hot-toast';

function VideoUpload() {
  const [videos, setVideos] = useState<FileList | null>(null);
  const [thumbnail, setThumbnail] = useState<FileList | null>(null);
  const [videoData, setVideoData] = useState<IUploadVideoForm>({
    title: '',
    description: '',
    tags: [],
  });

  // TODO: upload thumbnail like videos on upload, then store thumbnail URL

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!videos || videos.length === 0) {
      toast.error('Select videos');
      return;
    }

    const blob = videos[0];
    const blobName = buildBlobName(blob);

    if (blob.size > 30 * 1024 * 1024) {
      toast.error('Max video size can be 30MB');
      return;
    }

    const supportedFormats = [
      'video/mp4',
      'video/x-msvideo', // AVI
      'video/x-flv', // FLV
      'video/x-matroska', // MKV
      'video/ogg', // OGV
      'video/webm', // WEBM
      'video/3gpp', // 3GP
      'video/3gpp2', // 3G2
    ];

    if (!supportedFormats.includes(blob.type)) {
      toast.error('Unsupported video file');
      return;
    }

    try {
      // req presigned URL
      const resp = await axiosWithToken.post(
        `${import.meta.env.VITE_API_URL}/video/presignedurl`,
        {
          key: blobName,
          ...videoData,
        },
      );

      const { url, sasKey, success, videoJobId } = resp.data;
      if (!success || !url) {
        toast.error('Failed to get pre-signed URL');
        return;
      }
      console.log({ url: `${url}?${sasKey}` });

      const sasClient = getBlobSASClient(`${url}?${sasKey}`);
      const resp2 = await sasClient.uploadData(blob);

      console.log({ resp2 });

      if (resp2.errorCode) {
        toast.error('Video upload failed.');
        return;
      }

      toast.success('Video uploaded successfully!');

      // add to transcoding queue
      const resp3 = await axiosWithToken.post(
        `${import.meta.env.VITE_API_URL}/video/transcode`,
        {
          videoUrl: url,
          videoJobId,
        },
      );

      const { success: success3 } = resp3.data;

      if (!success3) {
        toast.error('Failed to transcode');
        return;
      }

      setVideos(null);
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
    setVideos(e.target.files);
  };

  const handleThumbnailChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (!e.target.files || e.target.files.length === 0) {
      toast.error('Select files!!');
      return;
    }
    setThumbnail(e.target.files);
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
