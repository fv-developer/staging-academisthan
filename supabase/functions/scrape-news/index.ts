// Smart Job/Grant/Fellowship Scraper — runs in background, logs every run
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JOB_QUERIES = [
  { name: 'Faculty Positions', category: 'jobs', sub_category: 'faculty',
    query: `Find the latest faculty positions, assistant professor, associate professor, and professor job openings at Indian universities and colleges posted in the last 3 days. Include: exact institution name, designation, department/subject, city/state, last date to apply (exact date), official application URL. Return 5-8 most recent openings. Return ONLY a JSON array where each item has: title, summary, source_url, organization, location, last_date (YYYY-MM-DD or null), job_sub_category ("faculty").` },
  { name: 'Research Positions', category: 'jobs', sub_category: 'research',
    query: `Find the latest research positions in India — JRF, SRF, Research Associate, Postdoc, Project Fellow openings at Indian universities, IITs, IISc, CSIR labs posted in the last 3 days. Include: institution, position title, field/subject, stipend if mentioned, last date to apply, official URL. Return 5-8 openings. Return ONLY a JSON array where each item has: title, summary, source_url, organization, location, last_date (YYYY-MM-DD or null), job_sub_category ("research").` },
  { name: 'Grants & Funding', category: 'grant', sub_category: 'grant',
    query: `Find the latest research grants, project funding, seed grants from UGC, DST, SERB, DBT, ICSSR, CSIR, ICMR posted in the last 7 days. Include scheme name, funding body, eligibility, amount, last date, official URL. Return 3-6 items. ONLY a JSON array with: title, summary, source_url, organization, location, last_date, job_sub_category ("grant").` },
  { name: 'Fellowships', category: 'fellowship', sub_category: 'fellowship',
    query: `Latest fellowships for Indian academics — Fulbright, ICSSR, Raman, Nehru, Commonwealth, institutional fellowships posted last 7 days. Return 3-6 items. ONLY a JSON array with: title, summary, source_url, organization, location, last_date, job_sub_category ("fellowship").` },
  { name: 'Call for Papers', category: 'jobs', sub_category: 'cfp',
    query: `Latest call for papers, conferences, FDPs, workshops for Indian college/university teachers posted in last 7 days. Return 3-5 items. ONLY a JSON array with: title, summary, source_url, organization, location, last_date, job_sub_category ("cfp").` },
  { name: 'Administrative', category: 'jobs', sub_category: 'admin',
    query: `Latest administrative/non-teaching positions at Indian universities — Registrar, COE, Librarian, Director posted last 5 days. Return 3-5 items. ONLY a JSON array with: title, summary, source_url, organization, location, last_date, job_sub_category ("admin").` },
];

const TRUSTED_DOMAINS = ['.gov.in', '.ac.in', '.edu.in', 'ugc.gov.in', 'aicte-india.org', 'naac.gov.in', 'serb.gov.in', 'dst.gov.in', 'icssr.org', 'icmr.gov.in', 'csir.res.in'];

function isTrusted(url: string | null): boolean {
  if (!url) return false;
  return TRUSTED_DOMAINS.some(d => url.toLowerCase().includes(d));
}

async function fetchJobs(apiKey: string, q: typeof JOB_QUERIES[0]) {
  try {
    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: `You are an Indian academic job aggregator. Return ONLY a valid JSON array. Each item MUST have: title (max 200), summary (max 500), source_url (OFFICIAL URL only, never made up), organization, location, last_date (YYYY-MM-DD or null), job_sub_category. Be SPECIFIC. No markdown.` },
          { role: 'user', content: q.query },
        ],
        temperature: 0.1,
        search_recency_filter: 'week',
      }),
      signal: AbortSignal.timeout(45000),
    });
    const data = await r.json();
    if (!r.ok) { console.error(`Perplexity ${q.name}:`, data); return []; }
    const content = data.choices?.[0]?.message?.content || '';
    const citations: string[] = data.citations || [];
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (!m) return [];
    const items = JSON.parse(m[0]);
    return items.map((item: any, i: number) => {
      let lastDate: string | null = null;
      if (item.last_date && item.last_date !== 'null') {
        const d = new Date(item.last_date);
        if (!isNaN(d.getTime())) lastDate = d.toISOString();
      }
      const url = item.source_url || citations[i] || null;
      return {
        title: (item.title || '').substring(0, 500),
        summary: (item.summary || '').substring(0, 500),
        category: q.category,
        source_url: url,
        source_name: `${q.name} (AI Curated)`,
        is_ai_generated: true,
        is_published: true,
        retention_category: 'jobs',
        job_sub_category: item.job_sub_category || q.sub_category,
        organization: (item.organization || '').substring(0, 200),
        location: (item.location || '').substring(0, 200),
        last_date: lastDate,
        _trusted: isTrusted(url),
        expires_at: lastDate
          ? new Date(new Date(lastDate).getTime() + 7 * 86400000).toISOString()
          : new Date(Date.now() + 60 * 86400000).toISOString(),
      };
    });
  } catch (e) { console.error(`fetchJobs ${q.name}:`, e); return []; }
}

