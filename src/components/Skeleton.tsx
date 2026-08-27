/**
 * Loading placeholders shaped like a real ListingCard so the grid does not
 * jump when the results arrive.
 */
export function SkeletonCard(): JSX.Element {
  return (
    <div className="card-flat overflow-hidden" aria-hidden="true">
      <div className="skeleton aspect-[16/10] w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <div className="skeleton h-4 w-24 rounded-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-3">
          <div className="skeleton h-6 w-20" />
          <div className="skeleton h-4 w-4 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6 }: { count?: number }): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
    >
      {Array.from({ length: count }, (_unused, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  )
}
