<template>
  <div class="file-upload-component">
    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-200">
      <input
        ref="fileInput"
        type="file"
        :multiple="multiple"
        :accept="accept"
        @change="handleFileSelect"
        class="hidden"
      />
      
      <div v-if="!uploading && files.length === 0">
        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="mt-4">
          <button @click="$refs.fileInput.click()" class="btn-primary">
            Choose Files
          </button>
          <p class="mt-2 text-sm text-gray-500">or drag and drop files here</p>
        </div>
      </div>
      
      <div v-if="uploading" class="flex flex-col items-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <p class="text-sm text-gray-600">Uploading files...</p>
        <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div class="bg-indigo-600 h-2 rounded-full transition-all duration-300" :style="{ width: uploadProgress + '%' }"></div>
        </div>
      </div>
      
      <div v-if="files.length > 0 && !uploading" class="space-y-2">
        <div v-for="file in files" :key="file.id" class="flex items-center justify-between bg-gray-50 p-3 rounded-md">
          <div class="flex items-center space-x-3">
            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ file.original_name }}</p>
              <p class="text-xs text-gray-500">{{ formatFileSize(file.file_size) }}</p>
            </div>
          </div>
          <button @click="removeFile(file.id)" class="text-red-600 hover:text-red-900">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
        
        <div class="mt-4 flex justify-between">
          <button @click="$refs.fileInput.click()" class="btn-secondary">
            Add More Files
          </button>
          <button @click="uploadFiles" class="btn-primary">
            Upload Files
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { fileService } from '@/services/fileService';

export default {
  name: 'FileUploadComponent',
  props: {
    entityType: {
      type: String,
      required: true
    },
    entityId: {
      type: String,
      required: true
    },
    multiple: {
      type: Boolean,
      default: true
    },
    accept: {
      type: String,
      default: '*/*'
    }
  },
  emits: ['uploaded'],
  setup(props, { emit }) {
    const toast = useToast();
    const files = ref([]);
    const uploading = ref(false);
    const uploadProgress = ref(0);
    
    const handleFileSelect = (event) => {
      const selectedFiles = Array.from(event.target.files);
      
      selectedFiles.forEach(file => {
        files.value.push({
          id: Date.now() + Math.random(),
          file,
          original_name: file.name,
          file_size: file.size,
          mime_type: file.type
        });
      });
    };
    
    const removeFile = (fileId) => {
      files.value = files.value.filter(f => f.id !== fileId);
    };
    
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const uploadFiles = async () => {
      if (files.value.length === 0) return;
      
      try {
        uploading.value = true;
        uploadProgress.value = 0;
        
        const uploadPromises = files.value.map(async (fileItem, index) => {
          const formData = new FormData();
          formData.append('file', fileItem.file);
          formData.append('entity_type', props.entityType);
          formData.append('entity_id', props.entityId);
          formData.append('category', 'general');
          formData.append('tags', JSON.stringify([]));
          
          const result = await fileService.uploadFile(formData);
          
          // Update progress
          uploadProgress.value = Math.round(((index + 1) / files.value.length) * 100);
          
          return result;
        });
        
        const results = await Promise.all(uploadPromises);
        
        toast.success(`${results.length} file(s) uploaded successfully`);
        emit('uploaded', results);
        files.value = [];
        
      } catch (error) {
        console.error('Error uploading files:', error);
        toast.error('Failed to upload files');
      } finally {
        uploading.value = false;
        uploadProgress.value = 0;
      }
    };
    
    return {
      files,
      uploading,
      uploadProgress,
      handleFileSelect,
      removeFile,
      formatFileSize,
      uploadFiles
    };
  }
};
</script>

<style scoped>
.btn-primary {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500;
}

.btn-secondary {
  @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500;
}
</style>
