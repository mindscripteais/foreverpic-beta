'use client'

import { useEffect, useRef } from 'react'
import Pusher from 'pusher-js'

interface PusherEvent {
  type: string
  payload: Record<string, any>
}

export function usePusher(
  channelName: string | null,
  events: string[],
  onEvent: (type: string, payload: any) => void
) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!channelName) return

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2'

    if (!key) {
      console.warn('Pusher key not configured, real-time updates disabled')
      return
    }

    const pusher = new Pusher(key, {
      cluster,
      forceTLS: true,
    })

    const channel = pusher.subscribe(channelName)

    events.forEach((event) => {
      channel.bind(event, (payload: any) => {
        onEventRef.current(event, payload)
      })
    })

    return () => {
      events.forEach((event) => {
        channel.unbind(event)
      })
      pusher.unsubscribe(channelName)
      pusher.disconnect()
    }
  }, [channelName, events])
}
