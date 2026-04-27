import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GpsTraceSvg } from "@/components/GpsTraceSvg";
import { useAuth } from "@/contexts/AuthContext";
import { getRunWithGps } from "@/lib/database";
import type { CommunityPost } from "@/lib/runFormatters";
import { Clock, MapPin, MessageCircle, Share2, Trophy, Zap } from "lucide-react";

type ActivityPostCardProps = {
  post: CommunityPost;
  onOpen?: () => void;
  showActions?: boolean;
  onCommentClick?: () => void;
  onShareClick?: () => void;
  runId?: string;
};

export function ActivityPostCard({
  post,
  onOpen,
  showActions = false,
  onCommentClick,
  onShareClick,
  runId,
}: ActivityPostCardProps) {
  const { session } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [gpsTrace, setGpsTrace] = useState(post.gpsTrace ?? null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 },
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !runId || !session?.user?.id || gpsTrace !== null) return;

    let cancelled = false;
    void getRunWithGps(session.user.id, runId)
      .then((run) => {
        if (cancelled) return;
        if (run?.gps_trace && Array.isArray(run.gps_trace)) {
          setGpsTrace(run.gps_trace);
          return;
        }
        setGpsTrace([]);
      })
      .catch(() => {
        if (!cancelled) setGpsTrace([]);
      });

    return () => {
      cancelled = true;
    };
  }, [gpsTrace, isVisible, runId, session?.user?.id]);

  const enrichedPost = post as CommunityPost & {
    profiles?: { first_name?: string | null; username?: string | null; email?: string | null; avatar_url?: string | null };
  };
  const displayName =
    enrichedPost.profiles?.first_name?.trim() ||
    enrichedPost.profiles?.username ||
    enrichedPost.profiles?.email?.split("@")[0] ||
    post.user ||
    "Coureur";
  const avatarUrl = enrichedPost.profiles?.avatar_url ?? null;

  return (
    <Card ref={cardRef} className={`overflow-hidden ${onOpen ? "cursor-pointer" : ""}`} onClick={onOpen}>
      {gpsTrace && gpsTrace.length > 1 ? (
        <div className="mb-3 overflow-hidden rounded-t-xl">
          <GpsTraceSvg trace={gpsTrace} height={160} className="w-full" />
        </div>
      ) : isVisible && gpsTrace === null ? (
        <div className="mb-3 h-[160px] animate-pulse rounded-xl bg-muted/30" />
      ) : null}
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
            <AvatarFallback className="bg-secondary text-xs font-bold text-secondary-foreground">
              {post.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{displayName}</span>
              {post.type === "race" && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  <Trophy className="mr-0.5 h-3 w-3" /> Course
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{post.time}</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">{post.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{post.description}</p>
        </div>

        <div className="grid grid-cols-4 gap-2 rounded-lg bg-secondary/50 p-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> Dist.
            </div>
            <div className="mt-0.5 text-sm font-bold">{post.stats.distance}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" /> Allure
            </div>
            <div className="mt-0.5 text-sm font-bold">{post.stats.pace}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> Durée
            </div>
            <div className="mt-0.5 text-sm font-bold">{post.stats.duration}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">D+</div>
            <div className="mt-0.5 text-sm font-bold">{post.stats.elevation}</div>
          </div>
        </div>

        {showActions && (
          <div className="flex items-center gap-1 border-t border-border pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={(event) => {
                event.stopPropagation();
                onCommentClick?.();
              }}
            >
              <MessageCircle className="mr-1 h-4 w-4" /> {post.comments}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-muted-foreground"
              onClick={(event) => {
                event.stopPropagation();
                onShareClick?.();
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
