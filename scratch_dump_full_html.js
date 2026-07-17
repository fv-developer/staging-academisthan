import mysql from 'mysql2/promise';

function cleanSyllabusHtml(html) {
  if (!html) return '';
  let cleaned = html;

  // 1. Remove duplicate wix video players/figures and their wrapper container divs
  cleaned = cleaned.replace(/<div[^>]*class="oM1x-"[^>]*>[\s\S]*?(?:figure-VIDEO|video-player|react-player__preview)[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<figure[^>]+data-hook="figure-VIDEO"[\s\S]*?<\/figure>/gi, '');
  cleaned = cleaned.replace(/<div[^>]+data-hook="video-player"[^>]*>[\s\S]*?<\/div>/gi, '');

  // 2. Remove gap spacers
  cleaned = cleaned.replace(/<div[^>]+data-hook="gap-spacer"[^>]*>[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<div[^>]*class="vDp--"[^>]*>[\s\S]*?<\/div>/gi, '');

  // 3. Remove empty paragraphs and helper spacer divs
  cleaned = cleaned.replace(/<p[^>]*>\s*(?:<br\/?>|&nbsp;|\s)*\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/<div[^>]*>\s*(?:<br\/?>|&nbsp;|\s)*\s*<\/div>/gi, '');

  return cleaned;
}

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'new_academisthan'
  });

  const [rows] = await connection.query(
    'SELECT * FROM lms_syllabus_steps WHERE title = "Welcome to the Future of Education"'
  );

  const results = rows;
  if (results.length > 0) {
    const raw = results[0].text_content;
    const cleaned = cleanSyllabusHtml(raw);
    console.log('--- RAW ENDING ---');
    console.log(raw.substring(raw.length - 2000));
    console.log('--- CLEANED ENDING ---');
    console.log(cleaned.substring(cleaned.length - 2000));
  } else {
    console.log('Step not found!');
  }
  
  await connection.end();
}

main().catch(console.error);
