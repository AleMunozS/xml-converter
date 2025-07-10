// save-xml-service.js
import express     from 'express'
import fs          from 'fs'
import path        from 'path'
import basicAuth   from 'basic-auth'
import { config as loadEnv } from 'dotenv'

loadEnv()
// ───────────────── Config ─────────────────
const PORT          = process.env.PORT || 3000
const AUTH_USER     = process.env.AUTH_USER     || 'n8n'
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'supersecret'
const TARGET_DIR    = 'C:\\zonalibre\\crimsonlogic\\pendientes'

// ──────────────── App setup ───────────────
const app = express()

// 1️⃣ leemos el body como texto crudo
app.use(express.text({ type: '*/*', limit: '10mb' }))

// 2️⃣ middleware de Basic Auth
app.use((req, res, next) => {
  const creds = basicAuth(req)
  if (!creds || creds.name !== AUTH_USER || creds.pass !== AUTH_PASSWORD) {
    res.set('WWW-Authenticate', 'Basic realm="xml-service"')
    return res.status(401).send('Access denied')
  }
  next()
})

// 3️⃣ endpoint principal
app.post('/api/xml', async (req, res) => {
  try {
    if (!req.body?.trim()) {
      return res.status(400).json({ error: 'XML vacío' })
    }

    // nombre de archivo: ?filename=MiArchivo.xml
    const rawName   = (req.query.filename || '').toString().trim()
    const safeName  = rawName.replace(/[^A-Za-z0-9._-]/g, '')      // sanitiza
    const filename  = safeName ? safeName : `DMCFORM_${Date.now()}.xml`
    const fullPath  = path.join(TARGET_DIR, filename)

    // nos aseguramos de que exista la carpeta
    fs.mkdirSync(TARGET_DIR, { recursive: true })
    fs.writeFileSync(fullPath, req.body, 'utf8')

    res.status(201).json({ ok: true, savedAs: fullPath })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ──────────────── launch ──────────────────
app.listen(PORT, () =>
  console.log(`XML-receiver escuchando en http://localhost:${PORT}/api/xml`)
)
