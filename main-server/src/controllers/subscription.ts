import { Request, Response } from 'express';
import { SubscriptionModel } from '../models/subscription';

export const getSubscriptions = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const subscriptions = await SubscriptionModel.find({ userId: req.userId });
    return res.status(200).json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscriptions' });
  }
};

export const getUserSubscriptions = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { userId } = req.params;
    const subscriptions = await SubscriptionModel.find({ userId });
    return res.status(200).json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user subscriptions' });
  }
};

export const getCreatorSubscribersCount = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { creatorId } = req.params;
    const count = await SubscriptionModel.countDocuments({ creatorId });
    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscriber count' });
  }
};

export const subscribeToCreator = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { creatorId, isNotificationsEnabled } = req.body;
    const userId = req.userId;

    if (!creatorId) {
      return res.status(400).json({ message: 'creatorId is required' });
    }

    const existingSubscription = await SubscriptionModel.findOne({
      creatorId,
      userId,
    });

    if (existingSubscription) {
      return res
        .status(400)
        .json({ message: 'Already subscribed to this creator' });
    }

    const newSubscription = new SubscriptionModel({
      creatorId,
      userId,
      isNotificationsEnabled: isNotificationsEnabled || false,
    });

    await newSubscription.save();

    return res.status(200).json({
      success: true,
      message: 'Subscribed successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error subscribing to creator' });
  }
};

export const unsubscribeFromCreator = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { creatorId } = req.body;
    const userId = req.userId;

    if (!creatorId) {
      return res.status(400).json({ message: 'creatorId is required' });
    }

    const existingSubscription = await SubscriptionModel.findOne({
      creatorId,
      userId,
    });

    if (!existingSubscription) {
      return res
        .status(400)
        .json({ message: 'Not subscribed to this creator' });
    }

    await SubscriptionModel.deleteOne({ creatorId, userId });

    return res.status(200).json({
      success: true,
      message: 'Unsubscribed successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error unsubscribing from creator' });
  }
};
