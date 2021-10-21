import { plainText as main } from '../readme.md'

const docs = import.meta.globEager('../components/**/instructions.md')

export const instructionsMd = main + '\n\n' + Object.values(docs).map(m => m.plainText).join('\n\n')
