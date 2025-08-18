import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface Breakpoints {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouch: boolean
  orientation: 'portrait' | 'landscape'
  pixelRatio: number
}

/**
 * Composable for responsive design and device detection
 * Provides breakpoint detection, device info, and responsive utilities
 */
export function useResponsive(customBreakpoints?: Partial<Breakpoints>) {
  // Default Tailwind CSS breakpoints
  const defaultBreakpoints: Breakpoints = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  }

  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints }

  // Reactive state
  const windowWidth = ref(0)
  const windowHeight = ref(0)
  const orientation = ref<'portrait' | 'landscape'>('portrait')

  // Update dimensions
  const updateDimensions = () => {
    if (typeof window !== 'undefined') {
      windowWidth.value = window.innerWidth
      windowHeight.value = window.innerHeight
      orientation.value = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    }
  }

  // Breakpoint detection
  const isXs = computed(() => windowWidth.value >= breakpoints.xs && windowWidth.value < breakpoints.sm)
  const isSm = computed(() => windowWidth.value >= breakpoints.sm && windowWidth.value < breakpoints.md)
  const isMd = computed(() => windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg)
  const isLg = computed(() => windowWidth.value >= breakpoints.lg && windowWidth.value < breakpoints.xl)
  const isXl = computed(() => windowWidth.value >= breakpoints.xl && windowWidth.value < breakpoints['2xl'])
  const is2xl = computed(() => windowWidth.value >= breakpoints['2xl'])

  // Convenience breakpoints
  const isSmAndUp = computed(() => windowWidth.value >= breakpoints.sm)
  const isMdAndUp = computed(() => windowWidth.value >= breakpoints.md)
  const isLgAndUp = computed(() => windowWidth.value >= breakpoints.lg)
  const isXlAndUp = computed(() => windowWidth.value >= breakpoints.xl)
  const is2xlAndUp = computed(() => windowWidth.value >= breakpoints['2xl'])

  const isSmAndDown = computed(() => windowWidth.value < breakpoints.md)
  const isMdAndDown = computed(() => windowWidth.value < breakpoints.lg)
  const isLgAndDown = computed(() => windowWidth.value < breakpoints.xl)
  const isXlAndDown = computed(() => windowWidth.value < breakpoints['2xl'])

  // Current breakpoint
  const currentBreakpoint = computed(() => {
    if (is2xl.value) return '2xl'
    if (isXl.value) return 'xl'
    if (isLg.value) return 'lg'
    if (isMd.value) return 'md'
    if (isSm.value) return 'sm'
    return 'xs'
  })

  // Device detection
  const deviceInfo = computed((): DeviceInfo => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        orientation: 'landscape',
        pixelRatio: 1
      }
    }

    const userAgent = window.navigator.userAgent.toLowerCase()
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent)
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    return {
      isMobile: isMobile && !isTablet,
      isTablet,
      isDesktop: !isMobile && !isTablet,
      isTouch,
      orientation: orientation.value,
      pixelRatio: window.devicePixelRatio || 1
    }
  })

  // Responsive utilities
  const getResponsiveValue = <T>(values: Partial<Record<keyof Breakpoints, T>>): T | undefined => {
    const sortedBreakpoints = Object.entries(breakpoints)
      .sort(([, a], [, b]) => b - a) // Sort descending

    for (const [breakpoint] of sortedBreakpoints) {
      const key = breakpoint as keyof Breakpoints
      if (windowWidth.value >= breakpoints[key] && values[key] !== undefined) {
        return values[key]
      }
    }

    return undefined
  }

  const matchesBreakpoint = (breakpoint: keyof Breakpoints | string): boolean => {
    if (typeof breakpoint === 'string') {
      // Handle custom queries like "md-lg" or ">lg"
      if (breakpoint.includes('-')) {
        const [start, end] = breakpoint.split('-') as [keyof Breakpoints, keyof Breakpoints]
        return windowWidth.value >= breakpoints[start] && windowWidth.value < breakpoints[end]
      }
      
      if (breakpoint.startsWith('>')) {
        const bp = breakpoint.slice(1) as keyof Breakpoints
        return windowWidth.value > breakpoints[bp]
      }
      
      if (breakpoint.startsWith('<')) {
        const bp = breakpoint.slice(1) as keyof Breakpoints
        return windowWidth.value < breakpoints[bp]
      }
      
      if (breakpoint.startsWith('>=')) {
        const bp = breakpoint.slice(2) as keyof Breakpoints
        return windowWidth.value >= breakpoints[bp]
      }
      
      if (breakpoint.startsWith('<=')) {
        const bp = breakpoint.slice(2) as keyof Breakpoints
        return windowWidth.value <= breakpoints[bp]
      }
    }

    return currentBreakpoint.value === breakpoint
  }

  // Grid utilities
  const getGridColumns = (config: Partial<Record<keyof Breakpoints, number>>): number => {
    return getResponsiveValue(config) || 1
  }

  const getContainerMaxWidth = (): string => {
    const maxWidths = {
      xs: '100%',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    }

    return getResponsiveValue(maxWidths) || '100%'
  }

  // Touch utilities
  const isTouchDevice = computed(() => deviceInfo.value.isTouch)
  const isHoverCapable = computed(() => !deviceInfo.value.isTouch)

  // Orientation utilities
  const isPortrait = computed(() => orientation.value === 'portrait')
  const isLandscape = computed(() => orientation.value === 'landscape')

  // Screen density utilities
  const isHighDensity = computed(() => deviceInfo.value.pixelRatio > 1.5)
  const isRetinaDisplay = computed(() => deviceInfo.value.pixelRatio >= 2)

  // Viewport utilities
  const viewportWidth = computed(() => windowWidth.value)
  const viewportHeight = computed(() => windowHeight.value)
  const aspectRatio = computed(() => windowWidth.value / windowHeight.value)

  // Safe area utilities (for mobile devices with notches)
  const safeAreaInsets = computed(() => {
    if (typeof window === 'undefined' || typeof CSS === 'undefined' || !CSS.supports) {
      return { top: 0, right: 0, bottom: 0, left: 0 }
    }

    const getInset = (property: string): number => {
      if (CSS.supports(`padding: env(${property})`)) {
        const element = document.createElement('div')
        element.style.padding = `env(${property})`
        document.body.appendChild(element)
        const value = parseInt(getComputedStyle(element).paddingTop) || 0
        document.body.removeChild(element)
        return value
      }
      return 0
    }

    return {
      top: getInset('safe-area-inset-top'),
      right: getInset('safe-area-inset-right'),
      bottom: getInset('safe-area-inset-bottom'),
      left: getInset('safe-area-inset-left')
    }
  })

  // Event listeners
  const handleResize = () => {
    updateDimensions()
  }

  const handleOrientationChange = () => {
    // Delay to ensure dimensions are updated after orientation change
    setTimeout(updateDimensions, 100)
  }

  // Lifecycle
  onMounted(() => {
    updateDimensions()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  })

  return {
    // Dimensions
    windowWidth,
    windowHeight,
    viewportWidth,
    viewportHeight,
    aspectRatio,

    // Breakpoints
    breakpoints,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    isSmAndUp,
    isMdAndUp,
    isLgAndUp,
    isXlAndUp,
    is2xlAndUp,
    isSmAndDown,
    isMdAndDown,
    isLgAndDown,
    isXlAndDown,
    currentBreakpoint,

    // Device info
    deviceInfo,
    isTouchDevice,
    isHoverCapable,

    // Orientation
    orientation,
    isPortrait,
    isLandscape,

    // Screen density
    isHighDensity,
    isRetinaDisplay,

    // Safe area
    safeAreaInsets,

    // Utilities
    getResponsiveValue,
    matchesBreakpoint,
    getGridColumns,
    getContainerMaxWidth
  }
}

