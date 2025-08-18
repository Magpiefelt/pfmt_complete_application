<template>
  <div class="wizard-error">
    <div class="error-container">
      <!-- Error Icon -->
      <div class="error-icon-container">
        <div class="error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
      </div>

      <!-- Error Message -->
      <div class="error-content">
        <h2 class="error-title">{{ errorTitle }}</h2>
        <p class="error-description">{{ errorMessage }}</p>
        
        <!-- Error Details (if available) -->
        <div v-if="errorDetails" class="error-details">
          <details class="details-toggle">
            <summary class="details-summary">Technical Details</summary>
            <div class="details-content">
              <pre class="error-stack">{{ errorDetails }}</pre>
            </div>
          </details>
        </div>
      </div>

      <!-- Suggested Actions -->
      <div class="error-actions">
        <h3 class="actions-title">What can you do?</h3>
        <div class="actions-list">
          <div
            v-for="action in suggestedActions"
            :key="action.id"
            class="action-item"
          >
            <div class="action-icon">{{ action.icon }}</div>
            <div class="action-content">
              <div class="action-title">{{ action.title }}</div>
              <div class="action-description">{{ action.description }}</div>
            </div>
            <button
              v-if="action.handler"
              @click="action.handler"
              class="action-button"
            >
              {{ action.buttonText }}
            </button>
          </div>
        </div>
      </div>

      <!-- Primary Actions -->
      <div class="primary-actions">
        <button
          @click="retryOperation"
          class="btn btn-primary"
          :disabled="isRetrying"
        >
          {{ isRetrying ? 'Retrying...' : 'Try Again' }}
        </button>
        
        <button
          @click="goBack"
          class="btn btn-secondary"
        >
          Go Back
        </button>
        
        <button
          @click="goHome"
          class="btn btn-outline"
        >
          Go to Dashboard
        </button>
      </div>

      <!-- Support Options -->
      <div class="support-options">
        <button @click="reportError" class="support-link">
          🐛 Report this error
        </button>
        <button @click="contactSupport" class="support-link">
          💬 Contact Support
        </button>
        <button @click="viewDocs" class="support-link">
          📚 View Documentation
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectWizardIntegration } from '@/composables/useProjectWizardIntegration'

// Props
interface Props {
  error?: Error | string
  errorType?: 'network' | 'validation' | 'permission' | 'server' | 'unknown'
  canRetry?: boolean
  retryHandler?: () => Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  errorType: 'unknown',
  canRetry: true
})

// Composables
const router = useRouter()
const { wizardStore } = useProjectWizardIntegration()

// State
const isRetrying = ref(false)

// Computed properties
const errorTitle = computed(() => {
  const titles = {
    network: 'Connection Error',
    validation: 'Validation Error',
    permission: 'Permission Denied',
    server: 'Server Error',
    unknown: 'Something Went Wrong'
  }
  return titles[props.errorType] || titles.unknown
})

const errorMessage = computed(() => {
  if (typeof props.error === 'string') {
    return props.error
  }
  
  if (props.error instanceof Error) {
    return props.error.message
  }
  
  const messages = {
    network: 'Unable to connect to the server. Please check your internet connection and try again.',
    validation: 'The information provided is invalid or incomplete. Please review your input and try again.',
    permission: 'You do not have permission to perform this action. Please contact your administrator.',
    server: 'The server encountered an error while processing your request. Please try again later.',
    unknown: 'An unexpected error occurred. Please try again or contact support if the problem persists.'
  }
  
  return messages[props.errorType] || messages.unknown
})

const errorDetails = computed(() => {
  if (props.error instanceof Error) {
    return props.error.stack || props.error.message
  }
  return null
})

const suggestedActions = computed(() => {
  const actions = {
    network: [
      {
        id: 'check-connection',
        icon: '🌐',
        title: 'Check Your Connection',
        description: 'Verify that you have a stable internet connection',
        buttonText: 'Test Connection',
        handler: testConnection
      },
      {
        id: 'refresh-page',
        icon: '🔄',
        title: 'Refresh the Page',
        description: 'Sometimes a simple refresh can resolve connection issues',
        buttonText: 'Refresh',
        handler: refreshPage
      }
    ],
    validation: [
      {
        id: 'review-input',
        icon: '✏️',
        title: 'Review Your Input',
        description: 'Check all required fields and ensure data is valid',
        buttonText: 'Go Back',
        handler: goBack
      },
      {
        id: 'clear-form',
        icon: '🗑️',
        title: 'Start Over',
        description: 'Clear the form and start with fresh data',
        buttonText: 'Reset',
        handler: resetForm
      }
    ],
    permission: [
      {
        id: 'check-role',
        icon: '👤',
        title: 'Check Your Role',
        description: 'Verify that your user role has the necessary permissions',
        buttonText: 'View Profile',
        handler: viewProfile
      },
      {
        id: 'contact-admin',
        icon: '📞',
        title: 'Contact Administrator',
        description: 'Request additional permissions from your system administrator',
        buttonText: 'Contact',
        handler: contactSupport
      }
    ],
    server: [
      {
        id: 'wait-retry',
        icon: '⏰',
        title: 'Wait and Retry',
        description: 'Server issues are often temporary. Try again in a few minutes',
        buttonText: 'Retry',
        handler: retryOperation
      },
      {
        id: 'save-work',
        icon: '💾',
        title: 'Save Your Work',
        description: 'Save your progress locally to avoid losing data',
        buttonText: 'Save',
        handler: saveWork
      }
    ],
    unknown: [
      {
        id: 'retry-operation',
        icon: '🔄',
        title: 'Try Again',
        description: 'The error might be temporary. Retry the operation',
        buttonText: 'Retry',
        handler: retryOperation
      },
      {
        id: 'report-error',
        icon: '🐛',
        title: 'Report the Error',
        description: 'Help us improve by reporting this error',
        buttonText: 'Report',
        handler: reportError
      }
    ]
  }
  
  return actions[props.errorType] || actions.unknown
})

