import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GpsTraceSvg } from "@/components/GpsTraceSvg";
import type { CommunityPost } from "@/lib/runFormatters";
import { Clock, MapPin, MessageCircle, Share2, Trophy, Zap } from "lucide-react";

type ActivityPostCardProps = {
  post: CommunityPost;
  onOpen?: () => void;
  showActions?: boolean;
  onCommentClick?: () => void;
  onShareClick?: () => void;
};

export function ActivityPostCard({
  post,
  onOpen,
  showActions = false,
  onCommentClick,
  onShareClick,
}: ActivityPostCardProps) {
  return (
    <Card className={`overflow-hidden ${onOpen ? "cursor-pointer" : ""}`} onClick={onOpen}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-secondary text-xs font-bold text-secondary-foreground">
              {post.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{post.user}</span>
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

        {post.gpsTrace && post.gpsTrace.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-accent/20 bg-muted/30">
            <GpsTraceSvg trace={post.gpsTrace} height={180} />
          </div>
        ) : null}

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
