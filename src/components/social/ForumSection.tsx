import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getForumCategories, type ForumCategoryRecord } from "@/lib/database";
import { formatRelativeTime } from "@/lib/runFormatters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, MessageSquare } from "lucide-react";
import { ForumThreadList } from "@/components/social/ForumThreadList";
import { FORUM_CATEGORIES } from "@/components/social/forumCategories";

export { FORUM_CATEGORIES };

export function ForumSection() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ForumCategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [forumError, setForumError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setForumError(null);
    void getForumCategories()
      .then(setCategories)
      .catch(() => setForumError("Impossible de charger le forum pour le moment."))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/forum/${categoryId}`);
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
            </div>
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
            </CardContent>
          </Card>
        </ScrollReveal>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading
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
          : categories.map((category) => {
              const meta = FORUM_CATEGORIES[category.id];
              const Icon = meta?.icon ?? MessageSquare;
              return (
                <ScrollReveal key={category.id}>
                  <button type="button" onClick={() => handleCategoryClick(category.id)} className="text-left">
                    <Card className="h-full border-accent/20 bg-card/95 shadow-[0_12px_30px_hsl(var(--accent)/0.08)] transition-all hover:border-accent/40">
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

      <ForumThreadList />
    </div>
  );
}
