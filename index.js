class Hypermetrics {
  constructor (client) {
    this.client = client
    this.uploadSpeedometers = new Map()
    this.downloadSpeedometers = new Map()
    this.cores = []

    // for collect functions context
    const cores = this.cores

    new this.client.Gauge({
      name: 'hypercore_length',
      help: 'hypercore length',
      labelNames: ['key'],
      collect () {
        for (const core of cores) {
          this.labels({ key: core.key.toString('hex') }).set(core.length)
        }
      }
    })

    new this.client.Gauge({
      name: 'hypercore_indexed_length',
      help: 'hypercore indexed length',
      labelNames: ['key'],
      collect () {
        for (const core of cores) {
          this.labels({ key: core.key.toString('hex') }).set(core.indexedLength)
        }
      }
    })

    new this.client.Gauge({
      name: 'hypercore_contiguous_length',
      help: 'hypercore contiguous length',
      labelNames: ['key'],
      collect () {
        for (const core of cores) {
          this.labels({ key: core.key.toString('hex') }).set(core.contiguousLength)
        }
      }
    })

    new this.client.Gauge({
      name: 'hypercore_byte_length',
      help: 'hypercore byte length',
      labelNames: ['key'],
      collect () {
        for (const core of cores) {
          this.labels({ key: core.key.toString('hex') }).set(core.byteLength)
        }
      }
    })

    new this.client.Gauge({
      name: 'hypercore_contiguous_byte_length',
      help: 'hypercore contiguous byte length',
      labelNames: ['key'],
      collect () {
        for (const core of cores) {
          this.labels({ key: core.key.toString('hex') }).set(core.contiguousByteLength)
        }
      }
    })

    new this.client.Gauge({
      name: 'hypercore_fork',
      help: 'hypercore fork',
      labelNames: ['key'],
      collect () {
        for (const core of cores) {
          this.labels({ key: core.key.toString('hex') }).set(core.fork)
        }
      }
    })

    new this.client.Gauge({
      name: 'hypercore_peers',
      help: 'hypercore number of peers',
      labelNames: ['key'],
      collect () {
        for (const core of cores) {
          this.labels({ key: core.key.toString('hex') }).set(core.peers.length)
        }
      }
    })

    this.uploadedBlocks = new this.client.Counter({
      name: 'hypercore_uploaded_blocks',
      help: 'hypercore uploaded blocks',
      labelNames: ['key']
    })

    this.downloadedBlocks = new this.client.Counter({
      name: 'hypercore_downloaded_blocks',
      help: 'hypercore downloaded blocks',
      labelNames: ['key']
    })
  }

  add (core) {
    this.cores.push(core)
    core.on('upload', () => this.uploadedBlocks.labels(core.key.toString('hex')).inc())
    core.on('download', () => this.downloadedBlocks.labels(core.key.toString('hex')).inc())
  }

  get register () {
    return this.client.register
  }

  getMetricsAsJSON () {
    return this.client.register.getMetricsAsJSON()
  }
}

module.exports = Hypermetrics
