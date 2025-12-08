import React, { useState } from "react";
import toast from "react-hot-toast";
import { FaRegCommentDots } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { IoIosArrowDown, IoIosArrowUp, IoMdShareAlt } from "react-icons/io";

function timeAgo(ms) {
  const diff = (Date.now() - ms) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

export default function CommentReplies({
  replies,
  parentId,
  user,
  handleReply,
  level = 1,
  comments,
  postId,
  refresh,
  setRefresh,
  editingId,
  setEditingId,
  editText,
  setEditText,
  handleNestedEdit,
}) {
  const [replyBox, setReplyBox] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expanded, setExpanded] = useState({});
  const [openReplies, setOpenReplies] = useState({});

  if (!replies || replies.length === 0) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        text: "Check this out",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };


  return (
    <div
  className="mt-3 space-y-4 border-l border-gray-300 dark:border-gray-600 pl-2"
  
>
      {replies.map((r) => (
        <div key={r.id} className="flex lg:flex-row md:flex-row flex-col lg:pl-0 md:pl-0 pl-2 gap-3">
          {/* Avatar */}
          {r.avatar ? (
            <img
              src={r.avatar}
              className="w-10 h-10 rounded-full object-cover border-2 border-blue-400 dark:border-blue-500"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold border-2 border-blue-400 dark:border-blue-500">
              {r.username?.slice(0, 2).toUpperCase()}
            </div>
          )}

          {/* RIGHT SIDE */}
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-white">{r.username}</p>

            {/* SHOW REPLY TEXT */}
            {editingId !== r.id && (
              <p className="mt-1 text-gray-800 dark:text-gray-200 break-words whitespace-normal overflow-wrap-anywhere word-wrap-break-word">{r.reply}</p>
            )}

            {/* EDIT MODE */}
            {editingId === r.id && (
              <>
                <textarea
                  className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none mb-4 placeholder-gray-500 dark:placeholder-gray-400"
                  value={editText}
                  placeholder="Write reply..."
                  onChange={(e) => setEditText(e.target.value)}
                />

                <div className="flex gap-2 mt-2">
                  <button
                    className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                    onClick={async () => {
                      if (!editText.trim())
                        return toast.error("Reply cannot be empty");

                      await handleNestedEdit(r.id, editText);
                      setEditingId(null);
                      setEditText("");
                    }}
                  >
                    Save
                  </button>

                  <button
                    className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(r.date)}</p>

            <div className="flex flex-wrap gap-3 text-xs text-blue-600 dark:text-blue-400 mt-2">
              {/* Reply — only for others, NOT for you */}
              {user && (user._id || user.id)?.toString() !== r.userId?.toString() && (
                <button
                  className="flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  onClick={() =>
                    setReplyBox((prev) => (prev === r.id ? null : r.id))
                  }
                >
                  <FaRegCommentDots /> Reply
                </button>
              )}

              {/* Edit — only for you */}
              {user && (user._id || user.id)?.toString() === r.userId?.toString() && (
                <button
                  className="flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  onClick={() => {
                    setEditingId(r.id);
                    setEditText(r.reply);
                  }}
                >
                  <FiEdit /> Edit
                </button>
              )}

              {/* Share — everyone sees */}
              <button className="flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-300 transition-colors" onClick={handleShare}>
                <IoMdShareAlt /> Share
              </button>
            </div>

            {/* REPLY BOX */}
            {replyBox === r.id && (
              <div className="mt-2">
                <textarea
                  className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none mb-4 placeholder-gray-500 dark:placeholder-gray-400"
                  value={replyText}
                  placeholder="Write reply..."
                  onChange={(e) => setReplyText(e.target.value)}
                ></textarea>

                <button
                  className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded-lg mt-1 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  onClick={() => {
                    if (!replyText.trim())
                      return toast.error("Type something...");
                    handleReply(r.id, replyText);
                    setReplyText("");
                    setReplyBox(null);
                  }}
                >
                  Reply
                </button>
              </div>
            )}

            {/* RECURSIVE REPLIES */}
            {r.replies?.length > 0 && (
              <>
                <button
                  className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  onClick={() =>
                    setOpenReplies((prev) => ({
                      ...prev,
                      [r.id]: !prev[r.id],
                    }))
                  }
                >
                  {openReplies[r.id] ? (
                    <>
                      <IoIosArrowUp /> Hide replies
                    </>
                  ) : (
                    <>
                      <IoIosArrowDown /> {r.replies.length} replies
                    </>
                  )}
                </button>

                {openReplies[r.id] && (
                  <CommentReplies
                    replies={r.replies}
                    parentId={r.id}
                    user={user}
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
                    level={level + 1}
                  />
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
