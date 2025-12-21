import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

/**
 * Loading skeleton for student cards
 */
export function StudentCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for teacher cards
 */
export function TeacherCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for Halaqa header
 */
export function HalaqaHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Loading skeleton for table rows
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <TableRow>
      {Array.from({ length: columns }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

/**
 * Loading skeleton for stat cards
 */
export function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for page header
 */
export function PageHeaderSkeleton() {
  return (
    <div className="flex justify-between items-center">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-10 w-40" />
    </div>
  );
}

/**
 * Loading skeleton for search bar
 */
export function SearchBarSkeleton() {
  return <Skeleton className="h-10 w-full" />;
}

/**
 * Full page loading skeleton for Halaqat page
 */
export function HalaqatPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <SearchBarSkeleton />
      {[1, 2, 3].map((i) => (
        <HalaqaHeaderSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Full page loading skeleton for Students page
 */
export function StudentsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <SearchBarSkeleton />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <StudentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Full page loading skeleton for Teachers page
 */
export function TeachersPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <TeacherCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
