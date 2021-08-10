import TransportWebUSB from '@ledgerhq/hw-transport-webusb'
import AppEth from '@ledgerhq/hw-app-eth'
import Transport from '@ledgerhq/hw-transport'
import { createTransaction, signTransaction, txPartial } from './helpers'
import { RLoginEIP1993Provider } from '@rsksmart/rlogin-eip1193-proxy-subprovider'

export class LedgerProvider extends RLoginEIP1993Provider {
  #appEth: AppEth | null
  #debug: boolean

  selectedAddress: string | null
  isLedger = true

  constructor (opts: { chainId: number | string; rpcUrl: string, dPath?:string, debug?: boolean }) {
    super(opts.rpcUrl, opts.chainId, opts.dPath)
    this.#debug = opts.debug || false
    // to be set during connect
    this.#appEth = null
    this.selectedAddress = null
  }

  /**
   * Simple logger
   * @param params any
   * @returns null
   */
  #logger = (...params: any) => this.#debug && console.log(...params)

  /**
   * Attempt to parse an UNKNOWN_ERROR returned from Ledger.
   *
   * @param err Error Object
   * @param reject Reject from the parent's promise
   * @returns returns the rejected promise with more descriptive error
   */
  #handleLedgerError = (err: Error, reject: any) => {
    this.#logger('🦄 try to interperate the error: ', err)
    switch (err.message) {
      case 'Ledger device: UNKNOWN_ERROR (0x6b0c)': return reject('Unlock the device to connect.')
      case 'Ledger device: UNKNOWN_ERROR (0x6a15)': return reject('Navigate to the correct app (Ethereum or RSK Mainnet) in the Ledger.')
      // unknown error
      default: reject(err)
    }
  }

  /**
   * Connect to the Ledger physical device
   * @returns Ledger EIP1193 Provider Wrapper
   */
  connect ():Promise<any> {
    this.#logger('🦄 attempting to connect!')
    return new Promise((resolve, reject) => {
      TransportWebUSB.create()
        .then((transport: Transport) => {
          this.#appEth = new AppEth(transport)
          this.appEthConnected = true

          // get the ledger's first address and set it
          this.#appEth.getAddress(this.path)
            .then((result: { address: string, chainCode?: string, publicKey: string}) => {
              this.selectedAddress = result.address
              resolve(this)
            })
            .catch((error: Error) => this.#handleLedgerError(error, reject))
        })
        .catch((error: Error) => this.#handleLedgerError(error, reject))
    })
  }

  async ethSendTransaction(to:string, value:number|string, data: string): Promise<string> {
    const transaction: txPartial = await createTransaction(this.provider, this.selectedAddress,{ to, from: this.selectedAddress, value, data })
    const serializedTx: string =  await signTransaction(transaction, this.#appEth, this.path, this.chainId)
    return new Promise((resolve,reject)=> this.provider.sendRawTransaction(`0x${serializedTx}`, (sendError: Error, transactionHash: string) =>
          sendError ? reject(sendError) : resolve(transactionHash))
      .catch((error: Error) => reject(error)))
  }

  // reference: https://github.com/LedgerHQ/ledgerjs/tree/master/packages/hw-app-eth#signpersonalmessage
  async personalSign(message:string):Promise<string> {
    const result = await this.#appEth.signPersonalMessage(this.path, Buffer.from(message).toString('hex'))
    const v = result.v - 27
    let v2 = v.toString(16)
    if (v2.length < 2) {
      v2 = '0' + v
    }
    return `0x${result.r}${result.s}${v2}`
  }
}
