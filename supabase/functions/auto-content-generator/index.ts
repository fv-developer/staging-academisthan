const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/* ── Targeted news query categories ── */
const TARGETED_NEWS_QUERIES = [
  {
    name: 'Teacher Promotions & CAS',
    category: 'promotions',
    query: 'Latest updates on teacher promotions, Career Advancement Scheme CAS, API score requirements, and faculty promotion guidelines in Indian universities in the last 7 days. Include UGC and AICTE directives. Be specific with dates and document numbers.',
  },
  {
    name: 'NAAC Accreditation Updates',
    category: 'naac_update',
    query: 'Latest NAAC accreditation framework changes, new assessment criteria, recently accredited institutions, and NAAC notification updates in India in the last 7 days. Include specific grades and institutional names.',
  },
  {
    name: 'Pay Commission & Salary',
    category: 'pay_commission',
    query: 'Latest updates on 7th/8th Pay Commission for university teachers, salary revisions, allowance changes, arrears updates, and UGC pay scale notifications for professors in India in the last 7 days.',
  },
  {
    name: 'Autonomous Colleges',
    category: 'autonomous',
    query: 'Latest UGC guidelines for autonomous colleges, new institutions granted autonomy, graded autonomy updates, curriculum design freedom, and governance changes in India in the last 7 days.',
  },
  {
    name: 'PhD & Research Regulations',
    category: 'research_update',
    query: 'Latest UGC regulations on PhD programs, research methodology changes, plagiarism policies, academic integrity guidelines, NET/SET updates, and research funding opportunities in India in the last 7 days.',
  },
  {
    name: 'NEP Implementation',
    category: 'nep_update',
    query: 'Latest NEP 2020 implementation updates — Academic Bank of Credits, multidisciplinary education, four-year undergraduate programs, credit framework, and HECI developments in India in the last 7 days.',
  },
];

/* ── Gazette interpretation topics ── */
const GAZETTE_INTERPRETATION_QUERIES = [
  {
    query: 'What are the most important UGC, AICTE, NAAC, and Ministry of Education notifications or gazette entries published in India in the last 7 days? Focus on those that directly impact teachers, colleges, and universities. Provide the exact title, date, issuing authority, and a URL if available. Return 3-5 items.',
    category: 'gazette',
  },
];

