import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-gradient-to-r from-warm-200 via-warm-100 to-warm-200 bg-[length:200%_100%]',
        className
      )}
    />
  )
}

export function EventCardSkeleton() {
  return (
    <div className="bg-cream-100 rounded-2xl border border-warm-300/60 overflow-hidden">
      <Skeleton className="aspect-video rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

export function PhotoSkeleton() {
  return <Skeleton className="w-full rounded-xl" />
}