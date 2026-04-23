import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import BetaOpsClient from './BetaOpsClient'

export const dynamic = 'force-dynamic'

export default async function BetaOpsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/signin')
  }

  if (!session.user.isAdmin) {
    notFound()
  }

  return <BetaOpsClient />
}
