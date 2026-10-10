export interface Employee {
  id: string
  name: string
  role: string
}

/** Demo employees — synthetic records, not live HR data. */
export const EMPLOYEES: Employee[] = [
  { id: 'EMP-001', name: 'Meera P.', role: 'Quality Inspector' },
  { id: 'EMP-002', name: 'Rahul S.', role: 'Quality Inspector' },
  { id: 'EMP-003', name: 'Anita K.', role: 'Quality Supervisor' },
]

export function employeeIdByName(name: string): string {
  return EMPLOYEES.find((e) => e.name === name)?.id ?? 'EMP-000'
}
