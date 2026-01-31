# Example: Integrating AI-Readiness Action into Your Repository

This directory contains example configurations for using the AI-Readiness Action in your repositories.

## Basic Setup

### 1. Create Workflow File

Create `.github/workflows/ai-readiness.yml` in your repository:

```yaml
name: AI Readiness Check

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --coverage

  ai-readiness:
    needs: test
    uses: your-org/ai-readiness-action/.github/workflows/ai-readiness.yml@v1
    with:
      endpoint_url: ${{ vars.AI_READINESS_ENDPOINT }}
      coverage_threshold: 90
    secrets:
      endpoint_token: ${{ secrets.AI_READINESS_TOKEN }}
```

### 2. Configure Repository Variables

In your repository or organization settings (Settings → Secrets and variables → Actions):

**Variables:**
- `AI_READINESS_ENDPOINT`: `https://your-api.example.com/ai-readiness`

**Secrets:**
- `AI_READINESS_TOKEN`: Your bearer token for authentication (optional)

### 3. Ensure Coverage Files are Generated

The action expects coverage files to already exist. Make sure your test step generates them:

#### For Jest/Vitest (JavaScript/TypeScript):
```bash
npm test -- --coverage
```

This generates `coverage/coverage-summary.json`.

#### For JaCoCo (Java/Maven):
```xml
<!-- In pom.xml -->
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.11</version>
  <executions>
    <execution>
      <goals>
        <goal>prepare-agent</goal>
      </goals>
    </execution>
    <execution>
      <id>report</id>
      <phase>test</phase>
      <goals>
        <goal>report</goal>
      </goals>
    </execution>
  </executions>
</plugin>
```

Then run:
```bash
mvn test
```

This generates `target/site/jacoco/jacoco.xml`.

## Advanced Configuration

### Custom Coverage Threshold

```yaml
ai-readiness:
  uses: your-org/ai-readiness-action/.github/workflows/ai-readiness.yml@v1
  with:
    endpoint_url: ${{ vars.AI_READINESS_ENDPOINT }}
    coverage_threshold: 85  # Lower threshold
```

### Run on Specific Events

```yaml
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:  # Manual trigger
```

### Monorepo Setup

For monorepos with multiple languages:

```yaml
jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test -- --coverage
    working-directory: ./frontend

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: mvn test
    working-directory: ./backend

  ai-readiness:
    needs: [test-frontend, test-backend]
    uses: your-org/ai-readiness-action/.github/workflows/ai-readiness.yml@v1
    with:
      endpoint_url: ${{ vars.AI_READINESS_ENDPOINT }}
```

## Expected Files for Maximum AI-Readiness

### Documentation
- `AGENTS.md` - AI agent documentation
- `SKILLS.md` - AI skills documentation (can have multiple)

### JavaScript/TypeScript
- `package.json` - With dependencies like prettier, eslint, eslint-plugin-boundaries
- `tsconfig.json` - TypeScript configuration
- `.prettierrc` or `prettier.config.js` - Prettier configuration
- `.eslintrc.js` or `eslint.config.js` - ESLint configuration
- `.github/workflows/codeql.yml` - CodeQL security scanning
- `coverage/coverage-summary.json` - Test coverage report

### Java
- `pom.xml` or `build.gradle` - Build configuration
- Maven plugins: maven-checkstyle-plugin, spotbugs-maven-plugin, jacoco-maven-plugin
- Gradle plugins: checkstyle, spotbugs, jacoco
- Dependencies: archunit (for architecture tests)
- `target/site/jacoco/jacoco.xml` - JaCoCo coverage report

## Testing Locally

You can test the action locally by setting environment variables:

```bash
export ENDPOINT_URL="https://your-api.example.com/ai-readiness"
export ENDPOINT_TOKEN="your-token"
export COVERAGE_THRESHOLD="90"
export GITHUB_REPOSITORY="your-org/your-repo"
export GITHUB_SHA="$(git rev-parse HEAD)"
export GITHUB_REF="refs/heads/$(git branch --show-current)"
export GITHUB_RUN_ID="local-test"
export GITHUB_SERVER_URL="https://github.com"

# Run from the ai-readiness-action directory
node scripts/index.js
```

## Troubleshooting

### "No coverage files found"
- Ensure test job runs before ai-readiness job
- Check that tests generate coverage in the correct location
- Verify coverage files are not in `.gitignore`

### "Failed to post results"
- Check endpoint URL is correct
- Verify token is valid
- Check network connectivity
- The action will log the full JSON report even if posting fails

### "Language not detected"
- Ensure you have the marker files (package.json, pom.xml, build.gradle, tsconfig.json)
- Check files are in the repository root

## Example Backend Service

Your backend service should accept POST requests with this structure:

```javascript
app.post('/ai-readiness', (req, res) => {
  const report = req.body;
  
  // Validate token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!isValidToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Process the report
  console.log('Received report for:', report.metadata.repository.name);
  console.log('Languages:', report.languages.detected);
  console.log('Coverage:', report.checks.test_coverage.coverage?.lines.percentage);
  
  // Store in database, calculate scores, etc.
  await storeReport(report);
  
  res.status(200).json({ success: true, id: report.metadata.repository.name });
});
```
