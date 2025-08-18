import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  
  // Other metrics
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
  domContentLoaded?: number
  loadComplete?: number
  
  // Memory usage
  usedJSHeapSize?: number
  totalJSHeapSize?: number
  jsHeapSizeLimit?: number
  
  // Navigation timing
  navigationStart?: number
  responseStart?: number
  responseEnd?: number
  domInteractive?: number
  domComplete?: number
}

export interface ComponentPerformance {
  name: string
  renderTime: number
  updateTime: number
  mountTime: number
  unmountTime: number
  renderCount: number
}

/**
 * Composable for performance monitoring and optimization
 * Tracks Core Web Vitals, component performance, and provides optimization utilities
 */
export function usePerformance() {
  const metrics = ref<PerformanceMetrics>({})
  const componentMetrics = ref<Map<string, ComponentPerformance>>(new Map())
  const isMonitoring = ref(false)
  const observer = ref<PerformanceObserver | null>(null)

  // Start performance monitoring
  const startMonitoring = () => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      console.warn('Performance monitoring not supported')
      return
    }

    isMonitoring.value = true

    // Observe Core Web Vitals
    try {
      observer.value = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              metrics.value.lcp = entry.startTime
              break
            case 'first-input':
              metrics.value.fid = (entry as any).processingStart - entry.startTime
              break
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                metrics.value.cls = (metrics.value.cls || 0) + (entry as any).value
              }
              break
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                metrics.value.fcp = entry.startTime
              }
              break
            case 'navigation':
              const navEntry = entry as PerformanceNavigationTiming
              metrics.value.ttfb = navEntry.responseStart - navEntry.requestStart
              metrics.value.navigationStart = navEntry.navigationStart
              metrics.value.responseStart = navEntry.responseStart
              metrics.value.responseEnd = navEntry.responseEnd
              metrics.value.domInteractive = navEntry.domInteractive
              metrics.value.domComplete = navEntry.domComplete
              metrics.value.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.navigationStart
              metrics.value.loadComplete = navEntry.loadEventEnd - navEntry.navigationStart
              break
          }
        }
      })

      // Observe different entry types
      const entryTypes = ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint', 'navigation']
      entryTypes.forEach(type => {
        try {
          observer.value?.observe({ entryTypes: [type] })
        } catch (e) {
          // Some entry types might not be supported
        }
      })
    } catch (error) {
      console.warn('Failed to start performance monitoring:', error)
    }

    // Get memory info if available
    updateMemoryMetrics()
  }

  // Stop performance monitoring
  const stopMonitoring = () => {
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }
    isMonitoring.value = false
  }

  // Update memory metrics
  const updateMemoryMetrics = () => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory
      metrics.value.usedJSHeapSize = memory.usedJSHeapSize
      metrics.value.totalJSHeapSize = memory.totalJSHeapSize
      metrics.value.jsHeapSizeLimit = memory.jsHeapSizeLimit
    }
  }

  // Component performance tracking
  const trackComponent = (name: string) => {
    const startTime = performance.now()
    let renderStartTime = 0
    let renderCount = 0

    const onBeforeMount = () => {
      renderStartTime = performance.now()
    }

    const onMounted = () => {
      const mountTime = performance.now() - startTime
      const renderTime = performance.now() - renderStartTime
      renderCount++

      const existing = componentMetrics.value.get(name)
      componentMetrics.value.set(name, {
        name,
        renderTime,
        updateTime: existing?.updateTime || 0,
        mountTime,
        unmountTime: 0,
        renderCount: existing ? existing.renderCount + 1 : 1
      })
    }

    const onBeforeUpdate = () => {
      renderStartTime = performance.now()
    }

    const onUpdated = () => {
      const updateTime = performance.now() - renderStartTime
      renderCount++

      const existing = componentMetrics.value.get(name)
      if (existing) {
        existing.updateTime = updateTime
        existing.renderCount = renderCount
      }
    }

    const onBeforeUnmount = () => {
      renderStartTime = performance.now()
    }

    const onUnmounted = () => {
      const unmountTime = performance.now() - renderStartTime

      const existing = componentMetrics.value.get(name)
      if (existing) {
        existing.unmountTime = unmountTime
      }
    }

    return {
      onBeforeMount,
      onMounted,
      onBeforeUpdate,
      onUpdated,
      onBeforeUnmount,
      onUnmounted
    }
  }

  // Performance utilities
  const measureFunction = async <T>(name: string, fn: () => Promise<T> | T): Promise<T> => {
    const startTime = performance.now()
    
    try {
      const result = await fn()
      const endTime = performance.now()
      
      console.log(`${name} took ${endTime - startTime} milliseconds`)
      return result
    } catch (error) {
      const endTime = performance.now()
      console.log(`${name} failed after ${endTime - startTime} milliseconds`)
      throw error
    }
  }

  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate = false
  ): T => {
    let timeout: NodeJS.Timeout | null = null
    
    return ((...args: Parameters<T>) => {
      const later = () => {
        timeout = null
        if (!immediate) func(...args)
      }
      
      const callNow = immediate && !timeout
      
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      
      if (callNow) func(...args)
    }) as T
  }

  const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean
    
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }) as T
  }

  const memoize = <T extends (...args: any[]) => any>(
    func: T,
    getKey?: (...args: Parameters<T>) => string
  ): T => {
    const cache = new Map<string, ReturnType<T>>()
    
    return ((...args: Parameters<T>) => {
      const key = getKey ? getKey(...args) : JSON.stringify(args)
      
      if (cache.has(key)) {
        return cache.get(key)!
      }
      
      const result = func(...args)
      cache.set(key, result)
      return result
    }) as T
  }

  // Bundle analysis
  const analyzeBundle = () => {
    if (typeof window === 'undefined') return null

    const scripts = Array.from(document.querySelectorAll('script[src]'))
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    
    const analysis = {
      scripts: scripts.map(script => ({
        src: (script as HTMLScriptElement).src,
        async: (script as HTMLScriptElement).async,
        defer: (script as HTMLScriptElement).defer
      })),
      stylesheets: stylesheets.map(link => ({
        href: (link as HTMLLinkElement).href,
        media: (link as HTMLLinkElement).media
      })),
      totalScripts: scripts.length,
      totalStylesheets: stylesheets.length
    }

    return analysis
  }

  // Resource timing
  const getResourceTiming = () => {
    if (typeof window === 'undefined' || !performance.getEntriesByType) {
      return []
    }

    return performance.getEntriesByType('resource').map(entry => ({
      name: entry.name,
      duration: entry.duration,
      size: (entry as any).transferSize || 0,
      type: (entry as any).initiatorType
    }))
  }

  // Computed metrics
  const performanceScore = computed(() => {
    const { lcp, fid, cls } = metrics.value
    
    if (!lcp || fid === undefined || cls === undefined) return null

    // Simplified scoring based on Core Web Vitals thresholds
    const lcpScore = lcp <= 2500 ? 100 : lcp <= 4000 ? 50 : 0
    const fidScore = fid <= 100 ? 100 : fid <= 300 ? 50 : 0
    const clsScore = cls <= 0.1 ? 100 : cls <= 0.25 ? 50 : 0

    return Math.round((lcpScore + fidScore + clsScore) / 3)
  })

  const memoryUsage = computed(() => {
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = metrics.value
    
    if (!usedJSHeapSize || !totalJSHeapSize || !jsHeapSizeLimit) return null

    return {
      used: Math.round(usedJSHeapSize / 1024 / 1024), // MB
      total: Math.round(totalJSHeapSize / 1024 / 1024), // MB
      limit: Math.round(jsHeapSizeLimit / 1024 / 1024), // MB
      percentage: Math.round((usedJSHeapSize / jsHeapSizeLimit) * 100)
    }
  })

  const slowComponents = computed(() => {
    return Array.from(componentMetrics.value.values())
      .filter(component => component.renderTime > 16) // 60fps threshold
      .sort((a, b) => b.renderTime - a.renderTime)
  })

  // Lifecycle
  onMounted(() => {
    startMonitoring()
    
    // Update memory metrics periodically
    const memoryInterval = setInterval(updateMemoryMetrics, 5000)
    
    onUnmounted(() => {
      stopMonitoring()
      clearInterval(memoryInterval)
    })
  })

  return {
    // State
    metrics,
    componentMetrics,
    isMonitoring,

    // Methods
    startMonitoring,
    stopMonitoring,
    trackComponent,
    measureFunction,
    updateMemoryMetrics,

    // Utilities
    debounce,
    throttle,
    memoize,

    // Analysis
    analyzeBundle,
    getResourceTiming,

    // Computed
    performanceScore,
    memoryUsage,
    slowComponents
  }
}

/**
 * Performance decorator for Vue components
 */
export function withPerformanceTracking(name: string) {
  return function <T extends Record<string, any>>(component: T): T {
    const { trackComponent } = usePerformance()
    const tracker = trackComponent(name)

    return {
      ...component,
      beforeMount: tracker.onBeforeMount,
      mounted: tracker.onMounted,
      beforeUpdate: tracker.onBeforeUpdate,
      updated: tracker.onUpdated,
      beforeUnmount: tracker.onBeforeUnmount,
      unmounted: tracker.onUnmounted
    }
  }
}

/**
 * Global performance instance
 */
export const performance = usePerformance()

