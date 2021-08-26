import DcentWebConnector from 'dcent-web-connector'
import { RLoginEIP1993Provider } from '@rsksmart/rlogin-eip1193-proxy-subprovider'
export interface IDcentProviderOptions {
  chainId: number | string;
  config?: { addressSearchLimit: number, shouldAskForOnDeviceConfirmation: boolean };
  manifestEmail: string;
  manifestAppUrl: string;
  rpcUrl: string;
  dPath?: string
}
export class DcentProvider extends RLoginEIP1993Provider {
  #opts : IDcentProviderOptions
  constructor (opts: IDcentProviderOptions) {
    super(opts.rpcUrl, opts.chainId, opts.dPath)
    console.log('DcentProvider constructor!', opts)
    this.#opts = opts
  }
  /**
   * Attempt to parse an UNKNOWN_ERROR returned from Dcent.
   *
   * @param err Error Object
   * @param reject Reject from the parent's promise
   * @returns returns the rejected promise
   */
  #handleDcentError = (message: string, code?: string): string => {
    console.log(':cara_de_unicornio: try to interpret the error: ', { message, code })
    return code ? `Dcent: ${code} - ${message}` : message
  }
  async connect (): Promise<any> {
    let result
    if (!this.appEthInitialized) {
      console.log(':cara_de_unicornio: attempting to initialize!')
      try {
        result = await DcentWebConnector.getDeviceInfo()
        console.log({ result })
        this.appEthInitialized = true
      } catch (e) {
        throw new Error(this.#handleDcentError(e.message))
      }
    }

    if (!this.appEthConnected) {
      console.log(':cara_de_unicornio: attempting to connect!**')
      result = await DcentWebConnector.getAccountInfo()

      try {
        var coinType = DcentWebConnector.coinType.ETHEREUM
        result = await DcentWebConnector.getAddress(coinType, this.path)
      } catch (e) {
        throw new Error(this.#handleDcentError(e.message))
      }
      
      if (result.header.status === 'success') {
        this.appEthConnected = true
        this.selectedAddress = result.body.parameter.address
        DcentWebConnector.popupWindowClose()
      } else {
        throw new Error(this.#handleDcentError(result.payload.error, result.payload.code))
      }
    }
    return this
  }

  async personalSign (message:string) {
    let result
    try {
      result = await DcentWebConnector.getEthereumSignedMessage(message, this.path)
      console.log({ result })
      return result.body.parameter.sign
    } catch (error) {
      throw new Error(this.#handleDcentError(result.payload.error, result.payload.code))
    } finally {
      DcentWebConnector.popupWindowClose()
    }
  }
  async ethSendTransaction (to:string, value:number|string, data: string): Promise<string> {
    // TODO: Implement (add helper file if you need it (see trezor example))
    return undefined
  }
}