import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'

/**
 * Petit hook de chargement de données.
 *   const { data, loading, error, reload } = useFetch('/packages', { params })
 */
export default function useFetch(url, options = {}, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(Boolean(url))
  const [error, setError] = useState(null)
  const key = JSON.stringify(options.params || {})

  const load = useCallback(async () => {
    if (!url) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(url, { params: options.params })
      setData(res.data)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, key, ...deps])

  useEffect(() => {
    load()
  }, [load])

  return { data, setData, loading, error, reload: load }
}
