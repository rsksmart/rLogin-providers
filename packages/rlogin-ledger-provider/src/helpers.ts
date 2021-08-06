import BN from 'bn.js'
import AppEth from '@ledgerhq/hw-app-eth'
import { Transaction } from '@ethereumjs/tx'

export interface txPartial {
  to: string,
  from: string,
  value: number,
  data: string,
  nonce?: number,
  gasPrice: number,
  gasLimit: number,
}

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

/**
 * Sign a transaction using the Ledger
 * @param transaction Transaction from the dapp
 * @param appEth
 * @param path
 * @returns serialized Transaction
 */
export const signTransaction = (
  transactionData: txPartial, appEth: AppEth, path: string, chainId: number
) => {
  const txData = {
    ...transactionData,
    chainId,

    // these are needed here so signTransaction works correctly
    v: `0x${chainId.toString(16)}`, // chain id
    r: '0x00',
    s: '0x00'
  }

  const tx = new Transaction(txData)
  const serializedTx = tx.serialize().toString('hex')
  return appEth.signTransaction(path, serializedTx)
    .then((sig: {r: string, v: string, s: string}) => {
      txData.v = '0x' + sig.v
      txData.r = '0x' + sig.r
      txData.s = '0x' + sig.s

      return new Transaction(txData).serialize().toString('hex')
    })
}
