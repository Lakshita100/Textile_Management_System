import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import InspectionFormModal from '../components/quality/InspectionFormModal'
import { InspectionFormContext } from './inspectionFormContext'

export function InspectionFormProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialMachineId, setInitialMachineId] = useState<string | undefined>()

  const openForm = useCallback((machineId?: string) => {
    setInitialMachineId(machineId)
    setIsOpen(true)
  }, [])
  const closeForm = useCallback(() => {
    setIsOpen(false)
    setInitialMachineId(undefined)
  }, [])
  const value = useMemo(() => ({ openForm, closeForm }), [openForm, closeForm])

  return (
    <InspectionFormContext.Provider value={value}>
      {children}
      {isOpen ? <InspectionFormModal initialMachineId={initialMachineId} /> : null}
    </InspectionFormContext.Provider>
  )
}
