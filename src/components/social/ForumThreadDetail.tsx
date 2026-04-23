import { useCallback, useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createForumReply,
  getForumLikedThreadIds,
  getForumThreadDetail,
  toggleForumLike,
  type ForumThreadDetailRecord,
} from "@/lib/database";
import { formatRelativeTime, getInitials } from "@/lib/runFormatters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ForumThreadDetailProps = {
  threadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after successful reply or like toggle so the list can refresh counts. */
  onUpdated?: () => void;
};

function authorLabel(profile: ForumThreadDetailRecord["profile"]) {
  return profile?.username?.trim() || profile?.full_name?.trim() || "Coureur";
}

export function ForumThreadDetail({ threadId, open, onOpenChange, onUpdated }: ForumThreadDetailProps) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<ForumThreadDetailRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeBusy, setIsLikeBusy] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isReplyBusy, setIsReplyBusy] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!threadId) return;
    setIsLoading(true);
    try {
      const data = await getForumThreadDetail(threadId);
      setDetail(data);
      setLikeCount(data.likes_count ?? 0);
      if (user?.id) {
        const likedIds = await getForumLikedThreadIds([threadId], user.id);
        setIsLiked(likedIds.includes(threadId));
      } else {
        setIsLiked(false);
      }
    } catch {
      toast.error("Impossible de charger ce sujet.");
      setDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [threadId, user?.id]);

  useEffect(() => {
    if (!open || !threadId) {
      setDetail(null);
      setReplyText("");
      return;
    }
    void loadDetail();
  }, [open, threadId, loadDetail]);

  const handleLike = async () => {
    if (!user) {
      toast.error("Connectez-vous pour aimer ce sujet.");
      return;
    }
    if (!threadId) return;
    setIsLikeBusy(true);
    try {
      const liked = await toggleForumLike(threadId, user.id);
      setIsLiked(liked);
      setLikeCount((c) => Math.max(0, liked ? c + 1 : c - 1));
      onUpdated?.();
    } catch {
      toast.error("Impossible de mettre à jour le j'aime.");
    } finally {
      setIsLikeBusy(false);
    }
  };

  const handleReply = async () => {
    if (!user) {
      toast.error("Connectez-vous pour répondre.");
      return;
    }
    if (!threadId || !replyText.trim()) return;
    setIsReplyBusy(true);
    try {
      await createForumReply(user.id, threadId, replyText.trim());
      setReplyText("");
      toast.success("Réponse publiée.");
      await loadDetail();
      onUpdated?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Impossible d'envoyer la réponse.";
      toast.error(msg);
    } finally {
      setIsReplyBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3 pr-12 text-left">
          <DialogTitle className="line-clamp-2 text-base font-semibold leading-snug">
            {detail?.title ?? "Discussion"}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {isLoading || !detail ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isLikeBusy}
                  onClick={() => void handleLike()}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm transition-colors",
                    isLiked ? "border-accent/40 text-accent" : "text-muted-foreground hover:text-foreground",
                    isLikeBusy && "opacity-60",
                  )}
                >
                  <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                  {likeCount}
                </button>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(detail.updated_at ?? detail.created_at ?? new Date().toISOString())}
                </span>
              </div>

              <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {getInitials(authorLabel(detail.profile))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{authorLabel(detail.profile)}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{detail.content}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Réponses ({detail.replies.length})
                </p>
                <ul className="space-y-3">
                  {detail.replies.length === 0 ? (
                    <li className="text-sm text-muted-foreground">Aucune réponse pour le moment.</li>
                  ) : (
                    detail.replies.map((reply) => (
                      <li key={reply.id} className="rounded-xl border border-border/60 bg-card/80 p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{authorLabel(reply.profile)}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(reply.created_at ?? new Date().toISOString())}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{reply.content}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="border-t border-border pt-4">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={user ? "Écrire une réponse..." : "Connectez-vous pour répondre."}
                  disabled={!user}
                  className="min-h-[96px] resize-none rounded-xl bg-muted/50"
                  rows={3}
                />
                <Button
                  type="button"
                  className="mt-2 w-full"
                  disabled={!user || !replyText.trim() || isReplyBusy}
                  onClick={() => void handleReply()}
                >
                  {isReplyBusy ? "Envoi..." : "Répondre"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
