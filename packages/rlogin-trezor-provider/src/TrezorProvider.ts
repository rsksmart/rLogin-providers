import TrezorConnect from 'trezor-connect'
import { Transaction } from '@ethereumjs/tx'
import { createTransaction } from './helpers'
import BN from 'bn.js'
import { RLoginEIP1993Provider } from './RLoginEIP1993Provider'

export interface ITrezorProviderOptions {
  chainId: number;
  config?: { addressSearchLimit: number, shouldAskForOnDeviceConfirmation: boolean };
  manifestEmail: string;
  manifestAppUrl: string;
  rpcUrl: string;
}

export class TrezorProvider extends RLoginEIP1993Provider {
  #opts : ITrezorProviderOptions
  isTrezor = true

  constructor (opts: ITrezorProviderOptions) {
    super(opts.rpcUrl, opts.chainId)
    console.log('TrezorProvider constructor!', opts)
    this.#opts = opts
  }

  /**
   * Attempt to parse an UNKNOWN_ERROR returned from Trezor.
   *
   * @param err Error Object
   * @param reject Reject from the parent's promise
   * @returns returns the rejected promise
   */
  #handleTrezorError = (message: string, code?: string): string => {
    console.log('🦄 try to interpret the error: ', { message, code })
    return code ? `Trezor: ${code} - ${message}` : message
  }

  async connect (): Promise<any> {
    if (!this.appEthInitialized) {
      console.log('🦄 attempting to initialize!')
      try {
        await TrezorConnect.init({
          lazyLoad: true, // this param will prevent iframe injection until TrezorConnect.method will be called
          manifest: {
            email: this.#opts.manifestEmail,
            appUrl: this.#opts.manifestAppUrl
          }
        })
        this.appEthInitialized = true
      } catch (e) {
        throw new Error(this.#handleTrezorError(e.message))
      }
    }
    if (!this.appEthConnected) {
      console.log('🦄 attempting to connect!')
      const result = await TrezorConnect.ethereumGetAddress({ path: this.path, showOnTrezor: false })

      if (result.success) {
        this.appEthConnected = true
        this.selectedAddress = result.payload.address
      } else {
        throw new Error(this.#handleTrezorError(result.payload.error, result.payload.code))
      }
    }
    return this
  }

  async personalSign (message:string) {
    const result = await TrezorConnect.ethereumSignMessage({ path: this.path, message, hex: false })
    if (result.success) {
      return result.payload.signature
    } else {
      throw new Error(this.#handleTrezorError(result.payload.error, result.payload.code))
    }
  }

  async ethSendTransaction (to:string, value:number|string, data: string):Promise<string> {
    if (!this.appEthConnected) {
      throw new Error('Please connect before sending requests.')
    }
    const transaction = await createTransaction(this.provider, this.selectedAddress!,
      {
        to,
        value,
        data
      })
    const result = await TrezorConnect.ethereumSignTransaction({ path: this.path, transaction })
    if (result.success) {
      const signedTransaction = new Transaction({
        ...transaction,
        ...result.payload,
        chainId: `0x${(new BN(this.chainId)).toString(16)}`
      })
      return await this.provider.sendRawTransaction(`0x${signedTransaction.serialize().toString('hex')}`)
    } else {
      throw new Error(this.#handleTrezorError(result.payload.error, result.payload.code))
    }
  }
}
