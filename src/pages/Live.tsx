import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radio, MapPin, Clock, Users, ChevronRight, Eye } from "lucide-react";

const liveRaces = [
  {
    id: 1,
    name: "Marathon de Paris 2026",
    location: "Paris, France",
    status: "En cours",
    runners: 48500,
    watching: 12300,
    startedAt: "08:30",
    leaders: [
      { name: "Eliud Kipchoge", initials: "EK", bib: "1", position: 1, time: "1:02:45", pace: "2:58 /km", distance: "21.1 km" },
      { name: "Kelvin Kiptum", initials: "KK", bib: "2", position: 2, time: "1:02:48", pace: "2:58 /km", distance: "21.1 km" },
      { name: "Kenenisa Bekele", initials: "KB", bib: "3", position: 3, time: "1:03:12", pace: "2:59 /km", distance: "21.0 km" },
    ],
  },
  {
    id: 2,
    name: "UTMB — Ultra-Trail du Mont-Blanc",
    location: "Chamonix, France",
    status: "En cours",
    runners: 2300,
    watching: 8900,
    startedAt: "17:00 (hier)",
    leaders: [
      { name: "Jim Walmsley", initials: "JW", bib: "14", position: 1, time: "14:32:10", pace: "5:08 /km", distance: "142.8 km" },
      { name: "Kilian Jornet", initials: "KJ", bib: "7", position: 2, time: "14:35:02", pace: "5:09 /km", distance: "142.5 km" },
      { name: "Mathieu Blanchard", initials: "MB", bib: "22", position: 3, time: "14:48:30", pace: "5:14 /km", distance: "141.2 km" },
    ],
  },
];

const friendsLive = [
  { name: "Léa Martin", initials: "LM", race: "Semi de Lyon", distance: "14.2 km", pace: "4:52 /km", position: "234e / 4500" },
  { name: "Thomas Dubois", initials: "TD", race: "Marathon de Paris", distance: "32.8 km", pace: "4:15 /km", position: "1205e / 48500" },
];

const upcomingRaces = [
  { name: "10 km de Bordeaux", date: "30 mars 2026", runners: 6200, reminder: false },
  { name: "Trail des Templiers", date: "18 oct 2026", runners: 3400, reminder: true },
  { name: "Marathon de Berlin", date: "27 sept 2026", runners: 45000, reminder: false },
];

export default function Live() {
  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Live</h1>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Suivez les courses en direct</p>
      </ScrollReveal>

      <Tabs defaultValue="races" className="space-y-4">
        <ScrollReveal delay={0.05}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="races">
              <Radio className="h-3.5 w-3.5 mr-1" /> Courses
            </TabsTrigger>
            <TabsTrigger value="friends">
              <Users className="h-3.5 w-3.5 mr-1" /> Amis
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              <Clock className="h-3.5 w-3.5 mr-1" /> À venir
            </TabsTrigger>
          </TabsList>
        </ScrollReveal>

        <TabsContent value="races" className="space-y-4">
          {liveRaces.map((race, i) => (
            <ScrollReveal key={race.id} delay={0.05 + i * 0.06}>
              <Card className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{race.name}</h3>
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 animate-pulse">
                          LIVE
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" /> {race.location} · Départ {race.startedAt}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {race.runners.toLocaleString()} coureurs</span>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {race.watching.toLocaleString()} spectateurs</span>
                  </div>

                  {/* Leaders */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Classement</div>
                    {race.leaders.map((runner) => (
                      <div
                        key={runner.bib}
                        className="flex items-center gap-3 rounded-lg bg-secondary/50 p-2.5"
                      >
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          runner.position === 1
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {runner.position}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px] font-bold bg-secondary text-secondary-foreground">
                            {runner.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{runner.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            Dossard #{runner.bib} · {runner.distance}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold tabular-nums">{runner.time}</div>
                          <div className="text-[10px] text-muted-foreground">{runner.pace}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    Voir la course complète <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </TabsContent>

        <TabsContent value="friends" className="space-y-3">
          {friendsLive.map((friend, i) => (
            <ScrollReveal key={friend.name} delay={0.05 + i * 0.06}>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-accent text-accent-foreground font-bold text-xs">
                        {friend.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{friend.name}</div>
                    <div className="text-xs text-muted-foreground">{friend.race}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {friend.distance} · {friend.pace} · {friend.position}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Suivre</Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}

          <ScrollReveal delay={0.15}>
            <Card className="border-dashed">
              <CardContent className="p-4 text-center space-y-2">
                <p className="text-sm text-muted-foreground">Aucun autre ami en course actuellement</p>
                <Button variant="ghost" size="sm">Inviter des amis</Button>
              </CardContent>
            </Card>
          </ScrollReveal>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-3">
          {upcomingRaces.map((race, i) => (
            <ScrollReveal key={race.name} delay={0.05 + i * 0.06}>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{race.name}</div>
                    <div className="text-xs text-muted-foreground">{race.date} · {race.runners.toLocaleString()} inscrits</div>
                  </div>
                  <Button variant={race.reminder ? "secondary" : "outline"} size="sm">
                    {race.reminder ? "Rappel ✓" : "M'alerter"}
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
