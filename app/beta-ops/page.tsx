import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import BetaOpsClient from './BetaOpsClient'

export const dynamic = 'force-dynamic'

export default async function BetaOpsPage() {
  const session = await auth()

  console.log('[beta-ops] Session:', session?.user?.email, 'isAdmin:', session?.user?.isAdmin)

  if (!session?.user) {
    redirect('/signin')
  }

  if (!session.user.isAdmin) {
    console.log('[beta-ops] Access denied for', session.user.email)
    notFound()
  }

  return <BetaOpsClient />
}
