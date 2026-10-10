import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { EMPLOYEES } from '../services/employeeService'
import { SessionContext } from './session'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [employeeId, setEmployeeId] = useState(EMPLOYEES[0].id)

  const value = useMemo(
    () => ({
      employee: EMPLOYEES.find((e) => e.id === employeeId) ?? EMPLOYEES[0],
      setEmployeeId,
    }),
    [employeeId],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
