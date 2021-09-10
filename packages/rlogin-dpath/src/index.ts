export const getDPathByChainId = (chainId: number): string => {
  switch (chainId) {
    case 30: return "44'/137'/0'/0/0"
    case 31:
    case 1:
    case 3:
    case 4:
    case 5: return "m/44'/60'/0'/0/0"
    default: throw new Error('Network not supported please specify the derivation path')
  }
}
