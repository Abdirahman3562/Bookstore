import React, { useState } from "react";
import CommentReplies from "./CommentReplies";
import { AiOutlineLike, AiOutlineDislike } from "react-icons/ai";
import { FaRegCommentDots } from "react-icons/fa";

import { IoIosArrowDown, IoIosArrowUp, IoMdShareAlt } from "react-icons/io";
import { FiEdit } from "react-icons/fi";
import toast from "react-hot-toast";

function timeAgo(ms) {
  const diff = (Date.now() - ms) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

export default function CommentList({
  comments,
  user,
  handleReply,
  postId,
  refresh,
  setRefresh,
}) {
  const [replyBox, setReplyBox] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [openReplies, setOpenReplies] = useState({});
  const [expanded, setExpanded] = useState({});

  const startEditing = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.comment);
  };

  const saveEdit = async () => {
    const updated = comments.map((c) =>
      c.id === editingId ? { ...c, comment: editText, edited: true } : c
    );

    try {
      const response = await fetch(`http://localhost:3000/api/blogs/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: updated }),
      });

      if (!response.ok) throw new Error("Failed to update comment");
      
      setEditingId(null);
      setEditText("");
      setRefresh(!refresh);
      toast.success("Comment updated");
    } catch (err) {
      console.error("Error updating comment:", err);
      toast.error("Failed to update comment");
    }
  };

  const handleShare = () => {
    const shareData = {
      title: document.title,
      text: "Check out this post!",
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert("Share not supported. Link copied instead!");
    }
  };

  const handleNestedEdit = async (replyId, newText) => {
    const update = (list) =>
      list.map((r) =>
        r.id === replyId
          ? { ...r, reply: newText, edited: true }
          : { ...r, replies: update(r.replies) }
      );

    const updatedComments = comments.map((c) => ({
      ...c,
      replies: update(c.replies),
    }));

    try {
      const response = await fetch(`http://localhost:3000/api/blogs/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: updatedComments }),
      });

      if (!response.ok) throw new Error("Failed to update reply");
      setRefresh((prev) => !prev);
      toast.success("Reply updated");
    } catch (err) {
      console.error("Error updating reply:", err);
      toast.error("Failed to update reply");
    }
  };

  // Count all nested replies recursively
  function countAllReplies(replies) {
    let total = replies.length;
    replies.forEach((r) => {
      total += countAllReplies(r.replies || []);
    });
    return total;
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4 flex items-center text-blue-600 gap-2">
        <FaRegCommentDots className="text-blue-600 text-[23px] mt-1" />
        Comments ({comments.length})
      </h3>

      {comments.map((c) => (
        <div key={c.id} className="py-4 px-4 lg:px-0 md:px-0  border-b border-gray-200">
          <div className="flex gap-3">
            {/* Avatar */}
            {c.avatar ? (
              <img
                src={c.avatar}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                {c.username?.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              {/* Name + Comment */}
              <p className="font-semibold text-gray-900">{c.username}</p>

              {editingId === c.id ? (
                <>
                  <textarea
                    rows="3"
                    className="w-full resize-none rounded-lg border border-gray-300 py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  ></textarea>

                  <div className="flex gap-3 mt-1">
                    <button
                      onClick={saveEdit}
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      Save
                    </button>

                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-gray-300 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Comment text with clamp */}
                  <div
                    className="text-gray-800 mt-1 overflow-hidden transition-all duration-300 break-words"
                    style={{
                      maxHeight: expanded[c.id] ? "none" : "80px",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      maxWidth: "80%",
                    }}
                  >
                    {c.comment}
                  </div>

                  {/* Read more / Show less */}
                  {c.comment.length > 200 && (
                    <button
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [c.id]: !prev[c.id],
                        }))
                      }
                      className="text-blue-600 text-sm mt-1 flex items-center gap-1"
                    >
                      {expanded[c.id] ? (
                        <>
                          <IoIosArrowUp className="text-lg" />
                          Show less
                        </>
                      ) : (
                        <>
                          <IoIosArrowDown className="text-lg" />
                          Read more
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              <p className="text-xs text-gray-500 mt-1">{timeAgo(c.date)}</p>

              {/* Action buttons */}
              <div className="flex gap-4 text-sm mt-2 text-blue-600">
                {user && (user._id || user.id)?.toString() !== c.userId?.toString() && (
                  <button
                    className="flex items-center gap-1 text-blue-600"
                    onClick={() =>
                      setReplyBox((prev) => (prev === c.id ? null : c.id))
                    }
                  >
                    <FaRegCommentDots className="text-[18px]" />
                    Reply
                  </button>
                )}

                {user && (user._id || user.id)?.toString() === c.userId?.toString() && (
                  <button
                    className=" flex items-center gap-1 text-blue-600"
                    onClick={() => startEditing(c)}
                  >
                    <FiEdit className="text-[18px]" />
                    Edit
                  </button>
                )}

                <button
                  className=" flex items-center gap-1 text-blue-600"
                  onClick={handleShare}
                >
                  <IoMdShareAlt className="text-[18px]" />
                  Share
                </button>
              </div>

              {/* Reply box */}
              {replyBox === c.id && (
                <div className="mt-2">
                  <textarea
                    rows="2"
                    className="w-full resize-none rounded-lg border border-gray-300 py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
                    placeholder="Write reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  ></textarea>

                  <button
                    className="mt-1 bg-blue-600 text-white px-3 py-1 rounded"
                    onClick={() => {
                      if (!replyText.trim()) {
                        toast.error("Please reply to this comment");
                        return;
                      }
                      handleReply(c.id, replyText);
                      setReplyText("");
                      setReplyBox(null);
                    }}
                  >
                    Reply
                  </button>
                </div>
              )}
              {c.replies.length > 0 && (
                <button
                  className="text-sm text-blue-600 font-medium mt-4 flex items-center gap-1"
                  onClick={() =>
                    setOpenReplies((prev) => ({
                      ...prev,
                      [c.id]: !prev[c.id],
                    }))
                  }
                >
                  {openReplies[c.id] ? (
                    <>
                      <IoIosArrowUp className="text-lg" />
                      Hide replies
                    </>
                  ) : (
                    <>
                      <IoIosArrowDown className="text-lg" />
                      {countAllReplies(c.replies)} replies
                    </>
                  )}
                </button>
              )}

              {/* Replies */}
              {openReplies[c.id] && (
                <CommentReplies
                  replies={c.replies}
                  user={user}
                  parentId={c.id}
                  handleReply={handleReply}
                  comments={comments}
                  postId={postId}
                  refresh={refresh}
                  setRefresh={setRefresh}
                  editingId={editingId}
                  setEditingId={setEditingId}
                  editText={editText}
                  setEditText={setEditText}
                  handleNestedEdit={handleNestedEdit}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
