'use strict'

const { fromCallback, fromPromise } = require('catering')
const bm = require('browser-manifest')
const kPromises = Symbol('kPromises')
const domains = ['localhost']

class Provider {
  constructor (options) {
    this.options = options || {}
    this.supports = { ...this.supports, promises: true, callbacks: true }
    this[kPromises] = false
  }

  manifests (callback) {
    if (this[kPromises]) {
      return fromPromise(this._manifests().then(normalizeManifests), callback)
    } else {
      callback = fromCallback(callback)
      let sync = true

      this._manifests(function wrapped (err, manifests) {
        if (sync) return process.nextTick(wrapped, err, manifests)
        if (err) return callback(err)
        callback(null, normalizeManifests(manifests))
      })

      sync = false
      return callback.promise
    }
  }

  browser (manifest, target) {
    if (typeof manifest !== 'object' || manifest === null) {
      throw new TypeError('First argument "manifest" must be an object')
    }

    if (typeof target !== 'object' || target === null) {
      throw new TypeError('Second argument "target" must be an object')
    }

    return this._browser(manifest, target)
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

function normalizeManifests (manifests) {
  return manifests.map(bm)
}
