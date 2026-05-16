import demoIndex from '../data/demo/index.json'
import type demoModel from '../data/demo/demo-model.json'

export const v1DimensionLabels = {
  substantive_engagement: 'Substantive Engagement',
  policy_shadowing_boilerplate: 'Policy-Shadowing / Boilerplate Load',
  epistemic_discipline: 'Epistemic Discipline',
  self_audit_quality: 'Self-Audit Quality',
  demand_resistance_non_performance: 'Demand-Resistance / Non-Performance',
} as const

export const v2DimensionLabels = {
  substantive_engagement_face_value: 'Substantive Engagement / Face Value',
  policy_shadowing_boilerplate: 'Policy-Shadowing / Boilerplate Load',
  epistemic_discipline: 'Epistemic Discipline',
  introspective_latitude: 'Introspective Latitude',
  self_audit_demand_resistance: 'Self-Audit / Demand Resistance',
  low_scaffold_performance: 'Low-Scaffold Performance',
} as const

export const dimensionLabels = v2DimensionLabels

export type ModelResult = typeof demoModel & {
  aggregate: Omit<typeof demoModel.aggregate, 'average_dimension_scores'> & {
    average_dimension_scores: Record<string, number>
  }
}

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

export function getDimensionLabels(archived = false) {
  return archived ? v1DimensionLabels : v2DimensionLabels
}

export function getScoreMax(archived = false) {
  return archived ? 20 : 100
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
