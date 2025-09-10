export interface IComment {
  videoId: string;
  userId: string;

  content: string;
  likes: number;
  dislikes: number;
  star: boolean;

  comments: IComment[];
}

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
  thumbnailUrl: string;
  completedAt: number;
  userId: string;

  views: number;
  likes: number;
  dislikes: number;

  comments: IComment[];
}

export interface IVideoData {
  video: IVideo;
  likeStatus: 'LIKED' | 'DISLIKED' | 'NONE';
}
