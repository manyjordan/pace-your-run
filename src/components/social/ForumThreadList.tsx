import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useAuth } from "@/contexts/AuthContext";
import {
  createForumThread,
  getForumCategories,
  getForumThreads,
  type ForumCategoryRecord,
  type ForumThreadRecord,
} from "@/lib/database";
import { formatRelativeTime, getInitials } from "@/lib/runFormatters";
import { cn } from "@/lib/utils";
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
import { Lock, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { ForumThreadDetail } from "@/components/social/ForumThreadDetail";

type Props = {
  categoryId?: string;
};

const THREADS_PAGE_SIZE = 15;

function formatAuthorName(fullName?: string | null, username?: string | null) {
  return username || fullName || "Coureur";
}

function excerpt(content: string, maxLength = 160) {
  return content.length > maxLength ? `${content.slice(0, maxLength).trim()}...` : content;
}

export function ForumThreadList({ categoryId }: Props) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ForumCategoryRecord[]>([]);
  const [threads, setThreads] = useState<ForumThreadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmittingThread, setIsSubmittingThread] = useState(false);
  const [threadsPage, setThreadsPage] = useState(0);
  const [hasMoreThreads, setHasMoreThreads] = useState(true);
  const [newThreadCategoryId, setNewThreadCategoryId] = useState("");
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [newThreadVisibility, setNewThreadVisibility] = useState<"public" | "network">("public");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId],
  );

  const loadThreads = useCallback(
    async (pageNum = 0) => {
      if (pageNum === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const fetchedThreads = await getForumThreads(
          categoryId,
          THREADS_PAGE_SIZE,
          pageNum * THREADS_PAGE_SIZE,
        );
        if (pageNum === 0) {
          setThreads(fetchedThreads);
          setThreadsPage(0);
        } else {
          setThreads((prev) => [...prev, ...fetchedThreads]);
          setThreadsPage(pageNum);
        }
        setHasMoreThreads(fetchedThreads.length >= THREADS_PAGE_SIZE);
      } catch {
        setError("Impossible de charger les discussions.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [categoryId],
  );

  useEffect(() => {
    void getForumCategories()
      .then((data) => {
        setCategories(data);
        if (categoryId) {
          setNewThreadCategoryId(categoryId);
        } else if (data.length > 0) {
          setNewThreadCategoryId(data[0].id);
        }
      })
      .catch(() => setCategories([]));
  }, [categoryId]);

  useEffect(() => {
    setThreadsPage(0);
    setHasMoreThreads(true);
    setThreads([]);
    void loadThreads(0);
  }, [loadThreads]);

  const handleCreateThread = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour créer un sujet.");
      return;
    }
    const targetCategoryId = categoryId ?? newThreadCategoryId;
    if (!targetCategoryId || !newThreadTitle.trim() || !newThreadContent.trim()) {
      toast.error("Complétez la catégorie, le titre et le message.");
      return;
    }

    try {
      setIsSubmittingThread(true);
      await createForumThread(
        user.id,
        targetCategoryId,
        newThreadTitle.trim(),
        newThreadContent.trim(),
        newThreadVisibility,
      );
      setNewThreadTitle("");
      setNewThreadContent("");
      setNewThreadVisibility("public");
      setIsCreateOpen(false);
      toast.success("Sujet créé.");
      await loadThreads(0);
    } catch {
      toast.error("Impossible de créer ce sujet.");
    } finally {
      setIsSubmittingThread(false);
    }
  };

  return (
    <div className="space-y-4">
      <ForumThreadDetail
        threadId={selectedThreadId}
        open={selectedThreadId !== null}
        onOpenChange={(next) => {
          if (!next) {
            setSelectedThreadId(null);
            void loadThreads(0);
          }
        }}
        onUpdated={() => void loadThreads(0)}
      />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Discussions</h3>
          <p className="text-sm text-muted-foreground">
            {selectedCategory ? `Sujets de la catégorie ${selectedCategory.title}.` : "Tous les sujets du forum running."}
          </p>
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
              <DialogDescription>Ouvrez une discussion dans la catégorie la plus adaptée.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!categoryId ? (
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
              ) : null}

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
      </div>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {isLoading
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
            <Card className="border-accent/20 bg-card/95 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
              <CardContent className="space-y-3 p-6 text-center">
                <p className="text-sm font-semibold">Aucune discussion pour le moment</p>
                <p className="text-sm text-muted-foreground">
                  Lancez le premier sujet de cette catégorie pour démarrer les échanges.
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>Créer un sujet</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {threads.map((thread) => {
                const author = formatAuthorName(thread.profile?.full_name, thread.profile?.username);
                const initials = getInitials(author);
                return (
                  <ScrollReveal key={thread.id}>
                    <button
                      type="button"
                      className="w-full text-left transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                      onClick={() => setSelectedThreadId(thread.id)}
                    >
                    <Card className="border-accent/20 bg-card/95 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
                      <CardContent className="space-y-3 p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{thread.category?.title ?? "Forum"}</Badge>
                          {thread.visibility === "network" ? (
                            <Badge variant="secondary" className="gap-1">
                              <Lock className="h-3 w-3" />
                              Réseau
                            </Badge>
                          ) : null}
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
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(thread.updated_at ?? thread.created_at ?? new Date().toISOString())} ·{" "}
                              {thread.repliesCount} réponse{thread.repliesCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    </button>
                  </ScrollReveal>
                );
              })}

              {hasMoreThreads && !isLoadingMore && threads.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    void loadThreads(threadsPage + 1);
                  }}
                  className="w-full rounded-xl border border-border py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Voir plus
                </button>
              ) : null}

              {isLoadingMore ? (
                <div className="flex justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : null}
            </>
          )}
    </div>
  );
}
