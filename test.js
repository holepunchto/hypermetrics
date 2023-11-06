const Hypercore = require('hypercore')
const ram = require('random-access-memory')
const test = require('brittle')
const RAM = require('random-access-memory')
const Corestore = require('corestore')
const promClient = require('prom-client')
const Hyperbee = require('hyperbee')
const Id = require('hypercore-id-encoding')

const HyperMetrics = require('./index')

test('Returns expected metrics', async t => {
  promClient.register.clear()
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
    'hypercore_max_inflight_blocks'
  ])

  t.alike(metricNames, expectedMetrics, 'Has all expected metrics')
})

test('basic length metric', async (t) => {
  promClient.register.clear()
  const metrics = new HyperMetrics(promClient)
  const core = new Hypercore(ram)
  await core.ready()

  metrics.add(core)

  await core.append(Date.now().toString())
  await core.append(Date.now().toString())
  await core.append(Date.now().toString())
  await core.append(Date.now().toString())

  const result = await metrics.getMetricsAsJSON()

  const length = findMetric(result, Id.encode(core.key), 'hypercore_length')
  const indexedLength = findMetric(result, Id.encode(core.key), 'hypercore_indexed_length')
  const contiguousLength = findMetric(result, Id.encode(core.key), 'hypercore_contiguous_length')
  const byteLength = findMetric(result, Id.encode(core.key), 'hypercore_byte_length')

  t.is(length, 4)
  t.is(indexedLength, 4)
  t.is(contiguousLength, 4)
  t.is(byteLength, 52)
})

test('adds core name as label', async (t) => {
  promClient.register.clear()
  const metrics = new HyperMetrics(promClient)
  const core = new Hypercore(ram)
  await core.ready()

  const coreName = 'hypermetrics-test-core'
  metrics.add(core, coreName)

  await core.append(Date.now().toString())
  await core.append(Date.now().toString())
  await core.append(Date.now().toString())

  const result = await metrics.getMetricsAsJSON()

  const length = findMetricByCoreName(result, coreName, 'hypercore_length')

  t.is(length, 3)
})

function findMetric (metrics, key, name) {
  return metrics.find(e => e.name === name).values.find(e => e.labels.key === key).value
}

function findMetricByCoreName (metrics, coreName, name) {
  return metrics.find(e => e.name === name).values.find(e => e.labels.name === coreName).value
}
