const Id = require('hypercore-id-encoding')

const DEFAULT_NO_NAME = 'NO_NAME'

class Hypermetrics {
  constructor (client) {
    this.client = client
    this.uploadSpeedometers = new Map()
    this.downloadSpeedometers = new Map()
    this._cores = [] // TODO change to set
    this._names = new Map()
    this._labelNames = ['key', 'type', 'name']

    const self = this

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_length',
      help: 'hypercore length',
      labelNames: this._labelNames,
      collect () {
        self._collectMetric((core) => core.length, this)
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_indexed_length',
      help: 'hypercore indexed length',
      labelNames: this._labelNames,
      collect () {
        self._collectMetric((core) => core.indexedLength, this)
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_contiguous_length',
      help: 'hypercore contiguous length',
      labelNames: this._labelNames,
      collect () {
        self._collectMetric((core) => core.contiguousLength, this)
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_byte_length',
      help: 'hypercore byte length',
      labelNames: this._labelNames,
      collect () {
        self._collectMetric((core) => core.byteLength, this)
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_contiguous_byte_length',
      help: 'hypercore contiguous byte length',
      labelNames: this._labelNames,
      collect () {
        self._collectMetric((core) => core.contiguousByteLength, this)
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_fork',
      help: 'hypercore fork',
      labelNames: this._labelNames,
      collect () {
        self._collectMetric((core) => core.fork, this)
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_nr_inflight_blocks',
      help: 'Total number of blocks in flight per core (summed across all peers)',
      labelNames: this._labelNames,
      collect () {
        self._collectMetric((core) => {
          return core.peers.reduce((total, peer) => total + peer.inflight, 0)
        }, this)
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_max_inflight_blocks',
      help: 'Max number of blocks in flight per core (summed across all peers)',
      labelNames: this._labelNames,
      collect () {
        self._collectMetric((core) => {
          return core.peers.reduce((total, peer) => total + peer.getMaxInflight(), 0)
        }, this)
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'hypercore_peers',
      help: 'hypercore number of peers',
      labelNames: this._labelNames,
      collect () {
        self._collectMetric((core) => core.peers.length, this)
      }
    })

    this.uploadedBlocks = new this.client.Counter({
      name: 'hypercore_uploaded_blocks',
      help: 'hypercore uploaded blocks',
      labelNames: this._labelNames
    })

    this.downloadedBlocks = new this.client.Counter({
      name: 'hypercore_downloaded_blocks',
      help: 'hypercore downloaded blocks',
      labelNames: this._labelNames
    })
  }

  add (core, opts = {}) {
    const key = Id.encode(core.key)
    const name = opts.name || DEFAULT_NO_NAME
    this._cores.push(core)
    this._names.set(key, name)
    core.on('upload', () => this.uploadedBlocks.labels({ key, type: 'hypercore', name }).inc())
    core.on('download', () => this.downloadedBlocks.labels({ key, type: 'hypercore', name }).inc())
  }

  _collectMetric (getValue, metric) {
    for (const core of this._cores) {
      const key = Id.encode(core.key)
      const name = this._names.get(key)
      metric.labels({ key, type: 'hypercore', name }).set(getValue(core))
    }
  }

  get register () {
    return this.client.register
  }

  async getMetricsAsJSON () {
    return this.client.register.getMetricsAsJSON()
  }
}

module.exports = Hypermetrics
