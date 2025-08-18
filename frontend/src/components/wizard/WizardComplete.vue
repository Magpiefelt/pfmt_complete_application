<template>
  <div class="wizard-complete">
    <div class="completion-container">
      <!-- Success Animation -->
      <div class="success-animation">
        <div class="success-checkmark">
          <div class="check-icon">
            <span class="icon-line line-tip"></span>
            <span class="icon-line line-long"></span>
            <div class="icon-circle"></div>
            <div class="icon-fix"></div>
          </div>
        </div>
      </div>

      <!-- Completion Message -->
      <div class="completion-message">
        <h2 class="completion-title">Project Created Successfully!</h2>
        <p class="completion-description">
          Your project "{{ projectName }}" has been successfully created and is now active.
          All team members have been notified and can begin working on their assigned tasks.
        </p>
      </div>

      <!-- Project Summary -->
      <div class="project-summary">
        <h3 class="summary-title">Project Summary</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Project Name</div>
            <div class="summary-value">{{ projectName }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Project ID</div>
            <div class="summary-value">{{ projectId }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Status</div>
            <div class="summary-value status-active">Active</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Created By</div>
            <div class="summary-value">{{ createdBy }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Project Manager</div>
            <div class="summary-value">{{ assignedPM }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Team Size</div>
            <div class="summary-value">{{ teamSize }} members</div>
          </div>
        </div>
      </div>

      <!-- Next Steps -->
      <div class="next-steps">
        <h3 class="steps-title">What's Next?</h3>
        <div class="steps-list">
          <div class="step-item">
            <div class="step-icon">📋</div>
            <div class="step-content">
              <div class="step-title">Review Project Details</div>
              <div class="step-description">
                Check all project information and make any necessary updates
              </div>
            </div>
          </div>
          <div class="step-item">
            <div class="step-icon">👥</div>
            <div class="step-content">
              <div class="step-title">Team Collaboration</div>
              <div class="step-description">
                Team members can now access the project and begin their work
              </div>
            </div>
          </div>
          <div class="step-item">
            <div class="step-icon">📊</div>
            <div class="step-content">
              <div class="step-title">Track Progress</div>
              <div class="step-description">
                Monitor milestones and track project progress in real-time
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="completion-actions">
        <button
          @click="viewProject"
          class="btn btn-primary btn-large"
        >
          View Project Details
        </button>
        <button
          @click="createAnother"
          class="btn btn-outline btn-large"
        >
          Create Another Project
        </button>
        <button
          @click="goToDashboard"
          class="btn btn-secondary btn-large"
        >
          Go to Dashboard
        </button>
      </div>

      <!-- Additional Options -->
      <div class="additional-options">
        <button @click="downloadSummary" class="link-button">
          📄 Download Project Summary
        </button>
        <button @click="shareProject" class="link-button">
          🔗 Share Project Link
        </button>
        <button @click="scheduleReview" class="link-button">
          📅 Schedule Review Meeting
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectWizardIntegration } from '@/composables/useProjectWizardIntegration'

// Composables
const router = useRouter()
const { wizardStore, authStore } = useProjectWizardIntegration()

// Computed properties
const projectName = computed(() => wizardStore.project?.name || 'Untitled Project')
const projectId = computed(() => wizardStore.project?.id || 'N/A')
const createdBy = computed(() => authStore.currentUser?.name || 'Unknown')
const assignedPM = computed(() => wizardStore.project?.assigned_pm || 'Not assigned')
const teamSize = computed(() => {
  // Calculate team size based on project data
  let size = 1 // At least the PM
  if (wizardStore.project?.assigned_pm) size++
  if (wizardStore.project?.team_members) size += wizardStore.project.team_members.length
  return size
})

// Methods
const viewProject = () => {
  if (wizardStore.project?.id) {
    router.push(`/projects/${wizardStore.project.id}`)
  } else {
    router.push('/projects')
  }
}

const createAnother = () => {
  // Clear wizard state and start new project
  wizardStore.resetWizard()
  router.push('/wizard/initiate')
}

const goToDashboard = () => {
  router.push('/dashboard')
}

const downloadSummary = () => {
  // Generate and download project summary
  const summary = {
    projectName: projectName.value,
    projectId: projectId.value,
    createdBy: createdBy.value,
    assignedPM: assignedPM.value,
    teamSize: teamSize.value,
    createdAt: new Date().toISOString(),
    status: 'Active'
  }
  
  const blob = new Blob([JSON.stringify(summary, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `project-summary-${projectId.value}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const shareProject = () => {
  // Copy project link to clipboard
  const projectUrl = `${window.location.origin}/projects/${projectId.value}`
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(projectUrl).then(() => {
      // Show success message (could use toast notification)
      alert('Project link copied to clipboard!')
    })
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = projectUrl
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    alert('Project link copied to clipboard!')
  }
}

const scheduleReview = () => {
  // Open calendar or scheduling interface
  // This could integrate with calendar APIs or redirect to scheduling tool
  alert('Scheduling feature coming soon!')
}

// Lifecycle
onMounted(() => {
  // Trigger success animation
  setTimeout(() => {
    const checkmark = document.querySelector('.success-checkmark')
    if (checkmark) {
      checkmark.classList.add('animate')
    }
  }, 500)
})
</script>

<style scoped>
.wizard-complete {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.completion-container {
  max-width: 600px;
  width: 100%;
  background: white;
  border-radius: 1rem;
  padding: 3rem 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
}

/* Success Animation */
.success-animation {
  margin-bottom: 2rem;
}

.success-checkmark {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: block;
  stroke-width: 2;
  stroke: #28a745;
  stroke-miterlimit: 10;
  margin: 0 auto 1rem;
  box-shadow: inset 0px 0px 0px #28a745;
  animation: fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both;
}

.success-checkmark.animate .icon-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke: #28a745;
  fill: none;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.success-checkmark.animate .icon-line {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

.success-checkmark.animate .icon-line.line-tip {
  transform: rotate(45deg);
}

.success-checkmark.animate .icon-line.line-long {
  transform: rotate(-45deg);
}

.check-icon {
  width: 80px;
  height: 80px;
  position: relative;
  border-radius: 50%;
  box-sizing: content-box;
  border: 4px solid #28a745;
}

.icon-line {
  height: 5px;
  background-color: #28a745;
  display: block;
  border-radius: 2px;
  position: absolute;
  z-index: 10;
}

.icon-line.line-tip {
  top: 46px;
  left: 14px;
  width: 25px;
  transform: rotate(45deg);
}

.icon-line.line-long {
  top: 38px;
  right: 8px;
  width: 47px;
  transform: rotate(-45deg);
}

.icon-circle {
  top: -4px;
  left: -4px;
  z-index: 10;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  position: absolute;
  box-sizing: content-box;
  border: 4px solid rgba(40, 167, 69, 0.2);
}

.icon-fix {
  top: 8px;
  width: 5px;
  left: 26px;
  z-index: 1;
  height: 85px;
  position: absolute;
  transform: rotate(-45deg);
  background-color: white;
}

/* Animations */
@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes scale {
  0%, 100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}

@keyframes fill {
  100% {
    box-shadow: inset 0px 0px 0px 30px #28a745;
  }
}

/* Completion Message */
.completion-message {
  margin-bottom: 2rem;
}

.completion-title {
  font-size: 2rem;
  font-weight: 700;
  color: #212529;
  margin: 0 0 1rem;
}

.completion-description {
  font-size: 1.125rem;
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
}

/* Project Summary */
.project-summary {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
  text-align: left;
}

.summary-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 1rem;
  text-align: center;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-value {
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
}

.summary-value.status-active {
  color: #28a745;
}

/* Next Steps */
.next-steps {
  margin-bottom: 2rem;
  text-align: left;
}

.steps-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 1rem;
  text-align: center;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
}

.step-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.25rem;
}

.step-description {
  font-size: 0.875rem;
  color: #6c757d;
  line-height: 1.4;
}

/* Action Buttons */
.completion-actions {
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

.btn-large {
  padding: 1.25rem 2rem;
  font-size: 1.125rem;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-outline {
  background-color: transparent;
  border-color: #007bff;
  color: #007bff;
}

.btn-outline:hover {
  background-color: #007bff;
  color: white;
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

/* Additional Options */
.additional-options {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.link-button {
  background: none;
  border: none;
  color: #007bff;
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.15s ease;
}

.link-button:hover {
  color: #0056b3;
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 768px) {
  .wizard-complete {
    padding: 1rem;
  }
  
  .completion-container {
    padding: 2rem 1rem;
  }
  
  .completion-title {
    font-size: 1.5rem;
  }
  
  .completion-description {
    font-size: 1rem;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .additional-options {
    flex-direction: column;
    gap: 1rem;
  }
  
  .check-icon {
    width: 60px;
    height: 60px;
  }
  
  .success-checkmark {
    width: 60px;
    height: 60px;
  }
}

@media (max-width: 480px) {
  .step-item {
    flex-direction: column;
    text-align: center;
  }
  
  .step-icon {
    align-self: center;
  }
}
</style>

