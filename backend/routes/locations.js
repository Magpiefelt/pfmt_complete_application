const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Get project locations
router.get('/projects/:projectId/locations', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const query = `
      SELECT 
        pl.*,
        m.name as ministry_name,
        j.name as jurisdiction_name
      FROM project_locations pl
      LEFT JOIN ministries m ON pl.ministry_id = m.id
      LEFT JOIN jurisdictions j ON pl.jurisdiction_id = j.id
      WHERE pl.project_id = $1
      ORDER BY pl.created_at
    `;
    
    const result = await pool.query(query, [projectId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching project locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project locations'
    });
  }
});

// Create project location
router.post('/projects/:projectId/locations', authenticateToken, requireRole(['PM', 'SPM', 'Director', 'Admin']), auditLog, async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      building_name,
      address,
      city,
      province,
      postal_code,
      latitude,
      longitude,
      ministry_id,
      jurisdiction_id,
      urban_rural_classification,
      mla,
      legal_land_plan,
      legal_land_block,
      legal_land_lot,
      legal_land_quarter_section,
      legal_land_section,
      legal_land_township,
      legal_land_range,
      legal_land_meridian
    } = req.body;
    
    const query = `
      INSERT INTO project_locations (
        project_id,
        building_name,
        address,
        city,
        province,
        postal_code,
        latitude,
        longitude,
        ministry_id,
        jurisdiction_id,
        urban_rural_classification,
        mla,
        legal_land_plan,
        legal_land_block,
        legal_land_lot,
        legal_land_quarter_section,
        legal_land_section,
        legal_land_township,
        legal_land_range,
        legal_land_meridian,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING *
    `;
    
    const values = [
      projectId,
      building_name,
      address,
      city,
      province,
      postal_code,
      latitude,
      longitude,
      ministry_id,
      jurisdiction_id,
      urban_rural_classification,
      mla,
      legal_land_plan,
      legal_land_block,
      legal_land_lot,
      legal_land_quarter_section,
      legal_land_section,
      legal_land_township,
      legal_land_range,
      legal_land_meridian,
      req.user.id
    ];
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Project location created successfully'
    });
  } catch (error) {
    console.error('Error creating project location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project location'
    });
  }
});

// Update project location
router.put('/projects/:projectId/locations/:locationId', authenticateToken, requireRole(['PM', 'SPM', 'Director', 'Admin']), auditLog, async (req, res) => {
  try {
    const { projectId, locationId } = req.params;
    const {
      building_name,
      address,
      city,
      province,
      postal_code,
      latitude,
      longitude,
      ministry_id,
      jurisdiction_id,
      urban_rural_classification,
      mla,
      legal_land_plan,
      legal_land_block,
      legal_land_lot,
      legal_land_quarter_section,
      legal_land_section,
      legal_land_township,
      legal_land_range,
      legal_land_meridian
    } = req.body;
    
    const query = `
      UPDATE project_locations 
      SET 
        building_name = $3,
        address = $4,
        city = $5,
        province = $6,
        postal_code = $7,
        latitude = $8,
        longitude = $9,
        ministry_id = $10,
        jurisdiction_id = $11,
        urban_rural_classification = $12,
        mla = $13,
        legal_land_plan = $14,
        legal_land_block = $15,
        legal_land_lot = $16,
        legal_land_quarter_section = $17,
        legal_land_section = $18,
        legal_land_township = $19,
        legal_land_range = $20,
        legal_land_meridian = $21,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND project_id = $2
      RETURNING *
    `;
    
    const values = [
      locationId,
      projectId,
      building_name,
      address,
      city,
      province,
      postal_code,
      latitude,
      longitude,
      ministry_id,
      jurisdiction_id,
      urban_rural_classification,
      mla,
      legal_land_plan,
      legal_land_block,
      legal_land_lot,
      legal_land_quarter_section,
      legal_land_section,
      legal_land_township,
      legal_land_range,
      legal_land_meridian
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project location not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Project location updated successfully'
    });
  } catch (error) {
    console.error('Error updating project location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project location'
    });
  }
});

// Delete project location
router.delete('/projects/:projectId/locations/:locationId', authenticateToken, requireRole(['PM', 'SPM', 'Director', 'Admin']), auditLog, async (req, res) => {
  try {
    const { projectId, locationId } = req.params;
    
    const query = 'DELETE FROM project_locations WHERE id = $1 AND project_id = $2 RETURNING *';
    const result = await pool.query(query, [locationId, projectId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project location not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Project location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project location'
    });
  }
});

// Get ministries
router.get('/ministries', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT id, name, abbreviation, description
      FROM ministries 
      WHERE status = 'active'
      ORDER BY name
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching ministries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ministries'
    });
  }
});

// Get jurisdictions
router.get('/jurisdictions', authenticateToken, async (req, res) => {
  try {
    const { ministry_id } = req.query;
    
    let query = `
      SELECT id, name, type, ministry_id
      FROM jurisdictions 
      WHERE status = 'active'
    `;
    
    const values = [];
    
    if (ministry_id) {
      query += ' AND ministry_id = $1';
      values.push(ministry_id);
    }
    
    query += ' ORDER BY name';
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching jurisdictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jurisdictions'
    });
  }
});

// Geocode address
router.post('/geocode', authenticateToken, async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }
    
    // Mock geocoding response - replace with actual geocoding service
    const mockCoordinates = {
      latitude: 53.5461 + (Math.random() - 0.5) * 0.1,
      longitude: -113.4938 + (Math.random() - 0.5) * 0.1,
      formatted_address: address
    };
    
    res.json({
      success: true,
      data: mockCoordinates
    });
  } catch (error) {
    console.error('Error geocoding address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to geocode address'
    });
  }
});

// Get MLAs (Members of Legislative Assembly)
router.get('/mlas', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        name,
        constituency,
        party,
        email,
        phone
      FROM mlas 
      WHERE status = 'active'
      ORDER BY constituency, name
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching MLAs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MLAs'
    });
  }
});

module.exports = router;

