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

  // Find all SKILLS.md files
  const skillsFiles = await findFiles('**/SKILLS.md');

  return {
    agents_md: {
      present: agentsMdPath !== null,
      path: agentsMdPath
    },
    skills_md: {
      count: skillsFiles.length,
      paths: skillsFiles
    }
  };
}
