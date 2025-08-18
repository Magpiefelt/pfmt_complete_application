import axios from 'axios'

export interface WizardProgressResponse {
  completedSteps: number[]
  nextAllowed: number
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true
})

export const WizardProgressService = {
  async getProgress(projectId: string): Promise<WizardProgressResponse> {
    const resp = await api.get<WizardProgressResponse>(`/wizard/${projectId}/progress`)
    return resp.data
  }
}

export default WizardProgressService