/* ── Helper: call Perplexity for news ── */
async function fetchTargetedNews(apiKey: string, query: string, sourceName: string, category: string) {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are an expert Indian higher education policy analyst. Return ONLY a valid JSON array of news items. Each item must have: title (string, max 200 chars), summary (string, max 500 chars — explain significance for educators in plain English), source_url (string or null). Return 3-5 most important and SPECIFIC items. No markdown, no explanation, just the JSON array.`,
          },
          { role: 'user', content: query },
        ],
        temperature: 0.1,
        search_recency_filter: 'week',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`Perplexity error for ${sourceName}:`, data);
      return [];
    }

    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const items = JSON.parse(jsonMatch[0]);
    return items.map((item: any, i: number) => ({
      title: (item.title || '').substring(0, 500),
      summary: (item.summary || '').substring(0, 500),
      category,
      source_url: item.source_url || citations[i] || null,
      source_name: `${sourceName} (AI Curated)`,
      content: null,
      image_url: null,
      is_ai_generated: true,
    }));
  } catch (e) {
    console.error(`Perplexity error ${sourceName}:`, e);
    return [];
  }
}

const TRUSTED_UPDATE_DOMAINS = /(\.gov\.in|\.ac\.in|\.edu\.in|ugc\.gov\.in|aicte-india\.org|naac\.gov\.in|education\.gov\.in|egazette\.gov\.in|nbaind\.org|ncte\.gov\.in|pci\.nic\.in|barcouncilofindia\.org)/i;

async function fetchTargetedNewsViaFirecrawl(apiKey: string, query: string, sourceName: string, category: string) {
  try {
    const response = await fetch('https://api.firecrawl.dev/v2/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 10, tbs: 'qdr:m', scrapeOptions: { formats: ['markdown'] } }),
    });
    const data = await response.json();
    if (!response.ok) { console.error(`Firecrawl error for ${sourceName}:`, data); return []; }
    const list = data?.data?.web || data?.data || [];
    return list
      .filter((item: any) => item?.url && TRUSTED_UPDATE_DOMAINS.test(item.url))
      .slice(0, 5)
      .map((item: any) => ({
        title: (item.title || sourceName).substring(0, 500),
        summary: (item.description || item.markdown || 'Verified education update from an official source. Open the original source before taking action.').substring(0, 500),
        category,
        source_url: item.url,
        source_name: `${sourceName} (Official Search)`,
        content: null,
        image_url: null,
        is_ai_generated: true,
      }));
  } catch (e) {
    console.error(`Firecrawl error ${sourceName}:`, e);
    return [];
  }
}

/* ── Helper: Fetch gazette notifications for interpretation ── */
async function fetchGazetteNotifications(perplexityKey: string) {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: `You are an expert Indian education policy analyst. Return ONLY a valid JSON array. Each item: { "title": "exact notification title", "authority": "issuing body", "date": "date string", "source_url": "URL or null", "key_points": "2-3 sentence summary of what it says" }. Return 3-5 most impactful recent gazette/regulatory notifications.`,
          },
          { role: 'user', content: GAZETTE_INTERPRETATION_QUERIES[0].query },
        ],
        temperature: 0.1,
        search_recency_filter: 'week',
      }),
    });

    const data = await response.json();
    if (!response.ok) return [];

    const content = data.choices?.[0]?.message?.content || '';
    // Clean markdown fences if present
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const jsonMatch = cleaned.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      console.error('No JSON array in gazette response, raw:', content.substring(0, 200));
      return [];
    }

    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('Gazette fetch error:', e);
    return [];
  }
}

async function fetchGazetteNotificationsViaFirecrawl(firecrawlKey: string) {
  try {
    const response = await fetch('https://api.firecrawl.dev/v2/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'UGC AICTE NAAC Ministry of Education higher education notification circular gazette India official recent',
        limit: 8,
        tbs: 'qdr:m',
        scrapeOptions: { formats: ['markdown'] },
      }),
    });
    const data = await response.json();
    if (!response.ok) return [];
    const list = data?.data?.web || data?.data || [];
    return list
      .filter((item: any) => item?.url && TRUSTED_UPDATE_DOMAINS.test(item.url))
      .slice(0, 4)
      .map((item: any) => ({
        title: item.title || 'Official Higher Education Update',
        authority: item.url.includes('ugc') ? 'UGC' : item.url.includes('aicte') ? 'AICTE' : item.url.includes('naac') ? 'NAAC' : 'Official regulator',
        date: new Date().toISOString().slice(0, 10),
        source_url: item.url,
        key_points: (item.description || item.markdown || '').slice(0, 500),
      }));
  } catch (e) { console.error('Firecrawl gazette fetch error:', e); return []; }
}

/* ── Helper: Generate interpretation blog article using Lovable AI ── */
async function generateInterpretationArticle(
  lovableKey: string,
  notification: { title: string; authority: string; date: string; source_url: string | null; key_points: string }
) {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert Indian education policy writer for Academisthan — a platform that helps teachers and educators understand complex government regulations.

Write a comprehensive, engaging blog article interpreting the given government notification/gazette entry. Your article should:

1. **Start with a clear headline** (not the raw notification title — make it reader-friendly)
2. **Opening paragraph**: Explain what happened and why it matters to teachers in 2-3 sentences
3. **What the Notification Says**: Break down the key points in simple language
4. **Who is Affected**: Clearly list which teachers, institutions, or students are impacted
5. **Practical Impact & Examples**: Give 2-3 real-world examples of how this affects a teacher's daily work, career, or salary
6. **What You Should Do**: Actionable steps for educators
7. **Key Takeaway**: One-line summary

Write in a warm, authoritative tone. Use bullet points and headers for readability. Avoid jargon — if you must use a technical term, explain it. The article should be 800-1200 words.

Return ONLY a JSON object with these fields:
{
  "title": "reader-friendly article title (max 150 chars)",
  "summary": "2-3 sentence teaser (max 300 chars)",
  "content": "full article in markdown",
  "category": "policy" or "nep" or "career" or "general",
  "tags": ["tag1", "tag2", "tag3"]
}`,
          },
          {
            role: 'user',
            content: `Please write an interpretation article for:

**Notification**: ${notification.title}
**Issued by**: ${notification.authority}
**Date**: ${notification.date}
**Key Points**: ${notification.key_points}
**Source URL**: ${notification.source_url || 'Not available'}`,
          },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response');
      return null;
    }

    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('Article generation error:', e);
    return null;
  }
}

