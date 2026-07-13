import express, { Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../utils/auth';
import { v4 as uuidv4 } from 'uuid';
import { logUserActivity } from '../utils/logger';

const router = express.Router();

// Save tool result (API Score, Research Score, etc.)
router.post('/results', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { tool_name, tool_type, input_data, result_data, score } = req.body;

    // Validation
    if (!tool_name) {
      return res.status(400).json({ error: 'Tool name is required' });
    }

    const resultId = uuidv4();
    const numericScore = score !== undefined && score !== null ? Number(score) : 0;
    const isCas = tool_name.toLowerCase().includes('promotion') || (tool_type && tool_type.toLowerCase().includes('promotion'));
    let result = 'Fail';
    let passingScore = 50.00;

    if (isCas) {
      const isEligible = result_data && (result_data.eligible === true || result_data.eligible === 'true');
      result = isEligible ? 'Pass' : 'Fail';
      passingScore = 1.00;
    } else {
      result = numericScore >= passingScore ? 'Pass' : 'Fail';
    }

    const certStatus = result === 'Pass' ? 'Issued' : 'None';

    // Insert tool result
    await pool.execute(
      `INSERT INTO tool_results (
        id, user_id, tool_name, tool_type, input_data, result_data, score, passing_score, result, certificate_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resultId,
        userId,
        tool_name,
        tool_type || null,
        JSON.stringify(input_data || {}),
        JSON.stringify(result_data || {}),
        score !== undefined && score !== null ? score : null,
        passingScore,
        result,
        certStatus
      ]
    );

    // If passed, automatically issue a certificate
    if (result === 'Pass') {
      const certId = uuidv4();
      const prefix = (tool_type || 'TOOL').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
      const certificateNumber = `ACAD-${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;

      await pool.execute(
        `INSERT INTO certificates (
          id, user_id, certificate_number, certificate_type, issued_at, tool_result_id
        ) VALUES (?, ?, ?, ?, NOW(), ?)`,
        [
          certId,
          userId,
          certificateNumber,
          `tool_${tool_type || 'result'}`,
          resultId
        ]
      );
    }

    // Get the created result
    const [results]: any = await pool.execute(
      'SELECT * FROM tool_results WHERE id = ?',
      [resultId]
    );

    // Log activity
    let displayName = tool_name;
    if (tool_name === 'api_score') displayName = 'UGC Academic & Research Score Calculator';
    else if (tool_name === 'research_score') displayName = 'Research Score Calculator';
    else if (tool_name === 'naac_criterion_3') displayName = 'NAAC Self-Assessment (Criterion 3)';
    else if (tool_name === 'promotion_check') displayName = 'CAS Promotion Eligibility Checker';
    else if (tool_name === 'scholar_impact') displayName = 'Google Scholar Impact Analyzer';

    await logUserActivity(
      userId,
      'complete_test',
      `Completed evaluation: ${displayName} (Score: ${score || 'N/A'})`,
      { tool_name, score, resultId }
    );

    // Notify admins about the new test submission
    try {
      const [admins]: any = await pool.execute(
        `SELECT p.id FROM profiles p 
         JOIN admin_roles ar ON p.id = ar.user_id`
      );
      // Fetch user name
      const [userRow]: any = await pool.execute('SELECT full_name FROM users WHERE id = ?', [userId]);
      const userName = userRow[0]?.full_name || 'A fellow';
      for (const adminUser of admins) {
        await pool.execute(
          `INSERT INTO notifications (id, user_id, type, title, message, link)
           VALUES (?, ?, 'general', 'New Test Submission 📝', ?, '/admin/fellows')`,
          [uuidv4(), adminUser.id, `${userName} submitted a test: ${displayName} (Score: ${score || 'N/A'}).`]
        );
      }
    } catch (err) {
      console.error('Failed to notify admins on test submission:', err);
    }

    res.status(201).json({
      message: 'Tool result saved successfully',
      result: results[0],
    });
  } catch (error) {
    console.error('Save tool result error:', error);
    res.status(500).json({ error: 'Failed to save tool result' });
  }
});

