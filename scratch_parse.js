import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const dataPath = path.join(__dirname, 'scratch_course_data.json');
  const courseData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const mismatches = [
    { moduleIdx: 1, stepIdx: 4, name: 'How Does Generative AI Work?' },
    { moduleIdx: 1, stepIdx: 8, name: 'M1 - Quiz 2' },
    { moduleIdx: 1, stepIdx: 20, name: 'M1 - Task 1' },
    { moduleIdx: 1, stepIdx: 24, name: 'Prompting for Syllabus Design' }
  ];

  for (const mm of mismatches) {
    const mod = courseData[mm.moduleIdx];
    const step = mod.steps[mm.stepIdx];
    const prevStep = mod.steps[mm.stepIdx - 1];

    console.log(`\nChecking Step: ${step.title}`);
    
    // Check if the HTML is identical to the previous step
    const isDuplicate = step.content.htmlContent === prevStep.content.htmlContent;
    console.log(`  Is HTML identical to previous step "${prevStep.title}"?`, isDuplicate);
    
    const text = step.content.htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 300);
    console.log(`  Content Preview:`, text);
  }
}

main().catch(console.error);
