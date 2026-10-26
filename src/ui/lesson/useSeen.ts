import { useEffect, useRef, useState } from 'react'

// Vero dalla prima volta che l'elemento entra in vista. Senza
// IntersectionObserver (nei test) è vero da subito.
export function useSeen<T extends Element>() {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )
  useEffect(() => {
    const element = ref.current
    if (seen || !element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setSeen(true)
      },
      { threshold: 0.3 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [seen])
  return [ref, seen] as const
}
