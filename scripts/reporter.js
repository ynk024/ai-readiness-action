/**
 * Post results to HTTP endpoint
 * @param {Object} report - AI-readiness report
 * @param {string} endpoint - HTTP endpoint URL
 * @param {string|null} token - Authorization token
 * @returns {Promise<void>}
 */
export async function postResults(report, endpoint, token = null) {
  if (!endpoint) {
    console.log('No endpoint URL provided, skipping HTTP POST');
    console.log('\n=== AI-Readiness Report ===');
    console.log(JSON.stringify(report, null, 2));
    console.log('=== End of Report ===\n');
    return;
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'ai-readiness-action/1.0.0'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(report)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('Successfully posted results to endpoint');
  } catch (error) {
    console.error(`Failed to post results: ${error.message}`);
    console.log('\n=== AI-Readiness Report (fallback) ===');
    console.log(JSON.stringify(report, null, 2));
    console.log('=== End of Report ===\n');
    // Don't throw - just log the error and continue
    // This ensures the action always succeeds even if POST fails
  }
}
