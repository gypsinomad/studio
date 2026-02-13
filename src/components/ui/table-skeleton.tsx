import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TableSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead><Skeleton className="h-5 w-[150px]" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-[150px]" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-[120px]" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-[100px]" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-[100px]" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-[100px]" /></TableHead>
                        <TableHead className="w-[100px] text-right"><Skeleton className="h-5 w-10 ml-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i} className="hover:bg-transparent">
                            <TableCell><Skeleton className="h-5 w-full max-w-[150px]" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-full max-w-[150px]" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-full max-w-[120px]" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-[90px]" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
