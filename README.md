# browser-provider

**Interface for listing and creating browsers.** Uses [`browser-manifest`](https://github.com/airtap/browser-manifest) for browser metadata and [`abstract-browser`](https://github.com/airtap/abstract-browser) for browser instances.

[![npm status](http://img.shields.io/npm/v/browser-provider.svg)](https://www.npmjs.org/package/browser-provider)
[![node](https://img.shields.io/node/v/browser-provider.svg)](https://www.npmjs.org/package/browser-provider)
[![Travis](https://img.shields.io/travis/com/airtap/browser-provider.svg)](https://travis-ci.com/airtap/browser-provider)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Usage

With promises:

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

With callbacks:

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

## API

### `provider = new Provider([options])`

Constructor. The `options` argument is optional, to contain implementation-specific options.

### `provider.manifests([callback])`

Get an array of manifests. If no callback is provided, a promise is returned.

### `browser = provider.browser(manifest, target)`

Instantiate and synchronously return an [`abstract-browser`](https://github.com/airtap/abstract-browser) instance from a manifest.

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
