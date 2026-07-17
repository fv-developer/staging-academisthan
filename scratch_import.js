import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const programId = '1964e7e3-0184-4c4c-bb4b-2d703f77035d';
  
  console.log('Loading course data...');
  const dataPath = path.join(__dirname, 'scratch_course_data.json');
  const courseData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'new_academisthan'
  });

  console.log('Launching browser to parse quiz questions...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Wiping existing modules and steps for the program...');
  // Find all module IDs for this program
  const [existingModules] = await connection.query(
    'SELECT id FROM program_modules WHERE program_id = ?',
    [programId]
  );
  const moduleIds = existingModules.map(m => m.id);

  if (moduleIds.length > 0) {
    const placeholders = moduleIds.map(() => '?').join(',');
    console.log(`Deleting steps for modules: ${moduleIds.length}`);
    await connection.query(
      `DELETE FROM lms_syllabus_steps WHERE module_id IN (${placeholders})`,
      moduleIds
    );
    console.log(`Deleting program modules...`);
    await connection.query(
      'DELETE FROM program_modules WHERE program_id = ?',
      [programId]
    );
  }

  // Update Program Description
  const programDesc = `Unlock the transformative power of artificial intelligence in your classroom with "AI for Educators – Your Partner in the Future of Learning." This intermediate-level program is expertly crafted for teachers eager to elevate their teaching strategies and stay ahead in the rapidly evolving educational landscape. Through a blend of practical insights and hands-on activities, you’ll explore how AI can personalize learning, streamline administrative tasks, and foster student engagement like never before.

Designed specifically for educators with a foundational understanding of technology, this course delves into real-world applications of AI, ethical considerations, and the latest tools shaping modern education. You’ll gain the confidence to integrate AI-driven solutions into your curriculum, enhance assessment methods, and support diverse learning needs. Collaborative discussions and interactive modules ensure you not only learn about AI, but also develop actionable strategies to implement immediately in your classroom.

Join a community of forward-thinking teachers and become a catalyst for positive change. Embrace the future of education—empowered by AI, inspired by innovation, and driven by your passion for teaching.`;

  await connection.query(
    'UPDATE programs SET description = ? WHERE id = ?',
    [programDesc, programId]
  );
  console.log('Program description updated successfully.');

  // Loop through modules
  for (let mIdx = 0; mIdx < courseData.length; mIdx++) {
    const mod = courseData[mIdx];
    const moduleId = uuidv4();

    console.log(`Inserting Module (${mIdx + 1}/${courseData.length}): ${mod.title}`);
    
    // Insert module
    // Exact title is used in both chapter and title columns
    await connection.query(
      `INSERT INTO program_modules (id, program_id, chapter, title, description, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [moduleId, programId, mod.title, mod.title, null, mIdx]
    );

    // Loop through steps
    for (let sIdx = 0; sIdx < mod.steps.length; sIdx++) {
      const step = mod.steps[sIdx];
      const stepId = uuidv4();

      if (!step.content) continue;
      const html = step.content.htmlContent || '';

      // Determine content type
      let contentType = 'text';
      let videoUrl = null;
      let fileUrl = null;
      let quizQuestions = null;

      // Extract Youtube Video ID if present
      const ytMatch = html.match(/youtube\.com\/vi\/([^/"]+)/) || 
                      html.match(/ytimg\.com\/vi\/([^/"]+)/) ||
                      html.match(/youtube\.com\/embed\/([^?"]+)/) ||
                      html.match(/youtube\.com\/watch\?v=([^"&]+)/);
      if (ytMatch) {
        contentType = 'video';
        videoUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
      }

      // Extract PDF Link if present
      const pdfMatch = html.match(/(https?:\/\/static\.wixstatic\.com\/document\/[^\s"<>]+)/) ||
                       html.match(/(https?:\/\/[^\s"<>]+?\.pdf)/);
      if (pdfMatch) {
        contentType = 'pdf';
        fileUrl = pdfMatch[1];
      }

      // Parse Quiz Questions if title contains quiz
      if (step.title.toLowerCase().includes('quiz')) {
        contentType = 'quiz';
        await page.setContent(html);
        
        const questions = await page.evaluate(() => {
          const parsed = [];
          const labelElements = Array.from(document.querySelectorAll('label'));
          
          for (const label of labelElements) {
            const questionText = label.textContent.replace(/\*$/, '').trim();
            if (!questionText) continue;
            
            const gridContainer = label.closest('div[style*="display: grid"]') || label.closest('div.itmEcW') || label.parentElement?.parentElement;
            if (!gridContainer) continue;

            const inputs = Array.from(gridContainer.querySelectorAll('input[type="radio"], input[type="checkbox"]'));
            const options = inputs.map(input => {
              return input.getAttribute('value') || input.getAttribute('aria-label') || '';
            }).map(t => t.trim()).filter(Boolean);
            
            if (options.length > 0 && !parsed.some(q => q.question === questionText)) {
              parsed.push({
                question: questionText,
                options,
                correct_answer: options[0] // Default fallback
              });
            }
          }
          return parsed;
        });

        if (questions.length > 0) {
          quizQuestions = JSON.stringify(questions);
        }
      }

      // Calculate estimate duration
      const wordCount = html.replace(/<[^>]+>/g, '').split(/\s+/).length;
      const duration = Math.max(5, Math.min(20, Math.round(wordCount / 180)));

      // Insert step
      await connection.query(
        `INSERT INTO lms_syllabus_steps (
          id, module_id, title, content_type, video_url, text_content, file_url, quiz_questions, passing_score, sort_order, duration_minutes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          stepId,
          moduleId,
          step.title,
          contentType,
          videoUrl,
          html,
          fileUrl,
          quizQuestions,
          80,
          sIdx,
          duration
        ]
      );
    }
  }

  console.log('\nSUCCESS: Database import complete!');
  await browser.close();
  await connection.end();
}

main().catch(console.error);
