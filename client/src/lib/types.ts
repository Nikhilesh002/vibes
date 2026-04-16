export interface IUploadVideoForm {
  title: string;
  description: string;
  tags: string[];
}

export interface IVideo extends IUploadVideoForm {
  _id: string;
  blobName: string;
  tempUrl: string;
  status: 'IN_QUEUE' | 'DONE' | 'PENDING' | 'FAILED';
  logs: string;
  transcodedVideoUrl: string;
  transcodedVideoSasToken: string;
  thumbnailUrl: string;
  completedAt: number;

  userId: string;
  creatorName: string;
  creatorAvatar: string;

  views: number;
  likes: number;
  dislikes: number;

  comments: IComment[];
}

export interface IVideoData {
  video: IVideo;
  likeStatus: 'LIKED' | 'DISLIKED' | 'NONE';
}

export interface IComment {
  _id: string;
  videoId: string;
  parentCommentId: string | null;
  userId: string;
  username: string;
  avatarUrl: string;

  content: string;
  likes: number;
  dislikes: number;
  star: boolean;
  createdAt: string;
  updatedAt: string;
}
