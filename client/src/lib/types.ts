export interface IUploadVideoForm {
  title: string;
  description: string;
  tags: string[];
}

export interface IVideo extends IUploadVideoForm {
  _id: string;
  blobName: string;
  tempUrl: string;
  status: 'IN_QUEUE' | 'DONE' | 'PENDING';
  logs: string;
  transcodedVideoUrl: string;
  thumbnailImage: string;
  completedAt: number;
  userId: string;
}
