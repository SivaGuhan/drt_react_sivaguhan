import { 
  flexRender, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getSortedRowModel, 
  Row, 
  useReactTable 
} from "@tanstack/react-table";
import type { 
  ColumnDef, 
  ColumnFilter, 
  FilterFn, 
  RowSelectionState, 
  Table 
} from '@tanstack/react-table';
import { useVirtualizer, VirtualItem, Virtualizer } from "@tanstack/react-virtual";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { fetchSatellites } from "./apiUtils";
import { useQuery } from "@tanstack/react-query";
import FilterPopover from "../filter-popover";
import { extractValues } from "./utils";
import TableSkeleton from "./TableSkeleton";
import { Button, Checkbox } from "@mui/material";
import { useNavigate } from "react-router-dom";

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
    const [rowSelection, setRowSelection] = useState<RowSelectionState>(() => {
        const stored = localStorage.getItem('assetItems');
        if (!stored) return {};
        try {
            const rows: SatelliteData[] = JSON.parse(stored);
            return rows.reduce((acc: RowSelectionState, row: SatelliteData) => {
                acc[row.noradCatId] = true;
                return acc;
            }, {});
        } catch (error) {
            console.error("Failed to parse stored selection", error);
            return {};
        }
    });

    const selectedCount = Object.keys(rowSelection).length;

    const navigate = useNavigate();

    const { data: satelliteData, isLoading, isError, refetch } = useQuery({
        queryKey: ['satellites'],
        queryFn: fetchSatellites,
        staleTime: 1000 * 60 * 5,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
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
                            color: "#4db6ac",
                        },
                        "& .MuiSvgIcon-root": {
                            backgroundColor: "#121212",
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

    const globalFilterFn: FilterFn<SatelliteData> = (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      return String(value).toLowerCase().includes(filterValue.toLowerCase());
    };

    const table = useReactTable({
        data: satelliteData,
        columns,
        state: {
            globalFilter,
            columnFilters,
            rowSelection,
        },
        globalFilterFn,
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

    useEffect(() => {
    if (!satelliteData) return;

    const rows = Object.keys(rowSelection)
        .map(id => table.getRowModel().rowsById[id]?.original)
        .filter(Boolean) as SatelliteData[];

    localStorage.setItem('assetItems', JSON.stringify(rows));
    }, [rowSelection, satelliteData, table]);

    const objectTypeCounts = useMemo(
        () => {
            if(!satelliteData) return null;
            return getFacetCounts(table.getCoreRowModel().rows, 'objectType')
        },
        [satelliteData]
    );

    const handleProceed = () => {
        navigate('/checkout');
    }

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
                disabled={isLoading}
            />
            <FilterPopover
                appliedFilters={appliedFilters}
                onApplyFilters={(newFilters) => setAppliedFilters(newFilters)}
                count={{ objectType: objectTypeCounts }}
                disabled={isLoading}
            />
        </div>
      <div
        className="container"
        ref={tableContainerRef}
        style={{ height: 'clamp(300px, 68vh, 700px)' }}
      >
        {isLoading ? (
            <TableSkeleton columnsCount={columns.length} />
        ) : isError ? (
          <div className="table-error-container">
            <p className="table-error-text">Something went wrong!! Please retry!!</p>
            <Button 
              variant="outlined" 
              onClick={() => refetch()} 
              className="retry-button"
            >
              Retry
            </Button>
          </div>
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
      <div className="table-footer-container">
        <Button 
            type="button" 
            variant="contained" 
            className="proceed-button"
            onClick={handleProceed}
            disabled={selectedCount === 0 || isLoading}
        >
                Proceed
        </Button>
      </div>
    </div>
  );
}

export default VirtualizedTable;