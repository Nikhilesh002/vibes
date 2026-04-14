import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { axiosWithToken } from "@/lib/axiosWithToken"
import { timeElapsed } from "@/lib/formatFuncs"
import type { IComment } from "@/lib/types"
import axios from "axios"
import {
  EllipsisVertical,
  Heart,
  MessageCircle,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { emojis } from "@/lib/emojis"

function Comments({ videoId }: { videoId: string }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  const fetchComments = useCallback(async () => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/comments/${videoId}`
    )
    const data = response.data
    if (data.success) {
      setComments(data.comments)
    }
  }, [videoId])

  const handleCommentPost = useCallback(async () => {
    if (newComment.trim() === "") return

    try {
      const res = await axiosWithToken.post(
        `${import.meta.env.VITE_API_URL}/comments/${videoId}`,
        {
          content: newComment,
        }
      )

      const data = res.data
      if (data.success) {
        setNewComment("")
        setIsFocused(false)
        fetchComments()
      }
    } catch (error) {
      console.error("Error posting comment:", error)
    }
  }, [videoId, newComment, fetchComments])

  // TODO: use react-query
  useEffect(() => {
    fetchComments()
  }, [videoId, fetchComments])

  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold">
        {comments.length} Comment{comments.length !== 1 ? "s" : ""}
      </h2>

      {/* Comment input */}
      <div className="mt-4">
        <Textarea
          ref={commentInputRef}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="min-h-11 resize-none rounded-lg border-border bg-transparent text-sm placeholder:text-muted-foreground"
          placeholder="Add a comment..."
          rows={isFocused ? 3 : 1}
        />

        {isFocused && (
          <div className="mt-1.5 flex items-center justify-between ps-1">
            {/* Emoji hint — use OS native picker */}
            <div className="flex items-center gap-3 text-xl">
              {emojis.map((emoji) => (
                <span
                  key={emoji}
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => {
                    setNewComment(newComment + emoji)
                    commentInputRef.current?.select()
                  }}
                >
                  {emoji}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewComment("")
                  setIsFocused(false)
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCommentPost}
                disabled={!newComment.trim()}
              >
                Comment
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Comments list */}
      <div className="mt-6 space-y-5">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No comments yet. Be the first to comment!
            </p>
          </div>
        ) : (
          comments.map((comment: IComment) => (
            <div key={comment._id} className="flex gap-3">
              {/* Avatar */}
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  comment.username
                )}&background=random&size=32`}
                alt={comment.username}
                className="h-8 w-8 shrink-0 rounded-full"
              />

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium">
                    @{comment.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {comment.createdAt === comment.updatedAt
                      ? timeElapsed(new Date(comment.createdAt).valueOf())
                      : `Edited ${timeElapsed(new Date(comment.updatedAt).valueOf())}`}
                  </span>
                </div>

                <p className="mt-0.5 text-sm leading-relaxed">
                  {comment.content}
                </p>

                {/* Actions */}
                <div className="mt-1.5 flex items-center gap-3">
                  <button className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {comment.likes > 0 && <span>{comment.likes}</span>}
                  </button>

                  <button className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <ThumbsDown className="h-3.5 w-3.5" />
                    {comment.dislikes > 0 && <span>{comment.dislikes}</span>}
                  </button>

                  {!comment.star && (
                    <Heart
                      className="h-3.5 w-3.5 text-red-500"
                      fill="currentColor"
                    />
                  )}

                  <button className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                    Reply
                  </button>
                </div>
              </div>

              {/* Menu */}
              <Menubar className="h-auto border-none bg-transparent p-0 shadow-none">
                <MenubarMenu>
                  <MenubarTrigger className="h-8 w-8 cursor-pointer rounded-full p-0 data-[state=open]:bg-accent">
                    <EllipsisVertical className="mx-auto h-4 w-4 text-muted-foreground" />
                  </MenubarTrigger>
                  <MenubarContent align="end">
                    <MenubarItem>Edit</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem className="text-destructive">
                      Delete
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Comments
