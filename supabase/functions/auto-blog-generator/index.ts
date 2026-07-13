import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/* ── Rotating topic bank — relevant to Academisthan audience ── */
const TOPIC_BANK = [
  { topic: 'How to compute your API Score correctly under the 2018 UGC Regulations (CAS)', category: 'CAS & Promotions', tags: ['CAS', 'API Score', 'UGC'] },
  { topic: 'Common PhD-by-publication mistakes faculty make in CAS promotion applications', category: 'CAS & Promotions', tags: ['CAS', 'PhD', 'Promotion'] },
  { topic: 'NAAC Binary Accreditation 2024+: what changes for self-assessment', category: 'NAAC', tags: ['NAAC', 'Accreditation'] },
  { topic: 'NEP 2020 multi-disciplinary requirements: practical roadmap for HEIs', category: 'NEP', tags: ['NEP', 'Curriculum'] },
  { topic: 'NIRF 2026 data preparation: faculty-level inputs explained', category: 'NIRF', tags: ['NIRF', 'Ranking'] },
  { topic: 'UGC PhD Regulations 2022: compliance checklist for universities', category: 'PhD Regulations', tags: ['PhD', 'UGC'] },
  { topic: 'How Indian teachers should disclose Generative-AI use in research (UGC June 2025 advisory)', category: 'Research Integrity', tags: ['AI', 'Plagiarism', 'UGC'] },
  { topic: 'FDP planning under AICTE & ATAL: how to choose programs that count', category: 'Professional Development', tags: ['FDP', 'AICTE'] },
  { topic: 'Writing a winning SERB / ICSSR / ICMR research grant proposal', category: 'Research Funding', tags: ['Grants', 'Research'] },
  { topic: 'Choosing legitimate journals: avoiding predatory & cloned journals in 2026', category: 'Research Integrity', tags: ['Journals', 'Publishing'] },
  { topic: 'Autonomous colleges in India: latest UGC norms and graded autonomy', category: 'Higher Education Policy', tags: ['Autonomous', 'UGC'] },
  { topic: 'Academic Bank of Credits (ABC): how teachers should map their courses', category: 'NEP', tags: ['ABC', 'NEP'] },
  { topic: 'Outcome-Based Education (OBE): writing measurable Course Outcomes', category: 'Pedagogy', tags: ['OBE', 'Pedagogy'] },
  { topic: 'Bloom\'s Taxonomy for lesson planning: a practical Indian classroom guide', category: 'Pedagogy', tags: ['Bloom', 'Lesson Plan'] },
  { topic: 'ORCID, Scopus & Google Scholar: keeping your researcher profile consistent', category: 'Research Profile', tags: ['ORCID', 'Scholar'] },
  { topic: 'How to read a UGC Gazette notification: a teacher\'s field guide', category: 'Regulations', tags: ['Gazette', 'UGC'] },
  { topic: 'Career Advancement Scheme: Stage 4 to Stage 5 — the exact documents you need', category: 'CAS & Promotions', tags: ['CAS', 'Promotion'] },
  { topic: 'NET / SET / JRF eligibility in 2026: what counts and what doesn\'t', category: 'Eligibility', tags: ['NET', 'JRF'] },
  { topic: 'Indian Knowledge Systems (IKS) integration in syllabi under NEP', category: 'NEP', tags: ['IKS', 'NEP'] },
  { topic: 'AI tools for teachers in 2026: what to adopt, what to avoid', category: 'EdTech', tags: ['AI', 'EdTech'] },
];

function pickTopicForToday(slot: 'brief' | 'deep' = 'brief') {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  // Use a different offset for evening "deep" slot so the two daily posts cover different topics
  const idx = slot === 'deep' ? (dayOfYear + 7) % TOPIC_BANK.length : dayOfYear % TOPIC_BANK.length;
  return TOPIC_BANK[idx];
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
}

async function logRun(supabase: any, runId: string | null, patch: any) {
  if (!runId) return;
  await supabase.from('automation_runs').update(patch).eq('id', runId);
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, init);
      if (res.status >= 500 && i < retries) {
        await new Promise((r) => setTimeout(r, 800 * (i + 1)));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw lastErr ?? new Error('fetchWithRetry: exhausted retries');
}

