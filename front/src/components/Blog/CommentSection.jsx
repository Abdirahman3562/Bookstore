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
    fetch("http://localhost:3000/api/blogs")
      .then((res) => res.json())
      .then((response) => {
        const blogs = response.data || [];
        const slug = (txt) => txt.toLowerCase().replace(/\s+/g, "-");
        const post = blogs.find((b) => slug(b.title) === title);

        if (post) {
          setPostId(post._id || post.id);
          setComments(post.comments || []);
        }
      })
      .catch((err) => console.error("Error fetching blog:", err));
  }, [title, refresh]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      userId: (user._id || user.id)?.toString(),
      username: user.name,
      avatar: user.avatar || "",
      comment,
      date: Date.now(),
      replies: [],
    };

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:3000/api/blogs/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: [...comments, newComment] }),
      });

      if (!response.ok) throw new Error("Failed to add comment");

      setComment("");
      setRefresh(!refresh);
      toast.success("Comment Added");
    } catch (err) {
      console.error("Error adding comment:", err);
      toast.error("Failed to add comment");
    } finally {
      setLoading(false);
    }
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

    try {
      const response = await fetch(`http://localhost:3000/api/blogs/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: updated }),
      });

      if (!response.ok) throw new Error("Failed to add reply");
      setRefresh(!refresh);
      toast.success("Reply added");
    } catch (err) {
      console.error("Error adding reply:", err);
      toast.error("Failed to add reply");
    }
  };

  return (
    <div className="mt-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
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
            className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none mb-4 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Write comment..."
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>

          <button
            className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg mt-2 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Posting..." : "Post Comment"}
          </button>
        </form>
      ) : (
        <div className="p-6 mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium mb-3">
            Please login to comment
          </p>

          <a
            href="/auth"
            className="inline-block px-5 py-2 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-md shadow hover:bg-blue-700 dark:hover:bg-blue-600 transition"
          >
            Login Now
          </a>
        </div>
      )}
    </div>
  );
}
