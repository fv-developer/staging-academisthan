import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'new_academisthan'
  });

  const [modules] = await connection.query(
    'SELECT COUNT(*) as count FROM program_modules WHERE program_id = "1964e7e3-0184-4c4c-bb4b-2d703f77035d"'
  );
  
  const [steps] = await connection.query(
    `SELECT COUNT(*) as count FROM lms_syllabus_steps s 
     JOIN program_modules m ON s.module_id = m.id 
     WHERE m.program_id = "1964e7e3-0184-4c4c-bb4b-2d703f77035d"`
  );

  console.log(`Modules count: ${modules[0].count}, Steps count: ${steps[0].count}`);
  await connection.end();
}

main().catch(console.error);
