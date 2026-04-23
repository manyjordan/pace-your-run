import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, TrendingUp, Route, Clock, Mountain, Edit2, Save, X, ChevronRight, Activity, Zap, Camera, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, getRuns, uploadProfileAvatar, upsertProfile } from "@/lib/database";
import { getPlanById } from "@/lib/trainingPlans";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { birthDateDayPickerProps } from "@/lib/dateCalendarSettings";
import { logger } from "@/lib/logger";
import { ScrollReveal } from "@/components/ScrollReveal";
import { toast } from "sonner";
import type { ProfileRow, RunRow } from "@/lib/database";

type GoalData = {
  goalType?: "weight" | "distance" | "race";
  raceType?: string;
  raceDistanceKm?: string;
  raceTargetDate?: string;
  raceTargetTime?: string;
  distanceKm?: string;
  targetWeightKg?: string;
  selectedPlanId?: string;
  goalSavedAt?: string;
};

export function ProfileContent({
  compact = false,
  showDetails = true,
}: {
  compact?: boolean;
  showDetails?: boolean;
}) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [showAvatarHelp, setShowAvatarHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    if (!authLoading && !user?.id) {
      navigate("/auth");
      return;
    }

    if (!authLoading && user?.id) {
      void loadProfileData();
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const loadProfileData = async () => {
    if (!user?.id) return;

    try {
      const [profileData, runsData] = await Promise.all([
        getProfile(user.id),
        showDetails ? getRuns(user.id) : Promise.resolve([]),
      ]);

      setProfile(
        profileData ?? {
          id: user.id,
          avatar_url: null,
          created_at: new Date().toISOString(),
          full_name: null,
          goal_data: null,
          goal_type: null,
          updated_at: null,
          username: null,
          first_name: null,
          last_name: null,
          gender: null,
          date_of_birth: null,
        },
      );
      setRuns(runsData);
      setFormData({
        firstName: profileData?.first_name || "",
        lastName: profileData?.last_name || "",
        gender: profileData?.gender || "",
        dateOfBirth: profileData?.date_of_birth || "",
      });
    } catch (error) {
      logger.error("Error loading profile", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {};

      if ((profile?.first_name ?? "") !== formData.firstName) {
        payload.first_name = formData.firstName || null;
      }

      if ((profile?.last_name ?? "") !== formData.lastName) {
        payload.last_name = formData.lastName || null;
      }

      const currentFullName = profile?.full_name ?? "";
      const nextFullName = [formData.firstName, formData.lastName].filter(Boolean).join(" ");
      if (currentFullName !== nextFullName) {
        payload.full_name = nextFullName || null;
      }

      if ((profile?.gender ?? "") !== formData.gender && formData.gender) {
        payload.gender = formData.gender;
      }

      if ((profile?.date_of_birth ?? "") !== formData.dateOfBirth && formData.dateOfBirth) {
        payload.date_of_birth = formData.dateOfBirth;
      }

      if (Object.keys(payload).length === 0) {
        setIsEditMode(false);
        toast.success("Aucune modification à enregistrer.");
        return;
      }

      const updatedProfile = await upsertProfile(user.id, payload);

      setProfile(updatedProfile);
      setIsEditMode(false);
      toast.success("Profil mis à jour");
    } catch (error) {
      logger.error("Error saving profile", error);
      const message =
        typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
          ? error.message
          : "Impossible de sauvegarder les informations.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: profile?.first_name || "",
      lastName: profile?.last_name || "",
      gender: profile?.gender || "",
      dateOfBirth: profile?.date_of_birth || "",
    });
    setAvatarPreviewUrl(null);
    setIsEditMode(false);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setAvatarPreviewUrl(null);
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choisissez une image JPG, PNG ou WebP.");
      event.target.value = "";
      setAvatarPreviewUrl(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image doit faire moins de 5 Mo.");
      event.target.value = "";
      setAvatarPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return objectUrl;
    });
    setShowAvatarHelp(true);

    if (!user?.id) return;

    try {
      setIsUploadingAvatar(true);
      const uploadedUrl = await uploadProfileAvatar(user.id, file);
      setProfile((current) => (current ? { ...current, avatar_url: uploadedUrl } : current));
      setAvatarPreviewUrl(null);
      toast.success("Photo de profil mise à jour");
    } catch (error) {
      logger.error("Error uploading avatar", error);
      const message =
        typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
          ? error.message
          : "Impossible de mettre à jour la photo.";
      toast.error(message);
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Profil non trouvé</p>
      </div>
    );
  }

  const getUserInitials = () => {
    const first = profile.first_name?.[0]?.toUpperCase() || "";
    const last = profile.last_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || "";
    return `${first}${last}`.slice(0, 2) || "U";
  };

  const getMemberSinceDate = () => {
    if (!profile.created_at) return "";
    const date = new Date(profile.created_at);
    return format(date, "MMMM yyyy", { locale: fr });
  };

  const containerClass = compact ? "space-y-6" : "space-y-6 pb-20";

  return (
    <div className={containerClass}>
      <ScrollReveal>
        <Card className="relative border-accent/20 bg-card/95 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
          <Link
            to="/settings"
            className="absolute right-3 top-3 z-10 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
            aria-label="Paramètres"
          >
            <Settings className="h-5 w-5" />
          </Link>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Avatar className="h-20 w-20 border-2 border-accent/20">
              <AvatarImage src={avatarPreviewUrl ?? profile.avatar_url ?? undefined} alt="Photo de profil" />
              <AvatarFallback className="bg-accent text-2xl font-bold text-accent-foreground">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>

            <div className="text-center">
              <h1 className="text-2xl font-bold">
                {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-sm text-muted-foreground">Membre depuis {getMemberSinceDate()}</p>
            </div>

            <div className="w-full max-w-xs space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowAvatarHelp(true);
                  fileInputRef.current?.click();
                }}
                disabled={isUploadingAvatar}
              >
                <Camera className="mr-2 h-4 w-4" />
                {isUploadingAvatar ? "Mise à jour..." : "Changer la photo"}
              </Button>
              {showAvatarHelp ? (
                <p className="text-center text-xs text-muted-foreground">
                  JPG, PNG ou WebP, 5 Mo maximum. La photo sera stockée dans Supabase.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <Card className="border-accent/20 bg-card/95 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg">Informations personnelles</CardTitle>
              <Button
                onClick={() => (isEditMode ? handleCancel() : setIsEditMode(true))}
                variant="outline"
                className={isEditMode ? "border-red-500/50 text-red-500 hover:bg-red-500/10" : ""}
              >
                {isEditMode ? (
                  <>
                    <X className="mr-2 h-4 w-4" /> Annuler
                  </>
                ) : (
                  <>
                    <Edit2 className="mr-2 h-4 w-4" /> Modifier
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              {isEditMode ? (
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="border-accent"
                  placeholder="Votre prénom"
                />
              ) : (
                <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  {formData.firstName || "—"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              {isEditMode ? (
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="border-accent"
                  placeholder="Votre nom"
                />
              ) : (
                <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  {formData.lastName || "—"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Genre</Label>
              {isEditMode ? (
                <div className="grid grid-cols-2 gap-2">
                  {(["Homme", "Femme"] as const).map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => setFormData({ ...formData, gender: option })}
                      className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                        formData.gender === option
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  {formData.gender || "—"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date de naissance</Label>
              {isEditMode ? (
                <ProfileDatePicker
                  value={formData.dateOfBirth}
                  onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
                />
              ) : (
                <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  {formData.dateOfBirth
                    ? format(parse(formData.dateOfBirth, "yyyy-MM-dd", new Date()), "d MMMM yyyy", { locale: fr })
                    : "—"}
                </p>
              )}
            </div>

            {isEditMode && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCancel} variant="outline" className="flex-1">
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || isUploadingAvatar}
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {isSaving || isUploadingAvatar ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {isUploadingAvatar ? "Upload de la photo..." : "Enregistrement..."}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </ScrollReveal>

      {showDetails ? <ProfileDetails profile={profile} runs={runs} navigate={navigate} /> : null}
    </div>
  );
}

function ProfileDetails({
  profile,
  runs,
  navigate,
}: {
  profile: ProfileRow;
  runs: RunRow[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const goalData = (profile.goal_data as GoalData) || {};

  return (
    <>
      <ScrollReveal>
        <Card className="border-accent/20 bg-card/95 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
          <CardHeader>
            <CardTitle className="text-lg">Mon objectif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goalData.goalType ? (
              <>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Type d'objectif</p>
                  <div className="inline-flex">
                    <span className="rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-accent">
                      {goalData.goalType === "weight"
                        ? "Perte de poids"
                        : goalData.goalType === "distance"
                          ? "Distance"
                          : "Course"}
                    </span>
                  </div>
                </div>

                {goalData.goalType === "weight" && goalData.targetWeightKg && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Poids cible</p>
                    <p className="font-medium">{goalData.targetWeightKg} kg</p>
                  </div>
                )}

                {goalData.goalType === "distance" && goalData.raceDistanceKm && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Distance cible</p>
                    <p className="font-medium">{goalData.raceDistanceKm} km</p>
                  </div>
                )}

                {goalData.goalType === "race" && (
                  <>
                    {goalData.raceDistanceKm && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Distance de la course</p>
                        <p className="font-medium">{goalData.raceDistanceKm} km</p>
                      </div>
                    )}
                    {goalData.raceTargetDate && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Date cible</p>
                        <p className="font-medium">{format(new Date(goalData.raceTargetDate), "d MMMM yyyy", { locale: fr })}</p>
                      </div>
                    )}
                    {goalData.raceTargetTime && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Objectif de temps</p>
                        <p className="font-medium">{goalData.raceTargetTime}</p>
                      </div>
                    )}
                  </>
                )}

                <Button onClick={() => navigate("/plan")} variant="outline" className="w-full">
                  Modifier mon objectif
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Aucun objectif défini pour l'instant.</p>
                <Button onClick={() => navigate("/plan")} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Définir mon objectif
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </ScrollReveal>

      <ScrollReveal>
        <div className="space-y-3">
          <h3 className="px-4 text-lg font-bold">Mes statistiques</h3>
          <StatisticsGrid runs={runs} />
        </div>
      </ScrollReveal>

      {goalData.selectedPlanId && (
        <ScrollReveal>
          <Card className="border-accent/20 bg-card/95 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
            <CardHeader>
              <CardTitle className="text-lg">Mon plan actuel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PlanSummary planId={goalData.selectedPlanId} goalSavedAt={goalData.goalSavedAt} />
            </CardContent>
          </Card>
        </ScrollReveal>
      )}
    </>
  );
}

function ProfileDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between border-accent bg-card text-left font-normal hover:border-accent hover:bg-accent/10"
        >
          <span className={selectedDate ? "text-foreground" : "text-muted-foreground"}>
            {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: fr }) : "Choisir une date"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-lg border-border bg-card p-0 shadow-md">
        <CalendarComponent
          mode="single"
          {...birthDateDayPickerProps(selectedDate)}
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
          className="rounded-lg bg-card p-3"
          classNames={{
            caption_label: "text-sm font-semibold text-foreground",
            head_cell: "w-9 rounded-md text-[0.75rem] font-medium text-muted-foreground",
            nav_button: "h-8 w-8 rounded-lg border border-accent/20 bg-card p-0 text-foreground opacity-100 hover:bg-accent hover:text-accent-foreground",
            day_today: "bg-accent/15 text-foreground",
            day_selected:
              "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function StatisticsGrid({ runs }: { runs: RunRow[] }) {
  if (runs.length === 0) {
    return (
      <Card className="border-accent/20 bg-card/95 p-4 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
        <p className="text-center text-sm text-muted-foreground">Aucune course enregistrée pour l'instant.</p>
      </Card>
    );
  }

  const totalRuns = runs.length;
  const totalDistance = runs.reduce((sum, run) => sum + (run.distance_km || 0), 0);
  const totalSeconds = runs.reduce((sum, run) => sum + (run.duration_seconds || 0), 0);
  const totalHours = totalSeconds / 3600;
  const averagePace = totalDistance > 0 ? (totalSeconds / 60) / totalDistance : 0;
  const longestRun = Math.max(...runs.map((run) => run.distance_km || 0), 0);

  let fastestPace = Infinity;
  for (const run of runs) {
    if (run.distance_km && run.distance_km > 0 && run.duration_seconds) {
      const pace = (run.duration_seconds / 60) / run.distance_km;
      if (pace < fastestPace) {
        fastestPace = pace;
      }
    }
  }
  fastestPace = fastestPace === Infinity ? 0 : fastestPace;

  const formatPace = (minutes: number) => {
    if (!Number.isFinite(minutes) || minutes === 0) return "—";
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}:${String(secs).padStart(2, "0")}/km`;
  };

  const stats = [
    { label: "Total de courses", value: totalRuns.toString(), icon: Activity },
    { label: "Distance totale", value: `${totalDistance.toFixed(1)} km`, icon: Route },
    { label: "Temps total", value: `${Math.round(totalHours)}h ${Math.round((totalHours % 1) * 60)}min`, icon: Clock },
    { label: "Allure moyenne", value: formatPace(averagePace), icon: TrendingUp },
    { label: "Plus longue course", value: `${longestRun.toFixed(1)} km`, icon: Mountain },
    { label: "Course la plus rapide", value: formatPace(fastestPace), icon: Zap },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Card className="border-accent/20 bg-card/95 shadow-[0_12px_30px_hsl(var(--accent)/0.08)]">
              <CardContent className="flex flex-col items-center gap-2 pt-4">
                <div className="rounded-lg bg-accent/10 p-2">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <p className="text-center text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-center text-lg font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

function PlanSummary({ planId, goalSavedAt }: { planId: string; goalSavedAt?: string }) {
  const plan = getPlanById(planId);

  if (!plan) {
    return <p className="text-sm text-muted-foreground">Plan non trouvé</p>;
  }

  const currentWeek = goalSavedAt
    ? Math.min(
        Math.max(1, Math.floor((Date.now() - new Date(goalSavedAt).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1),
        plan.durationWeeks,
      )
    : 1;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Plan</span>
          <span className="font-semibold">{plan.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Durée</span>
          <span className="font-semibold">{plan.durationWeeks} semaines</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Jours par semaine</span>
          <span className="font-semibold">{plan.daysPerWeek}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Semaine actuelle</span>
          <span className="font-semibold">{currentWeek}/{plan.durationWeeks}</span>
        </div>
      </div>

      <Button onClick={() => window.location.href = "/plan"} variant="outline" className="w-full">
        Voir mon plan complet <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
