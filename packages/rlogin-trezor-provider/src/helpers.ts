import BN from 'bn.js'
import { EthereumTransaction } from 'trezor-connect/lib/typescript/networks/ethereum'
/**
 * Creates a transaction from transaction data
 * @param provider http provider
 * @param selectedAddress address of the to account
 * @param txData { to: string, from: string, value: number, data: hex }
 * @returns EthereumTransaction
 */
export const createTransaction = async (provider: any, selectedAddress: string, txData: any): Promise<EthereumTransaction> => {
  const txParams = {
    to: txData.to.toLowerCase(),
    value: `0x${(new BN(txData.value || 0)).toString(16)}`,
    data: txData.data || '0x'
  }

  const txCount = await provider.getTransactionCount(selectedAddress.toLowerCase())
  const gasPrice = await provider.gasPrice()
  const gasLimit = await provider.estimateGas(
    {
      from: selectedAddress.toLowerCase(),
      to: txData.to.toLowerCase(),
      value: `0x${(new BN(txData.value || 0)).toString(16)}`,
      data: txData.data || '0x'
    })

  const tx:EthereumTransaction = {
    ...txParams,
    nonce: `0x${(new BN(txCount)).toString(16)}`,
    gasPrice: `0x${Math.floor(gasPrice.toNumber() * 1.01).toString(16)}`,
    gasLimit: `0x${gasLimit.toString(16)}`
  }

  return tx
}
