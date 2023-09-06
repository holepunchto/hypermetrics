const Hypercore = require('hypercore')
const ram = require('random-access-memory')
const test = require('brittle')
const Hypermetrics = require('../index.js')

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

  const length = findMetric(result, core.key.toString('hex'), 'hypercore_length')
  const indexedLength = findMetric(result, core.key.toString('hex'), 'hypercore_indexed_length')
  const contiguousLength = findMetric(result, core.key.toString('hex'), 'hypercore_contiguous_length')
  const byteLength = findMetric(result, core.key.toString('hex'), 'hypercore_byte_length')

  t.is(length, 4)
  t.is(indexedLength, 4)
  t.is(contiguousLength, 4)
  t.is(byteLength, 52)
})

function findMetric (metrics, key, name) {
  return metrics.find(e => e.name === name).values.find(e => e.labels.key === key).value
}
