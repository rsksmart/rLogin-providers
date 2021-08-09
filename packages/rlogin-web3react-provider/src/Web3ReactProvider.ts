import { AbstractConnectorArguments, ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from '@web3-react/abstract-connector'

interface RLoginReponse {
  provider: any
  disconnect: () => void
}

export class Web3ReactProvider extends AbstractConnector {
  private provider: any // rLogin EIP1193 provider
  private disconnect: () => void | null

  public name: string

  constructor(rLoginResponse: RLoginReponse) {
    const kwargs: AbstractConnectorArguments = {
      supportedChainIds: [30, 31]
    }
    super(kwargs)

    this.provider = rLoginResponse.provider
    this.disconnect = rLoginResponse.disconnect
    this.name = 'rLogin'

    // bind _this_ for emitEvent to be called
    this.handleAccountsChanged = this.handleAccountsChanged.bind(this)
    this.handleNetworkChanged = this.handleNetworkChanged.bind(this)
    this.handleChainChanged = this.handleChainChanged.bind(this)
    this.close = this.close.bind(this)
  }

  /**
   * activate()
   * User has already selected and connected with their provider using
   * the rLogin popup
   * @returns ConnectorUpdate { provider, chainId, account }
   */
  public async activate(): Promise<ConnectorUpdate> {
    // get account and chainId
    const promises: [Promise<string[]>, Promise<number>] = [
      this.provider.request({ method: 'eth_accounts' }),
      this.provider.request({ method: 'eth_chainId' })
    ]

    // setup listeners
    this.provider.on('chainChanged', this.handleChainChanged)
    this.provider.on('accountsChanged', this.handleAccountsChanged)
    this.provider.on('close', this.close)
    this.provider.on('networkChanged', this.handleNetworkChanged)

    // return this back to web3React
    return Promise.all(promises).then((results: any[]) => ({
      provider: this.provider,
      chainId: parseInt(results[1]),
      account: results[0][0].toLowerCase()
    }))
  }

  public getProvider() {
    return this.provider
  }

  public getChainId(): Promise<number> {
    return this.provider.request({ method: 'eth_chainId' }).then((hex: string) => parseInt(hex))
  }

  public getAccount(): Promise<string> {
    return this.provider.request({ method: 'eth_accounts' })
  }

  public deactivate() {
    this.provider.removeListener('chainChanged', this.handleChainChanged)
    this.provider.removeListener('accountsChanged', this.handleAccountsChanged)
    this.provider.removeListener('close', this.close)
    this.provider.removeListener('networkChanged', this.handleNetworkChanged)
  }

  public close() {
    this.disconnect()
    this.emitDeactivate()
  }

  handleChainChanged(chainId: string | number) {
    this.emitUpdate({ chainId, provider: this.provider })
  }

  handleAccountsChanged(accounts: string[]) {
    if (accounts.length === 0) {
      this.emitDeactivate()
    } else {
      this.emitUpdate({ account: accounts[0] })
    }
  }

  handleNetworkChanged(networkId: string | number) {
    this.emitUpdate({ chainId: networkId, provider: this.provider })
  }
}
