import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'new_academisthan'
  });

  const [rows] = await connection.query(
    'SELECT * FROM lms_syllabus_steps WHERE title = "The Three Pillars"'
  );

  const results = rows;
  if (results.length > 0) {
    console.log('Step Title:', results[0].title);
    console.log('Video URL:', results[0].video_url);
    console.log('Text Content Length:', results[0].text_content.length);
    console.log('Text Content (snippet):', results[0].text_content.substring(0, 1500));
  } else {
    console.log('Step not found!');
  }
  
  await connection.end();
}

main().catch(console.error);
