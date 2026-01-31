import { fileExists, findFiles } from '../utils/file-utils.js';

/**
 * Check for SAST (Static Application Security Testing) tools
 * @returns {Promise<Object>}
 */
export async function checkSAST() {
  const result = {
    codeql: { present: false },
    semgrep: { present: false }
  };

  // Check for CodeQL workflow
  const codeqlWorkflows = await findFiles('.github/workflows/*codeql*.yml');
  const codeqlYamlWorkflows = await findFiles('.github/workflows/*codeql*.yaml');
  const allCodeqlWorkflows = [...codeqlWorkflows, ...codeqlYamlWorkflows];

  if (allCodeqlWorkflows.length > 0) {
    result.codeql = {
      present: true,
      workflow_file: allCodeqlWorkflows[0]
    };
  }

  // Check for Semgrep
  const semgrepConfigs = [
    '.semgrep.yml',
    '.semgrep.yaml',
    'semgrep.yml',
    'semgrep.yaml'
  ];

  for (const config of semgrepConfigs) {
    if (await fileExists(config)) {
      result.semgrep = {
        present: true,
        config_file: config
      };
      break;
    }
  }

  // Also check for Semgrep workflow
  if (!result.semgrep.present) {
    const semgrepWorkflows = await findFiles('.github/workflows/*semgrep*.yml');
    const semgrepYamlWorkflows = await findFiles('.github/workflows/*semgrep*.yaml');
    const allSemgrepWorkflows = [...semgrepWorkflows, ...semgrepYamlWorkflows];

    if (allSemgrepWorkflows.length > 0) {
      result.semgrep = {
        present: true,
        workflow_file: allSemgrepWorkflows[0]
      };
    }
  }

  return result;
}
