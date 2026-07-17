import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
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

  const mapPath = path.join(__dirname, 'scratch_course_map.json');
  const courseMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  console.log(`Loaded course map with ${courseMap.length} modules.`);

  const scrapedData = [];

  for (let mIdx = 0; mIdx < courseMap.length; mIdx++) {
    const mod = courseMap[mIdx];
    console.log(`\n==================================================`);
    console.log(`MODULE (${mIdx + 1}/${courseMap.length}): ${mod.title}`);
    console.log(`==================================================`);

    // Make sure module is expanded
    console.log(`Expanding module sidebar...`);
    const isClosed = await page.evaluate((btnSelector) => {
      const btn = document.querySelector(btnSelector);
      return btn ? btn.getAttribute('aria-expanded') !== 'true' : false;
    }, mod.btnSelector);

    if (isClosed && mod.btnSelector) {
      await page.locator(mod.btnSelector).click({ force: true });
      await page.waitForTimeout(1500);
    }

    const scrapedSteps = [];

    for (let sIdx = 0; sIdx < mod.steps.length; sIdx++) {
      const step = mod.steps[sIdx];
      console.log(`  Step (${sIdx + 1}/${mod.steps.length}): ${step.title}`);

      try {
        const selector = `li[data-id="${step.dataId}"] button.s__2SBGhr`;
        await page.locator(selector).click({ force: true });
        
        // Wait for player to load content. We wait for either the title to appear in the player content pane
        console.log(`    Waiting for title "${step.title}" to load in player...`);
        
        // Wix renders step title inside h3 or similar headings in the player pane
        await page.waitForFunction((expected) => {
          const player = document.querySelector('div.soMFyBK');
          if (!player) return false;
          const text = player.textContent || '';
          // Check if expected title is in the player content text
          return text.toLowerCase().includes(expected.toLowerCase());
        }, step.title, { timeout: 15000 }).catch(() => {
          console.log(`    Timeout waiting for title: "${step.title}". Proceeding anyway.`);
        });

        // Extra tiny grace timeout
        await page.waitForTimeout(1000);

        // Extract player contents
        const content = await page.evaluate(() => {
          const player = document.querySelector('div.soMFyBK');
          if (!player) return { error: 'Player container not found' };

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

        console.log(`    Scraped text length: ${content.htmlContent.length}`);
        
        scrapedSteps.push({
          ...step,
          content
        });

      } catch (err) {
        console.error(`    Failed to scrape step "${step.title}":`, err.message);
        scrapedSteps.push({
          ...step,
          error: err.message
        });
      }
    }

    scrapedData.push({
      ...mod,
      steps: scrapedSteps
    });

    // Write progress incrementally
    fs.writeFileSync(
      path.join(__dirname, 'scratch_course_data_partial.json'),
      JSON.stringify(scrapedData, null, 2)
    );
  }

  // Save final data
  fs.writeFileSync(
    path.join(__dirname, 'scratch_course_data.json'),
    JSON.stringify(scrapedData, null, 2)
  );
  console.log('\nSUCCESS: All course data saved to scratch_course_data.json');

  await browser.close();
}

main().catch(console.error);