async function fetchJobsViaFirecrawl(apiKey: string, q: typeof JOB_QUERIES[0]) {
  try {
    const r = await fetch('https://api.firecrawl.dev/v2/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q.query, limit: 10, tbs: 'qdr:m', scrapeOptions: { formats: ['markdown'] } }),
    });
    const data = await r.json();
    if (!r.ok) { console.error(`Firecrawl ${q.name}:`, data); return []; }
    const list = data?.data?.web || data?.data || [];
    return list
      .filter((item: any) => isTrusted(item?.url))
      .slice(0, 6)
      .map((item: any) => ({
        title: (item.title || q.name).substring(0, 500),
        summary: (item.description || item.markdown || 'Verified academic opportunity. Check the official source for eligibility, deadline, and application process.').substring(0, 500),
        category: q.category,
        source_url: item.url,
        source_name: `${q.name} (Official Search)`,
        is_ai_generated: true,
        is_published: true,
        published_at: new Date().toISOString(),
        retention_category: 'jobs',
        job_sub_category: q.sub_category,
        organization: (item.title || q.name).split(/[|–-]/)[0].substring(0, 200),
        location: 'India',
        last_date: null,
        _trusted: true,
        expires_at: new Date(Date.now() + 60 * 86400000).toISOString(),
      }));
  } catch (e) { console.error(`fetchJobsViaFirecrawl ${q.name}:`, e); return []; }
}

async function runScrape(supabase: any, perplexityKey: string | undefined, firecrawlKey: string | undefined, runId: string | null) {
  let inserted = 0, skipped = 0, untrusted = 0;
  const errors: string[] = [];
  for (const jq of JOB_QUERIES) {
    try {
      let items = perplexityKey ? await fetchJobs(perplexityKey, jq) : [];
      if (!items.length && firecrawlKey) items = await fetchJobsViaFirecrawl(firecrawlKey, jq);
      for (const item of items) {
        // Anti-hallucination guard
        if (!item._trusted) { untrusted++; continue; }
        delete item._trusted;
        const { data: existing } = await supabase.from('news_updates').select('id')
          .ilike('title', `%${item.title.substring(0, 50)}%`).limit(1);
        if (existing?.length) { skipped++; continue; }
        const { error } = await supabase.from('news_updates').insert(item);
        if (error) errors.push(`${item.title.substring(0, 40)}: ${error.message}`);
        else inserted++;
      }
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) { errors.push(`${jq.name}: ${e}`); }
  }
  const status = errors.length && !inserted ? 'failed' : 'success';
  if (runId) await supabase.from('automation_runs').update({
    finished_at: new Date().toISOString(), status, items_created: inserted,
    error_message: errors.slice(0, 3).join(' | ') || null,
    metadata: { skipped, untrusted_dropped: untrusted },
  }).eq('id', runId);
  console.log('scrape-news done:', { inserted, skipped, untrusted, errors: errors.length });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!perplexityKey && !firecrawlKey) return new Response(JSON.stringify({ error: 'Need PERPLEXITY_API_KEY or FIRECRAWL_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: run } = await supabase.from('automation_runs').insert({ function_name: 'scrape-news', status: 'running' }).select('id').single();
  // @ts-ignore EdgeRuntime is available in supabase functions
  EdgeRuntime.waitUntil(runScrape(supabase, perplexityKey, firecrawlKey, run?.id ?? null));
  return new Response(JSON.stringify({ accepted: true, run_id: run?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
