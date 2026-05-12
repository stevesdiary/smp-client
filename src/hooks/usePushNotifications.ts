import { useEffect, useRef } from 'react'
import api from '@/lib/api'

export function usePushNotifications() {
  const subscribed = useRef(false)

  useEffect(() => {
    if (subscribed.current) return
    subscribed.current = true

    ;(async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        const { data } = await api.get('/notifications/vapid-key')
        if (!data.key) return

        let sub = await reg.pushManager.getSubscription()
        if (!sub) {
          const permission = await Notification.requestPermission()
          if (permission !== 'granted') return
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: data.key,
          })
        }

        const json = sub.toJSON()
        await api.post('/notifications/push/subscribe', {
          endpoint: sub.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        })
      } catch {
        // Push not available — silent fail
      }
    })()
  }, [])
}
