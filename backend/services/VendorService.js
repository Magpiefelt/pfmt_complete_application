/**
 * Vendor Service
 * Business logic for vendor management functionality
 */

const { query, transaction } = require('../config/database-enhanced');
const { v4: uuidv4 } = require('uuid');
const { auditLogger } = require('../middleware/logging');

class VendorService {
    /**
     * Get all vendors with filtering and pagination
     */
    static async getAllVendors(filters = {}) {
        try {
            let queryText = `
                SELECT 
                    v.*,
                    COUNT(DISTINCT c.id) as contract_count,
                    COUNT(DISTINCT p.id) as project_count,
                    COALESCE(AVG(vr.rating), 0) as avg_rating,
                    COUNT(vr.id) as rating_count
                FROM vendors v
                LEFT JOIN contracts c ON v.id = c.vendor_id
                LEFT JOIN projects p ON c.project_id = p.id
                LEFT JOIN vendor_ratings vr ON v.id = vr.vendor_id
                WHERE v.is_active = true
            `;
            
            const params = [];
            let paramCount = 0;
            
            // Apply filters
            if (filters.status) {
                paramCount++;
                queryText += ` AND v.status = $${paramCount}`;
                params.push(filters.status);
            }
            
            if (filters.category) {
                paramCount++;
                queryText += ` AND v.category = $${paramCount}`;
                params.push(filters.category);
            }
            
            if (filters.search) {
                paramCount++;
                queryText += ` AND (v.company_name ILIKE $${paramCount} OR v.contact_email ILIKE $${paramCount})`;
                params.push(`%${filters.search}%`);
            }
            
            if (filters.minRating) {
                // This will be applied after grouping
            }
            
            queryText += ` GROUP BY v.id`;
            
            // Apply rating filter after grouping
            if (filters.minRating) {
                paramCount++;
                queryText += ` HAVING COALESCE(AVG(vr.rating), 0) >= $${paramCount}`;
                params.push(filters.minRating);
            }
            
            // Pagination
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 20;
            const offset = (page - 1) * limit;
            
            queryText += ` ORDER BY v.company_name ASC`;
            queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            params.push(limit, offset);
            
            const result = await query(queryText, params);
            
            // Get total count for pagination
            let countQuery = `
                SELECT COUNT(DISTINCT v.id) as total
                FROM vendors v
                LEFT JOIN vendor_ratings vr ON v.id = vr.vendor_id
                WHERE v.is_active = true
            `;
            const countParams = [];
            let countParamCount = 0;
            
            if (filters.status) {
                countParamCount++;
                countQuery += ` AND v.status = $${countParamCount}`;
                countParams.push(filters.status);
            }
            
            if (filters.category) {
                countParamCount++;
                countQuery += ` AND v.category = $${countParamCount}`;
                countParams.push(filters.category);
            }
            
            if (filters.search) {
                countParamCount++;
                countQuery += ` AND (v.company_name ILIKE $${countParamCount} OR v.contact_email ILIKE $${countParamCount})`;
                countParams.push(`%${filters.search}%`);
            }
            
            if (filters.minRating) {
                countQuery += ` GROUP BY v.id HAVING COALESCE(AVG(vr.rating), 0) >= $${countParamCount + 1}`;
                countParams.push(filters.minRating);
            }
            
            const countResult = await query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].total);
            
