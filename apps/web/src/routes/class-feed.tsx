import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageWrapper } from "@/components/Card";
import { meetsMinTier } from "@edusim/rbac";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getClassPosts, 
  replyToClassPost, 
  reactToClassPost, 
  deleteClassPost, 
  type ClassPost 
} from "@/services/classFeedService";
import { MessageSquare, Send, Calendar, Trash2, ShieldAlert, Reply as ReplyIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/class-feed")({
  component: ClassFeedPage,
});

function ClassFeedPage() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  // Check access permissions
  const hasAccess = user && (user.role !== "student" || (user.age_tier && meetsMinTier(user.age_tier, "middle")));

  useEffect(() => {
    if (user && !hasAccess) {
      navigate({ to: "/unauthorized" as any });
    }
  }, [user, hasAccess, navigate]);

  // Fetch posts query
  const { data: posts = [], isLoading, error } = useQuery<ClassPost[]>({
    queryKey: ["classPosts", token, user?.class_id],
    queryFn: () => getClassPosts(token, user?.class_id || undefined),
    enabled: !!token && !!user?.class_id && !!hasAccess,
    refetchInterval: 8000, // Poll every 8 seconds for new replies/reactions
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      replyToClassPost(token, postId, content),
    onSuccess: (data, variables) => {
      if (data?.success) {
        toast.success("Reply posted!");
        setReplyTexts((prev) => ({ ...prev, [variables.postId]: "" }));
        queryClient.invalidateQueries({ queryKey: ["classPosts"] });
      } else {
        toast.error("Failed to post reply.");
      }
    },
    onError: () => {
      toast.error("An error occurred while posting your reply.");
    },
  });

  // Reaction mutation
  const reactMutation = useMutation({
    mutationFn: ({ postId, emoji }: { postId: string; emoji: string }) =>
      reactToClassPost(token, postId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classPosts"] });
    },
    onError: () => {
      toast.error("Failed to update reaction.");
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (postId: string) => deleteClassPost(token, postId),
    onSuccess: (data) => {
      if (data?.success) {
        toast.success("Deleted successfully.");
        queryClient.invalidateQueries({ queryKey: ["classPosts"] });
      } else {
        toast.error("Failed to delete.");
      }
    },
    onError: () => {
      toast.error("An error occurred during deletion.");
    }
  });

  if (!user || !hasAccess) {
    return null;
  }

  const handleSendReply = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const content = replyTexts[postId]?.trim();
    if (!content) return;

    replyMutation.mutate({ postId, content });
  };

  const handleTextChange = (postId: string, text: string) => {
    setReplyTexts((prev) => ({ ...prev, [postId]: text }));
  };

  const handleDelete = (postId: string) => {
    if (confirm("Are you sure you want to delete this post or reply?")) {
      deleteMutation.mutate(postId);
    }
  };

  const canDelete = (authorId: string, postClassId: string) => {
    if (user.id === authorId) return true;
    if (user.role === "admin" || user.role === "superadmin") return true;
    if (user.role === "teacher" && user.class_id === postClassId) return true;
    return false;
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(" ");
      return parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  const renderReactions = (postId: string, postReactions: Record<string, string[]>) => {
    const emojis = ["👍", "❤️", "👏", "💡"];
    return (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {emojis.map((emoji) => {
          const userIds = postReactions[emoji] || [];
          const count = userIds.length;
          const hasReacted = userIds.includes(user.id);
          return (
            <button
              key={emoji}
              onClick={() => reactMutation.mutate({ postId, emoji })}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                hasReacted
                  ? "bg-primary/15 border-primary text-primary"
                  : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/70"
              }`}
            >
              <span>{emoji}</span>
              {count > 0 && <span className="text-[10px] font-bold">{count}</span>}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <PageWrapper>
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              Class Group Feed
            </h1>
            <p className="text-muted-foreground mt-2">
              Stay updated with your educator's prompts, announcements, and collaborate with classmates.
            </p>
          </div>

          {/* Enrolled Status Alert */}
          {!user.class_id && (
            <div className="p-6 rounded-2xl border border-dashed border-border bg-card text-center max-w-md mx-auto my-12">
              <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-1">Not Enrolled</h3>
              <p className="text-xs text-muted-foreground">
                You are not currently enrolled in any class group. Reach out to your teacher to join a class.
              </p>
            </div>
          )}

          {/* Loading State */}
          {user.class_id && isLoading && (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-card border border-border rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-secondary rounded" />
                      <div className="h-3 w-20 bg-secondary rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-secondary rounded" />
                  <div className="h-4 w-3/4 bg-secondary rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {user.class_id && error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm">
              Failed to load class feed. Please try again later.
            </div>
          )}

          {/* Feed List */}
          {user.class_id && !isLoading && !error && (
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-40 text-primary" />
                  <h3 className="font-bold text-lg text-foreground mb-1">No Announcements Yet</h3>
                  <p className="text-sm">Your teacher hasn't posted any announcements or prompts to the feed yet.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    {/* Parent Post Content */}
                    <div className="p-6 border-b border-border/60 bg-gradient-to-b from-card to-secondary/15">
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                            {getInitials(post.author.name, post.author.email)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-foreground">
                                {post.author.name || post.author.email.split("@")[0]}
                              </span>
                              <span className="text-[10px] uppercase font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                {post.author.role}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(post.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>

                        {canDelete(post.author.id, post.class_id) && (
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all cursor-pointer"
                            title="Delete post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <p className="text-foreground text-base whitespace-pre-wrap pl-1 md:pl-2">
                        {post.content}
                      </p>

                      {renderReactions(post.id, post.reactions)}
                    </div>

                    {/* Replies Container */}
                    <div className="bg-secondary/10 px-6 py-4 space-y-4">
                      {post.replies.length > 0 && (
                        <div className="space-y-4 mb-4">
                          {post.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-3 items-start bg-card/65 border border-border/40 rounded-xl p-3.5 shadow-sm relative group">
                              <div className="w-8 h-8 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                                {getInitials(reply.author.name, reply.author.email)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-foreground">
                                      {reply.author.name || reply.author.email.split("@")[0]}
                                    </span>
                                    <span className={`text-[8px] uppercase font-mono px-1.5 py-0.2 rounded-full ${
                                      reply.author.role === "teacher" 
                                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                        : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
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
                                      className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                                      title="Reply to student"
                                    >
                                      <ReplyIcon className="w-3.5 h-3.5" />
                                    </button>

                                    {canDelete(reply.author.id, post.class_id) && (
                                      <button
                                        onClick={() => handleDelete(reply.id)}
                                        className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                                        title="Delete reply"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-foreground mt-1 whitespace-pre-wrap">
                                  {reply.content}
                                </p>
                                <span className="text-[10px] text-muted-foreground mt-2 block">
                                  {new Date(reply.created_at).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
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
                          placeholder="Write a reply..."
                          value={replyTexts[post.id] || ""}
                          onChange={(e) => handleTextChange(post.id, e.target.value)}
                          className="flex-1 text-sm bg-card border border-border/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground"
                          required
                          disabled={replyMutation.isPending}
                        />
                        <button
                          type="submit"
                          disabled={replyMutation.isPending || !replyTexts[post.id]?.trim()}
                          className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                        >
                          <Send className="w-4.5 h-4.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </PageWrapper>
    </ProtectedRoute>
  );
}
