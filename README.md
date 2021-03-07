# browser-provider

**Interface for listing and creating browsers.** Uses [`browser-manifest`](https://github.com/airtap/browser-manifest) for browser metadata and [`abstract-browser`](https://github.com/airtap/abstract-browser) for browser instances.

[![npm status](http://img.shields.io/npm/v/browser-provider.svg)](https://www.npmjs.org/package/browser-provider)
[![node](https://img.shields.io/node/v/browser-provider.svg)](https://www.npmjs.org/package/browser-provider)
[![Travis](https://img.shields.io/travis/com/airtap/browser-provider.svg)](https://travis-ci.com/airtap/browser-provider)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Usage

A provider can be implemented with promises:

<details><summary>Click to expand</summary>

```js
const Provider = require('browser-provider').promises

class MyProvider extends Provider {
  // Return a manifest for every supported browser
  async _manifests () {
    return [
      { name: 'chrome', version: '83' },
      { name: 'firefox', version: '78.0.1' }
    ]
  }

  _browser (manifest, target) {
    // Return a instance of abstract-browser
    // ..
  }

  async _tunnel (options) {
    // Optionally implement a tunnel for remote browsers
    // ..
  }
}
```

</details>

Or with callbacks:

<details><summary>Click to expand</summary>

```js
const Provider = require('browser-provider')

class MyProvider extends Provider {
  // Return a manifest for every supported browser
  _manifests (callback) {
    callback(null, [
      { name: 'chrome', version: '83' },
      { name: 'firefox', version: '78.0.1' }
    ])
  }

  _browser (manifest, target) {
    // Return a instance of abstract-browser
    // ..
  }

  _tunnel (options, callback) {
    // Optionally implement a tunnel for remote browsers
    // ..
  }
}
```

</details>

Either way, the public interface supports both promises and callbacks:

```js
const provider = new MyProvider()

// Shorthands
const browser = await provider.open('ff', 'https://example.com')
const manifest = await provider.find('ff')

// Get a list of desired browsers
const wanted = [{ name: 'ff', version: 'oldest..latest' }]
const manifests = await provider.manifests(wanted)

// Instantiate a browser from a manifest
const target = { url: 'http://localhost:3000' }
const browser = provider.browser(manifests[0], target)

await browser.open()
```

## API

### `provider = new Provider([options])`

Constructor. The `options` argument is optional, to contain implementation-specific options.

### `provider.manifests([wanted][, callback])`

Get an array of manifests. A `wanted` array may be provided to [match the manifests against a desired list of browsers](https://github.com/airtap/match-browsers). If that argument is omitted, the result includes all manifests. If no callback is provided, a promise is returned. If you wish to combine & match manifests from multiple providers, use [`airtap-multi`](https://github.com/airtap/multi).

### `provider.browser(manifest, target)`

Instantiate and synchronously return an [`abstract-browser`](https://github.com/airtap/abstract-browser) instance from a manifest. The `target` argument must be a string url or an object in the form of `{ url }`.

### `provider.open(wanted, target[, options][, callback])`

Convenience method for opening a single browser. If no callback is provided, a promise is returned. The `wanted` argument is required and can be a string as a shorthand for `{ name }` or an object with manifest properties to [match](https://github.com/airtap/match-browsers). The `target` argument must be a string url or an object in the form of `{ url }`. The `options` argument will populate `manifest.options`.

Examples:

```js
const browser = await provider.open('ff', 'https://example.com')
```

```js
const browser = await provider.open(
  { name: 'chrome', channel: 'canary' },
  'https://example.com',
  { headless: false }
)
```

### `provider.find(wanted[, options][, callback])`

Convenience method for finding a single manifest. The `wanted` argument is required and can be a string as a shorthand for `{ name }` or an object with manifest properties to [match](https://github.com/airtap/match-browsers). The `options` argument will populate `manifest.options`. If no callback is provided, a promise is returned.

Examples:

```js
const manifest = await provider.find('chrome')
```

```js
const manifest = await provider.find({
  name: 'firefox',
  supports: {
    headless: true
  }
})
```

### `provider.tunnel([options, ][callback])`

Start a tunnel (of which the interface is currently undocumented). If no callback is provided, a promise is returned. Options may include:

- `domains`: an array of domain names to route through the tunnel. Defaults to `['localhost']`.

### `provider.options`

The options that were passed into the constructor, or an empty object.

## Install

With [npm](https://npmjs.org) do:

```
npm install browser-provider
```

## License

[MIT](LICENSE.md) © 2020-present Airtap contributors
