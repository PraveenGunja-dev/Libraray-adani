export default function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-corporate-line text-left text-sm">
        <thead className="bg-slate-50/80">
          <tr>
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-5 py-3 font-bold text-slate-500">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-corporate-line bg-white">
          {rows.map((row, index) => (
            <tr key={index} className="transition hover:bg-navy-50/40">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="whitespace-nowrap px-5 py-4 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
