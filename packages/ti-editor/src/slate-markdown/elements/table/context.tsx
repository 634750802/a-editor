import { createContext } from 'react'
import { AlignType } from 'mdast'

export interface TableContextProps {
  isHeader: boolean
  align?: AlignType[]
}

export const TableContext = createContext<TableContextProps>({
  isHeader: false,
})
