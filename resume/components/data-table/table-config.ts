import {
    columnFilteringFeature,
    createFilteredRowModel,
    createPaginatedRowModel,
    createSortedRowModel,
    globalFilteringFeature,
    rowPaginationFeature,
    rowSortingFeature,
    tableFeatures,
} from "@tanstack/react-table";

// ============================================================
// RMS DATA TABLE FEATURES
// ============================================================
//
// TanStack Table v9 uses an explicit feature system.
//
// We register only the features that our RMS tables currently
// need:
//
// - Global search
// - Column filtering
// - Sorting
// - Pagination
//
// The core row model is automatically included by TanStack.
// ============================================================

export const rmsTableFeatures = tableFeatures({
    // --------------------------------------------------------
    // FILTERING
    // --------------------------------------------------------

    columnFilteringFeature,

    globalFilteringFeature,

    filteredRowModel: createFilteredRowModel(),

    // --------------------------------------------------------
    // SORTING
    // --------------------------------------------------------

    rowSortingFeature,

    sortedRowModel: createSortedRowModel(),

    // --------------------------------------------------------
    // PAGINATION
    // --------------------------------------------------------

    rowPaginationFeature,

    paginatedRowModel: createPaginatedRowModel(),
});