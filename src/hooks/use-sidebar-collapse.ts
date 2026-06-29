import { useState, useEffect } from 'react'

const STORAGE_KEY = 'sidebar-collapsed'

export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed))
    } catch {
      // ignore
    }
  }, [collapsed])

  const toggle = () => setCollapsed((prev) => !prev)

  return { collapsed, toggle }
}
