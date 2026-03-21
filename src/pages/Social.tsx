import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2, MapPin, Clock, Zap, Trophy, UserPlus, Image as ImageIcon, Send } from "lucide-react";
import { useState } from "react";

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

const athletes = [
  { name: "Eliud Kipchoge", initials: "EK", sport: "Marathon", followers: "2.4M", following: false },
  { name: "Kilian Jornet", initials: "KJ", sport: "Ultra-Trail", followers: "1.8M", following: true },
  { name: "Courtney Dauwalter", initials: "CD", sport: "Ultra-Trail", followers: "890K", following: false },
  { name: "Jakob Ingebrigtsen", initials: "JI", sport: "Demi-fond", followers: "1.2M", following: true },
  { name: "Nadia Battocletti", initials: "NB", sport: "10 000m", followers: "340K", following: false },
];

const challenges = [
  { title: "100 km en mars", progress: 67, target: 100, unit: "km", participants: 1243, daysLeft: 10 },
  { title: "Dénivelé hunter", progress: 1850, target: 3000, unit: "m D+", participants: 578, daysLeft: 10 },
  { title: "Streak 7 jours", progress: 4, target: 7, unit: "jours", participants: 3420, daysLeft: 3 },
];

export default function Social() {
  const [posts, setPosts] = useState(feedPosts);
  const [newPost, setNewPost] = useState("");

  const toggleLike = (id: number) => {
    setPosts(posts.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Communauté</h1>
          <p className="text-sm text-muted-foreground">Partagez vos courses et suivez vos amis</p>
        </div>
      </ScrollReveal>

      <Tabs defaultValue="feed" className="space-y-4">
        <ScrollReveal delay={0.05}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="feed">Fil d'actu</TabsTrigger>
            <TabsTrigger value="athletes">Athlètes</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
          </TabsList>
        </ScrollReveal>

        <TabsContent value="feed" className="space-y-4">
          {/* Compose */}
          <ScrollReveal delay={0.08}>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">ME</AvatarFallback>
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
        </TabsContent>

        <TabsContent value="athletes" className="space-y-3">
          {athletes.map((athlete, i) => (
            <ScrollReveal key={athlete.name} delay={0.05 + i * 0.06}>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-accent text-accent-foreground font-bold text-sm">
                      {athlete.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{athlete.name}</div>
                    <div className="text-xs text-muted-foreground">{athlete.sport} · {athlete.followers} followers</div>
                  </div>
                  <Button
                    variant={athlete.following ? "secondary" : "default"}
                    size="sm"
                  >
                    {athlete.following ? "Suivi" : <><UserPlus className="h-4 w-4 mr-1" /> Suivre</>}
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </TabsContent>

        <TabsContent value="challenges" className="space-y-3">
          {challenges.map((c, i) => {
            const pct = Math.round((c.progress / c.target) * 100);
            return (
              <ScrollReveal key={c.title} delay={0.05 + i * 0.06}>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{c.title}</h3>
                      <Badge variant="outline" className="text-[10px]">{c.daysLeft}j restants</Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{c.progress} / {c.target} {c.unit}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{c.participants.toLocaleString()} participants</div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
