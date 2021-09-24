import HttpProvider from 'ethjs-provider-http'
import Eth from 'ethjs-query'
import { IRLoginEIP1193Provider, EthSendTransactionParams, PersonalSignParams } from '@rsksmart/rlogin-eip1193-types'

export type RLoginEIP1193ProviderOptions = { rpcUrl: string, chainId: number }

class ProviderRpcError extends Error {
  code: number;
  data?: unknown;

  constructor (message: string, code: number, data?: unknown) {
    super(message)
    this.code = code
    this.data = data
  }
}

export abstract class RLoginEIP1193Provider implements IRLoginEIP1193Provider {
  protected selectedAddress?: string
  readonly chainId: number

  protected provider: typeof Eth

  constructor ({ rpcUrl, chainId }: RLoginEIP1193ProviderOptions) {
    if (!rpcUrl) throw new Error('rpcUrl is required')
    if (!chainId) throw new Error('chainId is required')

    this.chainId = chainId

    this.provider = new Eth(new HttpProvider(rpcUrl))
  }

  abstract ethSendTransaction (params: EthSendTransactionParams): Promise<string>;
  abstract personalSign (params: PersonalSignParams, hex:boolean): Promise<string>;
  abstract ethSignTypedData (params: any): Promise<string>;

  private validateSender (sender: string) {
    if (sender.toLowerCase() !== this.selectedAddress.toLowerCase()) throw new ProviderRpcError('The requested account has not been authorized by the user', 4100)
  }

  private validateSenderAndPersonalSign (params: PersonalSignParams, hex:boolean) {
    this.validateSender(params[1])
    return this.personalSign(params, hex)
  }

  async request ({ method, params }): Promise<any> {
    console.log('🦄 incoming request:', method, params)

    switch (method) {
      case 'eth_accounts':
      case 'eth_requestAccounts':
        return [this.selectedAddress]

      case 'eth_chainId':
      case 'net_version':
        return `0x${this.chainId.toString(16)}`

      case 'eth_sign':
        // some web3 clients still use eth_sign RPC
        // this implementation is based on ethers.js redirecting metamask and ledger to personal_sign
        // ref: https://github.com/ethers-io/ethers.js/blob/f2a32d0d5b4ea3721d3f3ee14db56e0519cf337f/packages/providers/src.ts/web3-provider.ts#L35
        // ref: https://github.com/ethers-io/ethers.js/blob/f2a32d0d5b4ea3721d3f3ee14db56e0519cf337f/packages/hardware-wallets/src.ts/ledger.ts#L93
        return this.validateSenderAndPersonalSign([params[1], params[0]], true)

      case 'personal_sign':
        return this.validateSenderAndPersonalSign(params, false)

      case 'eth_sendTransaction': {
        const { from } = (params as EthSendTransactionParams)[0]
        if (from) this.validateSender((params as EthSendTransactionParams)[0].from)
        else params[0].from = this.selectedAddress
        return this.ethSendTransaction(params)
      }

      case 'eth_signTypedData_v4': {
        return this.ethSignTypedData(params)
      }

      default:
        return new Promise((resolve, reject) => {
          this.provider.rpc.sendAsync({ method, params }, (err, data) => {
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

  on (method: string) {
    console.log('🦄 registering action ', method)
  }

  removeAllListeners () {
    console.log('🦄 removeAllListeners')
  }
}
