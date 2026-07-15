// Supabase Edge Function: email bill reminders for recurring transactions due soon.
//
// Setup:
//   1. Create a Resend account (resend.com), verify a sender, get an API key.
//   2. supabase secrets set RESEND_API_KEY=re_xxx RESEND_FROM="BudgetFlow <noreply@yourdomain.com>"
//   3. supabase functions deploy send-notifications
//   4. Schedule it (Dashboard -> Edge Functions cron, or pg_cron + pg_net), e.g. daily.
//
// Honors each user's recurring_alerts_enabled preference and de-dupes via the
// notification_log table (phase 12). SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are
// injected by the runtime; the service role bypasses RLS to act across users.

import { createClient } from "jsr:@supabase/supabase-js@2";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM") ?? "BudgetFlow <onboarding@resend.dev>";

  if (!supabaseUrl || !serviceRoleKey || !resendKey) {
    return Response.json(
      { ok: false, error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date();
  const horizon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days out

  const { data: due, error } = await supabase
    .from("recurring_transactions")
    .select("id, user_id, title, amount, type, next_occurrence")
    .eq("is_active", true)
    .gte("next_occurrence", now.toISOString())
    .lte("next_occurrence", horizon.toISOString());

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const item of due ?? []) {
    const ref = `${item.id}:${item.next_occurrence}`;

    const { data: already } = await supabase
      .from("notification_log")
      .select("id")
      .eq("user_id", item.user_id)
      .eq("kind", "recurring_due")
      .eq("ref", ref)
      .maybeSingle();
    if (already) {
      continue;
    }

    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("recurring_alerts_enabled")
      .eq("user_id", item.user_id)
      .maybeSingle();
    if (prefs && prefs.recurring_alerts_enabled === false) {
      continue;
    }

    const { data: userData } = await supabase.auth.admin.getUserById(item.user_id);
    const email = userData?.user?.email;
    if (!email) {
      continue;
    }

    const when = new Date(item.next_occurrence).toLocaleDateString();
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: email,
        subject: `Upcoming: ${item.title} due ${when}`,
        html: `<p>Reminder: <strong>${escapeHtml(String(item.title))}</strong> (${escapeHtml(String(item.type))}) is scheduled for ${when}.</p><p>&mdash; BudgetFlow</p>`,
      }),
    });

    if (response.ok) {
      await supabase.from("notification_log").insert({ user_id: item.user_id, kind: "recurring_due", ref });
      sent += 1;
    }
  }

  return Response.json({ ok: true, sent });
});
