import TransportWebHID from '@ledgerhq/hw-transport-webhid'
import TransportWebUSB from '@ledgerhq/hw-transport-webusb'
import AppEth from '@ledgerhq/hw-app-eth'
import Transport from '@ledgerhq/hw-transport'
import { signTransaction, convertFromHex } from './helpers'
import { PersonalSignParams, SignParams, EthSendTransactionParams } from '@rsksmart/rlogin-eip1193-types'
import { RLoginEIP1193ProviderOptions, RLoginEIP1193Provider } from '@rsksmart/rlogin-eip1193-proxy-subprovider'
import { createTransaction } from '@rsksmart/rlogin-transactions'
import { getDPathByChainId } from '@rsksmart/rlogin-dpath'

type LedgerProviderOptions = RLoginEIP1193ProviderOptions & {
  debug?: boolean
  dPath?: string
}

export class LedgerProvider extends RLoginEIP1193Provider {
  public readonly isLedger = true

  protected dpath: string

  private appEthConnected: boolean = false
  private appEth?: AppEth

  private debug: boolean

  constructor ({ chainId, rpcUrl, dPath, debug }: LedgerProviderOptions) {
    super({ rpcUrl, chainId })

    this.debug = !!debug

    this.dpath = dPath || getDPathByChainId(chainId, 0)
  }

  /**
   * Simple logger
   * @param params any
   * @returns null
   */
  #logger = (...params: any) => this.debug && console.log(...params)

  /**
   * Attempt to parse an UNKNOWN_ERROR returned from Ledger.
   *
   * @param err Error Object
   * @param reject Reject from the parent's promise
   * @returns returns the rejected promise with more descriptive error
   */
  #handleLedgerError = (err: Error): string => {
    this.#logger('🦄 try to interperate the error: ', err)
    switch (err.message) {
      case 'Ledger device: UNKNOWN_ERROR (0x6b0c)': return 'Unlock the device to connect.'
      case 'Ledger device: UNKNOWN_ERROR (0x6a15)': return 'Navigate to the correct app in the Ledger.'
      case 'Ledger device: UNKNOWN_ERROR (0x6511)': return 'Open up the correct app in the Ledger.' // no app selected
      // unknown error
      default: return err.message
    }
  }

  #validateIsConnected () {
    if (!this.appEthConnected) throw new Error('You need to connect the device first')
  }

  /**
   * Connect to the Ledger physical device
   * @returns Ledger EIP1193 Provider Wrapper
   */
  async connect (): Promise<RLoginEIP1193Provider> {
    this.#logger('🦄 attempting to connect!')

    let transport: Transport
    try {
      transport = await TransportWebHID.create()
    } catch (e) {
      transport = await TransportWebUSB.create()
    }

    this.appEth = new AppEth(transport)
    this.appEthConnected = true

    // select the path in the constructor
    return this.chooseAccount(this.dpath)
  }

  // Choose an account from the derivation path
  async chooseAccount (dpath: string): Promise<RLoginEIP1193Provider> {
    try {
      const result = await this.appEth.getAddress(dpath)
      this.selectedAddress = result.address
      this.dpath = dpath
      return this
    } catch (error) {
      throw new Error(this.#handleLedgerError(error))
    }
  }

  // note: ledger can only get one address at a time, so Promise.all will result in a thrown error
  async getAddresses (dPaths: string[]): Promise<{path: string, address:string}[]> {
    return dPaths.reduce((lastProm, dPath) => lastProm.then(
      (resultArrSoFar) =>
        this.appEth.getAddress(dPath, false)
          .then(result => [...resultArrSoFar, { dPath, address: result.address }])
          .catch(error => Promise.reject(this.#handleLedgerError(error)))
    ), Promise.resolve([]))
  }

  async ethSendTransaction (params: EthSendTransactionParams): Promise<string> {
    this.#validateIsConnected()
    const transaction = await createTransaction(this.provider, this.selectedAddress, params[0])
    const serializedTx: string = await signTransaction(transaction, this.appEth, this.dpath, this.chainId)
    return await this.provider.sendRawTransaction(`0x${serializedTx}`)
  }

  // reference: https://github.com/LedgerHQ/ledgerjs/tree/master/packages/hw-app-eth#signpersonalmessage
  private async validateConnectionAndPersonalSign (hexMessage: string): Promise<string> {
    this.#validateIsConnected()
    const message = convertFromHex(hexMessage)
    const result = await this.appEth.signPersonalMessage(this.dpath, Buffer.from(message).toString('hex'))
    const v = result.v - 27
    let v2 = v.toString(16)
    if (v2.length < 2) {
      v2 = '0' + v
    }

    return `0x${result.r}${result.s}${v2}`
  }

  ethSign (params: SignParams): Promise<string> {
    return this.validateConnectionAndPersonalSign(params[1])
  }

  personalSign (params: PersonalSignParams): Promise<string> {
    return this.validateConnectionAndPersonalSign(params[0])
  }

  async disconnect () {
    this.appEth.transport.close()

    this.selectedAddress = null
    this.appEthConnected = false

    this.appEth = null
  }
}
