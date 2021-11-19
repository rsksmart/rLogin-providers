import { Transaction } from '@rsksmart/rlogin-eip1193-types'
import { createTransaction } from '../src/index'
import BN from 'bn.js'

describe('createTransaction', () => {
  const provider = {
    getTransactionCount: () => Promise.resolve(new BN(5)),
    gasPrice: () => Promise.resolve(new BN(10000)),
    estimateGas: () => Promise.resolve(35000)
  }

  const tx: Transaction = {
    to: '0x123456789',
    from: '0x987654321',
    value: '10000'
  }

  test('standard transaction', async () => {
    const result = await createTransaction(provider, tx.from, tx)
    expect(result).toMatchObject({
      ...tx,
      data: '0x0',
      value: '0x2710',
      gasLimit: 35000,
      gasPrice: 10100,
      nonce: 5
    })
  })

  test('can pass gas property' , async () => {
    const result = await createTransaction(
      provider,
      tx.from,
      {
        ...tx,
        gas: 12000
      }
    )
    expect(result).toMatchObject({
      ...tx,
      gas: 12000,
      data: '0x0',
      value: '0x2710',
      gasLimit: 35000,
      gasPrice: 10100,
      nonce: 5
    })
  })
})
