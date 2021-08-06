import HttpProvider from 'ethjs-provider-http'
import Eth from 'ethjs-query'
import BN from 'bn.js'
import {IRLoginEIP1993Provider} from './types'

export abstract class RLoginEIP1993Provider implements IRLoginEIP1993Provider{
  protected appEthInitialized: boolean = false
  protected appEthConnected: boolean = false
  protected chainId: number
  protected path: string
  protected provider: any

  selectedAddress: string | null

  constructor (rpcUrl: string, chainId: number | string, dPath?: string) {
    if (!rpcUrl || !chainId) {
      throw (new Error('chainId and rpcUrl are required in the constructor options.'))
    }
    this.chainId = typeof chainId === 'number'? chainId : parseInt(chainId) 
    this.provider = new Eth(new HttpProvider(rpcUrl))

    // is the trezor using the Ethereum app or the RSK app:
    this.path = dPath? dPath : this.#getDPath(this.chainId)
    this.appEthInitialized = false

    // to be set during connect
    this.selectedAddress = null
  }

  #getDPath(chainId: number): string {
    switch(chainId) {
      //RSK
      case 30: return "44'/137'/0'/0/0"
      case 31: 
      //Ethereum
      case 1:
      case 3: 
      case 4:
      case 5:
          return "m/44'/60'/0'/0/0"
      
      default:
          throw new Error('Network not supported please specify the derivation path')
    }
  }

  // If connect is successful it should set appEthInitialized and appEthConnected to true
  abstract connect(): Promise<IRLoginEIP1993Provider>;
  abstract ethSendTransaction(to:string, value:number|string, data: string):Promise<string>;
  abstract personalSign(message:string):Promise<string>;

  async request (request: { method: string, params?: any }): Promise<any> {
    if (!this.appEthConnected) {
      throw new Error('Please connect before sending requests.')
    }

    const { method, params } = request
    console.log('🦄 incoming request:', method, params)

    switch (method) {
      case 'eth_accounts':
      case 'eth_requestAccounts':
         return [this.selectedAddress]
      case 'eth_chainId':
      case 'net_version':
        return this.chainId.toString(16)
      case 'eth_getBalance':
        return this.provider.getBalance(this.selectedAddress).then((response:any) => response.toString('hex'))
      case 'eth_getTransactionReceipt':
        return new Promise((resolve, reject) =>
          this.provider.getTransactionReceipt(params[0], (error: Error, result: any) =>
            error ? reject(error) : resolve(result || null))
        )
      case 'personal_sign':
        return this.personalSign(params[0])
      case 'eth_sendTransaction':
        return this.ethSendTransaction(params[0].to, params[0].value, params[0].data)
      case 'eth_call':
        return this.provider.call(params[0], params[1])

      // returns promise
      case 'eth_estimateGas':
        return this.provider.estimateGas({
          ...params[0],
          value: params[0].value || 0,
          data: params[0].data || '0x0'
        }).then((estimate: BN) => estimate.toNumber())

      default:
        return new Promise((resolve, reject) => {
          this.provider.sendAsync(request, (err, data) => {
          if (err) return reject(err)
          resolve(data)
        })
      })
    }
  }

  /**
   * Support deprecated sendAsync method, pass them to the request method
   * @param request sendAsync method
   * @param cb callback function that returns (error, success)
   */
  sendAsync (request: { method: string, params?: any }, cb: any) {
    this.request({ method: request.method, params: request.params })
      .then((response: any) => cb(null, { result: response }))
      .catch((error: Error) => cb(error, null))
  }

  /**
   * Support .enable function used with older dapps
   * @returns accounts[] array
   */
  enable () {
    return new Promise((resolve, reject) =>
      this.selectedAddress
        ? resolve([this.selectedAddress])
        : this.connect()
          .then(() => resolve([this.selectedAddress]))
          .catch(reject))
  }

  // Event listeners
  on (method: string) {
    console.log('🦄 registering action ', method)
  }

  removeAllListeners () {
    console.log('🦄 removeAllListeners')
  }
}
