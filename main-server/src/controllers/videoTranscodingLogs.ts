import { Request, Response } from 'express';
import { VideoTranscodingLogsModel } from '../models/videoTranscodingLogs';

export const getLogs = async (req: Request, res: Response): Promise<any> => {
  try {
    const logs = await VideoTranscodingLogsModel.find({
      videoId: req.params.videoId,
    });
    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs' });
  }
};
