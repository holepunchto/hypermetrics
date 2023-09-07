const Hypercore = require('hypercore')
const Hyperbee = require('hyperbee')
const ram = require('random-access-memory')
const test = require('brittle')
const Hypermetrics = require('../index.js')
const Id = require('hypercore-id-encoding')

const client = require('prom-client')
const metrics = new Hypermetrics(client)

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

  metrics.addBee(bee)

  await bee.put('key', 'value')
  await bee.del('key')

  await new Promise((resolve) => setTimeout(resolve, 100))

  const result = await metrics.getMetricsAsJSON()
  const putOperations = findMetric(result, Id.encode(core.key), 'hyperbee_put_operations')
  const delOperations = findMetric(result, Id.encode(core.key), 'hyperbee_del_operations')

  t.is(putOperations, 1)
  t.is(delOperations, 1)
})

function findMetric (metrics, key, name) {
  return metrics.find(e => e.name === name).values.find(e => e.labels.key === key).value
}