/**
 * Global responsive instance
 */
export const responsive = useResponsive()

/**
 * Utility function for responsive classes
 */
export function responsiveClasses(
  classes: Partial<Record<keyof Breakpoints | 'default', string>>
): string {
  const { currentBreakpoint, matchesBreakpoint } = responsive

  const classArray: string[] = []

  // Add default classes
  if (classes.default) {
    classArray.push(classes.default)
  }

  // Add breakpoint-specific classes
  Object.entries(classes).forEach(([breakpoint, className]) => {
    if (breakpoint !== 'default' && className && matchesBreakpoint(breakpoint)) {
      classArray.push(className)
    }
  })

  return classArray.join(' ')
}

/**
 * Utility function for responsive styles
 */
export function responsiveStyles(
  styles: Partial<Record<keyof Breakpoints | 'default', Record<string, string>>>
): Record<string, string> {
  const { getResponsiveValue } = responsive

  const result: Record<string, string> = {}

  // Get all unique style properties
  const allProperties = new Set<string>()
  Object.values(styles).forEach(styleObj => {
    if (styleObj) {
      Object.keys(styleObj).forEach(prop => allProperties.add(prop))
    }
  })

  // Apply responsive values for each property
  allProperties.forEach(property => {
    const values: Partial<Record<keyof Breakpoints, string>> = {}
    
    Object.entries(styles).forEach(([breakpoint, styleObj]) => {
      if (styleObj && styleObj[property]) {
        if (breakpoint === 'default') {
          values.xs = styleObj[property]
        } else {
          values[breakpoint as keyof Breakpoints] = styleObj[property]
        }
      }
    })

    const value = getResponsiveValue(values)
    if (value) {
      result[property] = value
    }
  })

  return result
}

