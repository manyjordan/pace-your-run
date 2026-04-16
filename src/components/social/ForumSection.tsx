import { ScrollReveal } from "@/components/ScrollReveal";
import { useAuth } from "@/contexts/AuthContext";
import {
  createForumReply,
  createForumThread,
  deleteForumReply,
  deleteForumThread,
  getMutualNetworkUserIds,
  getForumCategories,
  getForumLikedThreadIds,
  getForumThreadDetail,
  getForumThreads,
  toggleForumLike,
  updateForumReply,
  updateForumThread,
  type ForumCategoryRecord,
  type ForumThreadDetailRecord,
  type ForumThreadRecord,
} from "@/lib/database";
import { formatRelativeTime, getInitials } from "@/lib/runFormatters";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  Apple,
  Flag,
  Footprints,
  Heart,
  Lightbulb,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Send,
  Target,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type CategoryMeta = {
  accent: string;
  icon: LucideIcon;
  topics: string[];
};

const categoryMeta: Record<string, CategoryMeta> = {
  objectifs: {
    icon: Target,
    accent: "bg-accent/10 text-accent",
    topics: ["5 km / 10 km", "Semi / marathon", "Reprise et progression"],
  },
  nutrition: {
    icon: Apple,
    accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    topics: ["Avant la séance", "Pendant l'effort", "Récupération"],
  },
  equipment: {
    icon: Footprints,
    accent: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    topics: ["Chaussures route", "Capteurs et montres", "Équipement selon la météo"],
  },
  "preparation-course": {
    icon: Flag,
    accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    topics: ["Plan d'entraînement", "Affûtage", "Stratégie de course"],
  },
  suggestions: {
    icon: Lightbulb,
    accent: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    topics: ["Nouvelles fonctionnalités", "Améliorations existantes", "Bugs rencontrés"],
  },
  organiser: {
    icon: MapPin,
    accent: "bg-orange-500/10 text-orange-500 dark:text-orange-400",
    topics: ["Run débutants", "Run intermédiaires", "Trail", "Soirée running"],
  },
  autres: {
    icon: MessageCircle,
    accent: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    topics: ["Général", "Présentations", "Hors-sujet"],
  },
};

function formatAuthorName(fullName?: string | null, username?: string | null) {
  return username || fullName || "Coureur";
}

function excerpt(content: string, maxLength = 160) {
  return content.length > maxLength ? `${content.slice(0, maxLength).trim()}...` : content;
}

