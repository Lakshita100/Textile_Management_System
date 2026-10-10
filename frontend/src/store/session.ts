import { createContext, useContext } from 'react'
import type { Employee } from '../services/employeeService'

export interface SessionContextValue {
  employee: Employee
  setEmployeeId: (id: string) => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
