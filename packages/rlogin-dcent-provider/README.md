<p align="middle">
  <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>@rsksmart/rlogin-dcent-provider</code></h3>
<p align="middle">
  rLogin D'Cent Provider
</p>
<p align="middle">
  <a href="https://github.com/rsksmart/rlogin-dcent-connector/actions/workflows/ci.yml" alt="ci">
    <img src="https://github.com/rsksmart/rlogin-dcent-connector/actions/workflows/ci.yml/badge.svg" alt="ci" />
  </a>
  <a href="https://developers.rsk.co/rif/templates/">
    <img src="https://img.shields.io/badge/-docs-brightgreen" alt="docs" />
  </a>
  <a href="https://lgtm.com/projects/g/rsksmart/rlogin-dcent-connector/context:javascript">
    <img src="https://img.shields.io/lgtm/grade/javascript/github/rsksmart/rlogin-dcent-connector" />
  </a>
  <a href='https://coveralls.io/github/rsksmart/rlogin-dcent-connector?branch=main'>
    <img src='https://coveralls.io/repos/github/rsksmart/rlogin-dcent-connector/badge.svg?branch=main' alt='Coverage Status' />
  </a>
</p>

A D'Cent provider connection for rLogin. Still in beta and tested manually for now.

## Features

Allow users to connect to your dapp using a D'cent device. Currently works with USB and returns an EIP1193 provider.

## Implementation

The implementation is a bit different for D'cent because it is not a Web3Modal supported provider. 

Add the dependecy to your project

```
yarn add @rsksmart/rlogin-dcent-provider --save
```

In your dapp, your rLogin implementation should be similar to this:

```
import RLogin from '@rsksmart/rlogin'
import { dcentProviderOptions } from '@rsksmart/rlogin-dcent-provider'

// ...

const rLogin = new RLogin({
  cacheProvider: false,
  providerOptions: {
    // ... other providers, i.e. WalletConnect or Portis, etc
      'custom-dcent': {
      ...dcentProviderOptions,
      options: {
        manifestEmail: 'info@iovlabs.org',
        manifestAppUrl: 'https://basic-sample.rlogin.identity.rifos.org/',
        rpcUrl: 'https://public-node.testnet.rsk.co',
        chainId: 31,
        debug: true
      }
  },
  supportedChains: [30, 31]
})
```

### Implementation notes

- Similar to the Portis connector, you can only specify a single chainId to connect to.
- The `custom-` needs to be connection data and provider configuration. The `...dcentProviderOptions` contains the D'cent text and image and connects rLogin to the provider.
- D'cent has two apps that work with RSK:
  - The RSK App will only work with RSK Mainnet as it uses the correct derivation path of `44'/137'/0'/0/0`
  - To use RSK Testnet, you must use the Ethereum App on the Ledger. It will use the standard Ethereum derivation path of `44'/60'/0'/0/0`. As of writing, no Ledger app will accept the RSK Testnet derivation path.
- pass `debug: true` for console logs that may help you debug.


## Run for development

Install dependencies:

```
yarn i
```

### Run unit tests

```
yarn test
```

Coverage report with:

```
yarn run test:coverage
```

### Run linter

```
yarn run lint
```

Auto-fix:

```
yarn run lint:fix
```

### Build for production

```
yarn run build
```
