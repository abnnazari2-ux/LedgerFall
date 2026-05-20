import { useEffect, useRef, useCallback } from 'react'
import supabase from '../lib/supabaseClient'

export function useSupabase() {
  return supabase
}

export function useRealtimeChannel(channelName, handlers, deps = []) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!channelName) return

    let ch = supabase.channel(channelName)

    for (const handler of handlers) {
      ch = ch.on(
        handler.type || 'postgres_changes',
        {
          event: handler.event || '*',
          schema: handler.schema || 'public',
          table: handler.table,
          filter: handler.filter,
        },
        handler.callback
      )
    }

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Supabase] Subscribed to channel: ${channelName}`)
      }
    })

    channelRef.current = ch

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, ...deps])

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  return { unsubscribe }
}

export default useSupabase
