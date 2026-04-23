import Pusher from 'pusher'

export const pusher =
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.PUSHER_CLUSTER
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER,
        useTLS: true,
      })
    : null

export function triggerPhotoAdded(eventId: string, photoId: string) {
  if (!pusher) return
  pusher.trigger(`event-${eventId}`, 'photo-added', { photoId, eventId })
}

export function triggerReactionAdded(eventId: string, photoId: string, reactionType: string) {
  if (!pusher) return
  pusher.trigger(`event-${eventId}`, 'reaction-added', { photoId, reactionType })
}

export function triggerReactionRemoved(eventId: string, photoId: string, reactionType: string) {
  if (!pusher) return
  pusher.trigger(`event-${eventId}`, 'reaction-removed', { photoId, reactionType })
}

export function triggerVoteCast(eventId: string, photoId: string) {
  if (!pusher) return
  pusher.trigger(`event-${eventId}`, 'vote-cast', { photoId })
}

export function triggerVoteRemoved(eventId: string, photoId: string) {
  if (!pusher) return
  pusher.trigger(`event-${eventId}`, 'vote-removed', { photoId })
}
