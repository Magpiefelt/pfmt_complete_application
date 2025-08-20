/**
 * Project-Scoped RBAC Middleware
 * HP-6: Users can only read/mutate projects they're authorized to
 */

const { query } = require('../config/database-enhanced');
const { resolveProjectIdFromSession } = require('../services/wizardProgress');

async function userHasProjectAccess(userId, projectId) {
  // Implement the actual check based on your schema (project_teams or equivalent)
  const r = await query(`
    SELECT 1
    FROM project_teams
    WHERE project_id = $1 AND (project_manager_id = $2 OR sr_project_manager_id = $2)
    LIMIT 1
  `, [projectId, userId]);
  return r.rowCount > 0;
}

function authorizeProject(paramKey='projectId'){
  return async (req,res,next)=>{
    const id = req.params[paramKey] || req.body[paramKey];
    if (!id) return res.status(400).json({ success:false, code:'MISSING_PROJECT_ID' });

    const role = (req.user?.role || '').toUpperCase();
    if (role === 'ADMIN' || role === 'DIRECTOR') return next();

    const ok = await userHasProjectAccess(req.user.id, id);
    if (!ok) return res.status(403).json({ success:false, code:'FORBIDDEN', resourceId:id, requiredRoles:['PM','SPM','DIRECTOR','ADMIN'] });
    next();
  };
}

// Specialized version for wizard routes that use sessionId
function authorizeProjectFromSession(sessionParamKey='sessionId'){
  return async (req,res,next)=>{
    const sessionId = req.params[sessionParamKey] || req.body[sessionParamKey];
    if (!sessionId) return res.status(400).json({ success:false, code:'MISSING_SESSION_ID' });

    const role = (req.user?.role || '').toUpperCase();
    if (role === 'ADMIN' || role === 'DIRECTOR') return next();

    // Resolve projectId from sessionId
    const projectId = await resolveProjectIdFromSession(sessionId);
    if (!projectId) return res.status(404).json({ success:false, code:'SESSION_OR_PROJECT_NOT_FOUND' });

    const ok = await userHasProjectAccess(req.user.id, projectId);
    if (!ok) return res.status(403).json({ success:false, code:'FORBIDDEN', resourceId:projectId, requiredRoles:['PM','SPM','DIRECTOR','ADMIN'] });
    next();
  };
}

module.exports = authorizeProject;
module.exports.authorizeProjectFromSession = authorizeProjectFromSession;

