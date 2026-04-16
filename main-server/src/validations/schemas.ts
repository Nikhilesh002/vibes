import { z } from 'zod';

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// ── User ──

export const signupSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, hyphens, and underscores',
      ),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password must be at most 100 characters'),
  }),
});

export const signinSchema = z.object({
  body: z.object({
    identifier: z
      .string()
      .min(1, 'Username or email is required')
      .max(100, 'Identifier too long'),
    password: z
      .string()
      .min(1, 'Password is required')
      .max(100, 'Password too long'),
  }),
});

// ── Video ──

export const presignedUrlSchema = z.object({
  body: z.object({
    videoKey: z.string().min(1, 'videoKey is required'),
    thumbnailKey: z.string().min(1, 'thumbnailKey is required'),
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must be at most 200 characters'),
    description: z
      .string()
      .max(5000, 'Description must be at most 5000 characters')
      .optional()
      .default(''),
    tags: z.array(z.string().max(50)).max(20, 'At most 20 tags').optional().default([]),
  }),
});

export const searchQuerySchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required').max(100, 'Search query must be at most 100 characters'),
  }),
});

export const videoIdParamSchema = z.object({
  params: z.object({
    videoId: objectId,
  }),
});

// ── Comments ──

export const getCommentsParamSchema = z.object({
  params: z.object({
    videoId: objectId,
  }),
});

export const postCommentSchema = z.object({
  params: z.object({
    videoId: objectId,
  }),
  body: z.object({
    content: z
      .string()
      .min(1, 'Comment cannot be empty')
      .max(5000, 'Comment must be at most 5000 characters'),
    parentCommentId: objectId.optional(),
  }),
});

export const deleteCommentParamSchema = z.object({
  params: z.object({
    commentId: objectId,
  }),
});

// ── Subscription ──

export const userIdParamSchema = z.object({
  params: z.object({
    userId: objectId,
  }),
});

export const creatorIdParamSchema = z.object({
  params: z.object({
    creatorId: objectId,
  }),
});

export const subscribeSchema = z.object({
  body: z.object({
    creatorId: objectId,
    isNotificationsEnabled: z.boolean().optional().default(false),
  }),
});

export const unsubscribeSchema = z.object({
  body: z.object({
    creatorId: objectId,
  }),
});

// ── Logs ──

export const logsParamSchema = z.object({
  params: z.object({
    videoId: objectId,
  }),
});
