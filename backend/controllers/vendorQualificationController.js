const pool = require('../config/database');

class VendorQualificationController {
  // Get qualification criteria
  async getQualificationCriteria(req, res) {
    try {
      const criteriaQuery = `
        SELECT 
          id, criteria_name, description, category, weight, max_score,
          is_required, evaluation_method, created_at
        FROM qualification_criteria 
        WHERE is_active = true
        ORDER BY category, weight DESC, criteria_name
      `;

      const criteriaResult = await pool.query(criteriaQuery);

      // Group criteria by category
      const criteriaByCategory = {};
      criteriaResult.rows.forEach(criteria => {
        if (!criteriaByCategory[criteria.category]) {
          criteriaByCategory[criteria.category] = [];
        }
        criteriaByCategory[criteria.category].push(criteria);
      });

      res.json({
        success: true,
        criteria: criteriaResult.rows,
        categorized: criteriaByCategory
      });

    } catch (error) {
      console.error('Error fetching qualification criteria:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch qualification criteria'
      });
    }
  }

  // Submit vendor assessment
  async submitAssessment(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { vendorId } = req.params;
      const { criteriaScores, comments, overallComments } = req.body;
      const assessorId = req.user.id;

      // Validate vendor exists
      const vendorCheck = await client.query(
        'SELECT id FROM vendor_registrations WHERE id = $1',
        [vendorId]
      );

      if (vendorCheck.rows.length === 0) {
        throw new Error('Vendor not found');
      }

      // Calculate overall score
      let totalScore = 0;
      let maxPossibleScore = 0;

      for (const criteriaScore of criteriaScores) {
        totalScore += criteriaScore.score;
        maxPossibleScore += criteriaScore.maxScore;
      }

      // Determine qualification status based on score percentage
      const scorePercentage = (totalScore / maxPossibleScore) * 100;
      let qualificationStatus;

      if (scorePercentage >= 80) {
        qualificationStatus = 'Qualified';
      } else if (scorePercentage >= 60) {
        qualificationStatus = 'Conditionally Qualified';
      } else {
        qualificationStatus = 'Not Qualified';
      }

      // Create assessment record
      const assessmentQuery = `
        INSERT INTO vendor_assessments (
          vendor_id, assessed_by, overall_score, max_score, 
          qualification_status, overall_comments, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `;

      const assessmentResult = await client.query(assessmentQuery, [
        vendorId, assessorId, totalScore, maxPossibleScore,
        qualificationStatus, overallComments
      ]);

      const assessmentId = assessmentResult.rows[0].id;

      // Insert individual criteria scores
      for (const criteriaScore of criteriaScores) {
        const scoreQuery = `
          INSERT INTO vendor_qualification_scores (
            assessment_id, criteria_id, criteria_name, score, max_score, comments
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await client.query(scoreQuery, [
          assessmentId,
          criteriaScore.criteriaId,
          criteriaScore.criteriaName,
          criteriaScore.score,
          criteriaScore.maxScore,
          criteriaScore.comments
        ]);
      }

      // Update vendor registration status if qualified
      if (qualificationStatus === 'Qualified') {
        await client.query(
          'UPDATE vendor_registrations SET registration_status = $1 WHERE id = $2',
          ['Approved', vendorId]
        );
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Assessment submitted successfully',
        assessment: assessmentResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error submitting assessment:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to submit assessment'
      });
    } finally {
      client.release();
    }
  }

  // Get vendor assessment history
  async getVendorAssessments(req, res) {
    try {
      const { vendorId } = req.params;

      const assessmentsQuery = `
        SELECT 
          va.*,
          (u.first_name || ' ' || u.last_name) as assessor_name,
          vr.company_name
        FROM vendor_assessments va
        JOIN users u ON va.assessed_by = u.id
        JOIN vendor_registrations vr ON va.vendor_id = vr.id
        WHERE va.vendor_id = $1
        ORDER BY va.created_at DESC
      `;

      const assessmentsResult = await pool.query(assessmentsQuery, [vendorId]);

      // Get detailed scores for each assessment
      for (const assessment of assessmentsResult.rows) {
        const scoresQuery = `
          SELECT criteria_name, score, max_score, comments
          FROM vendor_qualification_scores
          WHERE assessment_id = $1
          ORDER BY criteria_name
        `;

        const scoresResult = await pool.query(scoresQuery, [assessment.id]);
        assessment.criteriaScores = scoresResult.rows;
      }

      res.json({
        success: true,
        assessments: assessmentsResult.rows
      });

    } catch (error) {
      console.error('Error fetching vendor assessments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assessments'
      });
    }
  }

  // Get qualification status for a vendor
  async getQualificationStatus(req, res) {
    try {
      const { vendorId } = req.params;

      const statusQuery = `
        SELECT 
          va.*,
          vr.company_name,
          (u.first_name || ' ' || u.last_name) as assessor_name
        FROM vendor_assessments va
        JOIN vendor_registrations vr ON va.vendor_id = vr.id
        LEFT JOIN users u ON va.assessed_by = u.id
        WHERE va.vendor_id = $1
        ORDER BY va.created_at DESC
        LIMIT 1
      `;

      const statusResult = await pool.query(statusQuery, [vendorId]);

      if (statusResult.rows.length === 0) {
        return res.json({
          success: true,
          status: {
            qualificationStatus: 'Not Assessed',
            message: 'No assessment found for this vendor'
          }
        });
      }

      const assessment = statusResult.rows[0];

      // Get criteria scores
      const scoresQuery = `
        SELECT criteria_name, score, max_score, comments
        FROM vendor_qualification_scores
        WHERE assessment_id = $1
        ORDER BY criteria_name
      `;

      const scoresResult = await pool.query(scoresQuery, [assessment.id]);
      assessment.criteriaScores = scoresResult.rows;

      res.json({
        success: true,
        status: assessment
      });

    } catch (error) {
      console.error('Error fetching qualification status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch qualification status'
      });
    }
  }

  // Approve vendor
  async approveVendor(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { vendorId } = req.params;
      const { approvalComments } = req.body;
      const approvedBy = req.user.id;

      // Update vendor registration status
      const updateQuery = `
        UPDATE vendor_registrations 
        SET 
          registration_status = 'Approved',
          approved_by = $1,
          approved_at = NOW(),
          approval_comments = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [
        approvedBy, approvalComments, vendorId
      ]);

      if (updateResult.rows.length === 0) {
        throw new Error('Vendor not found');
      }

      // Create vendor record in main vendors table
      const vendor = updateResult.rows[0];
      const vendorQuery = `
        INSERT INTO vendors (
          name, description, contact_email, contact_phone, website, address,
          capabilities, certification_level, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (contact_email) DO UPDATE SET
          name = EXCLUDED.name,
          contact_phone = EXCLUDED.contact_phone,
          updated_at = NOW()
        RETURNING *
      `;

      const vendorResult = await client.query(vendorQuery, [
        vendor.company_name,
        `${vendor.business_type} company specializing in various capabilities`,
        vendor.contact_email,
        vendor.contact_phone,
        vendor.website,
        `${vendor.address}, ${vendor.city}, ${vendor.province} ${vendor.postal_code}`,
        JSON.stringify(vendor.capabilities),
        'Certified',
        'Active'
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Vendor approved successfully',
        vendor: updateResult.rows[0],
        vendorRecord: vendorResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error approving vendor:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to approve vendor'
      });
    } finally {
      client.release();
    }
  }

  // Reject vendor
  async rejectVendor(req, res) {
    try {
      const { vendorId } = req.params;
      const { rejectionReason } = req.body;
      const rejectedBy = req.user.id;

      const updateQuery = `
        UPDATE vendor_registrations 
        SET 
          registration_status = 'Rejected',
          rejected_by = $1,
          rejected_at = NOW(),
          rejection_reason = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const updateResult = await pool.query(updateQuery, [
        rejectedBy, rejectionReason, vendorId
      ]);

      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      res.json({
        success: true,
        message: 'Vendor registration rejected',
        vendor: updateResult.rows[0]
      });

    } catch (error) {
      console.error('Error rejecting vendor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject vendor'
      });
    }
  }

  // Get pending vendor registrations
  async getPendingRegistrations(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const registrationsQuery = `
        SELECT 
          id, company_name, business_number, contact_name, contact_email,
          contact_phone, business_type, capabilities, registration_status,
          created_at
        FROM vendor_registrations
        WHERE registration_status = 'Pending Review'
        ORDER BY created_at ASC
        LIMIT $1 OFFSET $2
      `;

      const registrationsResult = await pool.query(registrationsQuery, [limit, offset]);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM vendor_registrations 
        WHERE registration_status = 'Pending Review'
      `;
      const countResult = await pool.query(countQuery);
      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        registrations: registrationsResult.rows,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + limit < total,
          hasPrev: offset > 0
        }
      });

    } catch (error) {
      console.error('Error fetching pending registrations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending registrations'
      });
    }
  }

  // Create qualification criteria
  async createQualificationCriteria(req, res) {
    try {
      const {
        criteriaName,
        description,
        category,
        weight,
        maxScore,
        isRequired,
        evaluationMethod
      } = req.body;

      const criteriaQuery = `
        INSERT INTO qualification_criteria (
          criteria_name, description, category, weight, max_score,
          is_required, evaluation_method, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
        RETURNING *
      `;

      const criteriaResult = await pool.query(criteriaQuery, [
        criteriaName, description, category, weight, maxScore,
        isRequired, evaluationMethod
      ]);

      res.status(201).json({
        success: true,
        message: 'Qualification criteria created successfully',
        criteria: criteriaResult.rows[0]
      });

    } catch (error) {
      console.error('Error creating qualification criteria:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create qualification criteria'
      });
    }
  }
}

module.exports = new VendorQualificationController();

