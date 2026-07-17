import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const dataPath = path.join(__dirname, 'scratch_course_data.json');
  const courseData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Find all steps that are duplicates of the previous step
  const mismatches = [];
  for (let mIdx = 0; mIdx < courseData.length; mIdx++) {
    const mod = courseData[mIdx];
    for (let sIdx = 0; sIdx < mod.steps.length; sIdx++) {
      const step = mod.steps[sIdx];
      
      // We also check if the step title is not in the HTML content
      const shortTitle = step.title.substring(0, 20);
      const isMismatched = step.content && !step.content.htmlContent.includes(shortTitle);
      
      let isDuplicate = false;
      if (sIdx > 0) {
        const prevStep = mod.steps[sIdx - 1];
        isDuplicate = step.content && prevStep.content && step.content.htmlContent === prevStep.content.htmlContent;
      }

      if (isMismatched || isDuplicate) {
        mismatches.push({ mIdx, sIdx, title: step.title, dataId: step.dataId, modTitle: mod.title, modBtn: mod.btnSelector });
      }
    }
  }

  console.log(`Found ${mismatches.length} mismatched steps to rescrape.`);
  if (mismatches.length === 0) {
    console.log('No mismatches found. Database import can proceed.');
    return;
  }

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  console.log('Loading cookies...');
  const cookiesPath = path.join(__dirname, 'scratch_cookies.json');
  const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
  
  const playwrightCookies = cookies.map(c => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: c.sameSite === null ? 'Lax' : (c.sameSite === 'no_restriction' ? 'None' : (c.sameSite === 'lax' ? 'Lax' : 'Strict'))
  }));
  
  await context.addCookies(playwrightCookies);
  const page = await context.newPage();
  
  console.log('Navigating directly to participant page...');
  await page.goto('https://www.academisthan.com/participant-page/89cc1b25-664a-4252-a3fa-c34be3cfc4c0');
  
  console.log('Waiting 10s for page to render...');
  await page.waitForTimeout(10000);

  // Group mismatches by module to minimize sidebar clicks
  const groupedMismatches = {};
  for (const m of mismatches) {
    if (!groupedMismatches[m.mIdx]) {
      groupedMismatches[m.mIdx] = [];
    }
    groupedMismatches[m.mIdx].push(m);
  }

  for (const mIdxStr of Object.keys(groupedMismatches)) {
    const mIdx = parseInt(mIdxStr);
    const mod = courseData[mIdx];
    const ms = groupedMismatches[mIdx];

    console.log(`\nExpanding Module: ${mod.title}`);
    if (mod.btnSelector) {
      await page.locator(mod.btnSelector).click({ force: true });
      await page.waitForTimeout(2000);
    }

    for (const m of ms) {
      const step = mod.steps[m.sIdx];
      console.log(`Rescraping Step: "${step.title}"`);

      try {
        const selector = `li[data-id="${step.dataId}"] button.s__2SBGhr`;
        const btn = page.locator(selector);
        await btn.scrollIntoViewIfNeeded();
        
        const oldHtml = await page.evaluate(() => document.querySelector('div.soMFyBK')?.innerHTML || '');

        await btn.click({ force: true });

        // Wait for player to load new content
        console.log(`  Waiting for player content update...`);
        let loaded = false;
        
        // Wait for content change
        await page.waitForFunction((old) => {
          const player = document.querySelector('div.soMFyBK');
          return player && player.innerHTML !== old;
        }, oldHtml, { timeout: 8000 }).then(() => { loaded = true; }).catch(() => {});

        if (!loaded) {
          console.log(`  Content did not change immediately. Trying longer wait...`);
          await page.waitForTimeout(4000);
        } else {
          await page.waitForTimeout(1500); // tiny grace period
        }

        // Extract player contents
        const content = await page.evaluate(() => {
          const player = document.querySelector('div.soMFyBK');
          if (!player) return null;

          const iframes = Array.from(player.querySelectorAll('iframe')).map(i => i.src);
          const videos = Array.from(player.querySelectorAll('video')).map(v => v.src);
          const links = Array.from(player.querySelectorAll('a')).map(a => ({
            text: a.textContent.trim(),
            href: a.href
          }));

          const sectionEl = player.querySelector('section') || player;
          const htmlContent = sectionEl.innerHTML;

          return {
            videoUrls: iframes.filter(src => src.includes('youtube') || src.includes('vimeo') || src.includes('wixstatic.com/video')),
            pdfUrls: iframes.filter(src => src.includes('.pdf') || src.includes('wixstatic.com/document') || src.includes('pdf')),
            videoTags: videos,
            links,
            htmlContent
          };
        });

        if (content) {
          console.log(`  Successfully rescraped. Text length: ${content.htmlContent.length}`);
          courseData[mIdx].steps[m.sIdx].content = content;
        }

      } catch (err) {
        console.error(`  Failed to rescrape step "${step.title}":`, err.message);
      }
    }

    // Collapse module
    if (mod.btnSelector) {
      await page.locator(mod.btnSelector).click({ force: true });
      await page.waitForTimeout(1000);
    }
  }

  // Save updated data
  fs.writeFileSync(dataPath, JSON.stringify(courseData, null, 2));
  console.log('\nSUCCESS: Mismatches rescraped and saved.');

  await browser.close();
}

main().catch(console.error);
