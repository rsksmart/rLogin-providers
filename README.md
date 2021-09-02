<p align="middle">
    <img src="https://www.rsk.co/img/rsk_logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle">rLogin providers</h3>
<p align="middle">
    A set of EIP-1193 providers for rLogin
</p>

This libraries are a set of wrappers that are used by [`@rsksmart/rLogin`](https://github.com/rsksmart/rLogin) that make all integrated web3 providers compatible, complaint with [EIP-1193 - Ethereum Provider JavaScript API](https://eips.ethereum.org/EIPS/eip-1193).

## Packages

- `@rsmsart/rlogin-ledger-provider` - wrapper for Ledger [`@ledgerhq/hw-app-eth`](https://github.com/LedgerHQ/ledgerjs/tree/master/packages/hw-app-eth)
- `@rsmsart/rlogin-trezor-provider` - wrapper for Trezor [`trezor-connect`](https://github.com/trezor/connect)

Internals:

- `@rsmsart/rlogin-eip1193-proxy-subprovider` - fallbacks RPC requests to [`ethjs-query`](https://github.com/ethjs/ethjs-query)

## Run for development

Firs, install all dependencies and link packages

```
npm i
npm run setup
```

The packages are in `/pacakges` folder.

### Run tests

```
npm test
```

### Build for production

```
npm run build
```

### Branching model

- `main` has latest release. Do merge commits.
- `develop` has latest approved PR. PRs need to pass `ci` and _LGTM_. Do squash & merge.
- Use branches pointing to `develop` to add new PRs.
- Do external PRs against latest commit in `develop`.
