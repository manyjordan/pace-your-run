import { ScrollReveal } from "@/components/ScrollReveal";
import { ActivityDetail } from "@/components/ActivityDetail";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Clock,
  Zap,
  Trophy,
  Search,
  UserPlus,
  Users,
  AlertTriangle,
  Bell,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  followUser,
  getFollowing,
  getNotifications,
  getPersonalizedFeed,
  getSuggestedUsersToFollow,
  getUnreadNotificationsCount,
  markNotificationsRead,
  toggleLike as togglePostLike,
  type NotificationWithActor,
  type PersonalizedFeedPost,
  type ProfileRow,
  type RunRow,
} from "@/lib/database";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  formatDuration,
  formatPace,
  formatRelativeTime,
  getInitials,
  type CommunityPost,
} from "@/lib/runFormatters";
import { AppCard, PageContainer, PageHeader } from "@/components/ui/page-layout";
import { isNative } from "@/lib/platform";

const ForumSection = lazy(() =>
  import("@/components/social/ForumSection").then((module) => ({ default: module.ForumSection })),
);

function buildFallbackTrace(seed: number) {
  const points = 24;
  const baseLat = 48.8566 + (seed % 7) * 0.0012;
  const baseLng = 2.3522 + (seed % 5) * 0.0011;

  return Array.from({ length: points }, (_, i) => ({
    lat: baseLat + Math.sin((i + seed) / 3) * 0.003 + i * 0.00018,
    lng: baseLng + Math.cos((i + seed) / 4) * 0.003 + ((i % 6) - 3) * 0.00022,
    time: seed + i * 1000,
  }));
}

type FeedPost = CommunityPost & {
  activityId: number;
  dbId?: string;
  sourceRun?: RunRow | null;
  feedReason?: PersonalizedFeedPost["feedReason"];
  friendWhoLiked?: PersonalizedFeedPost["friendWhoLiked"];
};

