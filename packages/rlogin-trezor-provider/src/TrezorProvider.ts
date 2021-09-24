import TrezorConnect from 'trezor-connect'
import { Transaction } from '@ethereumjs/tx'
import { RLoginEIP1193Provider, RLoginEIP1193ProviderOptions } from '@rsksmart/rlogin-eip1193-proxy-subprovider'
import { EthSendTransactionParams, PersonalSignParams } from '@rsksmart/rlogin-eip1193-types'
import { getDPathByChainId } from '@rsksmart/rlogin-dpath'
import { createTransaction } from '@rsksmart/rlogin-transactions'

type TrezorOptions = {
  manifestEmail: string
  manifestAppUrl: string
}

export type TrezorProviderOptions = RLoginEIP1193ProviderOptions & TrezorOptions & {
  debug?: boolean
  dPath?: string
}

export class TrezorProvider extends RLoginEIP1193Provider {
  public readonly isTrezor = true

  path: string

  opts: TrezorOptions
  initialized = false
  connected = false

  debug = false

  constructor ({
    rpcUrl, chainId,
    debug, dPath,
    manifestEmail, manifestAppUrl
  }: TrezorProviderOptions) {
    super({ rpcUrl, chainId })

    this.debug = !!debug

    this.path = dPath || getDPathByChainId(chainId)
    this.opts = { manifestEmail, manifestAppUrl }
  }

  #logger = (...params: any) => this.debug && console.log(...params)

  /**
   * Attempt to parse an UNKNOWN_ERROR returned from Trezor.
   *
   * @param err Error Object
   * @param reject Reject from the parent's promise
   * @returns returns the rejected promise
   */
  #handleTrezorError = (message: string, code?: string): string => {
    this.#logger('🦄 try to interpret the error: ', { message, code })
    return code ? `Trezor: ${code} - ${message}` : message
  }

  #validateIsConnected () {
    if (!this.initialized || !this.connected) throw new Error('You need to connect the device first')
  }

  async connect (): Promise<any> {
    if (!this.initialized) {
      this.#logger('🦄 attempting to initialize!')
      try {
        await TrezorConnect.init({
          lazyLoad: true, // this param will prevent iframe injection until TrezorConnect.method will be called
          manifest: {
            email: this.opts.manifestEmail,
            appUrl: this.opts.manifestAppUrl
          }
        })
        this.initialized = true
      } catch (e) {
        throw new Error(this.#handleTrezorError(e.message))
      }
    }

    if (!this.connected) {
      console.log('🦄 attempting to connect!')
      const result = await TrezorConnect.ethereumGetAddress({ path: this.path, showOnTrezor: false })

      if (result.success) {
        this.connected = true
        this.selectedAddress = result.payload.address.toLowerCase()
      } else {
        throw new Error(this.#handleTrezorError(result.payload.error, result.payload.code))
      }
    }
    return this
  }

  async personalSign (params: PersonalSignParams, hex:boolean): Promise<string> {
    this.#validateIsConnected()

    const result = await TrezorConnect.ethereumSignMessage({ path: this.path, message: params[0], hex })
    if (result.success) {
      return result.payload.signature
    } else {
      throw new Error(this.#handleTrezorError(result.payload.error, result.payload.code))
    }
  }

  async ethSendTransaction (params: EthSendTransactionParams): Promise<string> {
    this.#validateIsConnected()

    const transaction = await createTransaction(this.provider, this.selectedAddress!, params[0])
    const tx = {
      ...transaction,
      nonce: `0x${transaction.nonce.toString(16)}`,
      gasPrice: `0x${transaction.gasPrice.toString(16)}`,
      gasLimit: `0x${transaction.gasLimit.toString(16)}`,
      chainId: this.chainId
    }
    const result = await TrezorConnect.ethereumSignTransaction({
      path: this.path,
      transaction: tx
    })

    if (result.success) {
      const signedTransaction = new Transaction({
        ...transaction,
        ...result.payload
      })
      return await this.provider.sendRawTransaction(`0x${signedTransaction.serialize().toString('hex')}`)
    } else {
      throw new Error(this.#handleTrezorError(result.payload.error, result.payload.code))
    }
  }

  /**
   * TODO Create sign typed data using Trezor provider.
   *
   * @param to
   * @returns Tx object, signature include.
   */
  async ethSignTypedData (params: any): Promise<string> {
    this.#logger('🦄 attempting to sign typed data')
    console.log('TODO IMPL TREZOR ')
    this.#logger(params)
    return undefined
  }
}
