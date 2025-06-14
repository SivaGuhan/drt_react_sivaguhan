import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, Row, useReactTable } from "@tanstack/react-table";
import type { ColumnDef, Table } from '@tanstack/react-table';
import { useVirtualizer, VirtualItem, Virtualizer } from "@tanstack/react-virtual";
import { FC, useMemo, useRef, useState } from "react";
import { fetchSatellites } from "./apiUtils";
import { useQuery } from "@tanstack/react-query";

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
    estimateSize: () => 33,
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
      }}
    >
      {row.getVisibleCells().map(cell => (
        <td className="row" key={cell.id} style={{ display: 'flex', width: cell.column.getSize() }}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
}

const Table: FC = () => {
    const [globalFilter, setGlobalFilter] = useState("");
    const [inputValue, setInputValue] = useState("");

    const { data: satelliteData, isLoading } = useQuery({
        queryKey: ['satellites'],
        queryFn: fetchSatellites,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const columns = useMemo<ColumnDef<SatelliteData>[]>(
    () => [
        { 
            accessorKey: 'noradCatId', 
            header: 'Norad Cat ID', 
            enableGlobalFilter: true,
            cell: ({ getValue }) => getValue() || '-',
        },
        { 
            accessorKey: 'intlDes', 
            header: 'Intl Des',
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
            accessorKey: 'decayDate', 
            header: 'Decay Date',
            cell: ({ getValue }) => getValue() || '-',
        },
        { 
            accessorKey: 'objectType', 
            header: 'Object Type',
            cell: ({ getValue }) => getValue() || '-',
        },
        { 
            accessorKey: 'launchSiteCode', 
            header: 'Launch Site Code',
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
            cell: ({ getValue }) => getValue() || '-',
        },
    ],
    []
  );

    const tableContainerRef = useRef<HTMLDivElement>(null);

    const table = useReactTable({
        data: satelliteData,
        columns,
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        debugTable: true,
    });

    return (
    <div className="table-wrapper">
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
      <div
        className="container"
        ref={tableContainerRef}
        style={{ height: 'clamp(300px, 80vh, 700px)' }}
      >
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
          {isLoading ? (
            <tbody>
              {Array.from({ length: 15 }).map((_, idx) => (
                <tr key={idx} style={{ display: 'flex', height: '33px', width: '100%' }}>
                  {columns.map((_, colIdx) => (
                    <td
                      key={colIdx}
                      style={{
                        flex: 1,
                        backgroundColor: '#eee',
                        margin: '2px',
                        borderRadius: '4px',
                        height: '80%',
                        animation: 'pulse 1.5s infinite ease-in-out',
                      }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          ) : (
            <TableBody table={table} tableContainerRef={tableContainerRef} />
          )}
        </table>
      </div>
    </div>
  );
}

export default Table;