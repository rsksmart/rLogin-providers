import TrezorConnect from 'trezor-connect'
import { Transaction } from '@ethereumjs/tx'
import { RLoginEIP1193Provider, RLoginEIP1193ProviderOptions } from '@rsksmart/rlogin-eip1193-proxy-subprovider'
import { EthSendTransactionParams, SignParams, PersonalSignParams, SignTypedDataParams } from '@rsksmart/rlogin-eip1193-types'
import { getDPathByChainId } from '@rsksmart/rlogin-dpath'
import { createTransaction } from '@rsksmart/rlogin-transactions'
import { getMessage, TypedData } from 'eip-712'

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
        console.log(e)
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

  private async validateConnectionAndSign (message: string): Promise<string> {
    this.#validateIsConnected()

    const result = await TrezorConnect.ethereumSignMessage({ path: this.path, message, hex: true })
    if (result.success) {
      return `0x${result.payload.signature}`
    } else {
      throw new Error(this.#handleTrezorError(result.payload.error, result.payload.code))
    }
  }

  personalSign (params: PersonalSignParams): Promise<string> {
    return this.validateConnectionAndSign(params[0])
  }

  ethSign (params: SignParams): Promise<string> {
    return this.validateConnectionAndSign(params[1])
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

  ethSignTypedData (params: SignTypedDataParams): Promise<string> {
    this.#logger('🦄 attempting to sign typed data.', params)
    const parsed: TypedData = (typeof params[1] === 'string') ? (JSON.parse(params[1]) as TypedData) : params[1]
    const hashedMsg:string = getMessage(parsed, true).toString('hex')
    return this.validateConnectionAndSign(hashedMsg)
  }

  /**
   * Create personal sign typed data using Trezor provider.
   *
   * @param to
   * @returns Tx object, signature include.
   */
  async personaSignTypedData (params: PersonalSignParams): Promise<string> {
    this.#logger('🦄 attempting to personal sign typed data.', params)
    const hashedMsg:string = getMessage(JSON.parse(params[0]), true).toString('hex')
    return this.validateConnectionAndSign(hashedMsg)
  }

  disconnect () {
    this.#logger('🦄 disconnecting device.')
    TrezorConnect.dispose()
    this.connected = false
    this.selectedAddress = null
  }
}
