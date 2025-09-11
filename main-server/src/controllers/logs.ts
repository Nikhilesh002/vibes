import { Request, Response } from 'express';
import { LogsModel } from '../models/logs';

export const getLogs = async (req: Request, res: Response): Promise<any> => {
  try {
    const logs = await LogsModel.find({ userId: req.userId });
    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs' });
  }
};
