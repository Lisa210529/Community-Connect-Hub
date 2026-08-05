export default function Table({ columns, data, emptyMessage = 'No records found.' }) {
  if (!data.length) {
    return <p className="text-text-secondary text-sm py-8 text-center">{emptyMessage}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-text-secondary border-b border-border text-left">
            {columns.map((col) => (
              <th key={col.key} className="pb-3 pr-4 font-medium">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-b border-border/50 hover:bg-background/50">
              {columns.map((col) => (
                <td key={col.key} className="py-3 pr-4">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