function hashStringToNumber(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function parseGpsTrace(trace: unknown): CommunityPost["gpsTrace"] | undefined {
  if (!Array.isArray(trace)) return undefined;

  const points = trace.filter((point): point is { lat: number; lng: number; time: number } => {
    return (
      typeof point === "object" &&
      point !== null &&
      typeof (point as { lat?: unknown }).lat === "number" &&
      typeof (point as { lng?: unknown }).lng === "number" &&
      typeof (point as { time?: unknown }).time === "number"
    );
  });

  return points.length ? points : undefined;
}

function inferPostType(title: string, description: string) {
  const label = `${title} ${description}`.toLowerCase();
  if (
    label.includes("marathon") ||
    label.includes("semi") ||
    label.includes("race") ||
    label.includes("course") ||
    label.includes("10k") ||
    label.includes("10 km") ||
    label.includes("5k") ||
    label.includes("5 km")
  ) {
    return "race" as const;
  }

  return "run" as const;
}

const FEED_PAGE_SIZE = 10;

function ranWithBadgeText(description: string): string | null {
  const idx = description.indexOf("Couru avec");
  if (idx < 0) return null;
  const segment = description.slice(idx).trim().replace(/\s*🤝\s*$/, "");
  return segment.startsWith("Couru avec") ? segment : null;
}

function mapPersonalizedPostToFeedPost(post: PersonalizedFeedPost): FeedPost {
  const displayName =
    post.profile?.username ||
    post.profile?.full_name ||
    "Coureur";
  const activityId = hashStringToNumber(post.run?.id ?? post.id);
  const run = post.run;

  return {
    activityId,
    dbId: post.id,
    sourceRun: run ?? null,
    id: activityId,
    user: displayName,
    initials: getInitials(displayName),
    time: formatRelativeTime(post.created_at ?? new Date().toISOString()),
    type: inferPostType(post.title ?? "", post.description ?? ""),
    title: post.title ?? run?.title ?? "Nouvelle activité",
    description: post.description ?? "Activité partagée",
    stats: {
      distance: `${(run?.distance_km ?? 0).toFixed(2)} km`,
      pace: run ? formatPace(run.distance_km * 1000, run.duration_seconds) : "--:-- /km",
      duration: run ? formatDuration(run.duration_seconds) : "00:00",
      elevation: `+${Math.round(run?.elevation_gain ?? 0)} m`,
    },
    // GPS trace is loaded lazily in ActivityDetail via getRunWithGps.
    gpsTrace: undefined,
    likes: post.likes_count ?? 0,
    comments: 0,
    liked: post.likedByMe,
    feedReason: post.feedReason,
    friendWhoLiked: post.friendWhoLiked,
  };
}

function suggestionDisplayName(profile: ProfileRow) {
  const first = profile.first_name?.trim();
  if (first) return first;
  return profile.username || profile.full_name || "Coureur";
}

export default function Social() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [activities, setActivities] = useState<RunRow[]>([]);
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [friendQuery, setFriendQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ profile: ProfileRow; runCount: number }[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followingAnyone, setFollowingAnyone] = useState(false);
  const [followBusyId, setFollowBusyId] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<RunRow | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<CommunityPost["gpsTrace"] | undefined>(undefined);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [likeBusyId, setLikeBusyId] = useState<string | null>(null);
  const [likeAnimatingId, setLikeAnimatingId] = useState<string | null>(null);
  const [likeBurstId, setLikeBurstId] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const hasLoadedRef = useRef(false);

  const buildRunFromPost = (post: FeedPost): RunRow => {
    const parseDistance = Number.parseFloat(post.stats.distance.replace(",", "."));
    const [hoursOrMinutes = "0", minutesOrSeconds = "0", seconds = "0"] = post.stats.duration.split(":");
    const durationSeconds =
      post.stats.duration.split(":").length === 3
        ? Number.parseInt(hoursOrMinutes, 10) * 3600 +
          Number.parseInt(minutesOrSeconds, 10) * 60 +
          Number.parseInt(seconds, 10)
        : Number.parseInt(hoursOrMinutes, 10) * 60 + Number.parseInt(minutesOrSeconds, 10);

    const eleParsed = Number.parseInt(post.stats.elevation.replace(/[^\d-]/g, ""), 10);

    return {
      id: post.dbId ? `feed-fallback-${post.dbId}` : `feed-fallback-${post.activityId}`,
      user_id: null,
      distance_km: Number.isFinite(parseDistance) ? parseDistance : 0,
      duration_seconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
      elevation_gain: Number.isFinite(eleParsed) ? eleParsed : 0,
      average_pace: null,
      average_heartrate: null,
      gps_trace: post.gpsTrace ?? null,
      run_type: post.type === "race" ? "race" : "run",
      started_at: new Date().toISOString(),
      title: post.title,
      created_at: new Date().toISOString(),
    };
  };

  const handleOpenActivity = (post: FeedPost) => {
    const matched =
      post.sourceRun ?? activities.find((run) => hashStringToNumber(run.id) === post.activityId);
    setSelectedActivity(matched ?? buildRunFromPost(post));
    setSelectedTrace(post.gpsTrace);
  };

  const handleToggleLike = async (post: FeedPost) => {
    if (!user) return;
    if (likeBusyId) return;

    const animKey = post.dbId ?? `activity-${post.activityId}`;
    setLikeAnimatingId(animKey);
    window.setTimeout(() => setLikeAnimatingId(null), 600);
    if (!post.liked) {
      setLikeBurstId(animKey);
      window.setTimeout(() => setLikeBurstId(null), 600);
    }

    if (!post.dbId) {
      setPosts((current) =>
        current.map((item) =>
          item.activityId === post.activityId
            ? { ...item, liked: !item.liked, likes: item.liked ? item.likes - 1 : item.likes + 1 }
            : item,
        ),
      );
      return;
    }

    try {
      setLikeBusyId(post.dbId);
      const result = await togglePostLike(post.dbId, user.id);
      setPosts((current) =>
        current.map((item) =>
          item.dbId === post.dbId ? { ...item, liked: result.liked, likes: result.likesCount } : item,
        ),
      );
    } catch {
      setPostsError("Impossible de mettre à jour le like pour le moment.");
    } finally {
      setLikeBusyId(null);
    }
  };

  const handleShare = async (post: FeedPost) => {
    const shareData = {
      title: post.title ?? "Course Pace",
      text: `${post.user} a couru ${post.stats.distance} en ${post.stats.duration} sur Pace`,
      url: window.location.origin,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          logger.error("Share failed", error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast({ title: "Lien copié" });
      } catch {
        toast({
          title: "Partage non disponible",
          description: "Votre navigateur ne supporte pas le partage natif.",
          variant: "destructive",
        });
      }
    }
  };

  const filteredSuggestions = suggestions.filter((s) =>
    suggestionDisplayName(s.profile).toLowerCase().includes(friendQuery.toLowerCase()),
  );

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadNotifCount(0);
      return;
    }
    try {
      const n = await getUnreadNotificationsCount(user.id);
      setUnreadNotifCount(n);
    } catch {
      setUnreadNotifCount(0);
    }
  }, [user?.id]);

  const loadFeed = useCallback(
    async (pageNum = 0) => {
      if (!user?.id) return;
      if (pageNum === 0) {
        setIsLoadingPosts(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const newPosts = await getPersonalizedFeed(user.id, FEED_PAGE_SIZE, pageNum * FEED_PAGE_SIZE);
        const mappedPosts = newPosts.map(mapPersonalizedPostToFeedPost);

        if (pageNum === 0) {
          setPosts(mappedPosts);
          setActivities(newPosts.filter((post) => post.run).map((post) => post.run as RunRow));
          setPage(0);
        } else {
          setPosts((prev) => [...prev, ...mappedPosts]);
          setActivities((prev) => [
            ...prev,
            ...newPosts.filter((post) => post.run).map((post) => post.run as RunRow),
          ]);
          setPage(pageNum);
        }
        setHasMore(newPosts.length >= FEED_PAGE_SIZE);
      } catch (error) {
        logger.error("Failed to load feed", error);
        if (pageNum === 0) {
          setActivities([]);
          setPosts([]);
          setPostsError("Impossible de charger le fil d'actualité. Vérifiez votre connexion.");
        }
      } finally {
        setIsLoadingPosts(false);
        setIsLoadingMore(false);
      }
    },
    [user?.id],
  );

  const loadCommunityPosts = useCallback(async () => {
    if (!user?.id) {
      setIsLoadingPosts(false);
      return;
    }

    setPage(0);
    setHasMore(true);
    setIsLoadingPosts(true);
    setPostsError(null);

    try {
      const [followingList, suggested] = await Promise.all([
        getFollowing(user.id),
        getSuggestedUsersToFollow(user.id, 5),
      ]);

      setFollowingIds(new Set(followingList));
      setFollowingAnyone(followingList.length > 0);
      setSuggestions(suggested);
    } catch {
      setActivities([]);
      setPosts([]);
      setPostsError("Impossible de charger le fil d'actualité. Vérifiez votre connexion.");
      setIsLoadingPosts(false);
      return;
    }

    await loadFeed(0);
  }, [user?.id, loadFeed]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    void loadCommunityPosts();
    void refreshUnreadCount();
    const handleReload = () => {
      void loadCommunityPosts();
    };
    const handleNotif = () => {
      void refreshUnreadCount();
    };

    window.addEventListener("pace-community-updated", handleReload);
    window.addEventListener("pace-notifications-updated", handleNotif);
    return () => {
      window.removeEventListener("pace-community-updated", handleReload);
      window.removeEventListener("pace-notifications-updated", handleNotif);
    };
  }, [loadCommunityPosts, refreshUnreadCount]);

  const handleFollowSuggestion = async (profileId: string) => {
    if (!user?.id) return;
    try {
      setFollowBusyId(profileId);
      await followUser(user.id, profileId);
      setFollowingIds((prev) => new Set([...prev, profileId]));
      setFollowingAnyone(true);
      setSuggestions((prev) => prev.filter((s) => s.profile.id !== profileId));
      window.dispatchEvent(new Event("pace-notifications-updated"));
    } catch {
      setPostsError("Impossible de suivre ce coureur pour le moment.");
    } finally {
      setFollowBusyId(null);
    }
  };

  const handleNotifOpenChange = async (open: boolean) => {
    setNotifOpen(open);
    if (!open || !user?.id) return;

    setNotifLoading(true);
    try {
      const list = await getNotifications(user.id);
      setNotifications(list);
      await markNotificationsRead(user.id);
      setUnreadNotifCount(0);
      window.dispatchEvent(new Event("pace-notifications-updated"));
      const cleared = await getNotifications(user.id);
      setNotifications(cleared);
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  const actorFirstName = (actor: ProfileRow | null) => {
    if (!actor) return "Quelqu'un";
    const first = actor.first_name?.trim();
    if (first) return first;
    return actor.username || actor.full_name?.split(/\s+/)[0] || "Coureur";
  };

  return (
    <PageContainer>
      {selectedActivity && (
        <ActivityDetail
          activity={selectedActivity}
          onClose={() => {
            setSelectedActivity(null);
            setSelectedTrace(undefined);
          }}
          allActivities={activities}
          fallbackTrace={selectedTrace}
        />
      )}

      <ScrollReveal>
        <PageHeader
          title="Communauté"
          action={
            <div className="flex shrink-0 items-center gap-1">
            <Sheet open={notifOpen} onOpenChange={(o) => void handleNotifOpenChange(o)}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  {unreadNotifCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white">
                      {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                    </span>
                  ) : null}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Notifications</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                  {notifLoading ? (
                    <div className="space-y-2 py-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Aucune notification pour l&apos;instant</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex gap-3 rounded-lg border border-border p-3 ${
                          !n.read_at ? "bg-accent/10" : ""
                        }`}
                      >
                        <div className="mt-0.5 text-muted-foreground">
                          {n.type === "like" ? <Heart className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1 text-sm">
                          <p>
                            {n.type === "like" ? (
                              <>
                                {actorFirstName(n.actor)} a aimé votre course{" "}
                                <span className="font-medium">{n.post_title || "sans titre"}</span>
                              </>
                            ) : (
                              <>{actorFirstName(n.actor)} a commencé à vous suivre</>
                            )}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatRelativeTime(n.created_at ?? new Date().toISOString())}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => setShowFriendSearch((v) => !v)}
              aria-label="Rechercher des amis"
            >
              <Search className="h-4 w-4" />
            </Button>
            </div>
          }
        />
      </ScrollReveal>

      <Tabs defaultValue="activity" className="space-y-6">
        <ScrollReveal>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activity">
              <Users className="mr-1.5 h-4 w-4" /> Activité
            </TabsTrigger>
            <TabsTrigger value="forum">
              <MessageCircle className="mr-1.5 h-4 w-4" /> Forum
            </TabsTrigger>
          </TabsList>
        </ScrollReveal>

        <TabsContent value="activity" className="space-y-4">
          {showFriendSearch && (
            <ScrollReveal>
              <AppCard className="p-0">
                <CardContent className="space-y-3 p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Chercher un ami..."
                      value={friendQuery}
                      onChange={(e) => setFriendQuery(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 ring-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Suggestions d&apos;amis</p>
                    {filteredSuggestions.map((s) => {
                      const name = suggestionDisplayName(s.profile);
                      const isFollowing = followingIds.has(s.profile.id);
                      return (
                        <div
                          key={s.profile.id}
                          className="flex items-center justify-between rounded-lg border border-border p-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-[10px] font-bold">{getInitials(name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{name}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.runCount} {s.runCount === 1 ? "course" : "courses"}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={isFollowing ? "secondary" : "default"}
                            disabled={followBusyId === s.profile.id || isFollowing}
                            onClick={() => void handleFollowSuggestion(s.profile.id)}
                          >
                            {isFollowing ? (
                              <>
                                <Check className="mr-1 h-4 w-4" /> Suivi
                              </>
                            ) : (
                              <>
                                <UserPlus className="mr-1 h-4 w-4" /> Suivre
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                    {filteredSuggestions.length === 0 && (
                      <p className="py-2 text-center text-xs text-muted-foreground">
                        Aucune suggestion pour le moment.
                      </p>
                    )}
                  </div>
                </CardContent>
              </AppCard>
            </ScrollReveal>
          )}

          {isLoadingPosts
            ? Array.from({ length: 3 }, (_, i) => (
                <ScrollReveal key={`skeleton-${i}`}>
                  <Card className="overflow-hidden">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-56" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                      <div className="grid grid-cols-4 gap-2 rounded-lg bg-secondary/50 p-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))
            : postsError ? (
                <ScrollReveal>
                  <AppCard className="border-destructive/30 bg-destructive/5">
                    <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold">Impossible de charger le fil d&apos;actualité. Vérifiez votre connexion.</h3>
                      </div>
                      <Button
                        variant="outline"
                        className="border-[hsl(var(--accent))] text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/10"
                        onClick={() => void loadCommunityPosts()}
                      >
                        Réessayer
                      </Button>
                    </CardContent>
                  </AppCard>
                </ScrollReveal>
              ) : posts.length === 0 ? (
                <ScrollReveal>
                  <AppCard className="border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5">
                    <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]">
                        <Users className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold">Fil vide</h3>
                        <p className="text-sm text-muted-foreground">
                          {!followingAnyone
                            ? "Suivez des coureurs pour voir leur activité ici. Commencez par enregistrer votre première course et partagez-la !"
                            : "Aucune activité récente de vos abonnements"}
                        </p>
                      </div>
                      <Button
                        className="bg-[hsl(var(--accent))] text-accent-foreground hover:bg-[hsl(var(--accent))]/90"
                        onClick={() => navigate("/run")}
                      >
                        Enregistrer une course
                      </Button>
                    </CardContent>
                  </AppCard>
                </ScrollReveal>
              ) : posts.map((post, i) => {
                const ranWithLine = ranWithBadgeText(post.description ?? "");
                return (
                <ScrollReveal key={post.dbId ?? post.activityId}>
                  <Card className="cursor-pointer overflow-hidden" onClick={() => handleOpenActivity(post)}>
                    <CardContent className="space-y-3 p-4">
                      {post.feedReason === "friend_liked" && post.friendWhoLiked ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Heart className="h-3 w-3 shrink-0" />
                          <span>
                            👍 {post.friendWhoLiked.name} a aimé cette publication
                          </span>
                        </div>
                      ) : null}
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

                      {ranWithLine ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-accent">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          <span>{ranWithLine}</span>
                        </div>
                      ) : null}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenActivity(post);
                        }}
                      >
                        Voir les détails de l&apos;activité
                      </Button>

                      <div className="flex items-center gap-1 border-t border-border pt-1">
                        <button
                          type="button"
                          disabled={likeBusyId === post.dbId}
                          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60 disabled:opacity-50"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleToggleLike(post);
                          }}
                        >
                          <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                            {isNative ? null : (
                              <AnimatePresence>
                                {likeBurstId === (post.dbId ?? `activity-${post.activityId}`) ? (
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
                            )}
                            {isNative ? (
                              <div className="relative z-[1]">
                                <Heart
                                  className={cn(
                                    "h-4 w-4 transition-colors duration-200",
                                    post.liked
                                      ? "fill-red-500 text-red-500"
                                      : "text-muted-foreground hover:text-red-400",
                                  )}
                                />
                              </div>
                            ) : (
                              <motion.div
                                className="relative z-[1]"
                                animate={
                                  likeAnimatingId === (post.dbId ?? `activity-${post.activityId}`)
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
                                    "h-4 w-4 transition-colors duration-200",
                                    post.liked
                                      ? "fill-red-500 text-red-500"
                                      : "text-muted-foreground hover:text-red-400",
                                  )}
                                />
                              </motion.div>
                            )}
                          </div>
                          <span
                            className={cn(
                              "tabular-nums transition-colors duration-200",
                              post.liked ? "text-red-500" : "text-muted-foreground",
                            )}
                          >
                            {post.likes}
                          </span>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MessageCircle className="mr-1 h-4 w-4" /> {post.comments}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto text-muted-foreground"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleShare(post);
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              );
              })}

              {hasMore && !isLoadingMore && posts.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    void loadFeed(page + 1);
                  }}
                  className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:border-accent/50 hover:text-foreground transition-colors"
                >
                  Voir plus
                </button>
              )}

              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <p className="text-center text-xs text-muted-foreground py-3">Vous avez tout vu</p>
              )}
        </TabsContent>

        <TabsContent value="forum">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            }
          >
            <ForumSection />
          </Suspense>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
