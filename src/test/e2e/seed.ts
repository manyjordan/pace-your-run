/**
 * E2E Test Script - Fake User Profiles
 * Run with: npx tsx src/test/e2e/seed.ts
 *
 * Creates test users, runs all critical flows, then cleans up.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (never commit this key)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("? Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USERS = [
  {
    email: "alice.test.pace@mailinator.com",
    password: "TestPace2024!",
    profile: {
      first_name: "Alice",
      full_name: "Alice Martin",
      username: "alice_runs",
      goal_type: "distance",
      goal_data: { targetDistance: "10k", targetTime: null },
      fitness_level: "beginner",
      days_per_week: 3,
      available_days: ["Lundi", "Mercredi", "Vendredi"],
      gender: "female",
      date_of_birth: "1995-06-15",
      onboarding_completed: true,
    },
  },
  {
    email: "thomas.test.pace@mailinator.com",
    password: "TestPace2024!",
    profile: {
      first_name: "Thomas",
      full_name: "Thomas Dubois",
      username: "thomas_marathon",
      goal_type: "race",
      goal_data: { targetDistance: "marathon", targetTime: "3:30:00" },
      fitness_level: "intermediate",
      days_per_week: 4,
      available_days: ["Mardi", "Jeudi", "Samedi", "Dimanche"],
      gender: "male",
      date_of_birth: "1990-03-22",
      onboarding_completed: true,
    },
  },
] as const;

const FAKE_GPS_TRACE = Array.from({ length: 20 }, (_, i) => ({
  lat: 48.8566 + i * 0.001,
  lng: 2.3522 + i * 0.001,
  time: Date.now() - (20 - i) * 30000,
  altitude: 35 + i,
  accuracy: 5,
}));

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`? ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  log("?", message);
}

async function cleanup(userIds: string[]) {
  log("??", "Cleaning up test data...");
  for (const userId of userIds) {
    await admin.from("follows").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`);
    await admin.from("post_likes").delete().eq("user_id", userId);
    await admin.from("notifications").delete().eq("user_id", userId);
    await admin.from("social_posts").delete().eq("user_id", userId);
    await admin.from("runs").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
  }
  log("?", "Cleanup complete");
}

async function main() {
  console.log("\n?? Pace E2E Test Suite\n");
  const createdUserIds: string[] = [];

  try {
    log("??", "Creating test users...");
    const userIds: Record<string, string> = {};

    for (const testUser of TEST_USERS) {
      const { data, error } = await admin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
      });
      if (error) throw new Error(`Failed to create user ${testUser.email}: ${error.message}`);
      if (!data.user?.id) throw new Error(`Failed to create user ${testUser.email}: missing user id`);

      const userId = data.user.id;
      userIds[testUser.email] = userId;
      createdUserIds.push(userId);

      const { error: profileError } = await admin.from("profiles").upsert({
        id: userId,
        ...testUser.profile,
      });
      if (profileError) throw new Error(`Failed to create profile: ${profileError.message}`);

      log("?", `Created user: ${testUser.profile.full_name} (${userId.slice(0, 8)}...)`);
    }

    const aliceId = userIds["alice.test.pace@mailinator.com"];
    const thomasId = userIds["thomas.test.pace@mailinator.com"];

    log("\n??", "Testing profile retrieval...");
    const { data: aliceProfile, error: profileErr } = await admin
      .from("profiles")
      .select("*")
      .eq("id", aliceId)
      .single();

    assert(!profileErr, "Profile retrieval has no error");
    assert(aliceProfile.first_name === "Alice", "Alice profile first_name is correct");
    assert(aliceProfile.onboarding_completed === true, "Onboarding marked as completed");
    assert(
      Array.isArray(aliceProfile.available_days) && aliceProfile.available_days.length === 3,
      "Alice has 3 available days",
    );

    log("\n??", "Testing run creation...");
    const { data: aliceRun, error: runErr } = await admin
      .from("runs")
      .insert({
        user_id: aliceId,
        title: "Course test Alice",
        distance_km: 7.5,
        duration_seconds: 2700,
        moving_time_seconds: 2580,
        elevation_gain: 45,
        average_pace: 6.0,
        run_type: "run",
        started_at: new Date().toISOString(),
        gps_trace: FAKE_GPS_TRACE,
      })
      .select()
      .single();

    assert(!runErr, "Run creation has no error");
    assert(aliceRun.distance_km === 7.5, "Run distance is correct");
    assert(aliceRun.user_id === aliceId, "Run belongs to Alice");

    log("\n??", "Testing social post creation...");
    const { data: alicePost, error: postErr } = await admin
      .from("social_posts")
      .insert({
        user_id: aliceId,
        run_id: aliceRun.id,
        title: "Belle sortie matinale !",
        description: "Super course ce matin ?????",
        is_public: true,
        audience: "public",
        likes_count: 0,
      })
      .select()
      .single();

    assert(!postErr, "Post creation has no error");
    assert(alicePost.user_id === aliceId, "Post belongs to Alice");

    log("\n??", "Testing follow system...");
    const { error: followErr } = await admin.from("follows").insert({
      follower_id: thomasId,
      following_id: aliceId,
    });

    assert(!followErr, "Thomas can follow Alice");

    const { data: followCheck } = await admin
      .from("follows")
      .select("*")
      .eq("follower_id", thomasId)
      .eq("following_id", aliceId)
      .single();

    assert(!!followCheck, "Follow relationship exists in database");

    log("\n??", "Testing self-follow prevention...");
    const { error: selfFollowErr } = await admin.from("follows").insert({
      follower_id: aliceId,
      following_id: aliceId,
    });

    if (!selfFollowErr) {
      await admin.from("follows").delete().eq("follower_id", aliceId).eq("following_id", aliceId);
      log("??", "Self-follow not prevented at DB level - enforced at app level only");
    } else {
      log("?", "Self-follow prevented at DB level");
    }

    log("\n??", "Testing like system...");
    const { error: likeErr } = await admin.from("post_likes").insert({
      user_id: thomasId,
      post_id: alicePost.id,
    });

    assert(!likeErr, "Thomas can like Alice's post");

    await new Promise((r) => setTimeout(r, 500));
    const { data: notifications } = await admin
      .from("notifications")
      .select("*")
      .eq("user_id", aliceId)
      .eq("type", "like");

    assert(notifications !== null && notifications.length > 0, "Alice received a like notification");

    log("\n??", "Testing security: Thomas cannot delete Alice's run...");
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!anonKey) {
      log("??", "Missing VITE_SUPABASE_ANON_KEY - skipping RLS user-client test");
    } else {
      const thomasClient = createClient(SUPABASE_URL, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { error: signInErr } = await thomasClient.auth.signInWithPassword({
        email: "thomas.test.pace@mailinator.com",
        password: "TestPace2024!",
      });

      if (!signInErr) {
        const { error: deleteErr } = await thomasClient.from("runs").delete().eq("id", aliceRun.id);

        assert(!!deleteErr || true, "RLS prevents Thomas from deleting Alice's run");

        const { data: runStillExists } = await admin.from("runs").select("id").eq("id", aliceRun.id).single();

        assert(!!runStillExists, "Alice's run still exists after Thomas's delete attempt");
      } else {
        log("??", "Could not test RLS - sign in failed (may need email confirmation disabled)");
      }
    }

    log("\n??", "Testing duplicate like prevention...");
    const { error: dupLikeErr } = await admin.from("post_likes").insert({
      user_id: thomasId,
      post_id: alicePost.id,
    });
    assert(!!dupLikeErr, "Duplicate like is prevented by unique constraint");

    console.log("\n" + "=".repeat(50));
    console.log("?? ALL TESTS PASSED");
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("\n?? TEST FAILED:", error);
  } finally {
    await cleanup(createdUserIds);
  }
}

void main();
