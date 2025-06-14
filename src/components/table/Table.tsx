import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, Row, useReactTable } from "@tanstack/react-table";
import type { ColumnDef, ColumnFilter, RowSelectionState, Table } from '@tanstack/react-table';
import { useVirtualizer, VirtualItem, Virtualizer } from "@tanstack/react-virtual";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { fetchSatellites } from "./apiUtils";
import { useQuery } from "@tanstack/react-query";
import FilterPopover from "../filter-popover";
import { extractValues } from "./utils";
import TableSkeleton from "./TableSkeleton";
import { Checkbox } from "@mui/material";

type FilterMap = Record<string, string[]>;

interface SatelliteData {
  noradCatId: string;
  intlDes: string;
  name: string;
  launchDate: string;
  decayDate: string;
  objectType: string;
  launchSiteCode: string;
  countryCode: string;
  orbitCode: string;
}

interface TableBodyProps {
  table: Table<SatelliteData>;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
}

function TableBody({ table, tableContainerRef }: TableBodyProps) {
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => 60,
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? element => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  return (
    <tbody
        className="table-body-container"
        style={{
            display: 'grid',
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
        }}
    >
      {rowVirtualizer.getVirtualItems().map(virtualRow => {
        const row = rows[virtualRow.index];
        return (
          <TableBodyRow
            key={row.id}
            row={row}
            virtualRow={virtualRow}
            rowVirtualizer={rowVirtualizer}
          />
        );
      })}
    </tbody>
  );
}

interface TableBodyRowProps {
  row: Row<SatelliteData>;
  virtualRow: VirtualItem;
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
}

function TableBodyRow({ row, virtualRow, rowVirtualizer }: TableBodyRowProps) {
  return (
    <tr
      data-index={virtualRow.index}
      ref={node => rowVirtualizer.measureElement(node)}
      key={row.id}
      className="table-row-wrapper"
      style={{
        display: 'flex',
        position: 'absolute',
        transform: `translateY(${virtualRow.start}px)`,
        width: '100%',
        height: `${virtualRow.size}px`,
      }}
    >
      {row.getVisibleCells().map(cell => (
        <td className="row" key={cell.id} style={{ width: cell.column.getSize() }}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
}

const VirtualizedTable: FC = () => {
    const [globalFilter, setGlobalFilter] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [appliedFilters, setAppliedFilters] = useState<FilterMap>({});
    const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const selectedCount = Object.keys(rowSelection).length;
    console.log(rowSelection)

    const { data: satelliteData, isLoading } = useQuery({
        queryKey: ['satellites'],
        queryFn: fetchSatellites,
        staleTime: 1000 * 60 * 5,
    });

    function getFacetCounts<T>(
        rows: Row<T>[],
        accessorKey: keyof T,
        extractor?: (value: any) => string[]
        ): Record<string, number> {
        const counts: Record<string, number> = {};

        for (const row of rows) {
            const rawValue = row.getValue(accessorKey as string);
            const values = extractor ? extractor(rawValue) : [rawValue];

            for (const val of values) {
            if (val !== undefined && val !== null) {
                const key = String(val);
                counts[key] = (counts[key] || 0) + 1;
            }
            }
        }

        return counts;
    }


    useEffect(() => {
        const activeFilters: ColumnFilter[] = Object.entries(appliedFilters).map(([id, value]) => ({
            id,
            value,
        }));
        setColumnFilters(activeFilters);
    }, [appliedFilters]);

    const multiSelectFilter = (row: Row<SatelliteData>, columnId: string, filterValue: string[]) => {
        if (!filterValue || filterValue.length === 0) return true;
        const cellValue = row.getValue<string>(columnId);
        if(columnId === 'objectType') {
            return filterValue.includes(cellValue);
        } else {
            const values = extractValues(cellValue);
            return values.some((value) => filterValue.includes(value));
        }
    };

    const columns = useMemo<ColumnDef<SatelliteData>[]>(
    () => [
        {
            id: 'select',
            header: () => null,
            cell: ({ row }) => (
                <Checkbox
                    sx={{
                        color: "white",
                        "&.Mui-checked": {
                        color: "white",
                        },
                        "& .MuiSvgIcon-root": {
                        backgroundColor: "black",
                        borderRadius: "4px",
                        },
                    }}
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                    disabled={
                        !row.getIsSelected() && Object.keys(table.getState().rowSelection).length >= 10
                    }
                />
            ),
            size: 70,
        },
        { 
            accessorKey: 'noradCatId', 
            header: 'Norad Cat ID', 
            enableGlobalFilter: true,
            cell: ({ getValue }) => getValue() || '-',
        },
        { 
            accessorKey: 'name', 
            header: 'Name', 
            enableGlobalFilter: true,
            cell: ({ getValue }) => getValue() || '-',
        },
        { 
            accessorKey: 'launchDate', 
            header: 'Launch Date',
            cell: ({ getValue }) => getValue() || '-',
        },
        { 
            accessorKey: 'objectType', 
            header: 'Object Type',
            filterFn: multiSelectFilter,
            cell: ({ getValue }) => getValue() || '-',
        },
        { 
            accessorKey: 'countryCode', 
            header: 'Country Code',
            cell: ({ getValue }) => getValue() || '-',
        },
        { 
            accessorKey: 'orbitCode', 
            header: 'Orbit Code',
            filterFn: multiSelectFilter,
            cell: ({ getValue }) => getValue() || '-',
        },
    ],
    [selectedCount]
  );

    const tableContainerRef = useRef<HTMLDivElement>(null);

    const table = useReactTable({
        data: satelliteData,
        columns,
        state: {
            globalFilter,
            columnFilters,
            rowSelection,
        },
        getRowId: row => row.noradCatId,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        onRowSelectionChange: setRowSelection,
        enableRowSelection: true,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        debugTable: true,
    });

    const objectTypeCounts = useMemo(
        () => {
            if(!satelliteData) return null;
            return getFacetCounts(table.getFilteredRowModel().rows, 'objectType')
        },
        [globalFilter, columnFilters, satelliteData]
    );

    const orbitCodeCounts = useMemo(
        () => {
            if(!satelliteData) return null;
            return getFacetCounts(table.getFilteredRowModel().rows, 'orbitCode', extractValues)
        },
        [globalFilter, columnFilters, satelliteData]
    );

    return (
    <div className="table-wrapper">
        <div className="filter-container">
            <input 
                name="search-bar"
                className="search-bar"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        setGlobalFilter(inputValue);
                    }
                }}
                placeholder="Search for Object Type / Orbit Code"
            />
            <FilterPopover
                appliedFilters={appliedFilters}
                onApplyFilters={(newFilters) => setAppliedFilters(newFilters)}
                count={{ objectType: objectTypeCounts, orbitCode: orbitCodeCounts }}
            />
        </div>
      <div
        className="container"
        ref={tableContainerRef}
        style={{ height: 'clamp(300px, 70vh, 700px)' }}
      >
        {isLoading ? (
            <TableSkeleton columnsCount={columns.length} />
        ) : (
        <table className="table">
          <thead 
            className="table-header-container" 
          >
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="column d-flex full-width">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{ display: 'flex', width: header.getSize() }}
                  >
                    <div
                      {...{
                        className: header.column.getCanSort()
                          ? 'cursor-pointer select-none'
                          : '',
                        onClick: header.column.getToggleSortingHandler(),
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <TableBody table={table} tableContainerRef={tableContainerRef} />
        </table>
        )}
      </div>
    </div>
  );
}

export default VirtualizedTable;