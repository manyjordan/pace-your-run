import { ScrollReveal } from "@/components/ScrollReveal";
import { ActivityDetail } from "@/components/ActivityDetail";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, Share2, MapPin, Clock, Zap, Trophy, Image as ImageIcon, Send, Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import GPSMap from "@/components/GPSMap";
import { useAuth } from "@/contexts/AuthContext";
import { getPublicPosts, toggleLike as togglePostLike, type PublicPostRecord, type RunRow } from "@/lib/database";
import {
  formatDuration,
  formatPace,
  formatRelativeTime,
  getInitials,
  type CommunityPost,
  type StravaActivity,
} from "@/lib/strava";

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

function ensurePostTrace(post: CommunityPost): CommunityPost {
  if (post.gpsTrace?.length) return post;
  if (post.type !== "run" && post.type !== "race") return post;
  return { ...post, gpsTrace: buildFallbackTrace(post.id) };
}

type FeedPost = CommunityPost & {
  activityId: number;
  dbId?: string;
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

function runToActivity(run: RunRow, activityId: number): StravaActivity {
  return {
    id: activityId,
    name: run.title ?? "Activité",
    distance: run.distance_km * 1000,
    moving_time: run.duration_seconds,
    elapsed_time: run.duration_seconds,
    total_elevation_gain: run.elevation_gain ?? 0,
    start_date: run.started_at ?? run.created_at ?? new Date().toISOString(),
    type: run.run_type ?? "Run",
  };
}

function mapPublicPostToFeedPost(post: PublicPostRecord): FeedPost {
  const displayName =
    post.profile?.username ||
    post.profile?.full_name ||
    "Coureur";
  const activityId = hashStringToNumber(post.run?.id ?? post.id);
  const run = post.run;

  return {
    activityId,
    dbId: post.id,
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
    gpsTrace: parseGpsTrace(run?.gps_trace),
    likes: post.likes_count ?? 0,
    comments: 0,
    liked: post.likedByMe,
  };
}

const feedPosts: FeedPost[] = [
  {
    activityId: 1,
    id: 1,
    user: "Léa Martin",
    initials: "LM",
    time: "Il y a 2h",
    type: "run" as const,
    title: "Sortie tempo au bord du canal 🏃‍♀️",
    description: "Super session ce matin ! 12 km à 4:45/km en moyenne. Les jambes étaient légères après deux jours de repos.",
    stats: { distance: "12.3 km", pace: "4:45 /km", duration: "58:27", elevation: "+45 m" },
    likes: 24,
    comments: 6,
    liked: false,
  },
  {
    activityId: 2,
    id: 2,
    user: "Thomas Dubois",
    initials: "TD",
    time: "Il y a 4h",
    type: "race" as const,
    title: "Semi-marathon de Lyon 🏅",
    description: "PR cassé ! 1h28:12 — objectif sub-1h30 atteint. Merci à tous pour le soutien pendant la prépa !",
    stats: { distance: "21.1 km", pace: "4:11 /km", duration: "1:28:12", elevation: "+120 m" },
    likes: 87,
    comments: 23,
    liked: true,
  },
  {
    activityId: 3,
    id: 3,
    user: "Marie Lefevre",
    initials: "ML",
    time: "Il y a 6h",
    type: "run" as const,
    title: "Récup active en forêt 🌲",
    description: "Petite sortie tranquille à 6:00/km. Parfait pour la récup après les fracs de mardi.",
    stats: { distance: "7.8 km", pace: "6:02 /km", duration: "47:05", elevation: "+85 m" },
    likes: 12,
    comments: 3,
    liked: false,
  },
  {
    activityId: 4,
    id: 4,
    user: "Antoine Moreau",
    initials: "AM",
    time: "Il y a 8h",
    type: "run" as const,
    title: "Intervalles 10x400m 💨",
    description: "Session difficile mais bien exécutée. 400m entre 1:18 et 1:22, récup 200m trot.",
    stats: { distance: "9.2 km", pace: "4:30 /km", duration: "41:24", elevation: "+12 m" },
    likes: 31,
    comments: 8,
    liked: false,
  },
];

const friendsSeed = [
  { id: 1, name: "Camille Bernard", initials: "CB", discipline: "10 km", following: false },
  { id: 2, name: "Nicolas Petit", initials: "NP", discipline: "Semi-marathon", following: false },
  { id: 3, name: "Sarah Lopez", initials: "SL", discipline: "Trail", following: true },
  { id: 4, name: "Maxime Laurent", initials: "ML", discipline: "Marathon", following: false },
];

export default function Social() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [newPost, setNewPost] = useState("");
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [friendQuery, setFriendQuery] = useState("");
  const [friends, setFriends] = useState(friendsSeed);
  const [selectedActivity, setSelectedActivity] = useState<StravaActivity | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<CommunityPost["gpsTrace"] | undefined>(undefined);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [likeBusyId, setLikeBusyId] = useState<string | null>(null);

  const buildActivityFromPost = (post: FeedPost): StravaActivity => {
    const parseDistance = Number.parseFloat(post.stats.distance.replace(",", "."));
    const [hoursOrMinutes = "0", minutesOrSeconds = "0", seconds = "0"] = post.stats.duration.split(":");
    const durationSeconds =
      post.stats.duration.split(":").length === 3
        ? Number.parseInt(hoursOrMinutes, 10) * 3600 +
          Number.parseInt(minutesOrSeconds, 10) * 60 +
          Number.parseInt(seconds, 10)
        : Number.parseInt(hoursOrMinutes, 10) * 60 + Number.parseInt(minutesOrSeconds, 10);

    return {
      id: post.activityId,
      name: post.title,
      distance: Number.isFinite(parseDistance) ? parseDistance * 1000 : 0,
      moving_time: durationSeconds,
      elapsed_time: durationSeconds,
      total_elevation_gain: Number.parseInt(post.stats.elevation.replace(/[^\d-]/g, ""), 10) || 0,
      start_date: new Date().toISOString(),
    };
  };

  const handleOpenActivity = (post: FeedPost) => {
    const matched = activities.find((activity) => activity.id === post.activityId);
    setSelectedActivity(matched ?? buildActivityFromPost(post));
    setSelectedTrace(post.gpsTrace);
  };

  const handleToggleLike = async (post: FeedPost) => {
    if (!user) return;

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

  const toggleFollow = (id: number) => {
    setFriends((prev) => prev.map((f) => (f.id === id ? { ...f, following: !f.following } : f)));
  };

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(friendQuery.toLowerCase()),
  );

  useEffect(() => {
    const loadCommunityPosts = async () => {
      setIsLoadingPosts(true);
      setPostsError(null);

      try {
        const publicPosts = await getPublicPosts();

        if (publicPosts.length === 0) {
          const fallbackPosts = feedPosts.map(ensurePostTrace);
          setPosts(fallbackPosts);
          setActivities(fallbackPosts.map((post) => buildActivityFromPost(post)));
          return;
        }

        const mappedPosts = publicPosts.map(mapPublicPostToFeedPost).map(ensurePostTrace);
        setPosts(mappedPosts);
        setActivities(
          publicPosts
            .filter((post) => post.run)
            .map((post) => runToActivity(post.run as RunRow, hashStringToNumber(post.run?.id ?? post.id))),
        );
      } catch {
        setActivities([]);
        setPosts([]);
        setPostsError("Impossible de charger le fil social pour le moment.");
      } finally {
        setIsLoadingPosts(false);
      }
    };

    void loadCommunityPosts();
    const handleReload = () => {
      void loadCommunityPosts();
    };

    window.addEventListener("pace-community-updated", handleReload);
    return () => {
      window.removeEventListener("pace-community-updated", handleReload);
    };
  }, []);

  return (
    <div className="space-y-6">
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Communauté</h1>
            <p className="text-sm text-muted-foreground">Partagez vos courses et suivez vos amis</p>
          </div>
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
      </ScrollReveal>

      <div className="space-y-4">
        {postsError && (
          <ScrollReveal delay={0.04}>
            <p className="text-sm text-destructive">{postsError}</p>
          </ScrollReveal>
        )}

        {showFriendSearch && (
          <ScrollReveal delay={0.04}>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Chercher un ami..."
                    value={friendQuery}
                    onChange={(e) => setFriendQuery(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 ring-accent transition"
                  />
                </div>
                <div className="space-y-2">
                  {filteredFriends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px] font-bold">{friend.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{friend.name}</p>
                          <p className="text-xs text-muted-foreground">{friend.discipline}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={friend.following ? "secondary" : "default"}
                        onClick={() => toggleFollow(friend.id)}
                      >
                        {friend.following ? "Suivi" : <><UserPlus className="h-4 w-4 mr-1" /> Suivre</>}
                      </Button>
                    </div>
                  ))}
                  {filteredFriends.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">Aucun ami trouvé.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        {/* Compose */}
        <ScrollReveal delay={0.08}>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">MOI</AvatarFallback>
                </Avatar>
                <Textarea
                  placeholder="Partagez votre dernière course..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ImageIcon className="h-4 w-4 mr-1" /> Photo
                </Button>
                <Button size="sm" disabled={!newPost.trim()}>
                  <Send className="h-4 w-4 mr-1" /> Publier
                </Button>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Posts */}
        {isLoadingPosts
          ? Array.from({ length: 3 }, (_, i) => (
              <ScrollReveal key={`skeleton-${i}`} delay={0.1 + i * 0.06}>
                <Card className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
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
          : posts.map((post, i) => (
              <ScrollReveal key={post.dbId ?? post.activityId} delay={0.1 + i * 0.06}>
                <Card className="cursor-pointer overflow-hidden" onClick={() => handleOpenActivity(post)}>
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                          {post.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{post.user}</span>
                          {post.type === "race" && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              <Trophy className="h-3 w-3 mr-0.5" /> Course
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{post.time}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="font-semibold text-sm">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{post.description}</p>
                    </div>

                    {/* Stats strip */}
                    <div className="grid grid-cols-4 gap-2 rounded-lg bg-secondary/50 p-3">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <MapPin className="h-3 w-3" /> Dist.
                        </div>
                        <div className="text-sm font-bold mt-0.5">{post.stats.distance}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <Zap className="h-3 w-3" /> Allure
                        </div>
                        <div className="text-sm font-bold mt-0.5">{post.stats.pace}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3" /> Durée
                        </div>
                        <div className="text-sm font-bold mt-0.5">{post.stats.duration}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">D+</div>
                        <div className="text-sm font-bold mt-0.5">{post.stats.elevation}</div>
                      </div>
                    </div>

                    {post.gpsTrace && post.gpsTrace.length > 0 && (
                      <GPSMap trace={post.gpsTrace} />
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenActivity(post);
                      }}
                    >
                      Voir les détails de l'activité
                    </Button>

                    {/* Actions */}
                    <div className="flex items-center gap-1 pt-1 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={likeBusyId === post.dbId}
                        className={post.liked ? "text-red-500" : "text-muted-foreground"}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleToggleLike(post);
                        }}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${post.liked ? "fill-current" : ""}`} />
                        {post.likes}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" /> {post.comments}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto text-muted-foreground"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
      </div>
    </div>
  );
}
