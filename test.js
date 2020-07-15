'use strict'

const test = require('tape')
const bm = require('browser-manifest')
const Provider = require('.')
const ProviderP = Provider.promises

test('options', function (t) {
  t.plan(4)

  for (const Ctor of [Provider, Provider.promises]) {
    t.same(new Ctor().options, {})
    t.same(new Ctor({ foo: 123 }).options, { foo: 123 })
  }
})

test('manifests()', function (t) {
  t.plan(4 * 2)

  class CallbackProvider extends Provider {
    _manifests (callback) {
      callback(null, [{ name: 'test' }])
    }
  }

  class PromiseProvider extends ProviderP {
    async _manifests () {
      return [{ name: 'test' }]
    }
  }

  for (const Ctor of [CallbackProvider, PromiseProvider]) {
    const provider = new Ctor()

    let sync = true

    provider.manifests(function (err, manifests) {
      t.ifError(err)
      t.same(manifests, [bm({ name: 'test' })])
      t.is(sync, false, 'dezalgoed')
    })

    sync = false

    provider.manifests().then(function (manifests) {
      t.same(manifests, [bm({ name: 'test' })])
    })
  }
})

test('manifests() error', function (t) {
  t.plan(4 * 2)

  class CallbackProvider extends Provider {
    _manifests (callback) {
      callback(new Error('test'))
    }
  }

  class PromiseProvider extends ProviderP {
    async _manifests () {
      throw new Error('test')
    }
  }

  for (const Ctor of [CallbackProvider, PromiseProvider]) {
    const provider = new Ctor()

    let sync = true

    provider.manifests(function (err, manifests) {
      t.is(err.message, 'test')
      t.is(manifests, undefined)
      t.is(sync, false, 'dezalgoed')
    })

    sync = false

    provider.manifests().catch(function (err) {
      t.is(err.message, 'test')
    })
  }
})

test('default manifests()', function (t) {
  t.plan(6)

  for (const Ctor of [Provider, Provider.promises]) {
    const provider = new Ctor()

    provider.manifests(function (err, manifests) {
      t.ifError(err, 'no manifests error')
      t.same(manifests, [])
    })

    provider.manifests().then(function (manifests) {
      t.same(manifests, [])
    })
  }
})

test('browser()', function (t) {
  t.plan(5)

  const mockManifest = { name: 'test' }
  const mockTarget = { url: 'http://localhost' }
  const mockBrowser = {}

  class TestProvider extends Provider {
    _browser (manifest, target) {
      t.is(manifest, mockManifest)
      t.is(target, mockTarget)

      // Should return an abstract-browser instance, not enforced
      return mockBrowser
    }
  }

  const provider = new TestProvider()
  const browser = provider.browser(mockManifest, mockTarget)

  t.is(browser, mockBrowser)
  t.throws(() => provider.browser(), /TypeError: First argument "manifest" must be an object/)
  t.throws(() => provider.browser({}), /TypeError: Second argument "target" must be an object/)
})

test('_browser() must be implemented', function (t) {
  t.plan(2)

  for (const Ctor of [Provider, Provider.promises]) {
    t.throws(() => new Ctor().browser({}, {}), /Error: _browser\(\) is not implemented/)
  }
})

test('default tunnel()', function (t) {
  t.plan(8)

  for (const Ctor of [Provider, Provider.promises]) {
    const provider = new Ctor()

    provider.tunnel(function (err, tunnel) {
      t.ifError(err, 'no tunnel error')
      t.is(tunnel, undefined)
    })

    provider.tunnel().then(function (err, tunnel) {
      t.ifError(err, 'no tunnel error')
      t.is(tunnel, undefined)
    })
  }
})