const TRUSTED = /(\.gov\.in|\.ac\.in|ugc\.gov\.in|aicte-india\.org|naac\.gov\.in|education\.gov\.in|nature\.com|sciencedirect\.com|springer\.com|tandfonline\.com|wiley\.com|jstor\.org|arxiv\.org)/i;

async function researchViaPerplexity(topic: string, perplexityKey: string) {
  const research = await fetchWithRetry('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${perplexityKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sonar-reasoning-pro',
      messages: [
        { role: 'system', content: 'You are a meticulous Indian higher-education policy researcher. Cite only .gov.in, .ac.in, ugc.gov.in, aicte-india.org, naac.gov.in, education.gov.in, or peer-reviewed sources. Never invent facts.' },
        { role: 'user', content: `Research the topic: "${topic}". Return a tight brief (max 1200 words) of the most important verified facts a college/university teacher in India must know. Include exact regulation numbers, dates, and figures wherever applicable.` },
      ],
      temperature: 0.1,
      search_recency_filter: 'month',
    }),
  });
  const data = await research.json();
  if (!research.ok) throw new Error('perplexity:' + (data?.error?.type || research.status));
  const briefText = data.choices?.[0]?.message?.content || '';
  const citations: string[] = (data.citations || []).filter((u: string) => typeof u === 'string' && TRUSTED.test(u));
  return { briefText, citations };
}

async function researchViaFirecrawl(topic: string, firecrawlKey: string, lovableKey: string) {
  const queries = [
    `${topic} site:ugc.gov.in`,
    `${topic} site:aicte-india.org OR site:naac.gov.in OR site:education.gov.in`,
    `${topic} India higher education regulation site:.gov.in`,
    `${topic} India university faculty`,
  ];
  const seen = new Set<string>();
  const merged: any[] = [];
  for (const query of queries) {
    try {
      const sr = await fetchWithRetry('https://api.firecrawl.dev/v2/search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query, limit: 8, tbs: 'qdr:y',
          scrapeOptions: { formats: ['markdown'] },
        }),
      });
      const sdata = await sr.json();
      if (!sr.ok) { console.warn('firecrawl query failed:', query, sr.status); continue; }
      const list = sdata?.data?.web || sdata?.data || [];
      for (const r of list) {
        if (!r?.url || seen.has(r.url)) continue;
        if (!TRUSTED.test(r.url)) continue;
        seen.add(r.url);
        merged.push(r);
      }
    } catch (e) { console.warn('firecrawl query error:', e); }
    if (merged.length >= 6) break;
  }

  const results = merged.slice(0, 6);
  const citations: string[] = results.map((r: any) => r.url);
  const snippets = results.map((r: any, i: number) => `[${i + 1}] ${r.url}\n${(r.markdown || r.description || r.title || '').slice(0, 1500)}`).join('\n\n---\n\n');

  if (citations.length < 2) return { briefText: '', citations };

  const synth = await fetchWithRetry('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: 'Synthesize a strict research brief using ONLY the provided snippets. Do not invent facts. Cite as [n] matching the snippet number. Max 1000 words.' },
        { role: 'user', content: `Topic: ${topic}\n\nSnippets:\n${snippets}` },
      ],
    }),
  });
  const sjson = await synth.json();
  if (!synth.ok) throw new Error('gemini-synth:' + synth.status);
  const briefText = sjson.choices?.[0]?.message?.content || '';
  return { briefText, citations };
}

