import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/lib/trpc'
import { z } from 'zod'
import QRCode from 'qrcode'

export const qrRouter = createTRPCRouter({
  generate: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const url = `${baseUrl}/events/${input.eventId}`

      const svg = await QRCode.toString(url, {
        type: 'svg',
        margin: 2,
        color: {
          dark: '#4F46E5',
          light: '#FFFFFF',
        },
      })

      return { url, svg }
    }),

  generatePNG: publicProcedure
    .input(z.object({ eventId: z.string(), size: z.number().default(400) }))
    .mutation(async ({ input }) => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const url = `${baseUrl}/events/${input.eventId}`

      const png = await QRCode.toDataURL(url, {
        width: input.size,
        margin: 2,
        color: {
          dark: '#4F46E5',
          light: '#FFFFFF',
        },
      })

      return { url, png }
    }),
})