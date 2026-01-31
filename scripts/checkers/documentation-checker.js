import { fileExists, findFiles } from '../utils/file-utils.js';

/**
 * Check for AI documentation files
 * @returns {Promise<Object>}
 */
export async function checkDocumentation() {
  // Check for AGENTS.md
  const agentsMdLocations = ['AGENTS.md', 'docs/AGENTS.md', '.github/AGENTS.md'];
  let agentsMdPath = null;
  
  for (const location of agentsMdLocations) {
    if (await fileExists(location)) {
      agentsMdPath = location;
      break;
    }
  }

  // Find all SKILL.md files
  const skillFiles = await findFiles('**/SKILL.md');

  return {
    agents_md: {
      present: agentsMdPath !== null,
      path: agentsMdPath
    },
    skill_md: {
      count: skillFiles.length,
      paths: skillFiles
    }
  };
}
