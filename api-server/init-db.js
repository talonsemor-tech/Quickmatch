require("dotenv").config()
const {Pool}=require("pg")
const fs=require("fs")
const path=require("path")

const pool=new Pool({
 connectionString:process.env.DATABASE_URL ||
 "postgres://quickmatch:quickmatch@localhost:5432/quickmatch"
})

async function initDB() {
 try {
  console.log('Initializing database...')

  // Read schema file
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')

  // Split schema into individual statements
  const statements = schema.split(';').filter(stmt => stmt.trim().length > 0)

  for (const statement of statements) {
   if (statement.trim()) {
    await pool.query(statement)
   }
  }

  console.log('Database initialized successfully!')
 } catch (error) {
  console.error('Database initialization failed:', error.message)
  process.exit(1)
 } finally {
  await pool.end()
 }
}

initDB()