/* ── Helper: Generate slug ── */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 80);
}

async function runGenerator(supabase: any, perplexityKey: string | undefined, lovableKey: string, firecrawlKey: string | undefined, runId: string | null) {
  let newsInserted = 0, articlesCreated = 0;
  const errors: string[] = [];

  // PHASE 1: Targeted News
  for (const tq of TARGETED_NEWS_QUERIES) {
    try {
      let items = perplexityKey ? await fetchTargetedNews(perplexityKey, tq.query, tq.name, tq.category) : [];
      if (!items.length && firecrawlKey) items = await fetchTargetedNewsViaFirecrawl(firecrawlKey, tq.query, tq.name, tq.category);
      for (const item of items) {
        const { data: existing } = await supabase.from('news_updates').select('id')
          .ilike('title', `%${item.title.substring(0, 50)}%`).limit(1);
        if (existing?.length) continue;
        const { error } = await supabase.from('news_updates').insert({
          title: item.title, summary: item.summary, category: item.category,
          source_url: item.source_url, source_name: item.source_name,
          content: item.content, image_url: item.image_url,
          is_published: true, is_pinned: false, is_ai_generated: true,
          published_at: new Date().toISOString(),
          retention_category: item.category === 'gazette' ? 'regulatory' : 'news',
        });
        if (error) errors.push(`News: ${item.title.substring(0, 40)}`);
        else newsInserted++;
      }
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) { errors.push(`News ${tq.name}: ${e}`); }
  }

  // PHASE 2: Gazette Interpretations
  try {
    let notifications = perplexityKey ? await fetchGazetteNotifications(perplexityKey) : [];
    if (!notifications.length && firecrawlKey) notifications = await fetchGazetteNotificationsViaFirecrawl(firecrawlKey);
    for (const n of notifications) {
      const searchTitle = (n.title || '').substring(0, 40);
      const { data: existing } = await supabase.from('blog_posts').select('id')
        .ilike('source_notification_title', `%${searchTitle}%`).limit(1);
      if (existing?.length) continue;
      const article = await generateInterpretationArticle(lovableKey, n);
      if (!article) { errors.push(`Interp gen failed: ${searchTitle}`); continue; }
      const slug = slugify(article.title) + '-' + Date.now().toString(36);
      const { error } = await supabase.from('blog_posts').insert({
        title: article.title, slug,
        summary: article.summary || '', content: article.content || '',
        category: article.category || 'policy',
        tags: article.tags || ['gazette', 'interpretation'],
        author_name: 'Academisthan AI', is_published: true,
        is_ai_generated: true,
        source_notification_url: n.source_url || null,
        source_notification_title: n.title || null,
        published_at: new Date().toISOString(),
      });
      if (!error) articlesCreated++;
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch (e) { errors.push(`Gazette phase: ${e}`); }

  if (runId) await supabase.from('automation_runs').update({
    finished_at: new Date().toISOString(),
    status: errors.length && !newsInserted && !articlesCreated ? 'failed' : 'success',
    items_created: newsInserted + articlesCreated,
    error_message: errors.slice(0, 3).join(' | ') || null,
    metadata: { news_inserted: newsInserted, articles_created: articlesCreated, errors: errors.length },
  }).eq('id', runId);
  console.log('auto-content-generator done:', { newsInserted, articlesCreated, errors: errors.length });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if ((!perplexityKey && !firecrawlKey) || !lovableKey) {
    return new Response(JSON.stringify({ error: 'Need LOVABLE_API_KEY and one of PERPLEXITY_API_KEY or FIRECRAWL_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: run } = await supabase.from('automation_runs').insert({ function_name: 'auto-content-generator', status: 'running' }).select('id').single();
  // @ts-ignore
  EdgeRuntime.waitUntil(runGenerator(supabase, perplexityKey, lovableKey, firecrawlKey, run?.id ?? null));
  return new Response(JSON.stringify({ accepted: true, run_id: run?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
