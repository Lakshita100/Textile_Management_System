import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import InspectionFormModal from '../components/quality/InspectionFormModal'
import { InspectionFormContext } from './inspectionFormContext'

export function InspectionFormProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openForm = useCallback(() => setIsOpen(true), [])
  const closeForm = useCallback(() => setIsOpen(false), [])
  const value = useMemo(() => ({ openForm, closeForm }), [openForm, closeForm])

  return (
    <InspectionFormContext.Provider value={value}>
      {children}
      {isOpen ? <InspectionFormModal /> : null}
    </InspectionFormContext.Provider>
  )
}
