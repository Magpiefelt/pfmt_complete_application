import { apiService } from './apiService'

export interface Ministry {
  id: string
  name: string
  abbreviation?: string
  description?: string
}

export interface Jurisdiction {
  id: string
  name: string
  type: string
  ministry_id?: string
}

export interface MLA {
  id: string
  name: string
  constituency: string
  party?: string
  email?: string
  phone?: string
}

export interface ProjectLocation {
  id?: string
  project_id: string
  building_name?: string
  address?: string
  city?: string
  province?: string
  postal_code?: string
  latitude?: number
  longitude?: number
  ministry_id?: string
  jurisdiction_id?: string
  urban_rural_classification?: 'urban' | 'rural'
  mla?: string
  legal_land_plan?: string
  legal_land_block?: string
  legal_land_lot?: string
  legal_land_quarter_section?: string
  legal_land_section?: string
  legal_land_township?: string
  legal_land_range?: string
  legal_land_meridian?: string
  
  // Related data
  ministry_name?: string
  jurisdiction_name?: string
  
  created_at?: string
  updated_at?: string
  created_by?: string
}

export interface GeocodeResult {
  latitude: number
  longitude: number
  formatted_address: string
}

class LocationService {
  /**
   * Get project locations
   */
  async getProjectLocations(projectId: string): Promise<ProjectLocation[]> {
    try {
      const response = await apiService.get(`/locations/projects/${projectId}/locations`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching project locations:', error)
      throw new Error('Failed to fetch project locations')
    }
  }

  /**
   * Create project location
   */
  async createProjectLocation(projectId: string, locationData: Omit<ProjectLocation, 'id' | 'project_id' | 'created_at' | 'updated_at'>): Promise<ProjectLocation> {
    try {
      const response = await apiService.post(`/locations/projects/${projectId}/locations`, {
        ...locationData,
        project_id: projectId
      })
      return response.data.data
    } catch (error) {
      console.error('Error creating project location:', error)
      throw new Error('Failed to create project location')
    }
  }

  /**
   * Update project location
   */
  async updateProjectLocation(projectId: string, locationId: string, locationData: Partial<ProjectLocation>): Promise<ProjectLocation> {
    try {
      const response = await apiService.put(`/locations/projects/${projectId}/locations/${locationId}`, locationData)
      return response.data.data
    } catch (error) {
      console.error('Error updating project location:', error)
      throw new Error('Failed to update project location')
    }
  }

  /**
   * Delete project location
   */
  async deleteProjectLocation(projectId: string, locationId: string): Promise<void> {
    try {
      await apiService.delete(`/locations/projects/${projectId}/locations/${locationId}`)
    } catch (error) {
      console.error('Error deleting project location:', error)
      throw new Error('Failed to delete project location')
    }
  }

  /**
   * Get ministries
   */
  async getMinistries(): Promise<Ministry[]> {
    try {
      const response = await apiService.get('/locations/ministries')
      return response.data.data
    } catch (error) {
      console.error('Error fetching ministries:', error)
      throw new Error('Failed to fetch ministries')
    }
  }

  /**
   * Get jurisdictions
   */
  async getJurisdictions(ministryId?: string): Promise<Jurisdiction[]> {
    try {
      const params = ministryId ? `?ministry_id=${ministryId}` : ''
      const response = await apiService.get(`/locations/jurisdictions${params}`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching jurisdictions:', error)
      throw new Error('Failed to fetch jurisdictions')
    }
  }

  /**
   * Get MLAs
   */
  async getMLAs(): Promise<MLA[]> {
    try {
      const response = await apiService.get('/locations/mlas')
      return response.data.data
    } catch (error) {
      console.error('Error fetching MLAs:', error)
      throw new Error('Failed to fetch MLAs')
    }
  }

  /**
   * Geocode address
   */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      const response = await apiService.post('/locations/geocode', { address })
      return response.data.data
    } catch (error) {
      console.error('Error geocoding address:', error)
      throw new Error('Failed to geocode address')
    }
  }

