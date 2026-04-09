import { Request, Response } from 'express';

import { VideoTranscodingLogsModel } from '../models/videoTranscodingLogs';

export const getLogs = async (req: Request, res: Response): Promise<any> => {
  try {
    const videoId = req.params.videoId as string;
    const logs = await VideoTranscodingLogsModel.find({
      videoId,
    } as any);
    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs' });
  }
};
