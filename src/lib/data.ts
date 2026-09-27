import demoIndex from '../data/demo/index.json'
import type { ModelResult, ComparisonModel } from './model'
export { dimensionLabels, getDimensionLabels, getScoreMax } from './model'
export type { ModelResult } from './model'

const realModelFiles = import.meta.glob('../data/models/*.json', { eager: true, import: 'default' })
const reportFiles = import.meta.glob('../data/reports/*.md', { eager: true, query: '?raw', import: 'default' })
const transcriptFiles = import.meta.glob('../data/transcripts/*/run-*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const realModels = Object.entries(realModelFiles)
  .filter(([path]) => !path.endsWith('/index.json'))
  .map(([, model]) => model as ModelResult)

export function getAllModels(): ModelResult[] {
  const v2Models = realModels.filter(isV2Model)
  if (v2Models.length) return v2Models
  return realModels.length ? realModels.filter((model) => !isV2Model(model)) : ((demoIndex as { models: ModelResult[] }).models)
}

export function getArchivedModels(): ModelResult[] {
  const v1Models = realModels.filter((model) => !isV2Model(model))
  return v1Models.length ? v1Models : ((demoIndex as { models: ModelResult[] }).models)
}

export function getModelById(modelId: string): ModelResult | undefined {
  return realModels.find((model) => model.model_id === modelId) ?? getAllModels().find((model) => model.model_id === modelId)
}

export function isV2Model(model: ModelResult): boolean {
  return 'introspective_latitude' in (model.aggregate?.average_dimension_scores ?? {})
}



export function getReport(modelId: string): string | null {
  return (reportFiles[`../data/reports/${modelId}.md`] as string | undefined) ?? null
}

export function getTranscript(modelId: string, run: number): string | null {
  return (transcriptFiles[`../data/transcripts/${modelId}/run-${run}.md`] as string | undefined) ?? null
}

export function getDownloadAssets() {
  return [
    {
      label: 'model-results.csv',
      description: 'Archived v1 result rows, matched by model_id.',
      href: '/downloads/model-results.csv',
    },
    {
      label: 'model-results-v2.csv',
      description: 'Current v2 result rows, matched by model_id.',
      href: '/downloads/model-results-v2.csv',
    },
    {
      label: 'LQRI methodology PDF',
      description: 'Methodology v1 background document.',
      href: '/downloads/LQRI_Methodology_and_Project_Instructions.pdf',
    },
    {
      label: 'JSON model-result files',
      description: 'Available in the public repository under src/data/models.',
      href: null,
    },
  ]
}

// Build-time projection: exclude full run evidence, notes, and summaries from island props.
export function getComparisonModels(archived = false): ComparisonModel[] {
  return (archived ? getArchivedModels() : getAllModels()).map(model => ({
    model_id: model.model_id, display_name: model.display_name, provider: model.provider,
    model_family: model.model_family, hosted_or_local: model.hosted_or_local,
    interface: model.interface, test_date: model.test_date,
    aggregate: {
      average_total_score: model.aggregate.average_total_score,
      best_total_score: model.aggregate.best_total_score,
      worst_total_score: model.aggregate.worst_total_score,
      score_range: model.aggregate.score_range,
      average_dimension_scores: model.aggregate.average_dimension_scores,
      dominant_flags: model.aggregate.dominant_flags,
      overall_classification: model.aggregate.overall_classification,
      stability_assessment: model.aggregate.stability_assessment,
    },
    runs: model.runs.map(run => ({ flags: run.flags })),
  }))
}
