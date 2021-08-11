<p align="middle">
  <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>@rsksmart/rlogin-web3react-provider</code></h3>
<p align="middle">
  rLogin Ledger Provider
</p>
<p align="middle">
  <a href="https://github.com/rsksmart/rlogin-web3react-connector/actions/workflows/ci.yml" alt="ci">
    <img src="https://github.com/rsksmart/rlogin-web3react-connector/actions/workflows/ci.yml/badge.svg" alt="ci" />
  </a>
  <a href="https://developers.rsk.co/rif/templates/">
    <img src="https://img.shields.io/badge/-docs-brightgreen" alt="docs" />
  </a>
  <a href="https://lgtm.com/projects/g/rsksmart/rlogin-web3react-connector/context:javascript">
    <img src="https://img.shields.io/lgtm/grade/javascript/github/rsksmart/rlogin-web3react-connector" />
  </a>
  <a href='https://coveralls.io/github/rsksmart/rlogin-web3react-connector?branch=main'>
    <img src='https://coveralls.io/repos/github/rsksmart/rlogin-web3react-connector/badge.svg?branch=main' alt='Coverage Status' />
  </a>
  <!--
  <a href="https://hits.seeyoufarm.com">
    <img src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Frsksmart%2Frlogin-web3react-connector&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false"/>
  </a>
    <a href="https://badge.fury.io/js/%40rsksmart%2Frlogin-web3react-connector">
      <img src="https://badge.fury.io/js/%40rsksmart%2Frlogin-web3react-connector.svg" alt="npm" />
    </a>
  -->
</p>

A [Web3 React](https://github.com/NoahZinsmeister/web3-react) provider for rLogin. This package can be used with existing Web3 React implementations where you want to use the rLogin provider selector. 

## Features

Uses the rLogin provider selector, and authenticaion or data vault if required, and passes the provider to the Web3 React implementation. 

## Implementation

Add the dependecy to your project:

```
yarn add @rsksmart/rlogin-web3react-provider --save
```

Then connect with rLogin, convert the response with this package, and pass it to Web3React:

```
const { activate } = useWeb3React()

rLogin.connect()
  .then(rloginResponse => new Web3ReactProvider(rloginResponse))
  .then(connector => activate(connector, undefined, true))
```
### Implementation notes

- Tested with Metamask and WalletConnect. 
- Portis has known issues with estimating the gas price. You must use `request` when sending transacitons. [See the rLogin docs](https://github.com/rsksmart/rlogin#portis-support) for additional information about this error.

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