            return {
                vendors: result.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting all vendors:', error);
            throw error;
        }
    }

    /**
     * Get vendor by ID
     */
    static async getVendorById(vendorId) {
        try {
            const queryText = `
                SELECT 
                    v.*,
                    COUNT(DISTINCT c.id) as contract_count,
                    COUNT(DISTINCT p.id) as project_count,
                    COALESCE(AVG(vr.rating), 0) as avg_rating,
                    COUNT(vr.id) as rating_count,
                    COALESCE(SUM(c.value), 0) as total_contract_value
                FROM vendors v
                LEFT JOIN contracts c ON v.id = c.vendor_id
                LEFT JOIN projects p ON c.project_id = p.id
                LEFT JOIN vendor_ratings vr ON v.id = vr.vendor_id
                WHERE v.id = $1 AND v.is_active = true
                GROUP BY v.id
            `;
            
            const result = await query(queryText, [vendorId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            const vendor = result.rows[0];
            
            // Get recent contracts
            const contractsResult = await query(`
                SELECT c.*, p.project_name
                FROM contracts c
                LEFT JOIN projects p ON c.project_id = p.id
                WHERE c.vendor_id = $1
                ORDER BY c.created_at DESC
                LIMIT 5
            `, [vendorId]);
            
            vendor.recent_contracts = contractsResult.rows;
            
            // Get recent ratings
            const ratingsResult = await query(`
                SELECT vr.*, u.first_name || ' ' || u.last_name as rated_by_name
                FROM vendor_ratings vr
                LEFT JOIN users u ON vr.rated_by = u.id
                WHERE vr.vendor_id = $1
                ORDER BY vr.created_at DESC
                LIMIT 5
            `, [vendorId]);
            
            vendor.recent_ratings = ratingsResult.rows;
            
            return vendor;
        } catch (error) {
            console.error('Error getting vendor by ID:', error);
            throw error;
        }
    }

    /**
     * Create vendor
     */
    static async createVendor(vendorData, userId) {
        try {
            const vendorId = uuidv4();
            
            const queryText = `
                INSERT INTO vendors (
                    id, company_name, contact_person, contact_email, contact_phone,
                    address, city, state, postal_code, country, website,
                    category, status, tax_id, registration_number, 
                    capabilities, certifications, insurance_info,
                    created_by, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
                RETURNING *
            `;
            
            const params = [
                vendorId,
                vendorData.companyName,
                vendorData.contactPerson,
                vendorData.contactEmail,
                vendorData.contactPhone || null,
                vendorData.address || null,
                vendorData.city || null,
                vendorData.state || null,
                vendorData.postalCode || null,
                vendorData.country || null,
                vendorData.website || null,
                vendorData.category || 'General',
                'Active',
                vendorData.taxId || null,
                vendorData.registrationNumber || null,
                JSON.stringify(vendorData.capabilities || []),
                JSON.stringify(vendorData.certifications || []),
                JSON.stringify(vendorData.insuranceInfo || {}),
                userId
            ];
            
            const result = await query(queryText, params);
            
            // Audit log
            auditLogger('VENDOR_CREATE', 'vendor', vendorId, userId, {
                companyName: vendorData.companyName,
                category: vendorData.category
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating vendor:', error);
            throw error;
        }
    }

    /**
     * Update vendor
     */
    static async updateVendor(vendorId, updateData, userId) {
        try {
            // Check if vendor exists
            const currentVendor = await query(
                'SELECT * FROM vendors WHERE id = $1 AND is_active = true',
                [vendorId]
            );
            
            if (currentVendor.rows.length === 0) {
                throw new Error('Vendor not found');
            }
            
            const vendor = currentVendor.rows[0];
            
            // Build update query dynamically
            const updateFields = [];
            const params = [];
            let paramCount = 0;
            
            const allowedFields = [
                'company_name', 'contact_person', 'contact_email', 'contact_phone',
                'address', 'city', 'state', 'postal_code', 'country', 'website',
                'category', 'status', 'tax_id', 'registration_number'
            ];
            
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    paramCount++;
                    updateFields.push(`${field} = $${paramCount}`);
                    params.push(updateData[field]);
                }
            });
            
            // Handle JSON fields
            if (updateData.capabilities !== undefined) {
                paramCount++;
                updateFields.push(`capabilities = $${paramCount}`);
                params.push(JSON.stringify(updateData.capabilities));
            }
            
            if (updateData.certifications !== undefined) {
                paramCount++;
                updateFields.push(`certifications = $${paramCount}`);
                params.push(JSON.stringify(updateData.certifications));
            }
            
            if (updateData.insuranceInfo !== undefined) {
                paramCount++;
                updateFields.push(`insurance_info = $${paramCount}`);
                params.push(JSON.stringify(updateData.insuranceInfo));
            }
            
            if (updateFields.length === 0) {
                return vendor;
            }
            
            // Add updated_at and updated_by
            paramCount++;
            updateFields.push(`updated_at = NOW()`);
            updateFields.push(`updated_by = $${paramCount}`);
            params.push(userId);
            
            // Add WHERE clause
            paramCount++;
            params.push(vendorId);
            
            const queryText = `
                UPDATE vendors 
                SET ${updateFields.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;
            
            const result = await query(queryText, params);
            
            // Audit log
            auditLogger('VENDOR_UPDATE', 'vendor', vendorId, userId, {
                changes: Object.keys(updateData)
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error updating vendor:', error);
            throw error;
        }
    }

    /**
     * Delete vendor (soft delete)
     */
    static async deleteVendor(vendorId, userId) {
        try {
            const vendor = await query(
                'SELECT * FROM vendors WHERE id = $1 AND is_active = true',
                [vendorId]
            );
            
            if (vendor.rows.length === 0) {
                throw new Error('Vendor not found');
            }
            
            const vendorData = vendor.rows[0];
            
            // Check if vendor has active contracts
            const activeContracts = await query(
                'SELECT COUNT(*) as count FROM contracts WHERE vendor_id = $1 AND status = \'Active\'',
                [vendorId]
            );
            
            if (parseInt(activeContracts.rows[0].count) > 0) {
                throw new Error('Cannot delete vendor with active contracts');
            }
            
            // Soft delete
            const queryText = `
                UPDATE vendors 
                SET 
                    is_active = false,
                    status = 'Inactive',
                    deleted_at = NOW(),
                    deleted_by = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *
            `;
            
            const result = await query(queryText, [userId, vendorId]);
            
            // Audit log
            auditLogger('VENDOR_DELETE', 'vendor', vendorId, userId, {
                companyName: vendorData.company_name
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error deleting vendor:', error);
            throw error;
        }
    }

    /**
     * Rate vendor
     */
    static async rateVendor(vendorId, ratingData, userId) {
        try {
            // Check if vendor exists
            const vendor = await query(
                'SELECT id FROM vendors WHERE id = $1 AND is_active = true',
                [vendorId]
            );
            
            if (vendor.rows.length === 0) {
                throw new Error('Vendor not found');
            }
            
            // Check if user has already rated this vendor
            const existingRating = await query(
                'SELECT id FROM vendor_ratings WHERE vendor_id = $1 AND rated_by = $2',
                [vendorId, userId]
            );
            
            if (existingRating.rows.length > 0) {
                // Update existing rating
                const queryText = `
                    UPDATE vendor_ratings 
                    SET 
                        rating = $1,
                        review = $2,
                        updated_at = NOW()
                    WHERE vendor_id = $3 AND rated_by = $4
                    RETURNING *
                `;
                
                const result = await query(queryText, [
                    ratingData.rating,
                    ratingData.review || null,
                    vendorId,
                    userId
                ]);
                
                // Audit log
                auditLogger('VENDOR_RATING_UPDATE', 'vendor_rating', existingRating.rows[0].id, userId, {
                    vendorId,
                    rating: ratingData.rating
                });
                
                return result.rows[0];
            } else {
                // Create new rating
                const ratingId = uuidv4();
                
                const queryText = `
                    INSERT INTO vendor_ratings (
                        id, vendor_id, rating, review, rated_by, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                    RETURNING *
                `;
                
                const result = await query(queryText, [
                    ratingId,
                    vendorId,
                    ratingData.rating,
                    ratingData.review || null,
                    userId
                ]);
                
                // Audit log
                auditLogger('VENDOR_RATING_CREATE', 'vendor_rating', ratingId, userId, {
                    vendorId,
                    rating: ratingData.rating
                });
                
                return result.rows[0];
            }
        } catch (error) {
            console.error('Error rating vendor:', error);
            throw error;
        }
    }

    /**
     * Get vendor ratings
     */
    static async getVendorRatings(vendorId, filters = {}) {
        try {
            let queryText = `
                SELECT 
                    vr.*,
                    u.first_name || ' ' || u.last_name as rated_by_name
                FROM vendor_ratings vr
                LEFT JOIN users u ON vr.rated_by = u.id
                WHERE vr.vendor_id = $1
            `;
            
            const params = [vendorId];
            let paramCount = 1;
            
            // Apply filters
            if (filters.minRating) {
                paramCount++;
                queryText += ` AND vr.rating >= $${paramCount}`;
                params.push(filters.minRating);
            }
            
            if (filters.maxRating) {
                paramCount++;
                queryText += ` AND vr.rating <= $${paramCount}`;
                params.push(filters.maxRating);
            }
            
            // Pagination
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const offset = (page - 1) * limit;
            
            queryText += ` ORDER BY vr.created_at DESC`;
            queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            params.push(limit, offset);
            
            const result = await query(queryText, params);
            
            // Get total count and rating statistics
            const statsResult = await query(`
                SELECT 
                    COUNT(*) as total_ratings,
                    COALESCE(AVG(rating), 0) as avg_rating,
                    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
                FROM vendor_ratings
                WHERE vendor_id = $1
            `, [vendorId]);
            
            const stats = statsResult.rows[0];
            const total = parseInt(stats.total_ratings);
            
            return {
                ratings: result.rows,
                statistics: stats,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting vendor ratings:', error);
            throw error;
        }
    }

    /**
     * Get vendor statistics
     */
    static async getVendorStatistics() {
        try {
            const queryText = `
                SELECT 
                    COUNT(*) as total_vendors,
                    COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_vendors,
                    COUNT(CASE WHEN status = 'Inactive' THEN 1 END) as inactive_vendors,
                    COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_vendors,
                    COUNT(DISTINCT category) as total_categories,
                    COALESCE(AVG(
                        (SELECT AVG(rating) FROM vendor_ratings WHERE vendor_id = v.id)
                    ), 0) as overall_avg_rating
                FROM vendors v
                WHERE v.is_active = true
            `;
            
            const result = await query(queryText);
            const stats = result.rows[0];
            
            // Get category breakdown
            const categoryResult = await query(`
                SELECT 
                    category,
                    COUNT(*) as vendor_count,
                    COALESCE(AVG(
                        (SELECT AVG(rating) FROM vendor_ratings WHERE vendor_id = v.id)
                    ), 0) as avg_rating
                FROM vendors v
                WHERE v.is_active = true
                GROUP BY category
                ORDER BY vendor_count DESC
            `);
            
            stats.categories = categoryResult.rows;
            
            return stats;
        } catch (error) {
            console.error('Error getting vendor statistics:', error);
            throw error;
        }
    }

    /**
     * Search vendors by capabilities
     */
    static async searchVendorsByCapabilities(capabilities, filters = {}) {
        try {
            let queryText = `
                SELECT 
                    v.*,
                    COUNT(DISTINCT c.id) as contract_count,
                    COALESCE(AVG(vr.rating), 0) as avg_rating,
                    COUNT(vr.id) as rating_count
                FROM vendors v
                LEFT JOIN contracts c ON v.id = c.vendor_id
                LEFT JOIN vendor_ratings vr ON v.id = vr.vendor_id
                WHERE v.is_active = true
                AND v.status = 'Active'
            `;
            
            const params = [];
            let paramCount = 0;
            
            // Search by capabilities
            if (capabilities && capabilities.length > 0) {
                paramCount++;
                queryText += ` AND v.capabilities @> $${paramCount}::jsonb`;
                params.push(JSON.stringify(capabilities));
            }
            
            // Apply additional filters
            if (filters.category) {
                paramCount++;
                queryText += ` AND v.category = $${paramCount}`;
                params.push(filters.category);
            }
            
            if (filters.minRating) {
                // This will be applied after grouping
            }
            
            queryText += ` GROUP BY v.id`;
            
            // Apply rating filter after grouping
            if (filters.minRating) {
                paramCount++;
                queryText += ` HAVING COALESCE(AVG(vr.rating), 0) >= $${paramCount}`;
                params.push(filters.minRating);
            }
            
            queryText += ` ORDER BY avg_rating DESC, contract_count DESC`;
            
            // Pagination
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 20;
            const offset = (page - 1) * limit;
            
            queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            params.push(limit, offset);
            
            const result = await query(queryText, params);
            
            return {
                vendors: result.rows,
                searchCriteria: {
                    capabilities,
                    filters
                }
            };
        } catch (error) {
            console.error('Error searching vendors by capabilities:', error);
            throw error;
        }
    }

    /**
     * Get vendor performance metrics
     */
    static async getVendorPerformanceMetrics(vendorId) {
        try {
            // Get contract performance
            const contractMetrics = await query(`
                SELECT 
                    COUNT(*) as total_contracts,
                    COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_contracts,
                    COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_contracts,
                    COUNT(CASE WHEN status = 'Terminated' THEN 1 END) as terminated_contracts,
                    COALESCE(AVG(
                        CASE WHEN end_date IS NOT NULL AND start_date IS NOT NULL 
                        THEN EXTRACT(DAYS FROM (end_date - start_date))
                        END
                    ), 0) as avg_contract_duration_days,
                    COALESCE(SUM(value), 0) as total_contract_value
                FROM contracts
                WHERE vendor_id = $1
            `, [vendorId]);
            
            // Get rating metrics
            const ratingMetrics = await query(`
                SELECT 
                    COUNT(*) as total_ratings,
                    COALESCE(AVG(rating), 0) as avg_rating,
                    COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_ratings,
                    COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_ratings
                FROM vendor_ratings
                WHERE vendor_id = $1
            `, [vendorId]);
            
            const contractData = contractMetrics.rows[0];
            const ratingData = ratingMetrics.rows[0];
            
            // Calculate performance scores
            const completionRate = contractData.total_contracts > 0 ? 
                (contractData.completed_contracts / contractData.total_contracts * 100).toFixed(2) : 0;
            
            const satisfactionRate = ratingData.total_ratings > 0 ? 
                (ratingData.positive_ratings / ratingData.total_ratings * 100).toFixed(2) : 0;
            
            return {
                contracts: contractData,
                ratings: ratingData,
                performance: {
                    completion_rate: completionRate,
                    satisfaction_rate: satisfactionRate,
                    overall_score: ((parseFloat(completionRate) + parseFloat(satisfactionRate)) / 2).toFixed(2)
                }
            };
        } catch (error) {
            console.error('Error getting vendor performance metrics:', error);
            throw error;
        }
    }
}

module.exports = VendorService;