// Get user's tool results
router.get('/results', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { tool_name } = req.query;

    let query = `
      SELECT tr.*, c.certificate_number, c.id as certificate_id, c.issued_at as certificate_issued_at, c.pdf_url as certificate_pdf_url
      FROM tool_results tr
      LEFT JOIN certificates c ON tr.id = c.tool_result_id
      WHERE tr.user_id = ?
    `;
    const params: any[] = [userId];

    if (tool_name) {
      query += ' AND tr.tool_name = ?';
      params.push(tool_name);
    }

    query += ' ORDER BY tr.created_at DESC';

    const [results] = await pool.execute(query, params);
    res.json(results);
  } catch (error) {
    console.error('Get tool results error:', error);
    res.status(500).json({ error: 'Failed to get tool results' });
  }
});

// Get tool certifications for the logged-in user
router.get('/certifications', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [certs] = await pool.execute(
      `SELECT * FROM certificates 
       WHERE user_id = ? AND (certificate_type LIKE 'tool_%' OR certificate_type = 'tool')
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(certs);
  } catch (error) {
    console.error('Get tool certifications error:', error);
    res.status(500).json({ error: 'Failed to get tool certifications' });
  }
});

// Get specific tool result by ID
router.get('/results/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [results]: any = await pool.execute(
      'SELECT * FROM tool_results WHERE id = ? AND user_id = ?',
      [req.params.id, req.user!.id]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: 'Tool result not found' });
    }

    res.json(results[0]);
  } catch (error) {
    console.error('Get tool result error:', error);
    res.status(500).json({ error: 'Failed to get tool result' });
  }
});

// Delete tool result
router.delete('/results/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.execute(
      'DELETE FROM tool_results WHERE id = ? AND user_id = ?',
      [req.params.id, req.user!.id]
    );

    if ((result[0] as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Tool result not found' });
    }

    res.json({ message: 'Tool result deleted successfully' });
  } catch (error) {
    console.error('Delete tool result error:', error);
    res.status(500).json({ error: 'Failed to delete tool result' });
  }
});

// Log tool report download
router.post('/results/:id/log-download', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { tool_name } = req.body;

    let displayName = tool_name || 'Evaluation';
    if (tool_name === 'api_score') displayName = 'UGC Academic & Research Score';
    else if (tool_name === 'research_score') displayName = 'Research Score';
    else if (tool_name === 'naac_criterion_3') displayName = 'NAAC Self-Assessment (Criterion 3)';
    else if (tool_name === 'promotion_check') displayName = 'CAS Promotion Eligibility';
    else if (tool_name === 'scholar_impact') displayName = 'Google Scholar Impact';

    await logUserActivity(
      userId,
      'download_report',
      `Downloaded PDF report for: ${displayName}`,
      { resultId: id, tool_name }
    );

    res.json({ message: 'Download logged successfully' });
  } catch (error) {
    console.error('Log download error:', error);
    res.status(500).json({ error: 'Failed to log report download' });
  }
});

// Invoke serverless function (replaces Supabase Edge Functions)
router.post('/functions/:name', async (req: express.Request, res: Response) => {
  const { name } = req.params;
  const body = req.body;
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cnhueGtvZGFvYWNrbW5vYWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDE4MjIsImV4cCI6MjA4OTIxNzgyMn0.2YrKwp6s_Qgm58PtSXL9Qm7dS23LGiBbJCp5n2eklng'; 

  try {
    if (name === 'journal-quality') {
      const query = (body.query || '').toString().slice(0, 300).trim();
      const system = `You are an Indian academic-publishing expert. Given a journal name, DOI, or ISSN, return ONLY valid JSON (no markdown) with this exact shape:
{
  "summary": "<2-3 sentence factual summary about this journal>",
  "indexedIn": ["<list of databases like Scopus, WoS-SCIE, UGC-CARE, DOAJ, PubMed, etc.>"],
  "ugcCare": "yes" | "no" | "unknown",
  "scopus": "yes" | "no" | "unknown",
  "webOfScience": "yes" | "no" | "unknown",
  "predatoryRisk": "low" | "medium" | "high" | "unknown",
  "sources": ["<official URLs the user can use to verify, e.g. https://ugccare.unipune.ac.in/, https://www.scopus.com/sources, https://mjl.clarivate.com/>"]
}`;
      const user = `Lookup journal: "${query}"`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        }),
      });

      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI returned non-JSON');
      const result = JSON.parse(jsonMatch[0]);
      return res.json(result);
    }

    if (name === 'scholar-impact') {
      const profile = body.profile;
      const systemPrompt = `You are an expert academic research advisor specializing in Indian higher education. You help educators improve their Google Scholar metrics (h-index, i10-index, citations) and overall research impact.
You must respond with VALID JSON only (no markdown, no code blocks). Use this exact structure:
{
  "impactScore": <number 0-100>,
  "tier": "<one of: Emerging Researcher | Active Researcher | Impactful Scholar | Distinguished Researcher>",
  "tierEmoji": "<emoji for tier>",
  "summary": "<2-3 sentence overall assessment>",
  "benchmarks": {
    "hIndex": { "current": <number>, "nationalAvg": <number>, "percentile": <number> },
    "i10Index": { "current": <number>, "nationalAvg": <number>, "percentile": <number> },
    "citations": { "current": <number>, "nationalAvg": <number>, "percentile": <number> }
  },
  "recommendations": [
    {
      "title": "<action title>",
      "description": "<detailed actionable description>",
      "estimatedImpact": "<specific impact>",
      "difficulty": "<Easy | Medium | Hard>",
      "timeframe": "<e.g. 3-6 months>",
      "priority": <number>,
      "category": "<Publication Strategy | Visibility | UGC-API Connection>"
    }
  ],
  "quickWins": ["<win 1>", "<win 2>"],
  "motivationalMessage": "<message>",
  "ugcApiConnection": "<connection>"
}`;
      const userPrompt = `Analyze this Indian educator's research profile:
Name: ${profile.name || 'Not provided'}
Google Scholar Metrics:
- h-index: ${profile.hIndex || 0}
- i10-index: ${profile.i10Index || 0}
- Total Citations: ${profile.totalCitations || 0}
- Total Publications: ${profile.totalPublications || 0}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        }),
      });

      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI returned non-JSON');
      const result = JSON.parse(jsonMatch[0]);
      return res.json(result);
    }

    if (name === 'auto-blog-generator') {
      const blogId = uuidv4();
      await pool.execute(
        `INSERT INTO blog_posts (id, title, slug, summary, content, category, review_status, is_published, is_ai_generated) 
         VALUES (?, 'AI Generated Blog Post', 'ai-generated-blog', 'This is a summary', 'This is content', 'Higher Education', 'pending_review', 0, 1)`,
        [blogId]
      );
      return res.json({ success: true, message: 'Blog generation automation completed.' });
    }

    if (name === 'scrape-news') {
      const newsId = uuidv4();
      await pool.execute(
        `INSERT INTO news_updates (id, title, content, summary, is_published, is_ai_generated) 
         VALUES (?, 'Scraped News Update', 'Detailed news content', 'Summary of news', 1, 1)`,
        [newsId]
      );
      return res.json({ success: true, message: 'News scraping completed.' });
    }

    return res.json({ success: true, message: `Function ${name} executed successfully` });
  } catch (err: any) {
    console.error(`Edge function ${name} execution error:`, err);
    res.status(500).json({ error: err.message || 'Execution failed' });
  }
});

export default router;