// Methods
const retryOperation = async () => {
  if (!props.canRetry || isRetrying.value) return
  
  isRetrying.value = true
  
  try {
    if (props.retryHandler) {
      await props.retryHandler()
    } else {
      // Default retry: reload current route
      await router.go(0)
    }
  } catch (error) {
    console.error('Retry failed:', error)
  } finally {
    isRetrying.value = false
  }
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/wizard')
  }
}

const goHome = () => {
  router.push('/dashboard')
}

const testConnection = async () => {
  try {
    const response = await fetch('/api/health', { method: 'HEAD' })
    if (response.ok) {
      alert('Connection is working! Try your operation again.')
    } else {
      alert('Connection test failed. Please check your network.')
    }
  } catch (error) {
    alert('Unable to test connection. Please check your network.')
  }
}

const refreshPage = () => {
  window.location.reload()
}

const resetForm = () => {
  wizardStore.resetCurrentStep()
  goBack()
}

const viewProfile = () => {
  router.push('/profile')
}

const saveWork = () => {
  try {
    const workData = {
      project: wizardStore.project,
      currentStep: wizardStore.currentStep,
      timestamp: new Date().toISOString()
    }
    
    localStorage.setItem('wizard-backup', JSON.stringify(workData))
    alert('Your work has been saved locally!')
  } catch (error) {
    console.error('Failed to save work:', error)
    alert('Unable to save work locally.')
  }
}

const reportError = () => {
  const errorReport = {
    error: props.error?.toString(),
    errorType: props.errorType,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    wizardState: {
      currentStep: wizardStore.currentStep,
      projectId: wizardStore.project?.id
    }
  }
  
  // In a real application, this would send to an error reporting service
  console.log('Error report:', errorReport)
  
  // For now, copy to clipboard
  navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2))
    .then(() => alert('Error report copied to clipboard!'))
    .catch(() => alert('Please copy the error details from the browser console.'))
}

const contactSupport = () => {
  // In a real application, this would open a support ticket or chat
  const supportEmail = 'support@pfmt.ca'
  const subject = encodeURIComponent(`PFMT Wizard Error: ${errorTitle.value}`)
  const body = encodeURIComponent(`
Error Type: ${props.errorType}
Error Message: ${errorMessage.value}
Timestamp: ${new Date().toISOString()}
Page: ${window.location.href}

Please describe what you were trying to do when this error occurred:
[Your description here]
  `)
  
  window.open(`mailto:${supportEmail}?subject=${subject}&body=${body}`)
}

const viewDocs = () => {
  // Open documentation in new tab
  window.open('/docs/wizard-guide', '_blank')
}
</script>

<style scoped>
.wizard-error {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  padding: 2rem;
}

.error-container {
  max-width: 600px;
  width: 100%;
  background: white;
  border-radius: 1rem;
  padding: 3rem 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
}

/* Error Icon */
.error-icon-container {
  margin-bottom: 2rem;
}

.error-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  color: #dc3545;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Error Content */
.error-content {
  margin-bottom: 2rem;
}

.error-title {
  font-size: 2rem;
  font-weight: 700;
  color: #212529;
  margin: 0 0 1rem;
}

.error-description {
  font-size: 1.125rem;
  color: #6c757d;
  line-height: 1.6;
  margin: 0 0 1rem;
}

.error-details {
  margin-top: 1rem;
}

.details-toggle {
  text-align: left;
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
}

.details-summary {
  cursor: pointer;
  font-weight: 500;
  color: #495057;
  outline: none;
}

.details-summary:hover {
  color: #212529;
}

.details-content {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

.error-stack {
  background: #f1f3f4;
  padding: 1rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #495057;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Suggested Actions */
.error-actions {
  margin-bottom: 2rem;
  text-align: left;
}

.actions-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 1rem;
  text-align: center;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
}

.action-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
}

.action-title {
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.25rem;
}

.action-description {
  font-size: 0.875rem;
  color: #6c757d;
  line-height: 1.4;
}

.action-button {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
  flex-shrink: 0;
}

.action-button:hover {
  background: #0056b3;
}

/* Primary Actions */
.primary-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn {
  padding: 1rem 2rem;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
  border-color: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
  border-color: #545b62;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.btn-outline {
  background-color: transparent;
  border-color: #6c757d;
  color: #6c757d;
}

.btn-outline:hover {
  background-color: #6c757d;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

/* Support Options */
.support-options {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.support-link {
  background: none;
  border: none;
  color: #007bff;
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.15s ease;
}

.support-link:hover {
  color: #0056b3;
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 768px) {
  .wizard-error {
    padding: 1rem;
  }
  
  .error-container {
    padding: 2rem 1rem;
  }
  
  .error-title {
    font-size: 1.5rem;
  }
  
  .error-description {
    font-size: 1rem;
  }
  
  .action-item {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .action-button {
    width: 100%;
  }
  
  .support-options {
    flex-direction: column;
    gap: 1rem;
  }
  
  .error-icon {
    width: 60px;
    height: 60px;
  }
}

@media (max-width: 480px) {
  .primary-actions {
    gap: 0.75rem;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
  }
}
</style>

