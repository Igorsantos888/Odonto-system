import React from 'react'

export const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table ref={ref} className={`w-full text-left text-sm text-slate-700 ${className}`} {...props}>
        {children}
      </table>
    </div>
  )
)
Table.displayName = 'Table'

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', children, ...props }, ref) => (
    <thead ref={ref} className={`bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200 ${className}`} {...props}>
      {children}
    </thead>
  )
)
TableHeader.displayName = 'TableHeader'

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', children, ...props }, ref) => (
    <tbody ref={ref} className={`divide-y divide-slate-100 ${className}`} {...props}>
      {children}
    </tbody>
  )
)
TableBody.displayName = 'TableBody'

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className = '', children, ...props }, ref) => (
    <tr
      ref={ref}
      className={`transition-colors hover:bg-slate-50/70 ${className}`}
      {...props}
    >
      {children}
    </tr>
  )
)
TableRow.displayName = 'TableRow'

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className = '', children, ...props }, ref) => (
    <th ref={ref} className={`px-4 py-3.5 tracking-wider ${className}`} {...props}>
      {children}
    </th>
  )
)
TableHead.displayName = 'TableHead'

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className = '', children, ...props }, ref) => (
    <td ref={ref} className={`px-4 py-3.5 align-middle ${className}`} {...props}>
      {children}
    </td>
  )
)
TableCell.displayName = 'TableCell'
