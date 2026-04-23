import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ForumThreadList } from "@/components/social/ForumThreadList";
import { FORUM_CATEGORIES } from "@/components/social/ForumSection";
import { PageContainer, PageHeader } from "@/components/ui/page-layout";

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
    <PageContainer>
      <PageHeader
        title={title}
        subtitle={description}
        action={
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />
      <div className={`inline-flex w-fit items-center gap-2 rounded-xl px-3 py-1.5 ${category?.accent ?? "bg-accent/10 text-accent"}`}>
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold">Catégorie</span>
      </div>
      <ForumThreadList categoryId={categoryId} />
    </PageContainer>
  );
}
