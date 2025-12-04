import React from "react";
import { FaThumbsUp } from "react-icons/fa";

function timeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diff = (now - past) / 1000;

  if (diff < 60) return "Just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
  return Math.floor(diff / 604800) + "w ago";
}

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

export default function ReplyItem({
  reply,
  onReply,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText
}) {
  return (
    <div>
      <div className="flex gap-2 mt-3 ml-5">
        {reply.avatar ? (
          <img src={reply.avatar} className="w-8 h-8 rounded-full border" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center font-semibold">
            {getInitials(reply.username)}
          </div>
        )}

        <div className="bg-gray-100 p-2 rounded-lg max-w-[80%]">
          <p className="font-semibold text-sm">{reply.username}</p>
          <p className="text-sm">{reply.reply}</p>

          <div className="flex items-center gap-4 text-xs text-blue-600 mt-1">
            <span>{timeAgo(reply.date)}</span>

            <button className="hover:underline flex items-center gap-1">
              <FaThumbsUp /> Like
            </button>

            <button
              className="hover:underline"
              onClick={() => setReplyingTo(reply.id)}
            >
              Reply
            </button>

            <button className="hover:underline">Share</button>
          </div>

          {/* REPLY INPUT FOR THIS REPLY */}
          {replyingTo === reply.id && (
            <div className="mt-2 ml-5">
              <textarea
                rows="2"
                className="w-full border p-2 rounded"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded mt-1"
                onClick={() => onReply(reply)}
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RECURSIVE CHILDREN */}
      {reply.replies?.map((child) => (
        <ReplyItem
          key={child.id}
          reply={child}
          onReply={onReply}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          replyText={replyText}
          setReplyText={setReplyText}
        />
      ))}
    </div>
  );
}
