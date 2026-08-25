import { useEffect, useState } from 'react'

/**
 * Trail a fast-changing value by `delay`, so typing drives one request rather
 * than one per keystroke. The first value is returned immediately; only later
 * changes wait.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    if (value === debounced) return
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay, debounced])

  return debounced
}
