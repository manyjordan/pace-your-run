import { supabase } from "@/lib/supabase";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRow = {
  avatar_url: string | null;
  created_at: string | null;
  full_name: string | null;
  goal_data: Json | null;
  goal_type: string | null;
  id: string;
  updated_at: string | null;
  username: string | null;
  onboarding_completed?: boolean;
  gender?: string | null;
  date_of_birth?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

export type RunGpsPoint = {
  lat: number;
  lng: number;
  time: number;
  altitude?: number;
  accuracy?: number;
};

export type RunRow = {
  average_heartrate: number | null;
  average_pace: number | null;
  created_at: string | null;
  distance_km: number;
  duration_seconds: number;
  elevation_gain: number | null;
  gps_trace: Json | null;
  id: string;
  run_type: string | null;
  started_at: string | null;
  title: string | null;
  user_id: string | null;
};

export type RunInput = {
  average_heartrate?: number | null;
  average_pace?: number | null;
  distance_km: number;
  duration_seconds: number;
  elevation_gain?: number | null;
  gps_trace?: RunGpsPoint[];
  run_type?: string | null;
  started_at?: string | null;
  title?: string | null;
};

export type SocialPostRow = {
  created_at: string | null;
  description: string | null;
  id: string;
  is_public: boolean | null;
  likes_count: number | null;
  run_id: string | null;
  title: string | null;
  user_id: string | null;
};

export type PublicPostRecord = SocialPostRow & {
  profile: ProfileRow | null;
  run: RunRow | null;
  likedByMe: boolean;
};

async function requireCurrentUserId(expectedUserId?: string) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Authenticated user required.");
  if (expectedUserId && user.id !== expectedUserId) {
    throw new Error("Authenticated user does not match requested user.");
  }

  return user.id;
}

export async function getProfile(userId: string) {
  await requireCurrentUserId(userId);

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as ProfileRow | null;
}

export async function upsertProfile(userId: string, data: Record<string, unknown>) {
  await requireCurrentUserId(userId);

  const payload: Record<string, unknown> = {
    id: userId,
    updated_at:
      typeof data.updated_at === "string"
        ? data.updated_at
        : new Date().toISOString(),
  };

  if ("first_name" in data) payload.first_name = data.first_name ?? null;
  if ("full_name" in data) payload.full_name = data.full_name ?? null;
  if ("gender" in data) payload.gender = data.gender ?? null;
  if ("date_of_birth" in data) payload.date_of_birth = data.date_of_birth ?? null;
  if ("onboarding_completed" in data) payload.onboarding_completed = data.onboarding_completed ?? false;
  if ("avatar_url" in data) payload.avatar_url = data.avatar_url ?? null;
  if ("username" in data) payload.username = data.username ?? null;

  if ("goal_data" in data) {
    payload.goal_data = (data.goal_data ?? null) as Json;
  } else if (typeof data.goalType === "string") {
    payload.goal_data = data as Json;
  }

  if ("goal_type" in data) {
    payload.goal_type = data.goal_type ?? null;
  } else if (typeof data.goalType === "string") {
    payload.goal_type = data.goalType;
  }

  // First try to get the existing profile
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  // If profile doesn't exist, insert it first with minimal data
  if (!existing) {
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        created_at: new Date().toISOString(),
        ...payload,
      });
    
    if (insertError) throw insertError;
  } else {
    // Profile exists, do the update
    const { error: updateError } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId);
    
    if (updateError) throw updateError;
  }

  // Fetch and return the updated profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return profile as ProfileRow;
}

