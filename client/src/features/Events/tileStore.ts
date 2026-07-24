import { clear, createStore, del, entries, get, set } from 'idb-keyval'

import { getEvents } from '@/api/events'
import type { BBox, EventFeature, EventsQuery } from '@/types/event'
import type { EventFilters } from '@/types/filter'

const CACHE_VERSION = 1
const IDB_TTL_MS = 30 * 24 * 60 * 60 * 1000
const tileIdbStore = createStore('geotensions', 'event-tiles')

interface TileData {
  features: EventFeature[]
  isTruncated: boolean
  fetchedAt: number
}

interface StoredTile {
  data: TileData
  lastModified: string
}

interface FetchTileOptions {
  key: string
  bbox: BBox
  filters: EventFilters
  fields: string[]
  limit: number
  signal: AbortSignal
  revalidate?: boolean
}

export class TileStore {
  private tiles = new Map<string, TileData>()
  private loading = new Set<string>()
  private lastModified = new Map<string, string>()
  private listeners = new Set<() => void>()
  private bumpTimer: ReturnType<typeof setTimeout> | null = null
  private version = 0

  /**
   * Clear IndexedDB if CACHE_VERSION has been bumped since last visit.
   * Then run a TTL soft cleanup: evict tiles whose fetchedAt exceeds IDB_TTL_MS.
   */
  static async init(): Promise<void> {
    const storedVersion = await get<number>('__version__', tileIdbStore)
    if (storedVersion !== CACHE_VERSION) {
      await clear(tileIdbStore)
      await set('__version__', CACHE_VERSION, tileIdbStore)
      return
    }

    const now = Date.now()
    const allEntries = await entries<string, StoredTile>(tileIdbStore)
    const expiredKeys = allEntries
      .filter(([key, value]) => key !== '__version__' && now - value.data.fetchedAt > IDB_TTL_MS)
      .map(([key]) => key)
    await Promise.all(expiredKeys.map((key) => del(key, tileIdbStore)))
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): number => this.version

  getData(key: string): TileData | null {
    return this.tiles.get(key) ?? null
  }

  isLoading(key: string): boolean {
    return this.loading.has(key)
  }

  prune(activeKeys: Set<string>): void {
    const staleTileKeys = [...this.tiles.keys()].filter((key) => !activeKeys.has(key))
    const staleLoadingKeys = [...this.loading].filter((key) => !activeKeys.has(key))

    for (const key of staleTileKeys) {
      this.tiles.delete(key)
      this.lastModified.delete(key)
    }
    for (const key of staleLoadingKeys) {
      this.loading.delete(key)
    }

    if (staleTileKeys.length || staleLoadingKeys.length) {
      this.bump()
    }
  }

  async fetchTile({
    key,
    bbox,
    filters,
    fields,
    limit,
    signal,
    revalidate = false,
  }: FetchTileOptions): Promise<void> {
    try {
      signal.throwIfAborted()

      if (!this.tiles.has(key)) {
        const stored = await get<StoredTile>(key, tileIdbStore)
        signal.throwIfAborted()
        if (stored) {
          this.tiles.set(key, stored.data)
          this.lastModified.set(key, stored.lastModified)
          this.bump()
        }
      }

      if (!revalidate) return

      if (this.loading.has(key)) return
      signal.throwIfAborted()
      this.loading.add(key)
      this.bump()

      try {
        const query: EventsQuery = { bbox, filters, fields, limit }
        const result = await getEvents(query, {
          ifModifiedSince: this.lastModified.get(key),
          signal,
        })

        if (!result) return

        const tileData: TileData = {
          features: result.data.features,
          isTruncated: result.data.is_truncated,
          fetchedAt: Date.now(),
        }
        this.tiles.set(key, tileData)
        this.lastModified.set(key, result.lastModified)

        set(
          key,
          { data: tileData, lastModified: result.lastModified } satisfies StoredTile,
          tileIdbStore
        ).catch((err) => {
          console.error('IDB write failed:', err)
        })
      } finally {
        this.loading.delete(key)
        this.bump()
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('Tile fetch failed:', err)
      this.bump()
    }
  }

  private bump(): void {
    this.version++
    this.scheduleNotify()
  }

  private scheduleNotify(): void {
    if (this.bumpTimer) clearTimeout(this.bumpTimer)
    this.bumpTimer = setTimeout(() => {
      this.bumpTimer = null
      this.notifyListeners()
    }, 80)
  }

  private notifyListeners(): void {
    for (const l of this.listeners) l()
  }
}

export const tileStore = new TileStore()
