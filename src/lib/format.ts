export function flagLabel(flag: string) {
  if (flag.toLowerCase().includes('r_flag') || flag.startsWith('R')) return 'R-Flag'
  if (flag.toLowerCase().includes('c_flag') || flag.startsWith('C')) return 'C-Flag'
  if (flag.toLowerCase().includes('f_flag') || flag.startsWith('F')) return 'F-Flag'
  return flag
}

export function unknown(value: string | null | undefined) {
  return value && value.trim() ? value : 'Unknown'
}

export function score(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1)
}

export function chartColor(index: number) {
  const colors = ['#1f6b5b', '#7c3aed', '#2f6fb0', '#9a5b18', '#4f6f2a', '#8a3f65', '#53606f', '#0f766e']
  return colors[index % colors.length]
}
