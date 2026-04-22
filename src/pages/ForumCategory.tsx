import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ForumThreadList } from "@/components/social/ForumThreadList";
import { FORUM_CATEGORIES } from "@/components/social/ForumSection";

export default function ForumCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const category = useMemo(() => {
    if (!categoryId) return null;
    return FORUM_CATEGORIES[categoryId];
  }, [categoryId]);

  const Icon = category?.icon ?? MessageSquare;
  const title = category?.label ?? categoryId ?? "Catégorie";
  const description = category?.description ?? "Discussions de la catégorie";

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className={`rounded-lg p-1.5 ${category?.accent ?? "bg-accent/10 text-accent"}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <ForumThreadList categoryId={categoryId} />
      </div>
    </div>
  );
}
