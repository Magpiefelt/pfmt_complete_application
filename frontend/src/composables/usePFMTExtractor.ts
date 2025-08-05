import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useProjectStore } from '@/stores/project'
import type { Project } from '@/stores/project'

export const usePFMTExtractor = () => {
  const uiStore = useUIStore()
  const projectStore = useProjectStore()

  const showPFMTExtractor = computed(() => uiStore.showPFMTExtractor)
  const selectedProjectForPFMT = computed(() => uiStore.selectedProjectForPFMT)

  const openPFMTExtractor = (project: Project) => {
    console.log('🔄 Opening PFMT Extractor for project:', project)
    uiStore.setSelectedProjectForPFMT(project)
    uiStore.setShowPFMTExtractor(true)
  }

  const closePFMTExtractor = () => {
    console.log('🔄 Closing PFMT Extractor')
    uiStore.setShowPFMTExtractor(false)
    uiStore.setSelectedProjectForPFMT(null)
  }

  const handlePFMTDataExtracted = async (file: File) => {
    console.log('🔄 Handling PFMT data extraction for file:', file?.name)
    if (selectedProjectForPFMT.value && file) {
      try {
        const result = await projectStore.uploadExcelFile(selectedProjectForPFMT.value.id, file)
        console.log('✅ PFMT data extraction completed:', result)
        return result
      } catch (error) {
        console.error('❌ Failed to upload PFMT Excel file:', error)
        throw error
      }
    } else {
      console.warn('⚠️ Missing requirements for PFMT extraction:', {
        hasProject: !!selectedProjectForPFMT.value,
        hasFile: !!file
      })
      throw new Error('Missing requirements for PFMT extraction')
    }
  }

  return {
    showPFMTExtractor,
    selectedProjectForPFMT,
    openPFMTExtractor,
    closePFMTExtractor,
    handlePFMTDataExtracted
  }
}

