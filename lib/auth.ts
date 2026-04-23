import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isAdmin: user.isAdmin,
          subscriptionTier: user.subscriptionTier,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.subscriptionTier = (token.tier as string) ?? 'FREE'
        session.user.isAdmin = (token.isAdmin as boolean) ?? false
      }
      return session
    },
    async jwt({ token, user }) {
      try {
        if (user?.email) {
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, subscriptionTier: true, isAdmin: true },
          })

          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image,
                subscriptionTier: 'FREE',
                isAdmin: user.email === 'egix.tuned@gmail.com',
              },
              select: { id: true, subscriptionTier: true, isAdmin: true },
            })
          }

          token.sub = dbUser.id
          token.tier = dbUser.subscriptionTier
          token.isAdmin = dbUser.isAdmin
        }
      } catch (e) {
        console.error('Auth JWT error:', e)
      }
      return token
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
})
