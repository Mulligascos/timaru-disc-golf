import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const DEFAULT_PASSWORD = "DiscGolf2026!";

export async function POST(request: Request) {
  // Verify requester is admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as any)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { members } = await request.json();

  if (!Array.isArray(members) || members.length === 0) {
    return NextResponse.json({ error: "No members provided" }, { status: 400 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const results: {
    email: string;
    full_name: string;
    success: boolean;
    error?: string;
  }[] = [];

  for (const member of members) {
    const { full_name, email, username } = member;

    try {
      // Check if username already taken
      const { data: existingUsername } = await adminClient
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (existingUsername) {
        results.push({
          email,
          full_name,
          success: false,
          error: `Username "@${username}" already taken`,
        });
        continue;
      }

      // Create auth user with default password
      const { data: newUser, error: createError } =
        await adminClient.auth.admin.createUser({
          email,
          password: DEFAULT_PASSWORD,
          email_confirm: true, // skip email confirmation
          user_metadata: {
            full_name,
            username,
          },
        });

      if (createError) {
        results.push({
          email,
          full_name,
          success: false,
          error: createError.message,
        });
        continue;
      }

      // Upsert profile row
      const { error: profileError } = await adminClient
        .from("profiles")
        .upsert({
          id: newUser.user.id,
          email,
          full_name,
          username,
          role: "member",
          is_active: true,
        });

      if (profileError) {
        results.push({
          email,
          full_name,
          success: false,
          error: profileError.message,
        });
        continue;
      }

      results.push({ email, full_name, success: true });
    } catch (err: any) {
      results.push({
        email,
        full_name,
        success: false,
        error: err.message ?? "Unknown error",
      });
    }
  }

  return NextResponse.json({ results });
}
