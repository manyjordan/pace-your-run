import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2, MapPin, Clock, Zap, Trophy, Image as ImageIcon, Send, Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import GPSMap from "@/components/GPSMap";

const COMMUNITY_POSTS_KEY = "pace-community-posts";

const feedPosts = [
  {
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
  const [posts, setPosts] = useState(feedPosts);
  const [newPost, setNewPost] = useState("");
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [friendQuery, setFriendQuery] = useState("");
  const [friends, setFriends] = useState(friendsSeed);

  const toggleLike = (id: number) => {
    setPosts(posts.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const toggleFollow = (id: number) => {
    setFriends((prev) => prev.map((f) => (f.id === id ? { ...f, following: !f.following } : f)));
  };

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(friendQuery.toLowerCase()),
  );

  useEffect(() => {
    const loadCommunityPosts = () => {
      try {
        const raw = window.localStorage.getItem(COMMUNITY_POSTS_KEY);
        const generatedPosts = raw ? JSON.parse(raw) as typeof feedPosts : [];
        setPosts([...generatedPosts, ...feedPosts]);
      } catch {
        setPosts(feedPosts);
      }
    };

    loadCommunityPosts();
    window.addEventListener("storage", loadCommunityPosts);
    window.addEventListener("pace-community-updated", loadCommunityPosts);
    return () => {
      window.removeEventListener("storage", loadCommunityPosts);
      window.removeEventListener("pace-community-updated", loadCommunityPosts);
    };
  }, []);

  return (
    <div className="space-y-6">
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
        {posts.map((post, i) => (
          <ScrollReveal key={post.id} delay={0.1 + i * 0.06}>
            <Card className="overflow-hidden">
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

                {/* GPS Trace Map */}
                {post.gpsTrace && post.gpsTrace.length > 0 && (
                  <GPSMap trace={post.gpsTrace} />
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={post.liked ? "text-red-500" : "text-muted-foreground"}
                    onClick={() => toggleLike(post.id)}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${post.liked ? "fill-current" : ""}`} />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <MessageCircle className="h-4 w-4 mr-1" /> {post.comments}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground ml-auto">
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
