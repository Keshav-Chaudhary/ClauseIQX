import { describe, it, expect } from 'vitest';
import {
  scanCodebaseForSecrets,
  verifyGitTrackedFiles,
  verifyFrontendSecretsIsolation,
} from '../scripts/scan-secrets';

describe('Secrets & Credential Leakage Scanner', () => {
  it('confirms 0 hardcoded secrets or API keys across the codebase', () => {
    const violations = scanCodebaseForSecrets();
    if (violations.length > 0) {
      console.error('Secret violations found:', violations);
    }
    expect(violations).toHaveLength(0);
  });

  it('verifies git does not track any private .env or key files', () => {
    const gitViolations = verifyGitTrackedFiles();
    expect(gitViolations).toHaveLength(0);
  });

  it('verifies frontend code does not reference private backend secrets', () => {
    const frontendViolations = verifyFrontendSecretsIsolation();
    expect(frontendViolations).toHaveLength(0);
  });
});
