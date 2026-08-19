"use client";

import React, { useState, useEffect } from "react";
import { 
  getClassPosts, 
  createClassPost, 
  replyToClassPost, 
  reactToClassPost, 
  deleteClassPost, 
  type ClassPost,
  type Reply 
} from "../../lib/classFeedService";
import { MessageSquare, Send, Calendar, RefreshCw, AlertCircle, Trash2, Sparkles, BarChart2, Reply as ReplyIcon } from "lucide-react";

export default function TeacherFeedPage() {
  const [posts, setPosts] = useState<ClassPost[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [isReflectionPrompt, setIsReflectionPrompt] = useState(false);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [selectedRollupPost, setSelectedRollupPost] = useState<ClassPost | null>(null);

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setToken(t);
    if (t) {
      try {
        const payload = JSON.parse(atob(t.split(".")[1]));
        setCurrentUserId(payload.sub || "");
      } catch {}
      fetchFeed(t);
    } else {
      setErrorMsg("No auth token found. Please sign in at the student web app first to authenticate.");
      setLoading(false);
    }
  }, []);

  const fetchFeed = async (authToken: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const feed = await getClassPosts(authToken);
      setPosts(feed);
    } catch {
      setErrorMsg("Failed to load class feed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !token) return;

    setSubmitting(true);
    try {
      const res = await createClassPost(token, "", newPostContent.trim(), isReflectionPrompt);
      if (res?.success) {
        setNewPostContent("");
        setIsReflectionPrompt(false);
        await fetchFeed(token);
      } else {
        setErrorMsg("Failed to post announcement. Make sure you are assigned to a class group.");
      }
    } catch {
      setErrorMsg("An error occurred while posting.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const content = replyTexts[postId]?.trim();
    if (!content || !token) return;

    try {
      const res = await replyToClassPost(token, postId, content);
      if (res?.success) {
        setReplyTexts((prev) => ({ ...prev, [postId]: "" }));
        await fetchFeed(token);
      } else {
        alert("Failed to send reply.");
      }
    } catch {
      alert("Error replying to post.");
    }
  };

  const handleToggleReaction = async (postId: string, emoji: string) => {
    if (!token) return;
    try {
      const res = await reactToClassPost(token, postId, emoji);
      if (res?.success) {
        await fetchFeed(token);
        // Update selected rollup post if open
        if (selectedRollupPost && selectedRollupPost.id === postId) {
          const updated = posts.find(p => p.id === postId);
          if (updated) setSelectedRollupPost(updated);
        }
      }
    } catch {
      alert("Failed to toggle reaction.");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this post or reply?")) return;
    try {
      const res = await deleteClassPost(token, postId);
      if (res?.success) {
        await fetchFeed(token);
        if (selectedRollupPost && selectedRollupPost.id === postId) {
          setSelectedRollupPost(null);
        }
      } else {
        alert("Failed to delete post.");
      }
    } catch {
      alert("Error occurred during deletion.");
    }
  };

  const handleTextChange = (postId: string, text: string) => {
    setReplyTexts((prev) => ({ ...prev, [postId]: text }));
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(" ");
      return parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  const getWordCloudData = (replies: Reply[]) => {
    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "if", "then", "else", "when", "at", "by", "for", 
      "with", "about", "against", "between", "into", "through", "during", "before", "after", 
      "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", 
      "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", 
      "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", 
      "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", 
      "will", "just", "don", "should", "now", "i", "me", "my", "myself", "we", "our", "ours", 
      "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", 
      "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", 
      "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", 
      "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", 
      "has", "had", "having", "do", "does", "did", "doing", "would", "should", "could", 
      "ought", "i'm", "you're", "he's", "she's", "it's", "we're", "they're", "i've", "you've", 
      "we've", "they've", "i'd", "you'd", "he'd", "she'd", "we'd", "they'd", "i'll", "you'll", 
      "he'll", "she'll", "we'll", "they'll", "isn't", "aren't", "wasn't", "weren't", "hasn't", 
      "haven't", "hadn't", "doesn't", "don't", "didn't", "won't", "wouldn't", "shan't", 
      "shouldn't", "can't", "cannot", "couldn't", "mustn't", "let's", "that's", "who's", 
      "what's", "here's", "there's", "when's", "where's", "why's", "how's", "a", "b", "c", 
      "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", 
      "u", "v", "w", "x", "y", "z", "learned", "yesterday", "today", "about", "learned", "learn",
      "did", "you", "what"
    ]);

    const counts: Record<string, number> = {};
    replies.forEach((r) => {
      const text = r.content || "";
      const words = text
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
        .split(/\s+/);
      
      words.forEach((w: string) => {
        const trimmed = w.trim();
        if (trimmed && trimmed.length > 2 && !stopWords.has(trimmed)) {
          counts[trimmed] = (counts[trimmed] || 0) + 1;
        }
      });
    });

    return Object.entries(counts)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 30);
  };

  const renderWordCloud = (replies: Reply[]) => {
    const words = getWordCloudData(replies);
    if (words.length === 0) {
      return (
        <p className="text-xs text-gray-400 italic text-center p-4 bg-gray-50 border border-gray-150 rounded-2xl">
          Not enough distinct words to build a word cloud yet.
        </p>
      );
    }

    const maxVal = Math.max(...words.map(w => w.value));
    const minVal = Math.min(...words.map(w => w.value));

    return (
      <div className="flex flex-wrap items-center justify-center gap-3.5 p-6 bg-gray-50 border border-gray-100 rounded-2xl min-h-[160px]">
        {words.map(({ text, value }) => {
          const size = maxVal === minVal ? 16 : 12 + ((value - minVal) / (maxVal - minVal)) * 20;
          const colors = [
            "text-indigo-600",
            "text-indigo-500",
            "text-indigo-700",
            "text-violet-650",
            "text-violet-500",
            "text-slate-700",
            "text-slate-600",
            "text-indigo-900"
          ];
          const colorClass = colors[text.length % colors.length];
          return (
            <span
              key={text}
              style={{ fontSize: `${size}px` }}
              className={`font-extrabold tracking-tight transition-all hover:scale-110 duration-205 cursor-default ${colorClass}`}
              title={`${value} occurrences`}
            >
              {text}
            </span>
          );
        })}
      </div>
    );
  };

  const renderReactions = (postId: string, postReactions: Record<string, string[]> = {}) => {
    const emojis = ["👍", "❤️", "👏", "💡"];
    return (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {emojis.map((emoji) => {
          const userIds = postReactions[emoji] || [];
          const count = userIds.length;
          const hasReacted = currentUserId && userIds.includes(currentUserId);
          return (
            <button
              key={emoji}
              onClick={() => handleToggleReaction(postId, emoji)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                hasReacted
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                  : "bg-gray-50 border-gray-250 text-gray-500 hover:bg-gray-100"
              }`}
            >
              <span>{emoji}</span>
              {count > 0 && <span className="text-[10px]">{count}</span>}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            Class Feed & Announcements
          </h1>
          <p className="text-sm text-gray-500">
            Post discussion prompts or announcements and moderate replies in real-time.
          </p>
        </div>
        {token && (
          <button
            onClick={() => fetchFeed(token)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Feed
          </button>
        )}
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex gap-2 items-center">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* New Post Form */}
      {token && !errorMsg && (
        <form onSubmit={handleCreatePost} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Post an Announcement or Prompt
            </label>
            <textarea
              placeholder="Write a prompt (e.g., 'What did you learn yesterday?') or class announcement..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={3}
              required
              disabled={submitting}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isReflectionPrompt}
                onChange={(e) => setIsReflectionPrompt(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-650 focus:ring-indigo-500 border-gray-300 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Make this a Daily Reflection Prompt (triggers student dashboard card)
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !newPostContent.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Posting..." : "Publish to Class Feed"}
            </button>
          </div>
        </form>
      )}

      {/* Feed List */}
      {token && !loading && (
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center p-12 bg-white border border-gray-200 rounded-2xl">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-900 mb-1">No Announcements Yet</h3>
              <p className="text-xs text-gray-500">
                Start by posting your first question or update to the class.
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Parent Post */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm">
                        {getInitials(post.author.name, post.author.email)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">
                            {post.author.name || "Educator"}
                          </span>
                          <span className="text-[10px] uppercase font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            {post.author.role}
                          </span>
                          {post.is_reflection && (
                            <span className="text-[10px] uppercase font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              Reflection Prompt
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(post.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {post.is_reflection && (
                        <button
                          onClick={() => setSelectedRollupPost(post)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors cursor-pointer border border-indigo-100"
                          title="View student reflection analytics"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                          View Rollup
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Delete prompt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap pl-1">
                    {post.content}
                  </p>
                  {renderReactions(post.id, post.reactions)}
                </div>

                {/* Replies */}
                <div className="bg-gray-50/20 px-6 py-4 space-y-4">
                  {post.replies.length > 0 && (
                    <div className="space-y-3.5 mb-4">
                      {post.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3 items-start bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm relative group">
                          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                            {getInitials(reply.author.name, reply.author.email)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-gray-900">
                                  {reply.author.name || reply.author.email.split("@")[0]}
                                </span>
                                <span className={`text-[8px] uppercase font-mono px-1.5 py-0.2 rounded-full ${
                                  reply.author.role === "teacher"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}>
                                  {reply.author.role}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    const authorName = reply.author.name || reply.author.email.split("@")[0];
                                    setReplyTexts((prev) => ({
                                      ...prev,
                                      [post.id]: `@${authorName} ${prev[post.id] || ""}`.trim() + " "
                                    }));
                                  }}
                                  className="p-1 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                                  title="Reply to user"
                                >
                                  <ReplyIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeletePost(reply.id)}
                                  className="p-1 text-gray-400 hover:text-red-650 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Delete reply"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">
                              {reply.content}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {new Date(reply.created_at).toLocaleString()}
                            </span>
                            {renderReactions(reply.id, reply.reactions)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input Form */}
                  <form onSubmit={(e) => handleSendReply(post.id, e)} className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Reply to this announcement..."
                      value={replyTexts[post.id] || ""}
                      onChange={(e) => handleTextChange(post.id, e.target.value)}
                      className="flex-1 text-xs bg-white border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900"
                      required
                    />
                    <button
                      type="submit"
                      disabled={!replyTexts[post.id]?.trim()}
                      className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Selected Rollup Modal Overlay */}
      {selectedRollupPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-150">
                  Reflection Rollup
                </span>
                <h2 className="text-lg font-bold text-gray-900 mt-1">
                  &ldquo;{selectedRollupPost.content}&rdquo;
                </h2>
              </div>
              <button
                onClick={() => setSelectedRollupPost(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>

            {/* Word Cloud Section */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Word Cloud Rollup
              </h3>
              {selectedRollupPost.replies.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No responses submitted yet to generate a word cloud.</p>
              ) : (
                renderWordCloud(selectedRollupPost.replies)
              )}
            </div>

            {/* List of Replies Section */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Student Responses ({selectedRollupPost.replies.length})
              </h3>
              {selectedRollupPost.replies.length === 0 ? (
                <p className="text-xs text-gray-400 italic p-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  No students have replied to this reflection prompt yet.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                  {selectedRollupPost.replies.map((reply) => (
                    <div key={reply.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl relative group">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">
                            {reply.author.name || reply.author.email.split("@")[0]}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeletePost(reply.id)}
                          className="p-1 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Delete response"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {token && loading && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-8 h-8 text-indigo-650 animate-spin text-indigo-600" />
        </div>
      )}
    </div>
  );
}
