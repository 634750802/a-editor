import { useState } from 'react'

export default function useForceUpdate (): () => void {
  const [n, setN] = useState(0)

  return () => {
    setN(n => n + 1)
  }
}
