import mysql from 'mysql2/promise';

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
    const html = results[0].text_content;
    
    // Find all occurrences of youtube, vimeo, video, iframe, react-player
    const searchTerms = ['youtube', 'vimeo', 'video', 'iframe', 'player'];
    for (const term of searchTerms) {
      const idx = html.toLowerCase().indexOf(term);
      if (idx !== -1) {
        const start = Math.max(0, idx - 200);
        const end = Math.min(html.length, idx + term.length + 500);
        console.log(`\n--- FOUND TERM: "${term}" ---`);
        console.log(html.substring(start, end));
      }
    }
  } else {
    console.log('Step not found!');
  }
  
  await connection.end();
}

main().catch(console.error);
