const Id = require('hypercore-id-encoding')

class HypermetricsBee {
  constructor (client) {
    this.client = client

    this.putOperations = new this.client.Counter({
      name: 'hyperbee_put_operations',
      help: 'hyperbee number of put operations',
      labelNames: ['key', 'type']
    })

    this.delOperations = new this.client.Counter({
      name: 'hyperbee_del_operations',
      help: 'hyperbee number of del operations',
      labelNames: ['key', 'type']
    })
  }

  add (bee) {
    bee.createHistoryStream({ live: true }).on('data', (op) => {
      if (op.type === 'put') {
        this.putOperations.labels({ key: Id.encode(bee.core.key), type: 'hyperbee' }).inc()
      }
      if (op.type === 'del') {
        this.delOperations.labels({ key: Id.encode(bee.core.key), type: 'hyperbee' }).inc()
      }
    })
  }

  get register () {
    return this.client.register
  }

  getMetricsAsJSON () {
    return this.client.register.getMetricsAsJSON()
  }
}

module.exports = HypermetricsBee