export async function saveRun(userId: string, runData: RunInput) {
  await requireCurrentUserId(userId);

  const { data, error } = await supabase
    .from("runs")
    .insert({
      user_id: userId,
      average_heartrate: runData.average_heartrate ?? null,
      average_pace: runData.average_pace ?? null,
      distance_km: runData.distance_km,
      duration_seconds: runData.duration_seconds,
      elevation_gain: runData.elevation_gain ?? null,
      gps_trace: (runData.gps_trace ?? []) as Json,
      run_type: runData.run_type ?? "run",
      started_at: runData.started_at ?? new Date().toISOString(),
      title: runData.title ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as RunRow;
}

export async function getRuns(userId: string) {
  await requireCurrentUserId(userId);

  const { data, error } = await supabase
    .from("runs")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as RunRow[];
}

export async function deleteRun(runId: string) {
  await requireCurrentUserId();

  const { error } = await supabase
    .from("runs")
    .delete()
    .eq("id", runId);

  if (error) throw error;
}

export async function getPublicPosts() {
  const currentUserId = await requireCurrentUserId();

  const { data: posts, error: postsError } = await supabase
    .from("social_posts")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (postsError) throw postsError;
  if (!posts?.length) return [] as PublicPostRecord[];

  const runIds = posts.map((post) => post.run_id).filter((value): value is string => Boolean(value));
  const userIds = posts.map((post) => post.user_id).filter((value): value is string => Boolean(value));
  const postIds = posts.map((post) => post.id);

  const [
    { data: runs, error: runsError },
    { data: profiles, error: profilesError },
    { data: likes, error: likesError },
  ] = await Promise.all([
    runIds.length
      ? supabase.from("runs").select("*").in("id", runIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? supabase.from("profiles").select("*").in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length
      ? supabase.from("post_likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (runsError) throw runsError;
  if (profilesError) throw profilesError;
  if (likesError) throw likesError;

  const runMap = new Map((runs ?? []).map((run) => [run.id, run as RunRow]));
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile as ProfileRow]));
  const likedPostIds = new Set((likes ?? []).map((like) => like.post_id).filter((value): value is string => Boolean(value)));

  return posts.map((post) => ({
    ...(post as SocialPostRow),
    likes_count: post.likes_count ?? 0,
    profile: post.user_id ? profileMap.get(post.user_id) ?? null : null,
    run: post.run_id ? runMap.get(post.run_id) ?? null : null,
    likedByMe: likedPostIds.has(post.id),
  })) as PublicPostRecord[];
}

export async function createPost(userId: string, runId: string, title: string, description: string) {
  await requireCurrentUserId(userId);

  const { data, error } = await supabase
    .from("social_posts")
    .insert({
      user_id: userId,
      run_id: runId,
      title,
      description,
      is_public: true,
      likes_count: 0,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as SocialPostRow;
}

export async function toggleLike(postId: string, userId: string) {
  await requireCurrentUserId(userId);

  const { data: existingLike, error: existingLikeError } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingLikeError) throw existingLikeError;

  if (existingLike) {
    const { error: deleteError } = await supabase
      .from("post_likes")
      .delete()
      .eq("id", existingLike.id);

    if (deleteError) throw deleteError;
  } else {
    const { error: insertError } = await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: userId });

    if (insertError) throw insertError;
  }

  const { count, error: countError } = await supabase
    .from("post_likes")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);

  if (countError) throw countError;

  const likesCount = count ?? 0;

  const { error: updateError } = await supabase
    .from("social_posts")
    .update({ likes_count: likesCount })
    .eq("id", postId);

  if (updateError) throw updateError;

  return {
    liked: !existingLike,
    likesCount,
  };
}

// ── Training Plan Sessions ──

export type TrainingPlanSessionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  week_number: number;
  session_day: string;
  session_type: string;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
  distance_km: number | null;
  duration_minutes: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type TrainingPlanSessionInput = {
  plan_id: string;
  week_number: number;
  session_day: string;
  session_type: string;
  completed?: boolean;
  completed_at?: string | null;
  notes?: string | null;
  distance_km?: number | null;
  duration_minutes?: number | null;
};

export async function toggleSessionCompleted(
  planId: string,
  weekNumber: number,
  sessionDay: string,
  userId: string,
  notes?: string
) {
  await requireCurrentUserId(userId);

  const { data: existingSession, error: existingError } = await supabase
    .from("training_plan_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_id", planId)
    .eq("week_number", weekNumber)
    .eq("session_day", sessionDay)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existingSession && existingSession.completed) {
    // Mark as not completed
    const { error } = await supabase
      .from("training_plan_sessions")
      .update({
        completed: false,
        completed_at: null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSession.id);

    if (error) throw error;
    return { completed: false };
  } else if (existingSession) {
    // Mark as completed
    const { error } = await supabase
      .from("training_plan_sessions")
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSession.id);

    if (error) throw error;
    return { completed: true };
  } else {
    // Create new session as completed
    const { error } = await supabase
      .from("training_plan_sessions")
      .insert({
        user_id: userId,
        plan_id: planId,
        week_number: weekNumber,
        session_day: sessionDay,
        session_type: "",
        completed: true,
        completed_at: new Date().toISOString(),
        notes: notes || null,
      });

    if (error) throw error;
    return { completed: true };
  }
}

export async function getWeekSessions(
  userId: string,
  planId: string,
  weekNumber: number
) {
  await requireCurrentUserId(userId);

  const { data, error } = await supabase
    .from("training_plan_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_id", planId)
    .eq("week_number", weekNumber);

  if (error) throw error;
  return (data ?? []) as TrainingPlanSessionRow[];
}

export async function getCompletedSessionsCount(
  userId: string,
  planId: string
) {
  await requireCurrentUserId(userId);

  const { data, error } = await supabase
    .from("training_plan_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_id", planId)
    .eq("completed", true);

  if (error) throw error;
  return (data ?? []).length;
}

export async function getPlanProgress(
  userId: string,
  planId: string,
  totalWeeks: number
) {
  await requireCurrentUserId(userId);

  const { data, error } = await supabase
    .from("training_plan_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_id", planId)
    .eq("completed", true);

  if (error) throw error;

  const completedSessions = data ?? [];
  const weeksWithProgress = new Set(completedSessions.map(s => s.week_number));
  
  return {
    totalCompleted: completedSessions.length,
    weeksWithProgress: weeksWithProgress.size,
    totalWeeks,
  };
}
