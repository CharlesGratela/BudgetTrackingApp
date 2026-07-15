// Supabase Edge Function — OPTION B trigger for scheduled recurring generation.
//
// Only needed if you prefer an Edge Function over the pg_cron schedule in
// supabase_phase7_setup.sql (Option A). Both call the same batch function —
// use one, not both.
//
// Deploy:
//   supabase functions deploy generate-recurring
// Schedule (pick one):
//   - Supabase Dashboard -> Edge Functions -> add a cron schedule, e.g. "0 * * * *"
//   - or invoke this function's URL from pg_cron via the pg_net extension
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically by the
// Edge runtime — do not hardcode them. The service role bypasses RLS, so the
// batch function processes every user.

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { ok: false, error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase.rpc("generate_all_due_recurring_transactions");

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, created: data ?? 0 });
});
