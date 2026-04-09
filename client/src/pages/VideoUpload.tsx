import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IUploadVideoForm } from '@/lib/types';
import { uploadData } from '@/lib/videoUpload';
import { Film, ImagePlus, Loader2, Upload } from 'lucide-react';
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
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!video || !thumbnail) {
      toast.error('Select files!!');
      return;
    }

    try {
      setIsUploading(true);
      await uploadData(video, videoData, thumbnail);

      setVideo(null);
      setThumbnail(null);
      toast.success('Transcoding started...');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An error occurred during upload.');
    } finally {
      setIsUploading(false);
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
    <div className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Upload video</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Share your content with the world
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleUpload}>
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Give your video a title"
              className="h-10"
              onChange={(e) =>
                setVideoData({ ...videoData, title: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              placeholder="Tell viewers about your video"
              id="description"
              className="min-h-[80px] resize-none"
              onChange={(e) =>
                setVideoData({ ...videoData, description: e.target.value })
              }
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Enter comma-separated tags"
              className="h-10"
              onChange={(e) =>
                setVideoData({
                  ...videoData,
                  tags: e.target.value.split(',').map((t) => t.trim()),
                })
              }
            />
            <p className="text-xs text-muted-foreground">Separate tags with commas</p>
          </div>

          {/* File inputs */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Video file */}
            <div className="space-y-2">
              <Label htmlFor="video-upload">Video file</Label>
              <label
                htmlFor="video-upload"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-ring hover:bg-muted/50"
              >
                <Film className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {video ? video.name : 'Choose video'}
                </span>
                <span className="text-xs text-muted-foreground">MP4, WebM, MOV</span>
              </label>
              <Input
                id="video-upload"
                onChange={handleVideoChange}
                type="file"
                accept="video/*"
                className="hidden"
              />
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail-upload">Thumbnail</Label>
              <label
                htmlFor="thumbnail-upload"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-ring hover:bg-muted/50"
              >
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {thumbnail ? thumbnail.name : 'Choose thumbnail'}
                </span>
                <span className="text-xs text-muted-foreground">PNG, JPG, WebP</span>
              </label>
              <Input
                id="thumbnail-upload"
                onChange={handleThumbnailChange}
                type="file"
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <Button type="submit" disabled={isUploading} className="h-10 w-full">
            {isUploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload video
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default VideoUpload;
