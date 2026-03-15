/**
 * useInterview — lightweight hook for interview data operations.
 * Used by pages to avoid duplicating service call logic.
 */

import { useCallback, useState } from 'react'
import { useOrgStore, useInterviewStore } from '@/app/store'
import {
  listInterviews,
  createInterviewRecord,
  deleteInterviewRecord,
  startInterviewSession,
  cancelInterviewSession,
  type CreateInterviewInput,
  type InterviewStatus,
} from '@/services/api'

export function useInterview() {
  const { currentOrgId } = useOrgStore()
  const {
    interviews,
    loading,
    statusFilter,
    setInterviews,
    addInterview,
    removeInterview,
    updateInterview,
    setLoading,
    setStatusFilter,
    clear,
  } = useInterviewStore()

  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(
    async (status?: InterviewStatus) => {
      if (!currentOrgId) return
      setLoading(true)
      setError(null)
      try {
        const list = await listInterviews(currentOrgId, status)
        setInterviews(list)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load interviews')
      } finally {
        setLoading(false)
      }
    },
    [currentOrgId, setInterviews, setLoading]
  )

  const create = useCallback(
    async (input: CreateInterviewInput) => {
      if (!currentOrgId) throw new Error('No organization selected')
      const interview = await createInterviewRecord(currentOrgId, input)
      addInterview(interview)
      return interview
    },
    [currentOrgId, addInterview]
  )

  const remove = useCallback(
    async (interviewId: string) => {
      if (!currentOrgId) throw new Error('No organization selected')
      await deleteInterviewRecord(currentOrgId, interviewId)
      removeInterview(interviewId)
    },
    [currentOrgId, removeInterview]
  )

  const start = useCallback(
    async (interviewId: string) => {
      if (!currentOrgId) throw new Error('No organization selected')
      const result = await startInterviewSession(currentOrgId, interviewId)
      updateInterview(interviewId, result.interview)
      return result
    },
    [currentOrgId, updateInterview]
  )

  const cancel = useCallback(
    async (interviewId: string) => {
      if (!currentOrgId) throw new Error('No organization selected')
      await cancelInterviewSession(currentOrgId, interviewId)
      updateInterview(interviewId, { status: 'cancelled' })
    },
    [currentOrgId, updateInterview]
  )

  return {
    interviews,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    clear,
    reload,
    create,
    remove,
    start,
    cancel,
  }
}
