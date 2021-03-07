'use strict'

const { fromCallback, fromPromise } = require('catering')
const matchBrowsers = require('airtap-match-browsers')
const bm = require('browser-manifest')
const kPromises = Symbol('kPromises')
const domains = ['localhost']

class Provider {
  constructor (options) {
    this.options = options || {}
    this.supports = { ...this.supports, promises: true, callbacks: true }
    this[kPromises] = false
  }

  manifests (wanted, callback) {
    if (typeof wanted === 'function') {
      callback = wanted
      wanted = null
    }

    if (this[kPromises]) {
      return fromPromise(this._manifests().then(transform(wanted)), callback)
    } else {
      callback = fromCallback(callback)
      let sync = true

      this._manifests(function wrapped (err, manifests) {
        if (sync) return process.nextTick(wrapped, err, manifests)
        if (err) return callback(err)

        try {
          manifests = transform(wanted)(manifests)
        } catch (err) {
          return callback(err)
        }

        callback(null, manifests)
      })

      sync = false
      return callback.promise
    }
  }

  browser (manifest, target) {
    if (typeof manifest !== 'object' || manifest === null) {
      throw new TypeError('First argument "manifest" must be an object')
    }

    if (typeof target === 'string') {
      target = { url: target }
    } else if (typeof target !== 'object' || target === null) {
      throw new TypeError('Second argument "target" must be a string or object')
    }

    return this._browser(manifest, target)
  }

  // Convenience method for finding a single manifest
  find (wanted, options, callback) {
    if (typeof options === 'function') {
      return this.find(wanted, null, options)
    }

    if (typeof wanted === 'string') {
      wanted = { name: wanted }
    }

    if (options) {
      wanted = { ...wanted, options }
    }

    if (callback === undefined) {
      return this.manifests([wanted]).then(first)
    } else {
      this.manifests([wanted], function (err, manifests) {
        if (err) return callback(err)
        callback(null, manifests[0])
      })
    }
  }

  // Convenience method for opening a single browser
  open (wanted, target, options, callback) {
    if (typeof options === 'function') {
      return this.open(wanted, target, null, options)
    }

    if (callback === undefined) {
      return this.find(wanted, options).then(manifest => {
        const browser = this.browser(manifest, target)
        return browser.open().then(() => browser)
      })
    } else {
      this.find(wanted, options, (err, manifest) => {
        if (err) return callback(err)

        const browser = this.browser(manifest, target)

        browser.open(function (err) {
          if (err) return callback(err)
          callback(null, browser)
        })
      })
    }
  }

  tunnel (options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = { domains }
    } else if (options == null) {
      options = { domains }
    } else if (options.domains == null) {
      options = { ...options, domains }
    }

    if (this[kPromises]) {
      return fromPromise(this._tunnel(options), callback)
    } else {
      callback = fromCallback(callback)
      let sync = true

      this._tunnel(options, function (err, tunnel) {
        if (sync) return process.nextTick(callback, err, tunnel)
        callback(err, tunnel)
      })

      sync = false
      return callback.promise
    }
  }

  _manifests (callback) { process.nextTick(callback, null, []) }
  _browser (manifest, target) { throw new Error('_browser() is not implemented') }
  _tunnel (options, callback) { process.nextTick(callback) }
}

Provider.promises = class ProviderPromises extends Provider {
  constructor (...args) {
    super(...args)
    this.supports = { ...this.supports, promises: true, callbacks: true }
    this[kPromises] = true
  }

  async _manifests () { return [] }
  async _tunnel (options) {}
}

module.exports = Provider

function transform (wanted) {
  return function (manifests) {
    manifests = manifests.map(bm)

    if (wanted != null) {
      manifests = matchBrowsers(manifests, wanted)
    }

    return manifests
  }
}

function first (arr) {
  return arr[0]
}
