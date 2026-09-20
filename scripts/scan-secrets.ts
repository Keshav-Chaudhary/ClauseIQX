import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface SecretViolation {
  file: string;
  line: number;
  patternName: string;
  snippet: string;
}

const SECRET_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  {
    name: 'Private Key Block',
    regex: /-----BEGIN\s+(?:RSA\s+|EC\s+|DSA\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/,
  },
  {
    name: 'AWS Access Key ID',
    regex: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /\b(?:ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{40,})\b/,
  },
  {
    name: 'OpenAI / Generic API Key',
    regex: /\bsk-[a-zA-Z0-9]{32,}\b/,
  },
  {
    name: 'Generic Bearer Token Literal',
    regex: /bearer\s+[a-zA-Z0-9_\-.]{40,}/i,
  },
];

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'coverage',
  '.nyc_output',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.json',
  '.sql',
  '.md',
  '.yml',
  '.yaml',
  '.css',
  '.html',
  '.env.example',
]);

function walkDirectory(dir: string, fileList: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath, fileList);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (ALLOWED_EXTENSIONS.has(ext) || entry.name.startsWith('.env')) {
        fileList.push(fullPath);
      }
    }
  }

  return fileList;
}

export function scanCodebaseForSecrets(rootDir: string = process.cwd()): SecretViolation[] {
  const files = walkDirectory(rootDir);
  const violations: SecretViolation[] = [];

  for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Exclude scanner's own definitions or regex patterns
      if (relativePath.includes('scan-secrets') || relativePath.includes('secrets-scan.test')) {
        return;
      }

      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(line)) {
          violations.push({
            file: relativePath,
            line: index + 1,
            patternName: pattern.name,
            snippet: line.trim().substring(0, 80),
          });
        }
      }
    });
  }

  return violations;
}

export function verifyGitTrackedFiles(rootDir: string = process.cwd()): string[] {
  const untrackedViolations: string[] = [];

  try {
    const trackedFiles = execSync('git ls-files', { cwd: rootDir, encoding: 'utf-8' })
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    for (const file of trackedFiles) {
      if (file === '.env' || file.endsWith('.env') || file.includes('.env.local')) {
        untrackedViolations.push(`Tracked sensitive env file in git: ${file}`);
      }
      if (file.endsWith('.pem') || file.endsWith('.key')) {
        untrackedViolations.push(`Tracked private key file in git: ${file}`);
      }
    }
  } catch {
    // If git is not present, skip git check
  }

  return untrackedViolations;
}

export function verifyFrontendSecretsIsolation(rootDir: string = process.cwd()): string[] {
  const webDir = path.join(rootDir, 'apps', 'web');
  const violations: string[] = [];

  if (!fs.existsSync(webDir)) {
    return violations;
  }

  const webFiles = walkDirectory(webDir);
  for (const filePath of webFiles) {
    const relativePath = path.relative(rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check for direct process.env references to sensitive backend variables
    const backendEnvReferences = [
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET',
      'SESSION_SECRET',
      'S3_SECRET_ACCESS_KEY',
      'LLM_API_KEY',
    ];

    for (const envVar of backendEnvReferences) {
      if (content.includes(`process.env.${envVar}`)) {
        violations.push(
          `Frontend file ${relativePath} directly references backend secret: process.env.${envVar}`
        );
      }
    }
  }

  return violations;
}

if (require.main === module) {
  console.log('[SecretScanner] Scanning repository for credentials and sensitive data...');
  const secretViolations = scanCodebaseForSecrets();
  const gitViolations = verifyGitTrackedFiles();
  const frontendViolations = verifyFrontendSecretsIsolation();

  let hasErrors = false;

  if (secretViolations.length > 0) {
    hasErrors = true;
    console.error(`[SecretScanner] Found ${secretViolations.length} secret violation(s):`);
    secretViolations.forEach((v) => {
      console.error(`  - ${v.file}:${v.line} [${v.patternName}] ${v.snippet}`);
    });
  }

  if (gitViolations.length > 0) {
    hasErrors = true;
    console.error(`[SecretScanner] Git tracking violations:`);
    gitViolations.forEach((v) => console.error(`  - ${v}`));
  }

  if (frontendViolations.length > 0) {
    hasErrors = true;
    console.error(`[SecretScanner] Frontend isolation violations:`);
    frontendViolations.forEach((v) => console.error(`  - ${v}`));
  }

  if (hasErrors) {
    console.error('[SecretScanner] FAILED: Sensitive data or secrets detected!');
    process.exit(1);
  } else {
    console.log('[SecretScanner] PASSED: Clean repository — 0 hardcoded secrets found.');
  }
}
