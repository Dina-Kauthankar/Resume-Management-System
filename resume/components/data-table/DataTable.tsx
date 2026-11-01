
"use client";

import { useState } from "react";

import {
    flexRender,
    useTable,
    type ColumnDef,
    type PaginationState,
    type RowData,
    type SortingState,
} from "@tanstack/react-table";

import { rmsTableFeatures } from "./table-config";

// ============================================================
// TYPES
// ============================================================

interface DataTableProps<TData extends RowData> {
    columns: ColumnDef<
        typeof rmsTableFeatures,
        TData
    >[];

    data: TData[];

    globalFilterFn?: (
        row: TData,
        searchValue: string
    ) => boolean;

    emptyMessage?: string;

    initialPageSize?: number;

    className?: string;
}

// ============================================================
// COMPONENT
// ============================================================

export default function DataTable<
    TData extends RowData
>({
    columns,
    data,
    globalFilterFn,
    emptyMessage = "No records found.",
    initialPageSize = 10,
    className = "",
}: DataTableProps<TData>) {
    // ========================================================
    // STATE
    // ========================================================

    const [sorting, setSorting] =
        useState<SortingState>([]);

    const [globalFilter, setGlobalFilter] =
        useState("");

    const [pagination, setPagination] =
        useState<PaginationState>({
            pageIndex: 0,
            pageSize: initialPageSize,
        });

    // ========================================================
    // TABLE
    // ========================================================

    const table = useTable({
        key: "rms-data-table",

        features: rmsTableFeatures,

        columns,

        data,

        state: {
            sorting,
            pagination,
            globalFilter,
        },

        onSortingChange: setSorting,

        onPaginationChange: setPagination,

        onGlobalFilterChange: setGlobalFilter,

        autoResetPageIndex: false,

        globalFilterFn: globalFilterFn
            ? (row, _columnId, filterValue) => {
                  return globalFilterFn(
                      row.original,
                      String(filterValue)
                  );
              }
            : undefined,
    });

    // ========================================================
    // SEARCH
    // ========================================================

    const handleSearchChange = (
        value: string
    ) => {
        setGlobalFilter(value);

        table.setGlobalFilter(value);

        table.setPageIndex(0);
    };

    // ========================================================
    // TABLE STATE
    // ========================================================

    const pageIndex =
        table.state.pagination.pageIndex;

    const pageSize =
        table.state.pagination.pageSize;

    const currentPage =
        pageIndex + 1;

    const totalRows =
        table.getFilteredRowModel().rows.length;

    const pageCount =
        table.getPageCount();

    const startRow =
        totalRows === 0
            ? 0
            : pageIndex * pageSize + 1;

    const endRow = Math.min(
        (pageIndex + 1) * pageSize,
        totalRows
    );

    // ========================================================
    // PAGE NUMBERS
    // ========================================================

    const getPageNumbers = (): (
        | number
        | "..."
    )[] => {
        const pages: (
            | number
            | "..."
        )[] = [];

        if (pageCount <= 7) {
            for (
                let page = 1;
                page <= pageCount;
                page++
            ) {
                pages.push(page);
            }

            return pages;
        }

        pages.push(1);

        if (currentPage > 4) {
            pages.push("...");
        }

        const start = Math.max(
            2,
            currentPage - 1
        );

        const end = Math.min(
            pageCount - 1,
            currentPage + 1
        );

        for (
            let page = start;
            page <= end;
            page++
        ) {
            pages.push(page);
        }

        if (currentPage < pageCount - 3) {
            pages.push("...");
        }

        pages.push(pageCount);

        return pages;
    };

    // ========================================================
    // SORT ICON
    // ========================================================

    const SortIcon = ({
        direction,
    }: {
        direction: false | "asc" | "desc";
    }) => {
        if (direction === "asc") {
            return (
                <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="m18 15-6-6-6 6" />
                </svg>
            );
        }

        if (direction === "desc") {
            return (
                <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            );
        }

        return (
            <svg
                className="h-3.5 w-3.5 opacity-30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path d="m8 9 4-4 4 4" />
                <path d="m16 15-4 4-4-4" />
            </svg>
        );
    };

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div
            className={`w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
        >
            {/* ==================================================
                TOOLBAR
            ================================================== */}

            <div className="border-b border-gray-100 bg-linear-to-r from-white via-white to-indigo-50/40 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* SEARCH */}

                    <div className="relative w-full sm:max-w-md">
                        <label
                            htmlFor="data-table-search"
                            className="sr-only"
                        >
                            Search
                        </label>

                        <svg
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle
                                cx="11"
                                cy="11"
                                r="7"
                            />

                            <path d="m20 20-4-4" />
                        </svg>

                        <input
                            id="data-table-search"
                            type="text"
                            value={globalFilter}
                            onChange={(event) =>
                                handleSearchChange(
                                    event.target.value
                                )
                            }
                            placeholder="Search..."
                            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-10 pr-10 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                        />

                        {globalFilter && (
                            <button
                                type="button"
                                onClick={() =>
                                    handleSearchChange("")
                                }
                                className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {/* RECORD COUNT */}

                    <div className="text-xs font-medium text-gray-500">
                        {totalRows}{" "}
                        {totalRows === 1
                            ? "record"
                            : "records"}
                    </div>
                </div>
            </div>

            {/* ==================================================
                TABLE
            ================================================== */}

            <div className="overflow-x-auto">
                <table className="w-full min-w-250">
                    <thead>
                        {table
                            .getHeaderGroups()
                            .map(
                                (
                                    headerGroup
                                ) => (
                                    <tr
                                        key={
                                            headerGroup.id
                                        }
                                        className="border-b border-gray-100 bg-gray-50/80"
                                    >
                                        {headerGroup.headers.map(
                                            (
                                                header
                                            ) => {
                                                const canSort =
                                                    header.column.getCanSort();

                                                const sortDirection =
                                                    header.column.getIsSorted();

                                                return (
                                                    <th
                                                        key={
                                                            header.id
                                                        }
                                                        className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500"
                                                    >
                                                        {header.isPlaceholder ? null : canSort ? (
                                                            <button
                                                                type="button"
                                                                onClick={header.column.getToggleSortingHandler()}
                                                                className="group inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-indigo-600"
                                                            >
                                                                {flexRender(
                                                                    header
                                                                        .column
                                                                        .columnDef
                                                                        .header,
                                                                    header.getContext()
                                                                )}

                                                                <SortIcon
                                                                    direction={
                                                                        sortDirection
                                                                    }
                                                                />
                                                            </button>
                                                        ) : (
                                                            flexRender(
                                                                header
                                                                    .column
                                                                    .columnDef
                                                                    .header,
                                                                header.getContext()
                                                            )
                                                        )}
                                                    </th>
                                                );
                                            }
                                        )}
                                    </tr>
                                )
                            )}
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {table
                            .getRowModel()
                            .rows.length > 0 ? (
                            table
                                .getRowModel()
                                .rows.map(
                                    (
                                        row
                                    ) => (
                                        <tr
                                            key={
                                                row.id
                                            }
                                            className="group transition-colors duration-200 hover:bg-indigo-50/30"
                                        >
                                            {row
                                                .getAllCells()
                                                .map(
                                                    (
                                                        cell
                                                    ) => (
                                                        <td
                                                            key={
                                                                cell.id
                                                            }
                                                            className="px-5 py-4"
                                                        >
                                                            {flexRender(
                                                                cell
                                                                    .column
                                                                    .columnDef
                                                                    .cell,
                                                                cell.getContext()
                                                            )}
                                                        </td>
                                                    )
                                                )}
                                        </tr>
                                    )
                                )
                        ) : (
                            <tr>
                                <td
                                    colSpan={
                                        columns.length
                                    }
                                    className="px-6 py-16 text-center"
                                >
                                    <div className="mx-auto flex max-w-md flex-col items-center">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                                            <svg
                                                className="h-6 w-6"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                            >
                                                <circle
                                                    cx="11"
                                                    cy="11"
                                                    r="7"
                                                />

                                                <path d="m20 20-4-4" />
                                            </svg>
                                        </div>

                                        <p className="mt-4 text-sm font-semibold text-gray-900">
                                            {
                                                emptyMessage
                                            }
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                            Try changing your
                                            search or filters.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ==================================================
                PAGINATION
            ================================================== */}

            <div className="flex flex-col gap-4 border-t border-gray-100 bg-gray-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-xs font-medium text-gray-500">
                    Showing{" "}
                    <span className="font-bold text-gray-700">
                        {startRow}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-gray-700">
                        {endRow}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-gray-700">
                        {totalRows}
                    </span>{" "}
                    records
                </p>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                        <span className="hidden text-xs font-medium text-gray-500 sm:inline">
                            Rows
                        </span>

                        <select
                            value={pageSize}
                            onChange={(event) => {
                                table.setPageSize(
                                    Number(
                                        event
                                            .target
                                            .value
                                    )
                                );

                                table.setPageIndex(
                                    0
                                );
                            }}
                            className="h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-700 outline-none transition hover:border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            aria-label="Rows per page"
                        >
                            {[5, 10, 20, 30, 50].map(
                                (
                                    size
                                ) => (
                                    <option
                                        key={
                                            size
                                        }
                                        value={
                                            size
                                        }
                                    >
                                        {size}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            table.previousPage()
                        }
                        disabled={
                            !table.getCanPreviousPage()
                        }
                        className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="m15 18-6-6 6-6" />
                        </svg>

                        <span className="hidden sm:inline">
                            Previous
                        </span>
                    </button>

                    <div className="flex items-center gap-1">
                        {getPageNumbers().map(
                            (
                                page,
                                index
                            ) =>
                                page ===
                                "..." ? (
                                    <span
                                        key={`ellipsis-${index}`}
                                        className="flex h-9 w-7 items-center justify-center text-xs font-semibold text-gray-400"
                                    >
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={
                                            page
                                        }
                                        type="button"
                                        onClick={() =>
                                            table.setPageIndex(
                                                page -
                                                    1
                                            )
                                        }
                                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                                            currentPage ===
                                            page
                                                ? "bg-indigo-600 text-white shadow-sm"
                                                : "border border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                        }`}
                                    >
                                        {
                                            page
                                        }
                                    </button>
                                )
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            table.nextPage()
                        }
                        disabled={
                            !table.getCanNextPage()
                        }
                        className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <span className="hidden sm:inline">
                            Next
                        </span>

                        <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="m9 6 6 6-6 6" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
