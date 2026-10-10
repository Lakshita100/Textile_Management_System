import { createContext, useContext } from 'react'

export interface InspectionFormContextValue {
  openForm: (machineId?: string) => void
  closeForm: () => void
}

export const InspectionFormContext = createContext<InspectionFormContextValue | null>(null)

export function useInspectionForm(): InspectionFormContextValue {
  const ctx = useContext(InspectionFormContext)
  if (!ctx) throw new Error('useInspectionForm must be used within InspectionFormProvider')
  return ctx
}
