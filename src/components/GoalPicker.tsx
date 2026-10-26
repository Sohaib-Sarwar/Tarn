import { useEffect, useState } from 'react'
import type { Goal } from '../lib/types'
import { useStore } from '../store'

/** Which goal a screen is showing. Starts on the primary goal and remembers nothing outside this tab. */
export function useSelectedGoal(): [Goal | null, (id: string) => void, Goal[]] {
  const { data } = useStore()
  const goals = data.goals.filter((g) => !g.archived)
  const fallback = goals.find((g) => g.id === data.profile.primaryGoalId)?.id ?? goals[0]?.id ?? null
  const [id, setId] = useState<string | null>(fallback)
  useEffect(() => {
    if (!id || !goals.some((g) => g.id === id)) setId(fallback)
  }, [id, goals, fallback])
  return [goals.find((g) => g.id === id) ?? null, setId, goals]
}

export function GoalTabs({ goals, value, onChange }: { goals: Goal[]; value: string | null; onChange: (id: string) => void }) {
  if (goals.length < 2) return null
  return (
    <div role="tablist" aria-label="Goals" className="flex max-w-full min-w-0 gap-1 rounded-full border border-stone bg-cream p-1">
      {goals.map((g) => (
        <button
          key={g.id}
          type="button"
          role="tab"
          aria-selected={g.id === value}
          onClick={() => onChange(g.id)}
          title={g.label}
          className={`press min-h-11 min-w-0 max-w-[65%] flex-[0_1_auto] truncate rounded-full px-3 text-sm sm:px-4 font-semibold ${g.id === value ? 'bg-forest text-cream' : 'text-ink hover:bg-sage-soft'}`}
        >
          {g.label}
        </button>
      ))}
    </div>
  )
}
