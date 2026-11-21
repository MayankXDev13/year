import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Habit,
  Plan,
  PlanStatus,
  QuarterGoal,
  WeekMeta,
  YearBoardData,
} from '@year-board/shared'
import { apiFetch } from './api'

export const boardKeys = {
  all: ['board'] as const,
}

export function useBoardQuery(enabled: boolean) {
  return useQuery({
    queryKey: boardKeys.all,
    queryFn: () => apiFetch<YearBoardData>('/api/board'),
    enabled,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (error && 'status' in error && (error.status === 401 || error.status === 404)) {
        return false
      }
      return failureCount < 2
    },
  })
}

export function useBoardMutations(onError: (msg: string) => void) {
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: boardKeys.all })

  const handleErr = (err: unknown, fallback: string) => {
    const msg = err instanceof Error ? err.message : fallback
    onError(msg)
  }

  const savePlan = useMutation({
    mutationFn: async ({ plan, existingId }: { plan: Omit<Plan, 'id'>; existingId?: string }) => {
      if (existingId) {
        return apiFetch<{ ok: true; id: string }>(`/api/plans/${existingId}`, {
          method: 'PATCH',
          body: JSON.stringify(plan),
        })
      }
      return apiFetch<Plan>('/api/plans', {
        method: 'POST',
        body: JSON.stringify(plan),
      })
    },
    onSuccess: invalidate,
    onError: (e) => handleErr(e, 'Failed to save plan'),
  })

  const deletePlan = useMutation({
    mutationFn: (planId: string) =>
      apiFetch<{ ok: true }>(`/api/plans/${planId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
    onError: (e) => handleErr(e, 'Failed to delete plan'),
  })

  const updatePlanStatus = useMutation({
    mutationFn: ({ planId, status }: { planId: string; status: PlanStatus }) =>
      apiFetch<{ ok: true }>(`/api/plans/${planId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onMutate: async ({ planId, status }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.all })
      const prev = queryClient.getQueryData<YearBoardData>(boardKeys.all)
      if (prev) {
        queryClient.setQueryData<YearBoardData>(boardKeys.all, {
          ...prev,
          plans: prev.plans.map((p) => (p.id === planId ? { ...p, status } : p)),
        })
      }
      return { prev }
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(boardKeys.all, ctx.prev)
      handleErr(e, 'Failed to update plan status')
    },
    onSettled: invalidate,
  })

  const saveHabit = useMutation({
    mutationFn: async ({
      habit,
      existingId,
    }: {
      habit: Omit<Habit, 'id'>
      existingId?: string
    }) => {
      if (existingId) {
        return apiFetch<{ ok: true }>(`/api/habits/${existingId}`, {
          method: 'PATCH',
          body: JSON.stringify(habit),
        })
      }
      return apiFetch<Habit>('/api/habits', {
        method: 'POST',
        body: JSON.stringify(habit),
      })
    },
    onSuccess: invalidate,
    onError: (e) => handleErr(e, 'Failed to save habit'),
  })

  const deleteHabit = useMutation({
    mutationFn: (habitId: string) =>
      apiFetch<{ ok: true }>(`/api/habits/${habitId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
    onError: (e) => handleErr(e, 'Failed to delete habit'),
  })

  const toggleArchiveHabit = useMutation({
    mutationFn: ({ habitId, archived }: { habitId: string; archived: boolean }) =>
      apiFetch<{ ok: true }>(`/api/habits/${habitId}`, {
        method: 'PATCH',
        body: JSON.stringify({ archived }),
      }),
    onMutate: async ({ habitId, archived }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.all })
      const prev = queryClient.getQueryData<YearBoardData>(boardKeys.all)
      if (prev) {
        queryClient.setQueryData<YearBoardData>(boardKeys.all, {
          ...prev,
          habits: prev.habits.map((h) => (h.id === habitId ? { ...h, archived } : h)),
        })
      }
      return { prev }
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(boardKeys.all, ctx.prev)
      handleErr(e, 'Failed to update habit archive status')
    },
    onSettled: invalidate,
  })

  const toggleHabitCheckin = useMutation({
    mutationFn: ({
      habitId,
      dateKey,
      todayKey,
    }: {
      habitId: string
      dateKey: string
      todayKey: string
    }) =>
      apiFetch<{ done: boolean }>(`/api/habits/${habitId}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ dateKey, todayKey }),
      }),
    onMutate: async ({ habitId, dateKey }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.all })
      const prev = queryClient.getQueryData<YearBoardData>(boardKeys.all)
      if (prev) {
        const curMap = prev.habitCheckins[habitId] ?? {}
        const nextMap = { ...curMap }
        if (nextMap[dateKey]) delete nextMap[dateKey]
        else nextMap[dateKey] = true
        queryClient.setQueryData<YearBoardData>(boardKeys.all, {
          ...prev,
          habitCheckins: { ...prev.habitCheckins, [habitId]: nextMap },
        })
      }
      return { prev }
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(boardKeys.all, ctx.prev)
      handleErr(e, 'Failed to toggle habit')
    },
    onSettled: invalidate,
  })

  const addLabEntry = useMutation({
    mutationFn: (entry: { date: string; topic: string; minutes: number }) =>
      apiFetch('/api/labs/entries', {
        method: 'POST',
        body: JSON.stringify(entry),
      }),
    onSuccess: invalidate,
    onError: (e) => handleErr(e, 'Failed to log focus time'),
  })

  const addGoal = useMutation({
    mutationFn: (goal: { year: number; quarter: 1 | 2 | 3 | 4; title: string }) =>
      apiFetch<QuarterGoal>('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goal),
      }),
    onSuccess: invalidate,
    onError: (e) => handleErr(e, 'Failed to add goal'),
  })

  const toggleGoal = useMutation({
    mutationFn: ({ goalId, done }: { goalId: string; done: boolean }) =>
      apiFetch('/api/goals/' + goalId, {
        method: 'PATCH',
        body: JSON.stringify({ done }),
      }),
    onMutate: async ({ goalId, done }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.all })
      const prev = queryClient.getQueryData<YearBoardData>(boardKeys.all)
      if (prev) {
        queryClient.setQueryData<YearBoardData>(boardKeys.all, {
          ...prev,
          quarterGoals: prev.quarterGoals.map((g) => (g.id === goalId ? { ...g, done } : g)),
        })
      }
      return { prev }
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(boardKeys.all, ctx.prev)
      handleErr(e, 'Failed to update goal')
    },
    onSettled: invalidate,
  })

  const deleteGoal = useMutation({
    mutationFn: (goalId: string) =>
      apiFetch('/api/goals/' + goalId, { method: 'DELETE' }),
    onSuccess: invalidate,
    onError: (e) => handleErr(e, 'Failed to delete goal'),
  })

  const upsertWeekMeta = useMutation({
    mutationFn: ({ weekKey, meta }: { weekKey: string; meta: WeekMeta }) =>
      apiFetch(`/api/weeks/${weekKey}`, {
        method: 'PUT',
        body: JSON.stringify(meta),
      }),
    onSuccess: invalidate,
    onError: (e) => handleErr(e, 'Failed to save week details'),
  })

  const updatePreferences = useMutation({
    mutationFn: (patch: Partial<Pick<YearBoardData, 'ownerName' | 'density' | 'view' | 'theme' | 'hiddenCategories' | 'tourSeen'>>) =>
      apiFetch('/api/preferences', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.all })
      const prev = queryClient.getQueryData<YearBoardData>(boardKeys.all)
      if (prev) {
        queryClient.setQueryData<YearBoardData>(boardKeys.all, { ...prev, ...patch })
      }
      return { prev }
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(boardKeys.all, ctx.prev)
      handleErr(e, 'Failed to save preferences')
    },
    onSettled: invalidate,
  })

  const resetBoard = useMutation({
    mutationFn: () => apiFetch('/api/board/reset', { method: 'POST' }),
    onSuccess: invalidate,
    onError: (e) => handleErr(e, 'Failed to reset board'),
  })

  return {
    savePlan,
    deletePlan,
    updatePlanStatus,
    saveHabit,
    deleteHabit,
    toggleArchiveHabit,
    toggleHabitCheckin,
    addLabEntry,
    addGoal,
    toggleGoal,
    deleteGoal,
    upsertWeekMeta,
    updatePreferences,
    resetBoard,
  }
}
