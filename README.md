# Warning
This sample project is intended for demonstration purposes only.

The dependencies used in this sample project may be outdated and may contain known security vulnerabilities. It is highly recommended that you only use the code as a reference when developing your project.

## Overview

This is an example implementation of a Chia DID Reputation dApp using the standalone
client for WalletConnect v2 to:

- handle pairings
- manage sessions
- send Signature requests to a paired wallet
- sync with nostr to send reputation messages
- poll a known third party service to see if the messages are valid

## Running locally

Install the app's dependencies:

```bash
yarn
```

Set up your local environment variables by copying the example into your own `.env.local` file:

```bash
cp .env.local.example .env.local
```

Your `.env.local` now contains the following environment variables:

- `NEXT_PUBLIC_PROJECT_ID` (placeholder) - You can generate your own ProjectId at https://cloud.walletconnect.com
- `NEXT_PUBLIC_RELAY_URL` (already set)

## Develop

```bash
yarn dev
```

## Test

```bash
yarn test
```

## Build

```bash
yarn build
```
