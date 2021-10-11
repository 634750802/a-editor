import { unified } from 'unified'

const docs = import.meta.globEager('./**/instructions.md')



export const instructionsMd = Object.values(docs).map(m => m.plainText).join('\n\n')
