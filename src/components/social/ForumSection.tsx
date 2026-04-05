import { ScrollReveal } from "@/components/ScrollReveal";
import { useAuth } from "@/contexts/AuthContext";
import {
  createForumReply,
  createForumThread,
  getForumCategories,
  getForumThreadDetail,
  getForumThreads,
  type ForumCategoryRecord,
  type ForumThreadDetailRecord,
  type ForumThreadRecord,
} from "@/lib/database";
import { formatRelativeTime, getInitials } from "@/lib/strava";
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
import { AlertTriangle, Apple, Flag, Footprints, MessageSquare, Plus, Send, Target } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type CategoryMeta = {
  accent: string;
  icon: typeof Target;
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
  const [replyContent, setReplyContent] = useState("");

  const loadOverview = useCallback(async () => {
    setIsLoadingOverview(true);
    setForumError(null);

    try {
      const [categoriesData, threadsData] = await Promise.all([
        getForumCategories(),
        getForumThreads(selectedCategoryId === "all" ? undefined : selectedCategoryId),
      ]);

      setCategories(categoriesData);
      setThreads(threadsData);

      if (!newThreadCategoryId && categoriesData.length > 0) {
        setNewThreadCategoryId(categoriesData[0].id);
      }
    } catch {
      setForumError("Impossible de charger le forum pour le moment.");
    } finally {
      setIsLoadingOverview(false);
    }
  }, [newThreadCategoryId, selectedCategoryId]);

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
      );

      toast.success("Sujet créé.");
      setIsCreateOpen(false);
      setNewThreadTitle("");
      setNewThreadContent("");
      setSelectedCategoryId(thread.category_id);
      await loadOverview();
      setSelectedThreadId(thread.id);
    } catch {
      toast.error("Impossible de créer ce sujet.");
    } finally {
      setIsSubmittingThread(false);
    }
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
        <ScrollReveal delay={0.04}>
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
              <ScrollReveal key={`forum-category-skeleton-${index}`} delay={0.04 + index * 0.03}>
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
                <ScrollReveal key={category.id} delay={0.04 + index * 0.04}>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId((current) => (current === category.id ? "all" : category.id))}
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

      <div className="space-y-4">
        <ScrollReveal delay={0.12}>
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
              <Button variant="ghost" size="sm" onClick={() => setSelectedCategoryId("all")}>
                Voir tout
              </Button>
            ) : null}
          </div>
        </ScrollReveal>

        {isLoadingOverview
          ? Array.from({ length: 3 }, (_, index) => (
              <ScrollReveal key={`forum-thread-skeleton-${index}`} delay={0.14 + index * 0.04}>
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
              <ScrollReveal delay={0.14}>
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
              threads.map((thread, index) => {
                const author = formatAuthorName(thread.profile?.full_name, thread.profile?.username);

                return (
                  <ScrollReveal key={thread.id} delay={0.14 + index * 0.04}>
                    <button type="button" className="w-full text-left" onClick={() => setSelectedThreadId(thread.id)}>
                      <Card className="border-accent/20 bg-card/95 shadow-[0_12px_30px_hsl(var(--accent)/0.08)] transition-colors hover:border-accent/40">
                        <CardContent className="space-y-3 p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{thread.category?.title ?? "Forum"}</Badge>
                            {thread.is_pinned ? <Badge variant="secondary">Épinglé</Badge> : null}
                            {thread.is_locked ? <Badge variant="secondary">Verrouillé</Badge> : null}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">{thread.title}</h4>
                            <p className="mt-1 text-sm text-muted-foreground">{excerpt(thread.content)}</p>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{author}</span>
                            <span>{thread.repliesCount} réponses</span>
                            <span>{formatRelativeTime(thread.updated_at ?? thread.created_at ?? new Date().toISOString())}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  </ScrollReveal>
                );
              })
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
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {formatAuthorName(
                            selectedThreadDetail.profile?.full_name,
                            selectedThreadDetail.profile?.username,
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(selectedThreadDetail.created_at ?? new Date().toISOString())}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {getInitials(
                          formatAuthorName(
                            selectedThreadDetail.profile?.full_name,
                            selectedThreadDetail.profile?.username,
                          ),
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm leading-6 text-foreground">{selectedThreadDetail.content}</p>
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
                    selectedThreadDetail.replies.map((reply) => (
                      <Card key={reply.id} className="border-accent/20 bg-card/95">
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold">
                              {formatAuthorName(reply.profile?.full_name, reply.profile?.username)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(reply.created_at ?? new Date().toISOString())}
                            </p>
                          </div>
                          <p className="text-sm leading-6 text-foreground">{reply.content}</p>
                        </CardContent>
                      </Card>
                    ))
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
    </div>
  );
}
