import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import CommentList from "./CommentList";

export default function CommentSection() {
  const { title } = useParams();
  const [postId, setPostId] = useState(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetch("http://localhost:5006/blogs")
      .then((res) => res.json())
      .then((blogs) => {
        const slug = (txt) => txt.toLowerCase().replace(/\s+/g, "-");
        const post = blogs.find((b) => slug(b.title) === title);

        if (post) {
          setPostId(post.id);
          setComments(post.comments || []);
        }
      });
  }, [title, refresh]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const newComment = {
      id: Date.now(),
      userId: user.id,
      username: user.name,
      avatar: user.avatar,
      comment,
      date: Date.now(),
      replies: [],
    };

    setLoading(true);

    await fetch(`http://localhost:5006/blogs/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comments: [...comments, newComment] }),
    });

    setComment("");
    setLoading(false);
    setRefresh(!refresh);
    toast.success("Comment Added");
  };

  const handleReply = async (commentId, text) => {
    const updateReplies = (list) =>
      list.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: [
              ...c.replies,
              {
                id: Date.now(),
                userId: user.id,
                username: user.name,
                avatar: user.avatar,
                reply: text,
                date: Date.now(),
                replies: [],
              },
            ],
          };
        }

        return {
          ...c,
          replies: updateReplies(c.replies),
        };
      });

    const updated = updateReplies(comments);

    await fetch(`http://localhost:5006/blogs/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comments: updated }),
    });

    setRefresh(!refresh);
  };

  return (
    <div className="mt-10">
      <CommentList
        comments={comments}
        user={user}
        handleReply={handleReply}
        postId={postId}
        refresh={refresh}
        setRefresh={setRefresh}
      />

      {user ? (
        <form onSubmit={handleSubmit} className="mt-5">
          <textarea
            className="w-full resize-none rounded-lg border border-gray-300 py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
            placeholder="Write comment..."
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
            disabled={loading}
          >
            {loading ? "Posting..." : "Post Comment"}
          </button>
        </form>
      ) : (
        <div className="p-6 mt-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-gray-700 text-lg font-medium mb-3">
            Please login to comment
          </p>

          <a
            href="/auth"
            className="inline-block px-5 py-2 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 transition"
          >
            Login Now
          </a>
        </div>
      )}
    </div>
  );
}