  /**
   * Validate postal code format
   */
  validatePostalCode(postalCode: string): boolean {
    const canadianPostalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/
    return canadianPostalCodeRegex.test(postalCode)
  }

  /**
   * Format postal code
   */
  formatPostalCode(postalCode: string): string {
    const cleaned = postalCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (cleaned.length === 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
    }
    return postalCode
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    // Alberta bounds (approximate)
    const albertaBounds = {
      north: 60.0,
      south: 49.0,
      east: -110.0,
      west: -120.0
    }

    return (
      latitude >= albertaBounds.south &&
      latitude <= albertaBounds.north &&
      longitude >= albertaBounds.west &&
      longitude <= albertaBounds.east
    )
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  /**
   * Format legal land description
   */
  formatLegalLandDescription(location: ProjectLocation): string {
    const parts: string[] = []

    if (location.legal_land_lot) parts.push(`Lot ${location.legal_land_lot}`)
    if (location.legal_land_block) parts.push(`Block ${location.legal_land_block}`)
    if (location.legal_land_plan) parts.push(`Plan ${location.legal_land_plan}`)
    
    if (location.legal_land_quarter_section) parts.push(`${location.legal_land_quarter_section}`)
    if (location.legal_land_section) parts.push(`Section ${location.legal_land_section}`)
    if (location.legal_land_township) parts.push(`Township ${location.legal_land_township}`)
    if (location.legal_land_range) parts.push(`Range ${location.legal_land_range}`)
    if (location.legal_land_meridian) parts.push(`${location.legal_land_meridian} Meridian`)

    return parts.join(', ')
  }

  /**
   * Get provinces
   */
  getProvinces(): { code: string; name: string }[] {
    return [
      { code: 'AB', name: 'Alberta' },
      { code: 'BC', name: 'British Columbia' },
      { code: 'MB', name: 'Manitoba' },
      { code: 'NB', name: 'New Brunswick' },
      { code: 'NL', name: 'Newfoundland and Labrador' },
      { code: 'NS', name: 'Nova Scotia' },
      { code: 'NT', name: 'Northwest Territories' },
      { code: 'NU', name: 'Nunavut' },
      { code: 'ON', name: 'Ontario' },
      { code: 'PE', name: 'Prince Edward Island' },
      { code: 'QC', name: 'Quebec' },
      { code: 'SK', name: 'Saskatchewan' },
      { code: 'YT', name: 'Yukon' }
    ]
  }

  /**
   * Get meridians
   */
  getMeridians(): string[] {
    return [
      '4th',
      '5th',
      '6th'
    ]
  }

  /**
   * Get quarter sections
   */
  getQuarterSections(): string[] {
    return [
      'NE',
      'NW',
      'SE',
      'SW'
    ]
  }

  /**
   * Validate location data
   */
  validateLocationData(location: Partial<ProjectLocation>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate postal code if provided
    if (location.postal_code && !this.validatePostalCode(location.postal_code)) {
      errors.push('Invalid postal code format')
    }

    // Validate coordinates if provided
    if (location.latitude !== undefined && location.longitude !== undefined) {
      if (!this.validateCoordinates(location.latitude, location.longitude)) {
        errors.push('Coordinates appear to be outside Alberta')
      }
    }

    // Validate legal land description completeness
    const hasLegalLand = location.legal_land_plan || location.legal_land_section
    if (hasLegalLand) {
      if (location.legal_land_section && !location.legal_land_township) {
        errors.push('Township is required when section is provided')
      }
      if (location.legal_land_section && !location.legal_land_range) {
        errors.push('Range is required when section is provided')
      }
      if (location.legal_land_section && !location.legal_land_meridian) {
        errors.push('Meridian is required when section is provided')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Format full address
   */
  formatFullAddress(location: ProjectLocation): string {
    const parts: string[] = []

    if (location.building_name) parts.push(location.building_name)
    if (location.address) parts.push(location.address)
    if (location.city) parts.push(location.city)
    if (location.province) parts.push(location.province)
    if (location.postal_code) parts.push(location.postal_code)

    return parts.join(', ')
  }
}

export const locationService = new LocationService()
export default locationService

