import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase environment variables" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Create Supabase admin client (with service role key)
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the token and extract user_id
    console.log("Step: verifying token");
    const {
      data: { user },
      error: tokenError,
    } = await supabaseAdmin.auth.getUser(token);

    if (tokenError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    console.log("Step: user verified, id:", userId);

    const isIgnorableCleanupError = (error: unknown) => {
      if (!error || typeof error !== "object") return false;
      const code = "code" in error ? error.code : undefined;
      const message = "message" in error && typeof error.message === "string" ? error.message : "";

      return (
        code === "42P01" ||
        code === "42703" ||
        message.toLowerCase().includes("does not exist") ||
        message.toLowerCase().includes("schema cache")
      );
    };

    const cleanupTable = async (
      table: string,
      column: string,
      value: string,
    ) => {
      const { error } = await supabaseAdmin.from(table).delete().eq(column, value);

      if (error && !isIgnorableCleanupError(error)) {
        throw error;
      }
    };

    const deleteAvatarFolder = async () => {
      const { data, error } = await supabaseAdmin.storage
        .from("avatars")
        .list(userId, { limit: 1000 });

      if (error) {
        if (!isIgnorableCleanupError(error)) {
          throw error;
        }
        return;
      }

      if (!data?.length) return;

      const avatarPaths = data
        .filter((file) => file.name)
        .map((file) => `${userId}/${file.name}`);

      if (!avatarPaths.length) return;

      const { error: removeError } = await supabaseAdmin.storage
        .from("avatars")
        .remove(avatarPaths);

      if (removeError && !isIgnorableCleanupError(removeError)) {
        throw removeError;
      }
    };

    const deleteSocialData = async () => {
      const { data: userPosts, error: userPostsError } = await supabaseAdmin
        .from("social_posts")
        .select("id")
        .eq("user_id", userId);

      if (userPostsError && !isIgnorableCleanupError(userPostsError)) {
        throw userPostsError;
      }

      const postIds = (userPosts ?? []).map((post) => post.id).filter(Boolean);

      await cleanupTable("post_likes", "user_id", userId);

      if (postIds.length > 0) {
        const { error: likesByPostError } = await supabaseAdmin
          .from("post_likes")
          .delete()
          .in("post_id", postIds);

        if (likesByPostError && !isIgnorableCleanupError(likesByPostError)) {
          throw likesByPostError;
        }
      }

      await cleanupTable("social_posts", "user_id", userId);
    };

    const deleteForumData = async () => {
      const { data: userThreads, error: userThreadsError } = await supabaseAdmin
        .from("forum_threads")
        .select("id")
        .eq("user_id", userId);

      if (userThreadsError && !isIgnorableCleanupError(userThreadsError)) {
        throw userThreadsError;
      }

      const threadIds = (userThreads ?? []).map((thread) => thread.id).filter(Boolean);

      await cleanupTable("forum_replies", "user_id", userId);

      if (threadIds.length > 0) {
        const { error: repliesByThreadError } = await supabaseAdmin
          .from("forum_replies")
          .delete()
          .in("thread_id", threadIds);

        if (repliesByThreadError && !isIgnorableCleanupError(repliesByThreadError)) {
          throw repliesByThreadError;
        }
      }

      await cleanupTable("forum_threads", "user_id", userId);
    };

    console.log("Step: cleaning up data");
    await deleteAvatarFolder();
    await deleteSocialData();
    await deleteForumData();
    await cleanupTable("training_plan_sessions", "user_id", userId);
    await cleanupTable("runs", "user_id", userId);
    await cleanupTable("strava_tokens", "user_id", userId);
    await cleanupTable("profiles", "id", userId);

    // Delete the auth user. All rows referencing auth.users(id) with ON DELETE CASCADE
    // are cleaned up automatically by Postgres.
    console.log("Step: deleting auth user");
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError);
      throw authDeleteError;
    }

    return new Response(JSON.stringify({ success: true, message: "Account and all data deleted" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in delete-account function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to delete account",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

Deno.serve(handler);