async function generateBlog(supabase: any, runId: string | null, slot: 'brief' | 'deep', perplexityKey: string | undefined, lovableKey: string, firecrawlKey: string | undefined) {
  try {
    const pick = pickTopicForToday(slot);
    console.log(`Generating ${slot} blog on:`, pick.topic);

    let briefText = '';
    let citations: string[] = [];
    let researchSource = 'perplexity';

    if (perplexityKey) {
      try {
        const r = await researchViaPerplexity(pick.topic, perplexityKey);
        briefText = r.briefText; citations = r.citations;
      } catch (e) {
        console.warn('Perplexity failed, falling back to Firecrawl:', e);
      }
    }

    if (citations.length < 3 && firecrawlKey) {
      const r = await researchViaFirecrawl(pick.topic, firecrawlKey, lovableKey);
      briefText = r.briefText; citations = r.citations;
      researchSource = 'firecrawl+gemini';
    }

    if (citations.length < 3) {
      throw new Error(`Insufficient verified sources (${citations.length}). Blog not generated to preserve data integrity.`);
    }

    const draftResp = await fetchWithRetry('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: `You are the Academisthan editorial assistant. Write clear, helpful, plain-English long-form blogs for Indian college and university teachers. Style: structured with H2/H3, short paragraphs, bullet lists where useful. ALWAYS cite sources inline using [1], [2] markers that map to the provided source URLs. Never invent regulations, dates, or figures — if uncertain, omit. End every blog with a "Sources" section listing each [n] -> URL, and a disclaimer.` },
          { role: 'user', content: `Topic: "${pick.topic}"\n\nVerified research brief (use this and ONLY this as ground truth):\n${briefText}\n\nAvailable source URLs (in order, refer as [1], [2], ...):\n${citations.map((u, i) => `[${i + 1}] ${u}`).join('\n')}\n\nWrite a 900-1300 word blog post in Markdown. Start with a single H1 title. After the H1, write a 2-3 sentence excerpt italicised. Then the body with H2/H3 sections. End with:\n\n## Sources\n[1] URL\n...\n\n## Disclaimer\nThis post is an AI-assisted interpretation for academic awareness. Always verify against the original gazette, notification, or official source before acting.` },
        ],
      }),
    });
    const draftData = await draftResp.json();
    if (!draftResp.ok) throw new Error('Gemini draft failed: ' + JSON.stringify(draftData));

    const markdown: string = draftData.choices?.[0]?.message?.content || '';
    if (markdown.length < 800) throw new Error('Generated draft too short.');

    const h1Match = markdown.match(/^#\s+(.+)$/m);
    const title = (h1Match ? h1Match[1] : pick.topic).trim().slice(0, 180);
    const slug = `${slugify(title)}-${Date.now().toString(36)}`;

    const afterH1 = markdown.replace(/^#\s+.+\n+/, '');
    const excerptMatch = afterH1.match(/^\*(.+?)\*/) || afterH1.match(/^(.+?)(?:\n|$)/);
    const summary = (excerptMatch ? excerptMatch[1] : pick.topic).slice(0, 300);

    const { error: insertErr } = await supabase.from('blog_posts').insert({
      title, slug, content: markdown, summary,
      category: pick.category, tags: pick.tags,
      is_published: true, is_ai_generated: true,
      published_at: new Date().toISOString(),
      author_name: 'Academisthan AI Desk',
      source_urls: citations,
      ai_model: `google/gemini-3-flash-preview + ${researchSource} (${slot})`,
      review_status: 'approved',
    });
    if (insertErr) throw new Error('Insert failed: ' + insertErr.message);

    await logRun(supabase, runId, {
      finished_at: new Date().toISOString(), status: 'success', items_created: 1,
      metadata: { topic: pick.topic, citations: citations.length, research: researchSource },
    });
  } catch (err: any) {
    console.error('auto-blog-generator error:', err);
    await logRun(supabase, runId, {
      finished_at: new Date().toISOString(), status: 'failed',
      error_message: String(err?.message ?? err),
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

  if (!supabaseUrl || !serviceKey || !lovableKey || (!perplexityKey && !firecrawlKey)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing env vars: need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY, and one of PERPLEXITY_API_KEY or FIRECRAWL_API_KEY' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  let body: any = {};
  try { body = await req.json(); } catch { /* OK */ }
  const slot: 'brief' | 'deep' = body?.slot === 'deep' ? 'deep' : 'brief';

  const { data: runRow } = await supabase
    .from('automation_runs')
    .insert({ function_name: 'auto-blog-generator', status: 'running', metadata: { slot } })
    .select('id')
    .single();
  const runId = runRow?.id ?? null;

  // @ts-ignore: EdgeRuntime is provided by Supabase Edge runtime
  EdgeRuntime.waitUntil(generateBlog(supabase, runId, slot, perplexityKey, lovableKey, firecrawlKey));

  return new Response(
    JSON.stringify({ accepted: true, run_id: runId, slot }),
    { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
