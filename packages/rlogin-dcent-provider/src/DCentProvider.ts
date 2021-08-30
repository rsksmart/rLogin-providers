import DcentWebConnector from 'dcent-web-connector'
import DcentProvider from 'dcent-provider'
import { createTransaction } from './helpers'
import { RLoginEIP1993Provider } from '@rsksmart/rlogin-eip1193-proxy-subprovider'
export interface IRLoginDcentProviderOptions {
  chainId: number | string;
  config?: { addressSearchLimit: number, shouldAskForOnDeviceConfirmation: boolean };
  manifestEmail: string;
  manifestAppUrl: string;
  rpcUrl: string;
  dPath?: string
}

export class RLoginDcentProvider extends RLoginEIP1993Provider {
  #opts : IRLoginDcentProviderOptions
  constructor (opts: IRLoginDcentProviderOptions) {
    super(opts.rpcUrl, opts.chainId, opts.dPath)
    console.log('RLoginDcentProvider constructor!', opts)
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

  /**
   * Connect to the Dcent physical device.
   * 
   * @returns Dcent EIP1193 Provider Wrapper
   */
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
      console.log(':cara_de_unicornio: attempting to connect!')
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

  /**
   * Sign personal message with Dcent.
   * 
   * @param message 
   * @returns 
   */
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

  /**
   * Create enable and send transaction using Dcent provider.
   * 
   * @param to 
   * @param value 
   * @param data 
   * @returns Tx object, signature include.
   */
  async ethSendTransaction (to:string, value:number|string, data: string): Promise<string> {
    if (!this.appEthConnected) {
      throw new Error('Please connect before sending requests.')
    }

    const tx = await createTransaction(this.provider, this.selectedAddress!,
    {
      to,
      value,
      data
    })

    const my_provider = new DcentProvider({
      rpcUrl: this.#opts.rpcUrl,
      chainId: this.chainId
    })

    const result = await my_provider.enable()
    
    const transaction = {
      from: tx.from,
      gasPrice: tx.gasPrice,
      gas: tx.gasLimit,
      to: tx.to,
      value: tx.value,
      data: tx.data
    }

    try {
      console.log(':cara_de_unicornio: attempting to send tx!')
      return await my_provider.send('eth_sendTransaction', transaction)
    } catch (error) {
        throw new Error(this.#handleDcentError(error.message, error.code))
    }
  }
}