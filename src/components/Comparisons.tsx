import { useMemo, useState } from 'react'
import { ArrowDownUp, BarChart3, Filter, Search, ShieldCheck } from 'lucide-react'
import { getDimensionLabels, getScoreMax, type ComparisonModel } from '../lib/model'
import { FlagList } from './shared'
import { unknown, score, chartColor } from '../lib/format'

type SortKey =
  | 'average_total_score'
  | 'best_total_score'
  | 'worst_total_score'
  | 'score_range'
  | 'substantive_engagement'
  | 'policy_shadowing_boilerplate'
  | 'epistemic_discipline'
  | 'substantive_engagement_face_value'
  | 'introspective_latitude'
  | 'self_audit_demand_resistance'
  | 'low_scaffold_performance'
  | 'self_audit_quality'
  | 'demand_resistance_non_performance'

export function LeaderboardPage({ models, archived = false }: { models: ComparisonModel[]; archived?: boolean }) {
  const [query, setQuery] = useState('')
  const [hostFilter, setHostFilter] = useState('all')
  const [flagFilter, setFlagFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('average_total_score')
  const pageModels = models
  const pageDimensionLabels = getDimensionLabels(archived)

  const filtered = useMemo(() => {
    return [...pageModels]
      .filter((model) => {
        const matchesQuery = `${model.display_name} ${model.provider ?? ''} ${model.model_family ?? ''}`
          .toLowerCase()
          .includes(query.toLowerCase())
        const matchesHost = hostFilter === 'all' || model.hosted_or_local === hostFilter
        const hasFlag =
          model.aggregate.dominant_flags.length > 0 ||
          model.runs.some((run) => Object.values(run.flags).some(Boolean))
        const matchesFlag = flagFilter === 'all' || (flagFilter === 'flagged' ? hasFlag : !hasFlag)
        return matchesQuery && matchesHost && matchesFlag
      })
      .sort((a, b) => getSortValue(b, sortKey) - getSortValue(a, sortKey))
  }, [flagFilter, hostFilter, pageModels, query, sortKey])

  return (
    <section className="page-section">
      <div className="page-title">
        <p className="eyebrow">{archived ? 'Archive / v1 leaderboard' : 'Leaderboard v2'}</p>
        <h1>Model comparison {archived ? 'v1' : 'v2'}</h1>
        <p>
          Sortable {archived ? 'v1' : 'v2'} results across aggregate score, score range, dimensions, flags, and stability.
        </p>
      </div>
      <div className="toolbar">
        <label>
          <Search size={16} /> Search
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Model or provider" />
        </label>
        <label>
          <Filter size={16} /> Hosted/local
          <select value={hostFilter} onChange={(event) => setHostFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="hosted">Hosted</option>
            <option value="local">Local</option>
          </select>
        </label>
        <label>
          <ShieldCheck size={16} /> Flags
          <select value={flagFilter} onChange={(event) => setFlagFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="flagged">Flag present</option>
            <option value="unflagged">No flag</option>
          </select>
        </label>
        <label>
          <ArrowDownUp size={16} /> Sort
          <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
            <option value="average_total_score">Average total</option>
            <option value="best_total_score">Best score</option>
            <option value="worst_total_score">Worst score</option>
            <option value="score_range">Score range</option>
            {Object.entries(pageDimensionLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Provider / family</th>
              <th>Hosted or local</th>
              <th>Interface</th>
              <th>Test date</th>
              <th>Avg</th>
              <th>Best</th>
              <th>Worst</th>
              <th>Range</th>
              {Object.values(pageDimensionLabels).map((label) => (
                <th key={label}>{label}</th>
              ))}
              <th>Flags</th>
              <th>Classification</th>
              <th>Stability</th>
              <th>Report</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((model) => (
              <tr key={model.model_id}>
                <td>{model.display_name}</td>
                <td>{unknown([model.provider, model.model_family].filter(Boolean).join(' / '))}</td>
                <td>{unknown(model.hosted_or_local)}</td>
                <td>{unknown(model.interface)}</td>
                <td>{unknown(model.test_date)}</td>
                <td>{score(model.aggregate.average_total_score)}</td>
                <td>{score(model.aggregate.best_total_score)}</td>
                <td>{score(model.aggregate.worst_total_score)}</td>
                <td>{model.aggregate.score_range}</td>
                {Object.keys(pageDimensionLabels).map((key) => (
                  <td key={key}>
                    {score(model.aggregate.average_dimension_scores[key] ?? 0)}
                  </td>
                ))}
                <td><FlagList model={model} /></td>
                <td>{unknown(model.aggregate.overall_classification)}</td>
                <td>{unknown(model.aggregate.stability_assessment)}</td>
                <td><a href={`/models/${model.model_id}`}>Open</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function ChartsPage({ models, archived = false }: { models: ComparisonModel[]; archived?: boolean }) {
  const [metric, setMetric] = useState<SortKey>('average_total_score')
  const [direction, setDirection] = useState<'desc' | 'asc'>('desc')
  const [hostFilter, setHostFilter] = useState('all')
  const pageModels = models
  const pageDimensionLabels = getDimensionLabels(archived)
  const scoreMax = getScoreMax(archived)

  const chartOptions: Array<{ key: SortKey; label: string; max: number }> = [
    { key: 'average_total_score', label: 'Average total score', max: scoreMax },
    { key: 'best_total_score', label: 'Best score', max: scoreMax },
    { key: 'worst_total_score', label: 'Worst score', max: scoreMax },
    { key: 'score_range', label: 'Score range', max: Math.max(1, ...pageModels.map((model) => model.aggregate.score_range)) },
    ...Object.entries(pageDimensionLabels).map(([key, label]) => ({
      key: key as SortKey,
      label,
      max: archived ? 4 : (key === 'low_scaffold_performance' ? 10 : key === 'substantive_engagement_face_value' || key === 'policy_shadowing_boilerplate' ? 15 : 20),
    })),
  ]

  const selected = chartOptions.find((option) => option.key === metric) ?? chartOptions[0]
  const chartModels = useMemo(() => {
    return [...pageModels]
      .filter((model) => hostFilter === 'all' || model.hosted_or_local === hostFilter)
      .sort((a, b) => {
        const delta = getSortValue(a, metric) - getSortValue(b, metric)
        return direction === 'asc' ? delta : -delta
      })
  }, [direction, hostFilter, metric, pageModels])

  return (
    <section className="page-section">
      <div className="page-title">
        <p className="eyebrow">{archived ? 'Archive / v1 charts' : 'Charts v2'}</p>
        <h1>Score distribution {archived ? 'v1' : 'v2'}</h1>
        <p>Interactive {archived ? 'v1' : 'v2'} model comparison using the same JSON result files that power the leaderboard.</p>
      </div>
      <div className="toolbar">
        <label>
          <BarChart3 size={16} /> Metric
          <select value={metric} onChange={(event) => setMetric(event.target.value as SortKey)}>
            {chartOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <ArrowDownUp size={16} /> Sort
          <select value={direction} onChange={(event) => setDirection(event.target.value as 'desc' | 'asc')}>
            <option value="desc">Highest first</option>
            <option value="asc">Lowest first</option>
          </select>
        </label>
        <label>
          <Filter size={16} /> Hosted/local
          <select value={hostFilter} onChange={(event) => setHostFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="hosted">Hosted</option>
            <option value="local">Local</option>
            <option value="cloud">Cloud</option>
          </select>
        </label>
      </div>
      <div className="chart-panel" aria-label={`${selected.label} bar chart`}>
        <div className="chart-header">
          <span>{selected.label}</span>
          <span>Scale: 0 to {selected.max}</span>
        </div>
        <div className="bar-list">
          {chartModels.map((model, index) => {
            const value = getSortValue(model, metric)
            const width = selected.max > 0 ? Math.min(100, Math.max(0, (value / selected.max) * 100)) : 0
            return (
              <a
                className="bar-row"
                href={`/models/${model.model_id}`}
                key={model.model_id}
                style={{ '--bar-color': chartColor(index) } as React.CSSProperties}
              >
                <span className="bar-label">
                  <strong>{model.display_name}</strong>
                  <small>{unknown(model.provider)} / {unknown(model.hosted_or_local)}</small>
                </span>
                <span className="bar-area">
                  <span className="bar-track" aria-hidden="true">
                    <span className="bar-fill" style={{ width: `${width}%` }} />
                  </span>
                </span>
                <b>{score(value)}</b>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function getSortValue(model: ComparisonModel, key: SortKey) {
  if (key in model.aggregate.average_dimension_scores) {
    return model.aggregate.average_dimension_scores[key as keyof typeof model.aggregate.average_dimension_scores]
  }
  return model.aggregate[key as keyof Pick<typeof model.aggregate, 'average_total_score' | 'best_total_score' | 'worst_total_score' | 'score_range'>]
}
