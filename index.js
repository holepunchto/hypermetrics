const Id = require('hypercore-id-encoding')

const DEFAULT_NO_NAME = 'NO_NAME'

class Hypermetrics {
  constructor (client) {
    this.client = client
    this.uploadSpeedometers = new Map()
    this.downloadSpeedometers = new Map()
    this.cores = [] // TODO change to set
    this.names = new Map()

    // for collect functions context
    const cores = this.cores
    const names = this.names

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_length',
      help: 'hypercore length',
      labelNames: ['key', 'type', 'name'],
      collect () {
        for (const core of cores) {
          const key = Id.encode(core.key)
          const name = names.get(key)
          this.labels({ key, type: 'hypercore', name }).set(core.length)
        }
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_indexed_length',
      help: 'hypercore indexed length',
      labelNames: ['key', 'type', 'name'],
      collect () {
        for (const core of cores) {
          const key = Id.encode(core.key)
          const name = names.get(key)
          this.labels({ key, type: 'hypercore', name }).set(core.indexedLength)
        }
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_contiguous_length',
      help: 'hypercore contiguous length',
      labelNames: ['key', 'type', 'name'],
      collect () {
        for (const core of cores) {
          const key = Id.encode(core.key)
          const name = names.get(key)
          this.labels({ key, type: 'hypercore', name }).set(core.contiguousLength)
        }
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_byte_length',
      help: 'hypercore byte length',
      labelNames: ['key', 'type', 'name'],
      collect () {
        for (const core of cores) {
          const key = Id.encode(core.key)
          const name = names.get(key)
          this.labels({ key, type: 'hypercore', name }).set(core.byteLength)
        }
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_contiguous_byte_length',
      help: 'hypercore contiguous byte length',
      labelNames: ['key', 'type', 'name'],
      collect () {
        for (const core of cores) {
          const key = Id.encode(core.key)
          const name = names.get(key)
          this.labels({ key, type: 'hypercore', name }).set(core.contiguousByteLength)
        }
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_fork',
      help: 'hypercore fork',
      labelNames: ['key', 'type', 'name'],
      collect () {
        for (const core of cores) {
          const key = Id.encode(core.key)
          const name = names.get(key)
          this.labels({ key, type: 'hypercore', name }).set(core.fork)
        }
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_nr_inflight_blocks',
      help: 'Total number of blocks in flight per core (summed across all peers)',
      labelNames: ['key', 'type', 'name'],
      collect () {
        for (const core of cores) {
          const key = Id.encode(core.key)
          const name = names.get(key)
          this.labels({ key, type: 'hypercore', name }).set(
            core.peers.reduce((total, peer) => total + peer.inflight, 0)
          )
        }
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_max_inflight_blocks',
      help: 'Max number of blocks in flight per core (summed across all peers)',
      labelNames: ['key', 'type', 'name'],
      collect () {
        for (const core of cores) {
          const key = Id.encode(core.key)
          const name = names.get(key)
          this.labels({ key, type: 'hypercore', name }).set(
            core.peers.reduce((total, peer) => total + peer.getMaxInflight(), 0)
          )
        }
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_peers',
      help: 'hypercore number of peers',
      labelNames: ['key', 'type', 'name'],
      collect () {
        for (const core of cores) {
          const key = Id.encode(core.key)
          const name = names.get(key)
          this.labels({ key, type: 'hypercore', name }).set(core.peers.length)
        }
      }
    })

    this.uploadedBlocks = new this.client.Counter({
      name: 'hypercore_uploaded_blocks',
      help: 'hypercore uploaded blocks',
      labelNames: ['key', 'type', 'name']
    })

    this.downloadedBlocks = new this.client.Counter({
      name: 'hypercore_downloaded_blocks',
      help: 'hypercore downloaded blocks',
      labelNames: ['key', 'type', 'name']
    })

    this.putOperations = new this.client.Counter({
      name: 'hyperbee_put_operations',
      help: 'hyperbee number of put operations',
      labelNames: ['key', 'type', 'name']
    })

    this.delOperations = new this.client.Counter({
      name: 'hyperbee_del_operations',
      help: 'hyperbee number of del operations',
      labelNames: ['key', 'type', 'name']
    })
  }

  add (core, name = DEFAULT_NO_NAME) {
    this.cores.push(core)
    const key = Id.encode(core.key)
    this.names.set(key, name)
    core.on('upload', () => this.uploadedBlocks.labels({ key, type: 'hypercore', name }).inc())
    core.on('download', () => this.downloadedBlocks.labels({ key, type: 'hypercore', name }).inc())
  }

  addBee (bee) {
    this.add(bee.core)
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

  async getMetricsAsJSON () {
    return this.client.register.getMetricsAsJSON()
  }
}

module.exports = Hypermetrics
