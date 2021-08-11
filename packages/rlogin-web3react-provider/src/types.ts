export interface IWeb3ReactProvider {
  new (rLoginResponse: { provider: any; disconnect: () => void }): void
  activate(): Promise<string[]>
  getProvider(): any
  getChainId(): Promise<number>
  getAccount(): Promise<string>
  deactivate(): null
  close(): null
  handleChainChanged(chainId: string | number): null
  handleAccountsChanged(accounts: string[]): null
  handleNetworkChanged(networkId: string | number): null
}
