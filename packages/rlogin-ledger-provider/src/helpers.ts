import AppEth from '@ledgerhq/hw-app-eth'
import { CompleteTx } from '@rsksmart/rlogin-transactions'
import { Transaction } from '@ethereumjs/tx'

/**
 * Sign a transaction using the Ledger
 * @param transactionData
 * @param appEth
 * @param path
 * @param chainId
 * @returns serialized Transaction
 */
export const signTransaction = (
  transactionData: CompleteTx, appEth: AppEth, path: string, chainId: number
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

// converts hex string '0x...' to utf string
export function convertFromHex (hex:string) {
  let str:string = ''
  for (let i = 2; i < hex.length; i += 2) { str += String.fromCharCode(parseInt(hex.substr(i, 2), 16)) }
  return str
}
