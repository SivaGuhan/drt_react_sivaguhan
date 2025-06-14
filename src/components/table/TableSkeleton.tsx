import { FC } from "react";

const TableSkeleton: FC<{ columnsCount: number; rowsCount?: number }> = ({ columnsCount, rowsCount = 15 }) => {
  return (
    <table className="table">
      <thead className="table-header-container">
        <tr className="column d-flex full-width">
          {Array.from({ length: columnsCount - 1 }).map((_, idx) => (
            <th key={idx} style={{ display: 'flex', flex: 1 }}>
              <div
                style={{
                  backgroundColor: '#BDBDBD',
                  borderRadius: '4px',
                  height: '18px',
                  width: '90%',
                  margin: '0 auto',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="table-body-container">
        {Array.from({ length: rowsCount }).map((_, rowIdx) => (
          <tr key={rowIdx} style={{ display: 'flex', height: '33px', width: '100%' }}>
            {Array.from({ length: columnsCount - 1 }).map((_, colIdx) => (
              <td
                key={colIdx}
                style={{
                  flex: 1,
                  backgroundColor: '#BDBDBD',
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
    </table>
  );
};

export default TableSkeleton;