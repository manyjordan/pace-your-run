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
  available_days?: string[];
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
  moving_time_seconds?: number | null;
  ran_with?: string[] | null;
  run_type: string | null;
  started_at: string | null;
  title: string | null;
  user_id: string | null;
};

export type RouteRow = {
  id: string;
  user_id: string;
  name: string;
  distance_km: number;
  elevation_gain: number;
  gps_trace: RunGpsPoint[];
  created_at: string | null;
};

export type RunInput = {
  average_heartrate?: number | null;
  average_pace?: number | null;
  distance_km: number;
  duration_seconds: number;
  elevation_gain?: number | null;
  gps_trace?: RunGpsPoint[];
  moving_time_seconds?: number | null;
  ran_with?: string[];
  run_type?: string | null;
  started_at?: string | null;
  title?: string | null;
};

export type SocialPostRow = {
  audience?: "private" | "friends" | "public" | null;
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

export type PersonalizedFeedPost = PublicPostRecord & {
  feedReason: "own" | "following" | "friend_liked";
  friendWhoLiked?: {
    id: string;
    name: string;
  };
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: "like" | "follow";
  actor_id: string;
  post_id: string | null;
  post_title: string | null;
  read_at: string | null;
  created_at: string | null;
};

export type NotificationWithActor = NotificationRow & {
  actor: ProfileRow | null;
};

export type ForumCategoryRow = {
  created_at: string | null;
  description: string | null;
  id: string;
  sort_order: number;
  title: string;
};

export type ForumThreadRow = {
  category_id: string;
  content: string;
  created_at: string | null;
  id: string;
  is_locked: boolean;
  is_pinned: boolean;
  likes_count: number | null;
  title: string;
  updated_at: string | null;
  user_id: string;
};

export type ForumReplyRow = {
  content: string;
  created_at: string | null;
  id: string;
  thread_id: string;
  updated_at: string | null;
  user_id: string;
};

export type ForumCategoryRecord = ForumCategoryRow & {
  latestActivityAt: string | null;
  threadsCount: number;
};

export type ForumReplyRecord = ForumReplyRow & {
  profile: ProfileRow | null;
};

export type ForumThreadRecord = ForumThreadRow & {
  category: ForumCategoryRow | null;
  profile: ProfileRow | null;
  repliesCount: number;
};

export type ForumThreadDetailRecord = ForumThreadRecord & {
  replies: ForumReplyRecord[];
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
    updated_at:
      typeof data.updated_at === "string"
        ? data.updated_at
        : new Date().toISOString(),
  };

  if ("first_name" in data) payload.first_name = data.first_name ?? null;
  if ("last_name" in data) payload.last_name = data.last_name ?? null;
  if ("full_name" in data) payload.full_name = data.full_name ?? null;
  if ("gender" in data) payload.gender = data.gender ?? null;
  if ("date_of_birth" in data) payload.date_of_birth = data.date_of_birth ?? null;
  if ("onboarding_completed" in data) payload.onboarding_completed = data.onboarding_completed ?? false;
  if ("avatar_url" in data) payload.avatar_url = data.avatar_url ?? null;
  if ("username" in data) payload.username = data.username ?? null;
  if ("available_days" in data) payload.available_days = (data.available_days ?? []) as string[];

  if (!("full_name" in data)) {
    const fullNameParts = [payload.first_name, payload.last_name]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);

    if (fullNameParts.length > 0) {
      payload.full_name = fullNameParts.join(" ");
    }
  }

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

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select("*");

  if (updateError) throw updateError;

  if (updatedProfile && updatedProfile.length > 0) {
    return updatedProfile[0] as ProfileRow;
  }

  const insertPayload: Record<string, unknown> = {
    id: userId,
    created_at: new Date().toISOString(),
    ...payload,
  };

  const { data: insertedProfile, error: insertError } = await supabase
      .from("profiles")
      .insert(insertPayload)
      .select("*")
    .single();

  if (insertError) throw insertError;
  return insertedProfile as ProfileRow;
}

