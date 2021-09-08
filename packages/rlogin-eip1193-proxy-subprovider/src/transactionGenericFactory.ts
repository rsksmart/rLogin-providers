import BN from 'bn.js'

/**
 * Creates a transaction from transaction data
 * @param provider http provider
 * @param selectedAddress address of the to account
 * @param txData { to: string, from: string, value: number, data: hex }
 * @returns Transaction
 */
 export const createTransaction = (provider: any, selectedAddress: string, txData: any) => {
  const txParams = {
    ...txData,
    to: txData.to.toLowerCase(),
    from: selectedAddress.toLowerCase(),
    value: parseInt(txData.value) || '0x0',
    data: txData.data || '0x0'
  }

  return Promise.all([
    provider.getTransactionCount(selectedAddress),
    provider.gasPrice(),
    provider.estimateGas(txParams)
  ])
    .then((response: BN[]) => ({
      ...txParams,
      nonce: response[0].toNumber(),
      gasPrice: Math.floor(response[1].toNumber() * 1.01),
      gasLimit: response[2]
    }))
}
