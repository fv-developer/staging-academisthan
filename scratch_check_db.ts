import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'new_academisthan'
  });

  try {
    const [programs] = await connection.execute('SELECT id, title, slug FROM academic_programs');
    console.log('--- Academic Programs ---');
    console.log(programs);

    for (const p of programs as any[]) {
      const [modules] = await connection.execute('SELECT id, title, chapter, sort_order FROM program_modules WHERE program_id = ? ORDER BY sort_order', [p.id]);
      console.log(`\nModules for program: ${p.title} (ID: ${p.id})`);
      console.log(modules);

      for (const m of modules as any[]) {
        const [steps] = await connection.execute('SELECT id, title, content_type, sort_order FROM syllabus_steps WHERE module_id = ? ORDER BY sort_order', [m.id]);
        console.log(`  Steps for module: ${m.title}`);
        console.log(steps.map((s: any) => `    - ${s.title} (${s.content_type})`));
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

main();