test('tunnel() with default options', function (t) {
  t.plan(30)

  class MockTunnel {
    close (callback) {
      t.pass('close called')
      callback()
    }
  }

  class ZalgoCallbackProvider extends Provider {
    _tunnel (options, callback) {
      t.same(options, { domains: ['localhost'] }, 'got default options')
      callback(null, new MockTunnel())
    }
  }

  class CallbackProvider extends Provider {
    _tunnel (options, callback) {
      t.same(options, { domains: ['localhost'] }, 'got default options')
      process.nextTick(callback, null, new MockTunnel())
    }
  }

  class PromiseProvider extends ProviderP {
    async _tunnel (options) {
      t.same(options, { domains: ['localhost'] }, 'got default options (2)')
      return new MockTunnel()
    }
  }

  for (const Ctor of [ZalgoCallbackProvider, CallbackProvider, PromiseProvider]) {
    const provider = new Ctor()

    let sync = true

    provider.tunnel(function (err, tunnel) {
      t.ifError(err, 'no tunnel error')
      t.ok(tunnel instanceof MockTunnel, 'got tunnel')
      t.is(sync, false, 'dezalgoed')

      // We have no interface for tunnel yet, but it must have a close
      // function that takes a callback or returns a promise.
      tunnel.close(function () {
        t.pass('closed')
      })
    })

    sync = false

    provider.tunnel().then(function (tunnel) {
      t.ok(tunnel instanceof MockTunnel, 'got tunnel (2)')

      tunnel.close(function () {
        t.pass('closed')
      })
    })
  }
})

test('tunnel() with merged options', function (t) {
  t.plan(20)

  class MockTunnel {
    close (callback) {
      t.pass('close called')
      callback()
    }
  }

  class CallbackProvider extends Provider {
    _tunnel (options, callback) {
      t.same(options, { domains: ['localhost'], foo: 123 }, 'got merged options')
      callback(null, new MockTunnel())
    }
  }

  class PromiseProvider extends ProviderP {
    async _tunnel (options) {
      t.same(options, { domains: ['localhost'], foo: 123 }, 'got merged options (2)')
      return new MockTunnel()
    }
  }

  for (const Ctor of [CallbackProvider, PromiseProvider]) {
    const provider = new Ctor()

    let sync = true

    provider.tunnel({ foo: 123 }, function (err, tunnel) {
      t.ifError(err, 'no tunnel error')
      t.ok(tunnel instanceof MockTunnel, 'got tunnel')
      t.is(sync, false, 'dezalgoed')

      tunnel.close(function () {
        t.pass('closed')
      })
    })

    sync = false

    provider.tunnel({ foo: 123 }).then(function (tunnel) {
      t.ok(tunnel instanceof MockTunnel, 'got tunnel (2)')

      tunnel.close(function () {
        t.pass('closed')
      })
    })
  }
})

test('tunnel() with custom options', function (t) {
  t.plan(20)

  class MockTunnel {
    close (callback) {
      t.pass('close called')
      callback()
    }
  }

  class CallbackProvider extends Provider {
    _tunnel (options, callback) {
      t.same(options, { domains: ['beep'], foo: 123 }, 'got merged options')
      callback(null, new MockTunnel())
    }
  }

  class PromiseProvider extends ProviderP {
    async _tunnel (options) {
      t.same(options, { domains: ['beep'], foo: 123 }, 'got merged options (2)')
      return new MockTunnel()
    }
  }

  for (const Ctor of [CallbackProvider, PromiseProvider]) {
    const provider = new Ctor()

    let sync = true

    provider.tunnel({ foo: 123, domains: ['beep'] }, function (err, tunnel) {
      t.ifError(err, 'no tunnel error')
      t.ok(tunnel instanceof MockTunnel, 'got tunnel')
      t.is(sync, false, 'dezalgoed')

      tunnel.close(function () {
        t.pass('closed')
      })
    })

    sync = false

    provider.tunnel({ foo: 123, domains: ['beep'] }).then(function (tunnel) {
      t.ok(tunnel instanceof MockTunnel, 'got tunnel (2)')

      tunnel.close(function () {
        t.pass('closed')
      })
    })
  }
})

test('supports', function (t) {
  t.plan(2)

  for (const Ctor of [Provider, Provider.promises]) {
    t.same(new Ctor().supports, { callbacks: true, promises: true })
  }
})