const PROFILE_AVATAR_BUCKET = "avatars";

export async function uploadProfileAvatar(userId: string, file: File) {
  await requireCurrentUserId(userId);

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${userId}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || undefined,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(filePath);

  await upsertProfile(userId, {
    avatar_url: publicUrl,
  });

  return publicUrl;
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
      moving_time_seconds: runData.moving_time_seconds ?? null,
      ran_with: runData.ran_with ?? [],
      run_type: runData.run_type ?? "run",
      started_at: runData.started_at ?? new Date().toISOString(),
      title: runData.title ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as RunRow;
}

export async function detectSimultaneousRuns(
  userId: string,
  startedAt: string,
  durationSeconds: number,
  gpsTrace: RunGpsPoint[],
): Promise<string[]> {
  if (!gpsTrace.length) return [];

  const endedAt = new Date(new Date(startedAt).getTime() + durationSeconds * 1000).toISOString();

  const { data, error } = await supabase.rpc("detect_simultaneous_runs", {
    p_user_id: userId,
    p_started_at: startedAt,
    p_ended_at: endedAt,
    p_gps_trace: JSON.stringify(gpsTrace),
  });

  if (error) {
    console.error("detectSimultaneousRuns error:", error);
    return [];
  }

  return (data as string[]) ?? [];
}

