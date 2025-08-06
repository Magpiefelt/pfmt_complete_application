import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import type { Ref } from 'vue'

export interface AccessibilityOptions {
  announceChanges?: boolean
  manageFocus?: boolean
  trapFocus?: boolean
  restoreFocus?: boolean
}

/**
 * Composable for accessibility features
 * Provides screen reader announcements, focus management, and keyboard navigation
 */
export function useAccessibility(options: AccessibilityOptions = {}) {
  const {
    announceChanges = true,
    manageFocus = true,
    trapFocus = false,
    restoreFocus = true
  } = options

  // State
  const announcer = ref<HTMLElement | null>(null)
  const focusStack = ref<HTMLElement[]>([])
  const trapContainer = ref<HTMLElement | null>(null)

  // Create screen reader announcer
  const createAnnouncer = () => {
    if (typeof window === 'undefined') return

    const element = document.createElement('div')
    element.setAttribute('aria-live', 'polite')
    element.setAttribute('aria-atomic', 'true')
    element.setAttribute('class', 'sr-only')
    element.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `
    
    document.body.appendChild(element)
    announcer.value = element
  }

  // Announce message to screen readers
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceChanges || !announcer.value) return

    announcer.value.setAttribute('aria-live', priority)
    announcer.value.textContent = message

    // Clear after announcement
    setTimeout(() => {
      if (announcer.value) {
        announcer.value.textContent = ''
      }
    }, 1000)
  }

  // Focus management
  const saveFocus = () => {
    if (!manageFocus) return

    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement !== document.body) {
      focusStack.value.push(activeElement)
    }
  }

  const restoreFocus = () => {
    if (!manageFocus || focusStack.value.length === 0) return

    const lastFocused = focusStack.value.pop()
    if (lastFocused && lastFocused.focus) {
      nextTick(() => {
        lastFocused.focus()
      })
    }
  }

  const focusElement = (element: HTMLElement | string) => {
    nextTick(() => {
      let targetElement: HTMLElement | null = null

      if (typeof element === 'string') {
        targetElement = document.querySelector(element)
      } else {
        targetElement = element
      }

      if (targetElement && targetElement.focus) {
        targetElement.focus()
      }
    })
  }

  // Focus trap for modals and dialogs
  const setupFocusTrap = (container: HTMLElement) => {
    if (!trapFocus) return

    trapContainer.value = container

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstElement.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }

  const removeFocusTrap = () => {
    trapContainer.value = null
  }

  // Keyboard navigation helpers
  const handleArrowNavigation = (
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: {
      loop?: boolean
      orientation?: 'horizontal' | 'vertical' | 'both'
    } = {}
  ) => {
    const { loop = true, orientation = 'both' } = options
    
    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'horizontal') return
        event.preventDefault()
        newIndex = currentIndex + 1
        break
      case 'ArrowUp':
        if (orientation === 'horizontal') return
        event.preventDefault()
        newIndex = currentIndex - 1
        break
      case 'ArrowRight':
        if (orientation === 'vertical') return
        event.preventDefault()
        newIndex = currentIndex + 1
        break
      case 'ArrowLeft':
        if (orientation === 'vertical') return
        event.preventDefault()
        newIndex = currentIndex - 1
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = items.length - 1
        break
      default:
        return currentIndex
    }

    // Handle bounds
    if (newIndex < 0) {
      newIndex = loop ? items.length - 1 : 0
    } else if (newIndex >= items.length) {
      newIndex = loop ? 0 : items.length - 1
    }

    if (items[newIndex]) {
      items[newIndex].focus()
    }

    return newIndex
  }

  // ARIA helpers
  const setAriaExpanded = (element: HTMLElement, expanded: boolean) => {
    element.setAttribute('aria-expanded', expanded.toString())
  }

  const setAriaSelected = (element: HTMLElement, selected: boolean) => {
    element.setAttribute('aria-selected', selected.toString())
  }

  const setAriaChecked = (element: HTMLElement, checked: boolean | 'mixed') => {
    element.setAttribute('aria-checked', checked.toString())
  }

  const setAriaDisabled = (element: HTMLElement, disabled: boolean) => {
    if (disabled) {
      element.setAttribute('aria-disabled', 'true')
    } else {
      element.removeAttribute('aria-disabled')
    }
  }

  const setAriaLabel = (element: HTMLElement, label: string) => {
    element.setAttribute('aria-label', label)
  }

  const setAriaDescribedBy = (element: HTMLElement, ids: string | string[]) => {
    const idString = Array.isArray(ids) ? ids.join(' ') : ids
    element.setAttribute('aria-describedby', idString)
  }

  // Color contrast helpers
  const checkColorContrast = (foreground: string, background: string): number => {
    const getLuminance = (color: string): number => {
      // Convert hex to RGB
      const hex = color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16) / 255
      const g = parseInt(hex.substr(2, 2), 16) / 255
      const b = parseInt(hex.substr(4, 2), 16) / 255

      // Calculate relative luminance
      const sRGB = [r, g, b].map(c => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })

      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]
    }

    const l1 = getLuminance(foreground)
    const l2 = getLuminance(background)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)

    return (lighter + 0.05) / (darker + 0.05)
  }

  const meetsWCAGAA = (foreground: string, background: string, isLargeText = false): boolean => {
    const ratio = checkColorContrast(foreground, background)
    return isLargeText ? ratio >= 3 : ratio >= 4.5
  }

  const meetsWCAGAAA = (foreground: string, background: string, isLargeText = false): boolean => {
    const ratio = checkColorContrast(foreground, background)
    return isLargeText ? ratio >= 4.5 : ratio >= 7
  }

  // Reduced motion detection
  const prefersReducedMotion = computed(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  // High contrast detection
  const prefersHighContrast = computed(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-contrast: high)').matches
  })

  // Screen reader detection
  const isScreenReaderActive = computed(() => {
    if (typeof window === 'undefined') return false
    return window.navigator.userAgent.includes('NVDA') ||
           window.navigator.userAgent.includes('JAWS') ||
           window.speechSynthesis?.speaking
  })

  // Lifecycle
  onMounted(() => {
    createAnnouncer()
  })

  onUnmounted(() => {
    if (announcer.value) {
      document.body.removeChild(announcer.value)
    }
    if (restoreFocus && focusStack.value.length > 0) {
      restoreFocus()
    }
  })

  return {
    // Announcements
    announce,

    // Focus management
    saveFocus,
    restoreFocus,
    focusElement,
    setupFocusTrap,
    removeFocusTrap,

    // Keyboard navigation
    handleArrowNavigation,

    // ARIA helpers
    setAriaExpanded,
    setAriaSelected,
    setAriaChecked,
    setAriaDisabled,
    setAriaLabel,
    setAriaDescribedBy,

    // Color contrast
    checkColorContrast,
    meetsWCAGAA,
    meetsWCAGAAA,

    // User preferences
    prefersReducedMotion,
    prefersHighContrast,
    isScreenReaderActive
  }
}

/**
 * Composable for keyboard shortcuts
 */
export function useKeyboardShortcuts() {
  const shortcuts = ref<Map<string, () => void>>(new Map())

  const normalizeKey = (event: KeyboardEvent): string => {
    const parts: string[] = []
    
    if (event.ctrlKey) parts.push('ctrl')
    if (event.altKey) parts.push('alt')
    if (event.shiftKey) parts.push('shift')
    if (event.metaKey) parts.push('meta')
    
    parts.push(event.key.toLowerCase())
    
    return parts.join('+')
  }

  const handleKeydown = (event: KeyboardEvent) => {
    const key = normalizeKey(event)
    const handler = shortcuts.value.get(key)
    
    if (handler) {
      event.preventDefault()
      handler()
    }
  }

  const register = (key: string, handler: () => void) => {
    shortcuts.value.set(key.toLowerCase(), handler)
  }

  const unregister = (key: string) => {
    shortcuts.value.delete(key.toLowerCase())
  }

  const clear = () => {
    shortcuts.value.clear()
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    clear()
  })

  return {
    register,
    unregister,
    clear
  }
}

/**
 * Global accessibility instance
 */
export const accessibility = useAccessibility({
  announceChanges: true,
  manageFocus: true,
  trapFocus: false,
  restoreFocus: true
})

