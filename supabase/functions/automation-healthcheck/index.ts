// Hourly cron: scans automation_runs, flags stale or failing pipelines.
// Records a 'healthcheck' run so admins can see this is alive too.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WATCHED = [
  { fn: 'auto-content-generator', maxStaleHours: 36 },
  { fn: 'scrape-news', maxStaleHours: 8 },
  { fn: 'scrape-gazette', maxStaleHours: 36 },
  { fn: 'auto-blog-generator', maxStaleHours: 30 },
  { fn: 'content-cleanup', maxStaleHours: 30 },
  { fn: 'update-autonomous-colleges', maxStaleHours: 24 * 8 },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing Supabase env vars' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const supabase = createClient(supabaseUrl, serviceKey);
    const now = Date.now();
    const alerts: Array<{ fn: string; reason: string; lastRun?: string }> = [];

    for (const w of WATCHED) {
      try {
        const { data } = await supabase
          .from('automation_runs')
          .select('started_at,status,error_message')
          .eq('function_name', w.fn)
          .order('started_at', { ascending: false })
          .limit(1);
        const last = data?.[0];
        if (!last) { alerts.push({ fn: w.fn, reason: 'never ran' }); continue; }
        const ageHours = (now - new Date(last.started_at).getTime()) / 3600000;
        if (ageHours > w.maxStaleHours) alerts.push({ fn: w.fn, reason: `stale (${ageHours.toFixed(1)}h)`, lastRun: last.started_at });
        else if (last.status === 'failed') alerts.push({ fn: w.fn, reason: `failed: ${last.error_message || 'unknown'}`, lastRun: last.started_at });
      } catch (innerErr) {
        alerts.push({ fn: w.fn, reason: `check error: ${String((innerErr as any)?.message ?? innerErr)}` });
      }
    }

    // The healthcheck itself succeeded as long as it could read the table.
    // 'alerts' is informational and stored in metadata for the admin dashboard.
    await supabase.from('automation_runs').insert({
      function_name: 'automation-healthcheck',
      finished_at: new Date().toISOString(),
      status: 'success',
      items_created: alerts.length,
      error_message: null,
      metadata: { alerts, alert_count: alerts.length },
    });

    return new Response(
      JSON.stringify({ ok: !alerts.length, alerts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('automation-healthcheck fatal:', err);
    return new Response(
      JSON.stringify({ ok: false, error: String((err as any)?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