export function ForumSection() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ForumCategoryRecord[]>([]);
  const [threads, setThreads] = useState<ForumThreadRecord[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThreadDetail, setSelectedThreadDetail] = useState<ForumThreadDetailRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSubmittingThread, setIsSubmittingThread] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [forumError, setForumError] = useState<string | null>(null);
  const [newThreadCategoryId, setNewThreadCategoryId] = useState("");
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [newThreadVisibility, setNewThreadVisibility] = useState<"public" | "network">("public");
  const [replyContent, setReplyContent] = useState("");
  const [mutualNetworkIds, setMutualNetworkIds] = useState<string[]>([]);
  const [likedThreadIds, setLikedThreadIds] = useState<string[]>([]);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editThreadContent, setEditThreadContent] = useState("");
  const [isSavingThread, setIsSavingThread] = useState(false);
  const [deleteThreadId, setDeleteThreadId] = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState("");
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [deleteReplyId, setDeleteReplyId] = useState<string | null>(null);
  const [likeBusyThreadId, setLikeBusyThreadId] = useState<string | null>(null);
  const [likeAnimatingThreadId, setLikeAnimatingThreadId] = useState<string | null>(null);
  const [likeBurstThreadId, setLikeBurstThreadId] = useState<string | null>(null);
  const [threadsPage, setThreadsPage] = useState(0);
  const [hasMoreThreads, setHasMoreThreads] = useState(true);
  const [isLoadingMoreThreads, setIsLoadingMoreThreads] = useState(false);
  const discussionsRef = useRef<HTMLDivElement>(null);

  const THREADS_PAGE_SIZE = 15;
  const mutualNetworkSet = useMemo(() => new Set(mutualNetworkIds), [mutualNetworkIds]);

  const loadThreads = useCallback(
    async (categoryId: string, pageNum = 0, allowedNetworkIds: string[] = mutualNetworkIds) => {
      if (pageNum === 0) {
        setThreads([]);
      }
      if (pageNum === 0) {
        setIsLoadingOverview(true);
      } else {
        setIsLoadingMoreThreads(true);
      }
      setForumError(null);

      try {
        const fetchedThreads = await getForumThreads(
          categoryId === "all" ? undefined : categoryId,
          THREADS_PAGE_SIZE,
          pageNum * THREADS_PAGE_SIZE,
        );
        const allowedNetworkSet = new Set(allowedNetworkIds);
        const newThreads = fetchedThreads.filter(
          (thread) =>
            thread.visibility !== "network" ||
            thread.user_id === user?.id ||
            allowedNetworkSet.has(thread.user_id),
        );

        if (pageNum === 0) {
          setThreads(newThreads);
        } else {
          setThreads((prev) => [...prev, ...newThreads]);
        }
        setHasMoreThreads(fetchedThreads.length === THREADS_PAGE_SIZE);

        if (user?.id && newThreads.length > 0) {
          try {
            const liked = await getForumLikedThreadIds(
              newThreads.map((t) => t.id),
              user.id,
            );
            if (pageNum === 0) {
              setLikedThreadIds(liked);
            } else {
              setLikedThreadIds((prev) => [...new Set([...prev, ...liked])]);
            }
          } catch {
            if (pageNum === 0) {
              setLikedThreadIds([]);
            }
          }
        } else if (pageNum === 0) {
          setLikedThreadIds([]);
        }
      } catch {
        setForumError("Impossible de charger le forum pour le moment.");
      } finally {
        setIsLoadingOverview(false);
        setIsLoadingMoreThreads(false);
      }
    },
    [mutualNetworkIds, user?.id],
  );

  const loadOverview = useCallback(async () => {
    setThreadsPage(0);
    setHasMoreThreads(true);
    setForumError(null);
    setIsLoadingOverview(true);

    try {
      const categoriesData = await getForumCategories();
      setCategories(categoriesData);
      if (user?.id) {
        const networkIds = await getMutualNetworkUserIds(user.id);
        setMutualNetworkIds(networkIds);
      } else {
        setMutualNetworkIds([]);
      }

      if (!newThreadCategoryId && categoriesData.length > 0) {
        setNewThreadCategoryId(categoriesData[0].id);
      }
    } catch {
      setForumError("Impossible de charger le forum pour le moment.");
      setIsLoadingOverview(false);
      return;
    }

    const networkIdsForFilter = user?.id ? await getMutualNetworkUserIds(user.id) : [];
    await loadThreads(selectedCategoryId, 0, networkIdsForFilter);
  }, [loadThreads, newThreadCategoryId, selectedCategoryId, user?.id]);

  const loadThreadDetail = useCallback(async (threadId: string) => {
    setIsLoadingThread(true);

    try {
      const detail = await getForumThreadDetail(threadId);
      setSelectedThreadDetail(detail);
    } catch {
      toast.error("Impossible de charger ce sujet.");
      setSelectedThreadId(null);
      setSelectedThreadDetail(null);
    } finally {
      setIsLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!selectedThreadId) {
      setSelectedThreadDetail(null);
      setReplyContent("");
      return;
    }

    void loadThreadDetail(selectedThreadId);
  }, [loadThreadDetail, selectedThreadId]);

  useEffect(() => {
    if (!selectedThreadDetail) return;
    const canView =
      selectedThreadDetail.visibility !== "network" ||
      selectedThreadDetail.user_id === user?.id ||
      mutualNetworkSet.has(selectedThreadDetail.user_id);
    if (!canView) {
      toast.error("Ce sujet est réservé au réseau de l'auteur.");
      setSelectedThreadId(null);
      setSelectedThreadDetail(null);
    }
  }, [mutualNetworkSet, selectedThreadDetail, user?.id]);

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const handleCreateThread = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour créer un sujet.");
      return;
    }

    if (!newThreadCategoryId || !newThreadTitle.trim() || !newThreadContent.trim()) {
      toast.error("Complétez la catégorie, le titre et le message.");
      return;
    }

    try {
      setIsSubmittingThread(true);
      const thread = await createForumThread(
        user.id,
        newThreadCategoryId,
        newThreadTitle.trim(),
        newThreadContent.trim(),
        newThreadVisibility,
      );

      toast.success("Sujet créé.");
      setIsCreateOpen(false);
      setNewThreadTitle("");
      setNewThreadContent("");
      setNewThreadVisibility("public");
      setSelectedCategoryId(thread.category_id);
      await loadOverview();
      setSelectedThreadId(thread.id);
    } catch {
      toast.error("Impossible de créer ce sujet.");
    } finally {
      setIsSubmittingThread(false);
    }
  };

  const scrollToDiscussions = () => {
    window.setTimeout(() => {
      discussionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleCategoryClick = (categoryId: string) => {
    setThreadsPage(0);
    setHasMoreThreads(true);
    setSelectedCategoryId((current) => (current === categoryId ? "all" : categoryId));
    scrollToDiscussions();
  };

  const handleReply = async () => {
    if (!user || !selectedThreadDetail) {
      toast.error("Vous devez être connecté pour répondre.");
      return;
    }

    if (!replyContent.trim()) {
      toast.error("Votre réponse est vide.");
      return;
    }

    try {
      setIsSubmittingReply(true);
      await createForumReply(user.id, selectedThreadDetail.id, replyContent.trim());
      setReplyContent("");
      toast.success("Réponse publiée.");
      await Promise.all([loadOverview(), loadThreadDetail(selectedThreadDetail.id)]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de publier cette réponse.";
      toast.error(message);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const threadLikeCount = (t: ForumThreadRecord | ForumThreadDetailRecord) => t.likes_count ?? 0;

  const applyThreadLikeOptimistic = (threadId: string, liked: boolean, count: number) => {
    setThreads((prev) => prev.map((row) => (row.id === threadId ? { ...row, likes_count: count } : row)));
    setSelectedThreadDetail((prev) => (prev?.id === threadId ? { ...prev, likes_count: count } : prev));
    setLikedThreadIds((prev) => {
      if (liked) {
        return prev.includes(threadId) ? prev : [...prev, threadId];
      }
      return prev.filter((id) => id !== threadId);
    });
  };

  const handleToggleThreadLike = async (threadId: string) => {
    if (!user) {
      toast.error("Connectez-vous pour aimer un sujet.");
      return;
    }
    if (likeBusyThreadId) return;

    setLikeAnimatingThreadId(threadId);
    window.setTimeout(() => setLikeAnimatingThreadId(null), 600);

    const fromList = threads.find((t) => t.id === threadId);
    const fromDetail = selectedThreadDetail?.id === threadId ? selectedThreadDetail : null;
    const base = fromList ?? fromDetail;
    const prevLiked = likedThreadIds.includes(threadId);
    const prevCount = base ? threadLikeCount(base) : 0;
    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, nextLiked ? prevCount + 1 : prevCount - 1);

    if (!prevLiked) {
      setLikeBurstThreadId(threadId);
      window.setTimeout(() => setLikeBurstThreadId(null), 600);
    }

    applyThreadLikeOptimistic(threadId, nextLiked, nextCount);
    setLikeBusyThreadId(threadId);

    try {
      await toggleForumLike(threadId, user.id);
    } catch {
      applyThreadLikeOptimistic(threadId, prevLiked, prevCount);
      toast.error("Impossible de mettre à jour le j'aime.");
    } finally {
      setLikeBusyThreadId(null);
    }
  };

  const handleSaveThreadEdit = async (threadId: string) => {
    if (!user) return;
    const trimmed = editThreadContent.trim();
    if (!trimmed) {
      toast.error("Le message ne peut pas être vide.");
      return;
    }
    try {
      setIsSavingThread(true);
      await updateForumThread(threadId, user.id, { content: trimmed });
      setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, content: trimmed } : t)));
      setSelectedThreadDetail((prev) => (prev?.id === threadId ? { ...prev, content: trimmed } : prev));
      setEditingThreadId(null);
      toast.success("Sujet mis à jour.");
    } catch {
      toast.error("Impossible d'enregistrer les modifications.");
    } finally {
      setIsSavingThread(false);
    }
  };

  const handleConfirmDeleteThread = async () => {
    if (!user || !deleteThreadId) return;
    try {
      await deleteForumThread(deleteThreadId, user.id);
      setThreads((prev) => prev.filter((t) => t.id !== deleteThreadId));
      setLikedThreadIds((prev) => prev.filter((id) => id !== deleteThreadId));
      if (selectedThreadId === deleteThreadId) {
        setSelectedThreadId(null);
        setSelectedThreadDetail(null);
      }
      setDeleteThreadId(null);
      toast.success("Sujet supprimé.");
      await loadOverview();
    } catch {
      toast.error("Impossible de supprimer ce sujet.");
    }
  };

  const handleSaveReplyEdit = async (replyId: string) => {
    if (!user) return;
    const trimmed = editReplyContent.trim();
    if (!trimmed) {
      toast.error("La réponse ne peut pas être vide.");
      return;
    }
    try {
      setIsSavingReply(true);
      await updateForumReply(replyId, user.id, trimmed);
      setSelectedThreadDetail((prev) =>
        prev
          ? {
              ...prev,
              replies: prev.replies.map((r) => (r.id === replyId ? { ...r, content: trimmed } : r)),
            }
          : null,
      );
      setEditingReplyId(null);
      toast.success("Réponse mise à jour.");
      await loadOverview();
    } catch {
      toast.error("Impossible d'enregistrer la réponse.");
    } finally {
      setIsSavingReply(false);
    }
  };

  const handleConfirmDeleteReply = async () => {
    if (!user || !deleteReplyId || !selectedThreadDetail) return;
    try {
      await deleteForumReply(deleteReplyId, user.id);
      setSelectedThreadDetail((prev) =>
        prev
          ? {
              ...prev,
              replies: prev.replies.filter((r) => r.id !== deleteReplyId),
              repliesCount: Math.max(0, prev.repliesCount - 1),
            }
          : null,
      );
      setDeleteReplyId(null);
      toast.success("Réponse supprimée.");
      await loadOverview();
    } catch {
      toast.error("Impossible de supprimer cette réponse.");
    }
  };

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <Card className="border-accent/30 bg-card/95 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Forum running</h2>
                <p className="text-sm text-muted-foreground">
                  Posez vos questions, partagez vos retours d&apos;expérience et échangez autour de vos objectifs, de
                  la nutrition, du matériel et de la préparation course.
                </p>
              </div>
              <div className="rounded-xl bg-accent/10 p-2.5 text-accent">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{categories.length} catégories</Badge>
              <Badge variant="secondary">{threads.length} sujets visibles</Badge>
              {activeCategory ? <Badge variant="outline">Filtre : {activeCategory.title}</Badge> : null}
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Créer un sujet
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nouveau sujet</DialogTitle>
                  <DialogDescription>
                    Ouvrez une discussion dans la catégorie la plus adaptée à votre question.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select value={newThreadCategoryId} onValueChange={setNewThreadCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input
                      value={newThreadTitle}
                      onChange={(event) => setNewThreadTitle(event.target.value)}
                      placeholder="Ex. Comment préparer un premier semi ?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      value={newThreadContent}
                      onChange={(event) => setNewThreadContent(event.target.value)}
                      placeholder="Décrivez votre question ou votre retour d'expérience."
                      className="min-h-[140px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Visibilité</Label>
                    <div className="inline-flex rounded-lg border border-border p-1">
                      <button
                        type="button"
                        className={cn(
                          "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                          newThreadVisibility === "public"
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => setNewThreadVisibility("public")}
                      >
                        Tout le monde
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                          newThreadVisibility === "network"
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => setNewThreadVisibility("network")}
                      >
                        Mon réseau uniquement
                      </button>
                    </div>
                  </div>

                  <Button onClick={() => void handleCreateThread()} disabled={isSubmittingThread} className="w-full">
                    {isSubmittingThread ? "Publication..." : "Publier le sujet"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </ScrollReveal>

      {forumError ? (
        <ScrollReveal>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">{forumError}</p>
              </div>
              <Button variant="outline" onClick={() => void loadOverview()}>
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </ScrollReveal>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {isLoadingOverview
          ? Array.from({ length: 4 }, (_, index) => (
              <ScrollReveal key={`forum-category-skeleton-${index}`}>
                <Card className="border-accent/20 bg-card/95">
                  <CardContent className="space-y-3 p-5">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))
          : categories.map((category, index) => {
              const meta = categoryMeta[category.id];
              const Icon = meta?.icon ?? MessageSquare;
              const isActive = selectedCategoryId === category.id;

              return (
                <ScrollReveal key={category.id}>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(category.id)}
                    className="text-left"
                  >
                    <Card
                      className={`h-full border-accent/20 bg-card/95 shadow-[0_12px_30px_hsl(var(--accent)/0.08)] transition-all ${
                        isActive ? "border-accent shadow-[0_16px_36px_hsl(var(--accent)/0.16)]" : "hover:border-accent/40"
                      }`}
                    >
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className={`rounded-xl p-2 ${meta?.accent ?? "bg-accent/10 text-accent"}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <h3 className="text-sm font-semibold">{category.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          </div>
                          <Badge variant="outline">{category.threadsCount} sujets</Badge>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sous-thèmes</p>
                          <div className="flex flex-wrap gap-2">
                            {(meta?.topics ?? []).map((topic) => (
                              <Badge key={topic} variant="secondary">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {category.latestActivityAt
                            ? `Dernière activité ${formatRelativeTime(category.latestActivityAt)}`
                            : "Aucune discussion pour l'instant"}
                        </p>
                      </CardContent>
                    </Card>
                  </button>
                </ScrollReveal>
              );
            })}
      </div>

      <div ref={discussionsRef} className="space-y-4">
        <ScrollReveal>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Discussions</h3>
              <p className="text-sm text-muted-foreground">
                {activeCategory
                  ? `Sujets de la catégorie ${activeCategory.title}.`
                  : "Tous les sujets du forum running."}
              </p>
            </div>
            {selectedCategoryId !== "all" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setThreadsPage(0);
                  setHasMoreThreads(true);
                  setSelectedCategoryId("all");
                  scrollToDiscussions();
                }}
              >
                Voir tout
              </Button>
            ) : null}
          </div>
        </ScrollReveal>

        {isLoadingOverview
          ? Array.from({ length: 3 }, (_, index) => (
              <ScrollReveal key={`forum-thread-skeleton-${index}`}>
                <Card className="border-accent/20 bg-card/95">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))
          : threads.length === 0 ? (
              <ScrollReveal>
                <Card className="border-accent/20 bg-card/95 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
                  <CardContent className="space-y-3 p-6 text-center">
                    <p className="text-sm font-semibold">Aucune discussion pour le moment</p>
                    <p className="text-sm text-muted-foreground">
                      Lancez le premier sujet de cette catégorie pour démarrer les échanges.
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)}>Créer un sujet</Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ) : (
              <>
                {threads.map((thread, index) => {
                const author = formatAuthorName(thread.profile?.full_name, thread.profile?.username);
                const initials = getInitials(author);
                const isOwner = Boolean(user?.id && thread.user_id === user.id);
                const liked = likedThreadIds.includes(thread.id);
                const likeCount = threadLikeCount(thread);
                const isEditing = editingThreadId === thread.id;

                return (
                  <ScrollReveal key={thread.id}>
                    <Card className="relative border-accent/20 bg-card/95 shadow-[0_12px_30px_hsl(var(--accent)/0.08)] transition-colors hover:border-accent/40">
                      <CardContent className="space-y-3 p-5">
                        {isOwner ? (
                          <div className="absolute right-3 top-3 z-10">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions du sujet</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  disabled={isEditing}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setEditingThreadId(thread.id);
                                    setEditThreadContent(thread.content);
                                  }}
                                >
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setDeleteThreadId(thread.id);
                                  }}
                                >
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ) : null}

                        {isEditing ? (
                          <div className={cn("space-y-3", isOwner && "pr-10")}>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{thread.category?.title ?? "Forum"}</Badge>
                              {thread.is_pinned ? <Badge variant="secondary">Épinglé</Badge> : null}
                              {thread.is_locked ? <Badge variant="secondary">Verrouillé</Badge> : null}
                            </div>
                            <h4 className="text-sm font-semibold">{thread.title}</h4>
                            <Textarea
                              value={editThreadContent}
                              onChange={(e) => setEditThreadContent(e.target.value)}
                              className="min-h-[120px] resize-none"
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                disabled={isSavingThread}
                                onClick={() => void handleSaveThreadEdit(thread.id)}
                              >
                                {isSavingThread ? "Enregistrement..." : "Sauvegarder"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isSavingThread}
                                onClick={() => {
                                  setEditingThreadId(null);
                                  setEditThreadContent("");
                                }}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={cn("w-full space-y-3 text-left", isOwner && "pr-10")}
                            onClick={() => setSelectedThreadId(thread.id)}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{thread.category?.title ?? "Forum"}</Badge>
                              {thread.is_pinned ? <Badge variant="secondary">Épinglé</Badge> : null}
                              {thread.is_locked ? <Badge variant="secondary">Verrouillé</Badge> : null}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold">{thread.title}</h4>
                              <p className="mt-1 text-sm text-muted-foreground">{excerpt(thread.content)}</p>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold leading-tight">{author}</p>
                                  {thread.visibility === "network" ? (
                                    <Badge variant="secondary" className="gap-1">
                                      <Lock className="h-3 w-3" />
                                      Réseau
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatRelativeTime(thread.updated_at ?? thread.created_at ?? new Date().toISOString())}{" "}
                                  · {thread.repliesCount} réponse{thread.repliesCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                          </button>
                        )}

                        <div className="flex justify-end border-t border-border/60 pt-3">
                          <button
                            type="button"
                            className="flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
                            disabled={likeBusyThreadId === thread.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void handleToggleThreadLike(thread.id);
                            }}
                          >
                            <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                              <AnimatePresence>
                                {likeBurstThreadId === thread.id ? (
                                  <>
                                    {[0, 1, 2, 3].map((i) => (
                                      <motion.div
                                        key={i}
                                        className="absolute inset-0 rounded-full border border-red-400"
                                        initial={{ scale: 0.5, opacity: 0.8 }}
                                        animate={{ scale: 2.5, opacity: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{
                                          duration: 0.5,
                                          delay: i * 0.05,
                                          ease: "easeOut",
                                        }}
                                      />
                                    ))}
                                  </>
                                ) : null}
                              </AnimatePresence>
                              <motion.div
                                className="relative z-[1]"
                                animate={
                                  likeAnimatingThreadId === thread.id
                                    ? {
                                        scale: [1, 1.4, 0.9, 1.1, 1],
                                        rotate: [0, -10, 10, -5, 0],
                                      }
                                    : { scale: 1, rotate: 0 }
                                }
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                              >
                                <Heart
                                  className={cn(
                                    "h-4 w-4 shrink-0",
                                    liked ? "fill-red-500 text-red-500" : "text-muted-foreground fill-none",
                                  )}
                                />
                              </motion.div>
                            </div>
                            <span
                              className={cn(
                                "text-sm font-medium tabular-nums transition-colors duration-200",
                                liked ? "text-red-500" : "text-foreground",
                              )}
                            >
                              {likeCount}
                            </span>
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                );
                })}

                {hasMoreThreads && !isLoadingMoreThreads && threads.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = threadsPage + 1;
                      setThreadsPage(next);
                      void loadThreads(selectedCategoryId, next);
                    }}
                    className="w-full rounded-xl border border-border py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Voir plus de sujets
                  </button>
                )}

                {isLoadingMoreThreads && (
                  <div className="flex justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  </div>
                )}
              </>
            )}
      </div>

      <Dialog
        open={Boolean(selectedThreadId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedThreadId(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {isLoadingThread || !selectedThreadDetail ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{selectedThreadDetail.title}</DialogTitle>
                <DialogDescription>
                  {selectedThreadDetail.category?.title ?? "Forum"} ·{" "}
                  {formatRelativeTime(selectedThreadDetail.created_at ?? new Date().toISOString())}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Card className="border-accent/20 bg-card/95">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                        {getInitials(
                          formatAuthorName(
                            selectedThreadDetail.profile?.full_name,
                            selectedThreadDetail.profile?.username,
                          ),
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-sm font-semibold leading-tight">
                          {formatAuthorName(
                            selectedThreadDetail.profile?.full_name,
                            selectedThreadDetail.profile?.username,
                          )}
                        </p>
                        {selectedThreadDetail.visibility === "network" ? (
                          <Badge variant="secondary" className="w-fit gap-1">
                            <Lock className="h-3 w-3" />
                            Réseau
                          </Badge>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(selectedThreadDetail.created_at ?? new Date().toISOString())}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-foreground">{selectedThreadDetail.content}</p>
                    <div className="flex justify-end border-t border-border/60 pt-3">
                      <button
                        type="button"
                        className="flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
                        disabled={likeBusyThreadId === selectedThreadDetail.id}
                        onClick={() => void handleToggleThreadLike(selectedThreadDetail.id)}
                      >
                        <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                          <AnimatePresence>
                            {likeBurstThreadId === selectedThreadDetail.id ? (
                              <>
                                {[0, 1, 2, 3].map((i) => (
                                  <motion.div
                                    key={i}
                                    className="absolute inset-0 rounded-full border border-red-400"
                                    initial={{ scale: 0.5, opacity: 0.8 }}
                                    animate={{ scale: 2.5, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{
                                      duration: 0.5,
                                      delay: i * 0.05,
                                      ease: "easeOut",
                                    }}
                                  />
                                ))}
                              </>
                            ) : null}
                          </AnimatePresence>
                          <motion.div
                            className="relative z-[1]"
                            animate={
                              likeAnimatingThreadId === selectedThreadDetail.id
                                ? {
                                    scale: [1, 1.4, 0.9, 1.1, 1],
                                    rotate: [0, -10, 10, -5, 0],
                                  }
                                : { scale: 1, rotate: 0 }
                            }
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                          >
                            <Heart
                              className={cn(
                                "h-4 w-4 shrink-0",
                                likedThreadIds.includes(selectedThreadDetail.id)
                                  ? "fill-red-500 text-red-500"
                                  : "text-muted-foreground fill-none",
                              )}
                            />
                          </motion.div>
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium tabular-nums transition-colors duration-200",
                            likedThreadIds.includes(selectedThreadDetail.id)
                              ? "text-red-500"
                              : "text-foreground",
                          )}
                        >
                          {threadLikeCount(selectedThreadDetail)}
                        </span>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Réponses</h4>
                    <span className="text-xs text-muted-foreground">{selectedThreadDetail.replies.length} message(s)</span>
                  </div>

                  {selectedThreadDetail.replies.length === 0 ? (
                    <Card className="border-accent/20 bg-card/95">
                      <CardContent className="p-4 text-sm text-muted-foreground">
                        Aucune réponse pour le moment. Soyez le premier à répondre.
                      </CardContent>
                    </Card>
                  ) : (
                    selectedThreadDetail.replies.map((reply) => {
                      const replyOwner = Boolean(user?.id && reply.user_id === user.id);
                      const editingReply = editingReplyId === reply.id;

                      return (
                        <Card key={reply.id} className="border-accent/20 bg-card/95">
                          <CardContent className="space-y-2 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                    {getInitials(
                                      formatAuthorName(reply.profile?.full_name, reply.profile?.username),
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold">
                                      {formatAuthorName(reply.profile?.full_name, reply.profile?.username)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatRelativeTime(reply.created_at ?? new Date().toISOString())}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              {replyOwner ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Actions</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      disabled={editingReply}
                                      onClick={() => {
                                        setEditingReplyId(reply.id);
                                        setEditReplyContent(reply.content);
                                      }}
                                    >
                                      Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => setDeleteReplyId(reply.id)}
                                    >
                                      Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : null}
                            </div>
                            {editingReply ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editReplyContent}
                                  onChange={(e) => setEditReplyContent(e.target.value)}
                                  className="min-h-[100px] resize-none"
                                />
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    disabled={isSavingReply}
                                    onClick={() => void handleSaveReplyEdit(reply.id)}
                                  >
                                    {isSavingReply ? "Enregistrement..." : "Sauvegarder"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isSavingReply}
                                    onClick={() => {
                                      setEditingReplyId(null);
                                      setEditReplyContent("");
                                    }}
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm leading-6 text-foreground">{reply.content}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>

                <div className="space-y-2 rounded-xl border border-accent/20 bg-card/95 p-4">
                  <Label>Répondre</Label>
                  <Textarea
                    value={replyContent}
                    onChange={(event) => setReplyContent(event.target.value)}
                    placeholder="Ajoutez votre réponse ou votre retour d'expérience."
                    className="min-h-[120px] resize-none"
                    disabled={selectedThreadDetail.is_locked}
                  />
                  <Button
                    onClick={() => void handleReply()}
                    disabled={selectedThreadDetail.is_locked || isSubmittingReply}
                    className="w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {selectedThreadDetail.is_locked
                      ? "Sujet verrouillé"
                      : isSubmittingReply
                        ? "Publication..."
                        : "Publier la réponse"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteThreadId !== null} onOpenChange={(open) => !open && setDeleteThreadId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce sujet ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => void handleConfirmDeleteThread()}
            >
              Supprimer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteReplyId !== null} onOpenChange={(open) => !open && setDeleteReplyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette réponse ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => void handleConfirmDeleteReply()}
            >
              Supprimer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
