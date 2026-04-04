import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ScrollReveal } from "@/components/ScrollReveal";
import { activityToCommunityPost, type StravaActivity } from "@/lib/strava";
import { ActivityPostCard } from "@/components/ActivityPostCard";

export const ActivitySection = ({
  activities,
  athleteName,
  onOpenActivityDetail,
}: {
  activities: StravaActivity[];
  athleteName: string;
  onOpenActivityDetail: (activity: StravaActivity) => void;
}) => {
  const activityPosts = useMemo(
    () =>
      [...activities]
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
        .map((activity) => ({
          activity,
          post: activityToCommunityPost(activity, athleteName),
        })),
    [activities, athleteName],
  );

  if (activityPosts.length === 0) {
    return (
      <div className="rounded-xl border border-accent/20 bg-card p-5 text-sm text-muted-foreground">
        Aucune activité trouvée, si tu as de l'historique réalisée sur d'autres applications ou supports,{" "}
        <Link to="/import" className="font-medium text-accent underline underline-offset-4">
          importe les données. Clique ici pour savoir comment faire
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activityPosts.map(({ activity, post }, index) => (
        <ScrollReveal key={activity.id} delay={index * 0.04}>
          <ActivityPostCard post={post} onOpen={() => onOpenActivityDetail(activity)} />
        </ScrollReveal>
      ))}
    </div>
  );
};
