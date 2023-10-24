const test = require('brittle')
const RAM = require('random-access-memory')
const Corestore = require('corestore')
const promClient = require('prom-client')
const Hyperbee = require('hyperbee')

const HyperMetrics = require('./index')

test('Returns expected metrics', async t => {
  const store = new Corestore(RAM)
  const core = store.get({ name: 'core' })
  await core.ready()
  const bee = new Hyperbee(store.get({ name: 'bee' }))
  await bee.ready()

  const metrics = new HyperMetrics(promClient)
  metrics.add(core)
  const metricNames = new Set((await metrics.getMetricsAsJSON()).map(entry => entry.name))

  const expectedMetrics = new Set([
    'hypercore_length',
    'hypercore_indexed_length',
    'hypercore_contiguous_length',
    'hypercore_byte_length',
    'hypercore_contiguous_byte_length',
    'hypercore_fork',
    'hypercore_peers',
    'hypercore_uploaded_blocks',
    'hypercore_downloaded_blocks',
    'hypercore_nr_inflight_blocks',
    'hypercore_max_inflight_blocks',
    'hyperbee_put_operations',
    'hyperbee_del_operations'
  ])

  t.alike(metricNames, expectedMetrics, 'Has all expected metrics')
})
