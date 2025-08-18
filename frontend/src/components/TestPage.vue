<template>
  <div class="test-page">
    <h1>PFMT Frontend Test Page</h1>
    <p>This is a test page to verify the frontend is working correctly.</p>
    
    <div class="test-section">
      <h2>API Test</h2>
      <button @click="testAPI" :disabled="loading">
        {{ loading ? 'Testing...' : 'Test API Connection' }}
      </button>
      <div v-if="apiResult" class="result">
        <h3>API Result:</h3>
        <pre>{{ JSON.stringify(apiResult, null, 2) }}</pre>
      </div>
      <div v-if="apiError" class="error">
        <h3>API Error:</h3>
        <p>{{ apiError }}</p>
      </div>
    </div>

    <div class="test-section">
      <h2>Project Creation Test</h2>
      <button @click="testProjectCreation" :disabled="loading">
        {{ loading ? 'Creating...' : 'Test Project Creation' }}
      </button>
      <div v-if="projectResult" class="result">
        <h3>Project Created:</h3>
        <pre>{{ JSON.stringify(projectResult, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const loading = ref(false)
const apiResult = ref(null)
const apiError = ref('')
const projectResult = ref(null)

const testAPI = async () => {
  loading.value = true
  apiError.value = ''
  apiResult.value = null
  
  try {
    const response = await fetch('http://localhost:3004/health', {
      headers: {
        'x-user-id': '550e8400-e29b-41d4-a716-446655440002',
        'x-user-name': 'Test User',
        'x-user-role': 'Project Manager'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    apiResult.value = data
  } catch (error) {
    apiError.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}

const testProjectCreation = async () => {
  loading.value = true
  projectResult.value = null
  
  try {
    const payload = {
      details: {
        name: `Test Project ${Date.now()}`,
        description: 'A test project created from the frontend',
        code: `TEST-${Date.now()}`
      },
      location: {
        municipality: 'Calgary',
        addressLine1: '123 Test Street',
        province: 'Alberta',
        country: 'Canada'
      },
      vendors: [
        {
          name: 'Test Vendor',
          contactName: 'John Doe',
          contactEmail: 'john@testvendor.com'
        }
      ],
      budget: {
        total: 50000,
        currency: 'CAD'
      }
    }
    
    const response = await fetch('http://localhost:3004/api/project-wizard/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '550e8400-e29b-41d4-a716-446655440002',
        'x-user-name': 'Test User',
        'x-user-role': 'Project Manager'
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    projectResult.value = data
  } catch (error) {
    apiError.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.test-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result {
  margin-top: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.error {
  margin-top: 10px;
  padding: 10px;
  background: #f8d7da;
  color: #721c24;
  border-radius: 4px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>

