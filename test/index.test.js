const Hypercore = require('hypercore')
const Hyperbee = require('hyperbee')
const ram = require('random-access-memory')
const test = require('brittle')
const { Hypermetrics, HypermetricsBee, HypermetricsAutobase } = require('../index.js')
const Id = require('hypercore-id-encoding')
const Corestore = require('corestore')
const Autobase = require('@holepunchto/autobase')

const client = require('prom-client')
const metrics = new Hypermetrics(client)
const beeMetrics = new HypermetricsBee(client)
const autobaseMetrics = new HypermetricsAutobase(client)

test('basic length metric', async (t) => {
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

test('hyperbee metrics', async (t) => {
  const core = new Hypercore(ram)
  const bee = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'utf-8' })
  await core.ready()
  await bee.ready()

  beeMetrics.add(bee)

  await bee.put('key', 'value')
  await bee.del('key')

  await new Promise((resolve) => setTimeout(resolve, 100))

  const result = await beeMetrics.getMetricsAsJSON()
  const putOperations = findMetric(result, Id.encode(core.key), 'hyperbee_put_operations')
  const delOperations = findMetric(result, Id.encode(core.key), 'hyperbee_del_operations')

  t.is(putOperations, 1)
  t.is(delOperations, 1)
})

test('autobase metrics', async (t) => {
  const store = new Corestore(ram)
  await store.ready()
  const base = new Autobase(store, [], { apply, open })
  await base.ready()

  autobaseMetrics.add(base)

  const result = await autobaseMetrics.getMetricsAsJSON()
  const activeWriters = findMetric(result, base.local.id, 'autobase_active_writers')

  t.is(activeWriters, 1)

  function open (store) {
    return store.get('test')
  }

  async function apply (nodes, view, base) {
  }
})

function findMetric (metrics, key, name) {
  return metrics.find(e => e.name === name).values.find(e => e.labels.key === key).value
}
