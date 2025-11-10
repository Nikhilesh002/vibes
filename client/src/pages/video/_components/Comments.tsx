import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { axiosWithToken } from '@/lib/axiosWithToken';
import { timeElapsed } from '@/lib/formatFuncs';
import { IComment } from '@/lib/types';
import axios from 'axios';
import {
  EllipsisVertical,
  Heart,
  Smile,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

function Comments({ videoId }: { videoId: string }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const emojiRef = useRef<HTMLDivElement | null>(null);

  const fetchComments = useCallback(async () => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/comments/${videoId}`,
    );
    const data = response.data;
    if (data.success) {
      setComments(data.comments);
    }
  }, [videoId]);

  const handleCommentPost = useCallback(async () => {
    if (newComment.trim() === '') return;

    try {
      const res = await axiosWithToken.post(
        `${import.meta.env.VITE_API_URL}/comments/${videoId}`,
        {
          content: newComment,
        },
      );

      const data = res.data;
      if (data.success) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  }, [videoId, newComment, fetchComments]);

  useEffect(() => {
    fetchComments();
  }, [videoId, fetchComments]);

  // close picker when clicking outside or pressing Esc
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (!showEmojiPicker) return;
      const el = emojiRef.current;
      if (el && !el.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && showEmojiPicker) {
        setShowEmojiPicker(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showEmojiPicker]);

  return (
    <div className="p-1">
      <div className="">
        <h2 className="text-xl font-semibold mb-4 mt-4">Comments</h2>
      </div>

      <div className="">
        <div className="flex flex-col space-x-4 mb-5">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full p-2 rounded mb-2 focus:outline-1"
            placeholder="Type your comment here..."
          ></Textarea>
          <div className="flex items-center justify-between">
            <div ref={emojiRef} className="relative">
              <button
                className="mr-2"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile />
              </button>
              {showEmojiPicker && (
                <div className="absolute  z-10">
                  <Picker
                    data={data}
                    onEmojiSelect={(emoji: any) => {
                      setNewComment((prev) => prev + emoji.native);
                    }}
                    theme="dark"
                  />
                </div>
              )}
            </div>

            <div className="space-x-3">
              <Button
                onClick={() => setNewComment('')}
                variant={'secondary'}
                className="px-4 py-2  text-white rounded"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCommentPost}
                variant="default"
                className="px-4 py-2  text-black rounded"
              >
                Post
              </Button>
            </div>
          </div>
        </div>
        {comments.length === 0 ? (
          <p>No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment: IComment) => (
            <div
              key={comment._id}
              className="mb-4 border-b pb-2 flex justify-between"
            >
              <div className="flex">
                <div className="">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      comment.username,
                    )}&background=random&size=20`}
                    alt={comment.username}
                    className="w-10 h-10 rounded-full inline-block mr-2"
                  />
                </div>

                <div className="">
                  <div className="flex items-center space-x-4">
                    <div className="">
                      <div className="flex space-x-2">
                        <p className="font-semibold text-sm">
                          @{comment.username}
                        </p>
                        <p className="text-xs text-gray-300">
                          {comment.createdAt === comment.updatedAt
                            ? timeElapsed(new Date(comment.createdAt).valueOf())
                            : `Edited: ${timeElapsed(
                                new Date(comment.updatedAt).valueOf(),
                              )}`}
                        </p>
                      </div>
                      <p className="font-serif">{comment.content}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <div className="text-sm flex items-center space-x-1">
                      <ThumbsUp className="text-white w-4 h-4 pb-0.5" />
                      <p className="min-w-[20px]">{comment.likes}</p>
                    </div>

                    <div className="text-sm flex items-center space-x-1">
                      <ThumbsDown className="text-white w-4 h-4 pb-0.5" />
                      <p className="min-w-[20px]">{comment.dislikes}</p>
                    </div>

                    {!comment.star && (
                      <div className="text-sm flex items-center">
                        <Heart
                          className="w-5 h-5 pb-0.5 text-red-500"
                          fill="red"
                        />
                      </div>
                    )}

                    <Button variant="outline" className="px-2 py-1">
                      Reply
                    </Button>
                  </div>
                </div>
              </div>

              <div className="">
                <div className="">
                  <Menubar>
                    <MenubarMenu>
                      <MenubarTrigger>
                        <EllipsisVertical className="w-4 h-4 text-gray-200" />
                      </MenubarTrigger>
                      <MenubarContent>
                        <MenubarItem>Edit</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem>Delete</MenubarItem>
                      </MenubarContent>
                    </MenubarMenu>
                  </Menubar>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Comments;
