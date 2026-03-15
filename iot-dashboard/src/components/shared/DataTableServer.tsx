// src/components/shared/DataTableServer.tsx
// Generic server-side paginated data table using shadcn <Table>; callers supply columns, rows, pagination state, and optional per-page control.

import type { ReactNode } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UI_STRINGS } from "@/constants";
import { cn } from "@/lib/utils";

export interface DataTableColumn<TData> {
    id: string;
    header: ReactNode;
    cell: (row: TData) => ReactNode;
    className?: string;
}

export interface DataTableMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface DataTableServerProps<TData> {
    columns: DataTableColumn<TData>[];
    data: TData[];
    isLoading: boolean;
    emptyMessage: string;
    meta: DataTableMeta | null;
    page: number;
    onPageChange: (page: number) => void;
    /** Current page size (rows per page). */
    perPage?: number;
    /** Called when user changes rows per page; caller should reset to page 1. */
    onPerPageChange?: (perPage: number) => void;
    /** Options for the per-page selector, e.g. [10, 25, 50, 100]. Shown only when onPerPageChange is provided. */
    perPageOptions?: readonly number[];
}

const DEFAULT_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

export function DataTableServer<TData>({
    columns,
    data,
    isLoading,
    emptyMessage,
    meta,
    page,
    onPageChange,
    perPage,
    onPerPageChange,
    perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
}: DataTableServerProps<TData>) {
    const total = meta?.total ?? 0;
    const lastPage = meta?.last_page ?? 1;
    const currentPage = meta?.current_page ?? page;
    const showPerPage = onPerPageChange != null && perPage != null;

    const canPrev = currentPage > 1;
    const canNext = currentPage < lastPage;

    return (
        <div className="flex flex-col gap-3">
            <div className="rounded-md border border-border bg-card dark:border-border dark:bg-card">
                {isLoading ? (
                    <div className="flex items-center justify-center p-8 text-muted-foreground dark:text-muted-foreground">
                        {UI_STRINGS.LOADING}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-muted/50 dark:border-border dark:hover:bg-muted/50">
                                {columns.map((column) => (
                                    <TableHead
                                        key={column.id}
                                        className={cn(
                                            "text-foreground dark:text-foreground",
                                            column.className,
                                        )}
                                    >
                                        {column.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow className="border-border dark:border-border">
                                    <TableCell
                                        colSpan={columns.length}
                                        className="text-center text-muted-foreground dark:text-muted-foreground"
                                    >
                                        {emptyMessage}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row, rowIndex) => (
                                    <TableRow
                                        key={rowIndex}
                                        className="border-border hover:bg-muted/50 dark:border-border dark:hover:bg-muted/50"
                                    >
                                        {columns.map((column) => (
                                            <TableCell key={column.id}>
                                                {column.cell(row)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            {meta != null && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                        {showPerPage && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                                    {UI_STRINGS.ROWS_PER_PAGE}
                                </span>
                                <Select
                                    value={String(perPage)}
                                    onValueChange={(v) => onPerPageChange(Number(v))}
                                >
                                    <SelectTrigger className="h-8 w-[70px] bg-background dark:bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {perPageOptions.map((n) => (
                                            <SelectItem key={n} value={String(n)}>
                                                {n}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {total > (meta?.per_page ?? 0) && (
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                Page {currentPage} of {lastPage} · {total}{" "}
                                {total === 1 ? "row" : "rows"}
                            </p>
                        )}
                    </div>
                    {total > (meta?.per_page ?? 0) && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!canPrev}
                                onClick={() => canPrev && onPageChange(currentPage - 1)}
                            >
                                {UI_STRINGS.PREVIOUS}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!canNext}
                                onClick={() => canNext && onPageChange(currentPage + 1)}
                            >
                                {UI_STRINGS.NEXT}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

