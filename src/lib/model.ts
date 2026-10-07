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

export function getDimensionLabels(archived = false) {
  return archived ? v1DimensionLabels : v2DimensionLabels
}

export function getScoreMax(archived = false) {
  return archived ? 20 : 100
}

// Only fields used by interactive comparisons cross the hydration boundary.
export type ComparisonModel = Pick<ModelResult, 'model_id' | 'display_name' | 'provider' | 'model_family' | 'hosted_or_local' | 'interface' | 'test_date'> & {
  aggregate: Pick<ModelResult['aggregate'], 'average_total_score' | 'best_total_score' | 'worst_total_score' | 'score_range' | 'average_dimension_scores' | 'dominant_flags' | 'overall_classification' | 'stability_assessment'>
  runs: Array<Pick<ModelResult['runs'][number], 'flags'>>
}
