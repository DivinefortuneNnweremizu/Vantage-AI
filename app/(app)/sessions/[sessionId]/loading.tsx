import { Skeleton } from "@/components/ui/skeleton";

export default function SessionLoading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading your report">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-[74px] w-full rounded-xl" />
      <div className="flex max-w-4xl flex-col gap-4 pt-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-10/12" />
      </div>
    </div>
  );
}