export async function getProfilesByIds(userIds: string[]): Promise<ProfileRow[]> {
  if (!userIds.length) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, full_name, username, avatar_url")
    .in("id", userIds);
  if (error) throw error;
  return (data ?? []) as ProfileRow[];
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

export async function saveRoute(
  userId: string,
  route: {
    name: string;
    distance_km: number;
    elevation_gain: number;
    gps_trace: RunGpsPoint[];
  },
): Promise<RouteRow> {
  await requireCurrentUserId(userId);
  const { data, error } = await supabase
    .from("routes")
    .insert({ user_id: userId, ...route })
    .select()
    .single();
  if (error) throw error;
  return data as RouteRow;
}

export async function getRoutes(userId: string): Promise<RouteRow[]> {
  await requireCurrentUserId(userId);
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RouteRow[];
}

export async function deleteRoute(routeId: string, userId: string): Promise<void> {
  await requireCurrentUserId(userId);
  const { error } = await supabase
    .from("routes")
    .delete()
    .eq("id", routeId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteRun(runId: string) {
  const userId = await requireCurrentUserId();
  const { error } = await supabase
    .from("runs")
    .delete()
    .eq("id", runId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function updateRunRanWith(
  runId: string,
  userId: string,
  ranWith: string[],
): Promise<void> {
  await requireCurrentUserId(userId);
  const { error } = await supabase
    .from("runs")
    .update({ ran_with: ranWith })
    .eq("id", runId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function updatePostDescription(
  postId: string,
  userId: string,
  description: string,
): Promise<void> {
  await requireCurrentUserId(userId);
  const { error } = await supabase
    .from("social_posts")
    .update({ description })
    .eq("id", postId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getPublicPosts() {
  const currentUserId = await requireCurrentUserId();

  const { data: posts, error: postsError } = await supabase
    .from("social_posts")
    .select("*")
    .eq("audience", "public")
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

function feedReasonPriority(reason: "own" | "following" | "friend_liked") {
  if (reason === "own") return 3;
  if (reason === "following") return 2;
  return 1;
}

export async function followUser(followerId: string, followingId: string) {
  await requireCurrentUserId(followerId);
  if (followerId === followingId) {
    throw new Error("Vous ne pouvez pas vous suivre vous-même.");
  }

  const { data, error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId })
    .select("follower_id");

  if (error) {
    if (error.code === "23505") return;
    throw error;
  }

  if (data?.length) {
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: followingId,
      type: "follow",
      actor_id: followerId,
      post_id: null,
      post_title: null,
    });
    if (notifError) console.error("follow notification:", notifError);
  }
}

export async function unfollowUser(followerId: string, followingId: string) {
  await requireCurrentUserId(followerId);

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) throw error;
}

export async function getFollowing(userId: string): Promise<string[]> {
  await requireCurrentUserId(userId);

  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.following_id as string);
}

/**
 * Run in Supabase SQL Editor: add `p_offset int default 0` to `get_personalized_feed`
 * and end the query with `limit p_limit offset p_offset` (same return columns as before).
 *
 * Example:
 *   create or replace function get_personalized_feed(
 *     p_user_id uuid,
 *     p_limit int default 20,
 *     p_offset int default 0
 *   ) returns table ( ... ) language sql stable security definer as $$
 *     ... existing select ...
 *     limit p_limit offset p_offset;
 *   $$;
 */
export async function getPersonalizedFeed(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<PersonalizedFeedPost[]> {
  await requireCurrentUserId(userId);

  const { data, error } = await supabase.rpc("get_personalized_feed", {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;
  if (!data?.length) return [];

  type PersonalizedFeedRpcRow = {
    id: string;
    user_id: string;
    run_id: string | null;
    title: string | null;
    description: string | null;
    is_public: boolean | null;
    audience: string | null;
    likes_count: number;
    created_at: string | null;
    feed_reason: "own" | "following" | "friend_liked";
    friend_who_liked_id: string | null;
    friend_who_liked_name: string | null;
    run_distance_km: number | null;
    run_duration_seconds: number | null;
    run_elevation_gain: number | null;
    run_average_pace: number | null;
    run_average_heartrate: number | null;
    run_started_at: string | null;
    run_title: string | null;
    run_gps_trace: Json | null;
    author_first_name: string | null;
    author_full_name: string | null;
    author_username: string | null;
    author_avatar_url: string | null;
    liked_by_me: boolean;
  };

  return (data as PersonalizedFeedRpcRow[]).map((row): PersonalizedFeedPost => {
    const profile: ProfileRow | null = row.user_id
      ? {
          id: row.user_id,
          first_name: row.author_first_name,
          full_name: row.author_full_name,
          username: row.author_username,
          avatar_url: row.author_avatar_url,
          goal_type: null,
          goal_data: null,
          created_at: null,
          updated_at: null,
        }
      : null;

    const run: RunRow | null = row.run_id
      ? {
          id: row.run_id,
          user_id: row.user_id,
          distance_km: row.run_distance_km ?? 0,
          duration_seconds: row.run_duration_seconds ?? 0,
          elevation_gain: row.run_elevation_gain ?? 0,
          average_pace: row.run_average_pace ?? null,
          average_heartrate: row.run_average_heartrate ?? null,
          started_at: row.run_started_at ?? null,
          title: row.run_title ?? null,
          gps_trace: row.run_gps_trace ?? null,
          run_type: "run",
          created_at: row.created_at,
        }
      : null;

    const post: SocialPostRow = {
      id: row.id,
      user_id: row.user_id,
      run_id: row.run_id ?? null,
      title: row.title,
      description: row.description,
      is_public: row.is_public,
      audience: (row.audience as SocialPostRow["audience"]) ?? "public",
      likes_count: row.likes_count,
      created_at: row.created_at,
    };

    return {
      ...post,
      profile,
      run,
      likedByMe: row.liked_by_me,
      feedReason: row.feed_reason,
      friendWhoLiked: row.friend_who_liked_id
        ? {
            id: row.friend_who_liked_id,
            name: row.friend_who_liked_name ?? "Coureur",
          }
        : undefined,
    };
  });
}

export async function getNotifications(userId: string): Promise<NotificationWithActor[]> {
  await requireCurrentUserId(userId);

  const { data: rows, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  if (!rows?.length) return [];

  const actorIds = [...new Set(rows.map((r) => r.actor_id as string))];
  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*").in("id", actorIds);
  if (profilesError) throw profilesError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as ProfileRow]));

  return rows.map((r) => ({
    ...(r as NotificationRow),
    actor: profileMap.get(r.actor_id as string) ?? null,
  }));
}

export async function markNotificationsRead(userId: string) {
  await requireCurrentUserId(userId);

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  await requireCurrentUserId(userId);

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function getSuggestedUsersToFollow(
  currentUserId: string,
  limit = 5,
): Promise<{ profile: ProfileRow; runCount: number }[]> {
  await requireCurrentUserId(currentUserId);

  const following = await getFollowing(currentUserId);
  const exclude = new Set<string>([currentUserId, ...following]);

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: runs, error } = await supabase
    .from("runs")
    .select("user_id")
    .gte("started_at", since.toISOString())
    .not("user_id", "is", null);

  if (error) throw error;

  const countByUser = new Map<string, number>();
  for (const row of runs ?? []) {
    const uid = row.user_id as string;
    if (!uid || exclude.has(uid)) continue;
    countByUser.set(uid, (countByUser.get(uid) ?? 0) + 1);
  }

  const sorted = [...countByUser.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);

  if (!sorted.length) return [];

  const userIds = sorted.map(([id]) => id);
  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*").in("id", userIds);
  if (profilesError) throw profilesError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as ProfileRow]));

  return sorted.map(([id, runCount]) => {
    const profile = profileMap.get(id);
    return {
      profile: profile ?? ({ id } as ProfileRow),
      runCount,
    };
  });
}

export async function createPost(
  userId: string,
  runId: string,
  title: string,
  description: string,
  audience: "private" | "friends" | "public" = "public",
) {
  await requireCurrentUserId(userId);

  const { data, error } = await supabase
    .from("social_posts")
    .insert({
      audience,
      user_id: userId,
      run_id: runId,
      title,
      description,
      is_public: audience === "public",
      likes_count: 0,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as SocialPostRow;
}

export async function updatePostAudience(
  postId: string,
  userId: string,
  audience: "private" | "friends" | "public",
) {
  await requireCurrentUserId(userId);

  const { data, error } = await supabase
    .from("social_posts")
    .update({
      audience,
      is_public: audience === "public",
    })
    .eq("id", postId)
    .eq("user_id", userId)
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

    const { data: postRow, error: postFetchError } = await supabase
      .from("social_posts")
      .select("user_id, title")
      .eq("id", postId)
      .maybeSingle();

    if (!postFetchError && postRow?.user_id && postRow.user_id !== userId) {
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: postRow.user_id,
        type: "like",
        actor_id: userId,
        post_id: postId,
        post_title: postRow.title,
      });
      if (notifError) console.error("like notification:", notifError);
    }
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

export async function getForumCategories() {
  const [{ data: categories, error: categoriesError }, { data: threads, error: threadsError }] = await Promise.all([
    supabase.from("forum_categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("forum_threads").select("id, category_id, updated_at"),
  ]);

  if (categoriesError) throw categoriesError;
  if (threadsError) throw threadsError;

  const threadStats = new Map<string, { latestActivityAt: string | null; threadsCount: number }>();

  for (const thread of threads ?? []) {
    const current = threadStats.get(thread.category_id) ?? { latestActivityAt: null, threadsCount: 0 };
    const latestActivityAt =
      !current.latestActivityAt || (thread.updated_at ?? "") > current.latestActivityAt
        ? thread.updated_at ?? null
        : current.latestActivityAt;

    threadStats.set(thread.category_id, {
      latestActivityAt,
      threadsCount: current.threadsCount + 1,
    });
  }

  return (categories ?? []).map((category) => {
    const stats = threadStats.get(category.id);
    return {
      ...(category as ForumCategoryRow),
      latestActivityAt: stats?.latestActivityAt ?? null,
      threadsCount: stats?.threadsCount ?? 0,
    };
  }) as ForumCategoryRecord[];
}

export async function getForumThreads(categoryId?: string, limit = 20, offset = 0) {
  const rangeEnd = offset + limit - 1;

  let threadsQuery = supabase
    .from("forum_threads")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .range(offset, rangeEnd);

  if (categoryId) {
    threadsQuery = threadsQuery.eq("category_id", categoryId);
  }

  const { data: threads, error: threadsError } = await threadsQuery;
  if (threadsError) throw threadsError;
  if (!threads?.length) return [] as ForumThreadRecord[];

  const userIds = Array.from(new Set(threads.map((thread) => thread.user_id).filter(Boolean)));
  const categoryIds = Array.from(new Set(threads.map((thread) => thread.category_id).filter(Boolean)));
  const threadIds = threads.map((thread) => thread.id);

  const [
    { data: profiles, error: profilesError },
    { data: categories, error: categoriesError },
    { data: replies, error: repliesError },
  ] = await Promise.all([
    userIds.length ? supabase.from("profiles").select("*").in("id", userIds) : Promise.resolve({ data: [], error: null }),
    categoryIds.length ? supabase.from("forum_categories").select("*").in("id", categoryIds) : Promise.resolve({ data: [], error: null }),
    threadIds.length ? supabase.from("forum_replies").select("id, thread_id").in("thread_id", threadIds) : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesError) throw profilesError;
  if (categoriesError) throw categoriesError;
  if (repliesError) throw repliesError;

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile as ProfileRow]));
  const categoryMap = new Map((categories ?? []).map((category) => [category.id, category as ForumCategoryRow]));
  const repliesCountMap = new Map<string, number>();

  for (const reply of replies ?? []) {
    repliesCountMap.set(reply.thread_id, (repliesCountMap.get(reply.thread_id) ?? 0) + 1);
  }

  return threads.map((thread) => {
    const row = thread as ForumThreadRow & { likes_count?: number | null };
    return {
      ...row,
      likes_count: row.likes_count ?? 0,
      category: categoryMap.get(thread.category_id) ?? null,
      profile: profileMap.get(thread.user_id) ?? null,
      repliesCount: repliesCountMap.get(thread.id) ?? 0,
    };
  }) as ForumThreadRecord[];
}

export async function getForumThreadDetail(threadId: string) {
  const { data: thread, error: threadError } = await supabase
    .from("forum_threads")
    .select("*")
    .eq("id", threadId)
    .single();

  if (threadError) throw threadError;

  const [
    { data: category, error: categoryError },
    { data: threadProfile, error: threadProfileError },
    { data: replies, error: repliesError },
  ] = await Promise.all([
    supabase.from("forum_categories").select("*").eq("id", thread.category_id).maybeSingle(),
    supabase.from("profiles").select("*").eq("id", thread.user_id).maybeSingle(),
    supabase.from("forum_replies").select("*").eq("thread_id", threadId).order("created_at", { ascending: true }),
  ]);

  if (categoryError) throw categoryError;
  if (threadProfileError) throw threadProfileError;
  if (repliesError) throw repliesError;

  const replyUserIds = Array.from(new Set((replies ?? []).map((reply) => reply.user_id).filter(Boolean)));
  const { data: replyProfiles, error: replyProfilesError } = replyUserIds.length
    ? await supabase.from("profiles").select("*").in("id", replyUserIds)
    : { data: [], error: null };

  if (replyProfilesError) throw replyProfilesError;

  const replyProfileMap = new Map((replyProfiles ?? []).map((profile) => [profile.id, profile as ProfileRow]));
  const replyRecords = (replies ?? []).map((reply) => ({
    ...(reply as ForumReplyRow),
    profile: replyProfileMap.get(reply.user_id) ?? null,
  })) as ForumReplyRecord[];

  const threadRow = thread as ForumThreadRow & { likes_count?: number | null };

  return {
    ...threadRow,
    likes_count: threadRow.likes_count ?? 0,
    category: (category as ForumCategoryRow | null) ?? null,
    profile: (threadProfile as ProfileRow | null) ?? null,
    repliesCount: replyRecords.length,
    replies: replyRecords,
  } as ForumThreadDetailRecord;
}

export async function createForumThread(userId: string, categoryId: string, title: string, content: string) {
  await requireCurrentUserId(userId);

  const { data, error } = await supabase
    .from("forum_threads")
    .insert({
      category_id: categoryId,
      content,
      title,
      user_id: userId,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as ForumThreadRow;
}

export async function createForumReply(userId: string, threadId: string, content: string) {
  await requireCurrentUserId(userId);

  const { data: thread, error: threadError } = await supabase
    .from("forum_threads")
    .select("id, is_locked")
    .eq("id", threadId)
    .single();

  if (threadError) throw threadError;
  if (thread.is_locked) {
    throw new Error("Ce sujet est verrouillé.");
  }

  const { data, error } = await supabase
    .from("forum_replies")
    .insert({
      content,
      thread_id: threadId,
      user_id: userId,
    })
    .select("*")
    .single();

  if (error) throw error;

  const { error: updateThreadError } = await supabase
    .from("forum_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId);

  if (updateThreadError) throw updateThreadError;

  return data as ForumReplyRow;
}

export async function toggleForumLike(threadId: string, userId: string): Promise<boolean> {
  /*
   * Run in Supabase SQL Editor:
   *
   * create or replace function increment_forum_likes(thread_id_input uuid)
   * returns void language sql as $$
   *   update forum_threads set likes_count = coalesce(likes_count,0) + 1 where id = thread_id_input;
   * $$;
   *
   * create or replace function decrement_forum_likes(thread_id_input uuid)
   * returns void language sql as $$
   *   update forum_threads set likes_count = greatest(0, coalesce(likes_count,0) - 1) where id = thread_id_input;
   * $$;
   */
  await requireCurrentUserId(userId);

  const { data: existing, error: existingError } = await supabase
    .from("forum_likes")
    .select("id")
    .eq("thread_id", threadId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { error: deleteError } = await supabase.from("forum_likes").delete().eq("id", existing.id);
    if (deleteError) throw deleteError;

    const { error: rpcError } = await supabase.rpc("decrement_forum_likes", {
      thread_id_input: threadId,
    });
    if (rpcError) throw rpcError;

    return false;
  }

  const { error: insertError } = await supabase
    .from("forum_likes")
    .insert({ thread_id: threadId, user_id: userId });
  if (insertError) throw insertError;

  const { error: rpcError } = await supabase.rpc("increment_forum_likes", {
    thread_id_input: threadId,
  });
  if (rpcError) throw rpcError;

  return true;
}

export async function getForumLikedThreadIds(threadIds: string[], userId: string): Promise<string[]> {
  if (!threadIds.length) return [];
  await requireCurrentUserId(userId);

  const { data, error } = await supabase
    .from("forum_likes")
    .select("thread_id")
    .eq("user_id", userId)
    .in("thread_id", threadIds);

  if (error) throw error;
  return (data ?? []).map((r) => r.thread_id as string);
}

export async function updateForumThread(
  threadId: string,
  userId: string,
  updates: { title?: string; content?: string }
): Promise<void> {
  await requireCurrentUserId(userId);

  const { error } = await supabase
    .from("forum_threads")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", threadId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteForumThread(threadId: string, userId: string): Promise<void> {
  await requireCurrentUserId(userId);

  const { error } = await supabase.from("forum_threads").delete().eq("id", threadId).eq("user_id", userId);
  if (error) throw error;
}

export async function updateForumReply(replyId: string, userId: string, content: string): Promise<void> {
  await requireCurrentUserId(userId);

  const { error } = await supabase
    .from("forum_replies")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", replyId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteForumReply(replyId: string, userId: string): Promise<void> {
  await requireCurrentUserId(userId);

  const { error } = await supabase.from("forum_replies").delete().eq("id", replyId).eq("user_id", userId);
  if (error) throw error;
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
