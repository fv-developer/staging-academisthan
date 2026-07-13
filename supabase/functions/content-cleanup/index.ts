import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function runCleanup(supabase: any, runId: string | null) {
  try {
    const now = new Date();
    let jobsRemoved = 0, newsRemoved = 0, blogsRemoved = 0;

    const { data: e1 } = await supabase.from('news_updates').delete().eq('retention_category', 'jobs')
      .not('last_date', 'is', null).lt('last_date', now.toISOString()).select('id');
    jobsRemoved += e1?.length || 0;

    const { data: e1b } = await supabase.from('news_updates').delete().eq('retention_category', 'jobs')
      .not('expires_at', 'is', null).lt('expires_at', now.toISOString()).select('id');
    jobsRemoved += e1b?.length || 0;

    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString();
    const { data: e1c } = await supabase.from('news_updates').delete().eq('retention_category', 'jobs')
      .is('last_date', null).lt('published_at', sixtyDaysAgo).select('id');
    jobsRemoved += e1c?.length || 0;

    const sixMonthsAgo = new Date(now.getTime() - 180 * 86400000).toISOString();
    const { data: e2 } = await supabase.from('news_updates').delete().eq('retention_category', 'news')
      .lt('published_at', sixMonthsAgo).select('id');
    newsRemoved += e2?.length || 0;

    const fiveYearsAgo = new Date(now.getTime() - 1825 * 86400000).toISOString();
    const { data: e3 } = await supabase.from('news_updates').delete().eq('retention_category', 'regulatory')
      .lt('published_at', fiveYearsAgo).select('id');
    newsRemoved += e3?.length || 0;

    const twoYearsAgo = new Date(now.getTime() - 730 * 86400000).toISOString();
    const { data: e4 } = await supabase.from('blog_posts').delete().eq('is_ai_generated', true)
      .lt('published_at', twoYearsAgo).select('id');
    blogsRemoved = e4?.length || 0;

    // Prune old automation_runs (keep last 60 days)
    const sixtyDaysAgoRuns = new Date(now.getTime() - 60 * 86400000).toISOString();
    await supabase.from('automation_runs').delete().lt('started_at', sixtyDaysAgoRuns);

    if (runId) await supabase.from('automation_runs').update({
      finished_at: new Date().toISOString(), status: 'success',
      items_created: jobsRemoved + newsRemoved + blogsRemoved,
      metadata: { jobs_removed: jobsRemoved, news_removed: newsRemoved, blogs_removed: blogsRemoved },
    }).eq('id', runId);
  } catch (error) {
    console.error('content-cleanup error:', error);
    if (runId) await supabase.from('automation_runs').update({
      finished_at: new Date().toISOString(), status: 'failed',
      error_message: String((error as any)?.message ?? error),
    }).eq('id', runId);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing Supabase env vars' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: run } = await supabase.from('automation_runs').insert({ function_name: 'content-cleanup', status: 'running' }).select('id').single();
  const runId = run?.id ?? null;

  // @ts-ignore: EdgeRuntime is provided by Supabase Edge runtime
  EdgeRuntime.waitUntil(runCleanup(supabase, runId));

  return new Response(
    JSON.stringify({ accepted: true, run_id: runId }),
    { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
