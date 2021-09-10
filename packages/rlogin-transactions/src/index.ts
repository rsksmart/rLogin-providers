import { Transaction } from '@rsksmart/rlogin-eip1193-types'

export type CompleteTx = {
  from: string
  to: string
  nonce: number
  data: string
  value: string | number
  gasLimit: number
  gasPrice: number
}

/**
 * Creates a transaction from transaction data
 * @param provider http provider
 * @param selectedAddress address of the to account
 * @param txData { to: string, from: string, value: number, data: hex }
 * @returns Transaction
 */
export const createTransaction = async (provider: any, from: string, tx: Transaction): Promise<CompleteTx> => {
  const finalTx: Partial<CompleteTx> = {
    from: from.toLowerCase(),
    to: tx.to.toLowerCase(),
    nonce: tx.nonce || await provider.getTransactionCount(from).then(r => r.toNumber()),
    data: tx.data || '0x0',
    value: tx.value ? (typeof tx.value === 'string' ? `0x${parseInt(tx.value).toString(16)}` : tx.value) : '0x0',
    gasPrice: tx.gasPrice || await provider.gasPrice().then(r => Math.floor(r.toNumber() * 1.01))
  }

  finalTx.gasLimit = tx.gasLimit || await provider.estimateGas(finalTx)

  return finalTx as CompleteTx
}
