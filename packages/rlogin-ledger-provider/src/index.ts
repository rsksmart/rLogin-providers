// this needs to be implemented better. it is used to jump "process.env.DEBUG" inside ledger deps
window.process = { env: { DEBUG: false }} as any

export { LedgerProvider } from './LedgerProvider'
export { ledgerProviderOptions } from './providerOptions'
