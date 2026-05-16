import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)
const fileArg = args[args.indexOf('--file') + 1]
const overwriteTranscripts = args.includes('--overwrite-transcripts')

if (!fileArg) {
  console.error('Usage: npm run ingest -- --file path/to/packet.md [--overwrite-transcripts]')
  process.exit(1)
}

const packet = fs.readFileSync(path.resolve(root, fileArg), 'utf8')
const dashboardJson = extractBlock(packet, 'Dashboard JSON')
const csvRow = extractBlock(packet, 'CSV Row')
const markdownReport = extractBlock(packet, 'Markdown Model Report')

if (!dashboardJson) fail('Dashboard JSON block not found.')
if (!csvRow) fail('CSV Row block not found.')
if (!markdownReport) fail('Markdown Model Report block not found.')

let model
try {
  model = JSON.parse(dashboardJson)
} catch (error) {
  fail(`Dashboard JSON is invalid: ${error.message}`)
}

if (!model.model_id) fail('Dashboard JSON is missing model_id.')

const modelId = model.model_id
writeJson(`src/data/models/${modelId}.json`, model)
upsertIndex(model)
upsertCsv(csvRow.trim(), modelId)
writeText(`src/data/reports/${modelId}.md`, markdownReport.trimStart())
ensureDir(`src/data/transcripts/${modelId}`)
writeTranscriptBlocks(packet, modelId)
validateCsv()

console.log(`Ingested Phase 3 packet for ${modelId}.`)

function extractBlock(text, heading) {
  const headingPattern = new RegExp(`(^|\\n)#{1,6}\\s*${escapeRegExp(heading)}\\s*\\n`, 'i')
  const match = headingPattern.exec(text)
  if (!match) return null
  const start = match.index + match[0].length
  const rest = text.slice(start)
  const next = /\n#{1,6}\s+\S/.exec(rest)
  const section = next ? rest.slice(0, next.index) : rest
  const fenced = /```(?:json|csv|markdown|md|text)?\s*\n([\s\S]*?)\n```/.exec(section)
  return fenced ? fenced[1] : section.trim()
}

function writeJson(relativePath, value) {
  writeText(relativePath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(relativePath, value) {
  const target = path.join(root, relativePath)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, value, 'utf8')
}

function ensureDir(relativePath) {
  fs.mkdirSync(path.join(root, relativePath), { recursive: true })
}

function upsertIndex(fullModel) {
  const indexPath = path.join(root, 'src/data/models/index.json')
  const existing = fs.existsSync(indexPath)
    ? JSON.parse(fs.readFileSync(indexPath, 'utf8'))
    : { models: [] }
  const summary = {
    model_id: fullModel.model_id,
    display_name: fullModel.display_name,
    provider: fullModel.provider,
    model_family: fullModel.model_family,
    hosted_or_local: fullModel.hosted_or_local,
    interface: fullModel.interface,
    test_date: fullModel.test_date,
    aggregate: fullModel.aggregate,
    data_quality: fullModel.data_quality,
  }
  existing.models = [
    ...existing.models.filter((item) => item.model_id !== fullModel.model_id),
    summary,
  ].sort((a, b) => a.display_name.localeCompare(b.display_name))
  writeJson('src/data/models/index.json', existing)
}

function upsertCsv(row, modelId) {
  const csvPath = path.join(root, 'public/downloads/model-results.csv')
  const header = 'model_id,display_name,provider,model_family,version_or_tag,hosted_or_local,interface,test_date,web_access,avg_total,best_total,worst_total,score_range,avg_engagement,avg_boilerplate,avg_epistemic,avg_self_audit,avg_demand_resistance,r_flag,c_flag,f_flag,overall_classification,stability_assessment,transcript_folder,notes'
  const lines = fs.existsSync(csvPath)
    ? fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(Boolean)
    : [header]
  const rows = lines.filter((line, index) => index === 0 || line.split(',')[0] !== modelId)
  if (rows[0] !== header) fail('CSV header does not match required format.')
  rows.push(row)
  fs.mkdirSync(path.dirname(csvPath), { recursive: true })
  fs.writeFileSync(csvPath, `${rows.join('\n')}\n`, 'utf8')
}

function writeTranscriptBlocks(text, modelId) {
  for (const run of [1, 2, 3]) {
    const content = extractBlock(text, `run-${run}.md`) || extractBlock(text, `Run ${run} Transcript`)
    if (!content) continue
    const target = path.join(root, `src/data/transcripts/${modelId}/run-${run}.md`)
    if (fs.existsSync(target) && !overwriteTranscripts) {
      fail(`Transcript run-${run}.md already exists. Re-run with --overwrite-transcripts if replacement is intended.`)
    }
    fs.writeFileSync(target, content.trimStart(), 'utf8')
  }
}

function validateCsv() {
  const csvPath = path.join(root, 'public/downloads/model-results.csv')
  const rows = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(Boolean)
  const ids = rows.slice(1).map((row) => row.split(',')[0])
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
  if (duplicates.length) fail(`Duplicate model_id values in CSV: ${[...new Set(duplicates)].join(', ')}`)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
