import { getBlobSASClient } from '@/utils/azureBlob/client';
import { axiosWithToken } from './axiosWithToken';
import { IUploadVideoForm } from './types';
import { buildBlobName } from '@/utils/azureBlob/buildBlobName';
import toast from 'react-hot-toast';
import { supportedFormats } from './supportedFormats';

export const uploadData = async (
  video: File,
  videoData: IUploadVideoForm,
  thumbnail: File,
) => {
  if (!videoChecks(video) || !thumbnailChecks(thumbnail)) {
    throw new Error('Video checks failed');
  }

  const videoKey = buildBlobName(video);
  const thumbnailKey = buildBlobName(thumbnail);

  // req presigned URL
  const resp = await axiosWithToken.post(
    `${import.meta.env.VITE_API_URL}/video/presignedurl`,
    {
      videoKey,
      thumbnailKey,
      ...videoData,
    },
  );

  const {
    videoUrl,
    videoSasKey,
    thumbnailUrl,
    thumbnailSasKey,
    success,
    videoId,
  } = resp.data;
  if (!success) {
    toast.error('Failed to get pre-signed URLs');
    return;
  }
  console.log({ video: `${videoUrl}?${videoSasKey}` });
  console.log({ thumbnail: `${thumbnailUrl}?${thumbnailSasKey}` });

  // upload video, thmbnail to azure
  await Promise.all([
    uploadToAzure(videoUrl, videoSasKey, video, { videoId }),
    uploadToAzure(thumbnailUrl, thumbnailSasKey, thumbnail, { videoId }),
  ]);

  toast.success('Video uploaded successfully!');
};

const uploadToAzure = async (
  url: string,
  sasKey: string,
  blob: File,
  metadata: any,
) => {
  const sasClient = getBlobSASClient(`${url}?${sasKey}`);
  const resp2 = await sasClient.uploadData(blob, {
    metadata,
  });

  console.log({ resp2 });

  if (resp2.errorCode) {
    toast.error('Video upload failed.');
    throw new Error('blob upload failed');
  }
};

const videoChecks = (videos: File | null) => {
  if (!videos) {
    toast.error('Select videos');
    return false;
  }

  const blob = videos;

  if (blob.size > 50 * 1024 * 1024) {
    toast.error('Max video size can be 50MB');
    return false;
  }

  if (!supportedFormats['video'].includes(blob.type)) {
    toast.error('Unsupported video file');
    return false;
  }
  return true;
};

const thumbnailChecks = (thumbnail: File | null) => {
  if (!thumbnail) {
    toast.error('Select thumbnail');
    return false;
  }

  const blob = thumbnail;

  if (blob.size > 5 * 1024 * 1024) {
    toast.error('Max thumbnail size can be 5MB');
    return false;
  }

  if (!supportedFormats['image'].includes(blob.type)) {
    toast.error('Unsupported thumbnail file');
    return false;
  }
  return true;
};
