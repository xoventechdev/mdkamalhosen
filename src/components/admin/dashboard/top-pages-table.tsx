import Link from "next/link";
import { Map } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { compactCount } from "@/lib/utils";
import type { DashboardTopPage } from "@/server/dashboard";

export interface TopPagesTableProps {
  pages: DashboardTopPage[];
}

export function TopPagesTable({ pages }: TopPagesTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Top pages</CardTitle>
          <CardDescription>Non-blog pages by view count.</CardDescription>
        </div>
        <Link
          href="/admin/analytics"
          className="text-xs font-medium text-accent hover:underline"
        >
          Analytics →
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Path</TableHead>
              <TableHead className="w-24 text-right">Views</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.length === 0 ? (
              <TableEmpty colSpan={3}>
                <Map className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p>No page views recorded yet.</p>
              </TableEmpty>
            ) : (
              pages.map((page, idx) => (
                <TableRow key={page.path}>
                  <TableCell className="text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{page.path}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {compactCount(page.views)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
