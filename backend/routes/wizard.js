const express = require('express');
const router = express.Router();

const { query } = require('../config/database-enhanced');
const { authorizeRoles } = require('../middleware/authorize');
const { v4: uuidv4 } = require('uuid');

/**
 * Wizard Progress API
 * Computes completedSteps and nextAllowed for a given project.
 * Step model (aligned with frontend):
 *  1 = INITIATE (project exists)
 *  2 = ASSIGN   (team has PM and SR PM set)
 *  3 = CONFIGURE (at least one project_version exists)
 */
function computeNextAllowed(completed) {
  const steps = [1,2,3];
  for (const s of steps) {
    if (!completed.includes(s)) return s;
  }
  return steps.length; // all complete
}

// GET /api/wizard/:projectId/progress
router.get('/:projectId/progress', authorizeRoles('PM','SPM','DIRECTOR','ADMIN'), async (req, res) => {
  const { projectId } = req.params;
  const correlationId = req.correlationId || uuidv4();

  // Basic UUID validation (projectId may be UUID or text in dev schemas; accept both but prefer UUID format)
  if (!projectId || projectId.length < 6) {
    return res.status(400).json({ success:false, code:'BAD_PROJECT_ID', message:'Invalid projectId', correlationId });
  }

  try {
    // 1) Project exists?
    const proj = await query('SELECT id FROM projects WHERE id = $1 OR code = $1::text LIMIT 1', [projectId]);
    if (proj.rows.length === 0) {
      return res.status(404).json({ success:false, code:'PROJECT_NOT_FOUND', correlationId });
    }
    const pid = proj.rows[0].id;

    const completedSteps = [];

    // Step 1: INITIATE -> project row exists
    completedSteps.push(1);

    // Step 2: ASSIGN -> PM and SR PM assigned in project_teams
    const team = await query(`
      SELECT project_manager_id, sr_project_manager_id
      FROM project_teams WHERE project_id = $1
    `, [pid]);
    if (team.rows.length && team.rows[0].project_manager_id && team.rows[0].sr_project_manager_id) {
      completedSteps.push(2);
    }

    // Step 3: CONFIGURE -> at least one project_version row
    const ver = await query(`
      SELECT 1 FROM project_versions WHERE project_id = $1 LIMIT 1
    `, [pid]);
    if (ver.rows.length) {
      completedSteps.push(3);
    }

    const nextAllowed = computeNextAllowed(completedSteps);

    return res.json({
      completedSteps,
      nextAllowed,
      correlationId
    });
  } catch (err) {
    console.error('Wizard progress error', { err, projectId });
    return res.status(500).json({ success:false, code:'PROGRESS_ERROR', message:'Failed to compute progress', correlationId });
  }
});

module.exports = router;
