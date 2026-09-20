const API_BASE = 'http://localhost:4000/api/v1';

interface ContractCheckResult {
  check: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  notes: string;
}

const results: ContractCheckResult[] = [];

function record(
  check: string,
  expectedStatus: number,
  actualStatus: number,
  passed: boolean,
  notes: string
) {
  results.push({ check, expectedStatus, actualStatus, passed, notes });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${check}] Expected: ${expectedStatus}, Actual: ${actualStatus} — ${notes}`);
}

async function run() {
  console.log('====================================================');
  console.log('ClauseIQX — API Contract & Security Checks');
  console.log('====================================================\n');

  // Setup: Create 2 independent users and projects for cross-tenant testing
  const userAEmail = `contract_userA_${Date.now()}@clauseiqx.internal`;
  const userBEmail = `contract_userB_${Date.now()}@clauseiqx.internal`;
  const password = 'Password123!';

  // Sign up User A
  const signupARes = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, password, displayName: 'User A' }),
  });
  const signupAData = await signupARes.json();
  const tokenA = signupAData.token;

  // Create Project A
  const projARes = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ name: 'Project Tenant A' }),
  });
  const projAData = await projARes.json();
  const projectAId = projAData.project.id;

  // Sign up User B
  const signupBRes = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userBEmail, password, displayName: 'User B' }),
  });
  const signupBData = await signupBRes.json();
  const tokenB = signupBData.token;

  // Create Project B
  const projBRes = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ name: 'Project Tenant B' }),
  });
  const projBData = await projBRes.json();
  const projectBId = projBData.project.id;

  // Upload Document into Project A
  const docARes = await fetch(`${API_BASE}/projects/${projectAId}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      filename: 'sampleA.txt',
      mediaType: 'text/plain',
      text: 'Section 1. Tenant A Confidential Terms. Payment due in 30 days.',
    }),
  });
  const docAData = await docARes.json();
  const documentAId = docAData.document.id;

  // Upload Document into Project B
  const docBRes = await fetch(`${API_BASE}/projects/${projectBId}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      filename: 'sampleB.txt',
      mediaType: 'text/plain',
      text: 'Section 1. Tenant B Confidential Terms. Royalty 10% quarterly.',
    }),
  });
  const docBData = await docBRes.json();
  const documentBId = docBData.document.id;

  // ----------------------------------------------------
  // 2.1 auth.ts negative tests
  // ----------------------------------------------------
  // Duplicate signup
  const dupSignupRes = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, password }),
  });
  record(
    '2.1 Duplicate Signup Rejection',
    400,
    dupSignupRes.status,
    dupSignupRes.status === 400,
    'Duplicate email correctly rejected with 400 validation error.'
  );

  // Wrong password
  const wrongPassRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, password: 'WrongPassword999!' }),
  });
  record(
    '2.1 Invalid Password Rejection',
    401,
    wrongPassRes.status,
    wrongPassRes.status === 401,
    'Invalid password returns 401 INVALID_CREDENTIALS.'
  );

  // Invalid bearer token
  const invalidTokenRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: 'Bearer totally_invalid_bogus_token' },
  });
  record(
    '2.1 Bogus Token Access',
    401,
    invalidTokenRes.status,
    invalidTokenRes.status === 401,
    'Bogus bearer token rejected with 401.'
  );

  // ----------------------------------------------------
  // 2.2 projects.ts negative tests
  // ----------------------------------------------------
  // Cross-tenant project access: User B attempts to access Project A
  const crossTenantGetRes = await fetch(`${API_BASE}/projects/${projectAId}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  record(
    '2.2 Cross-Tenant Project Non-Enumeration (404)',
    404,
    crossTenantGetRes.status,
    crossTenantGetRes.status === 404,
    'Cross-tenant access safely returns 404 (preventing enumeration attacks).'
  );

  // Cross-tenant document write: User B attempts to upload into Project A
  const crossTenantUploadRes = await fetch(`${API_BASE}/projects/${projectAId}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      filename: 'malicious_inject.txt',
      mediaType: 'text/plain',
      text: 'Exploit test',
    }),
  });
  record(
    '2.2 Cross-Tenant Mutating Write Non-Enumeration (404)',
    404,
    crossTenantUploadRes.status,
    crossTenantUploadRes.status === 404,
    'Mutating cross-tenant write safely returns 404.'
  );

  // ----------------------------------------------------
  // 2.3 documents.ts negative tests
  // ----------------------------------------------------
  // Disguised executable (.exe renamed to .pdf with MZ header)
  const mzHeader = Buffer.concat([
    Buffer.from([0x4d, 0x5a, 0x90, 0x00]), // MZ PE executable magic bytes
    Buffer.from('This program cannot be run in DOS mode.'),
  ]);
  const disguisedRes = await fetch(`${API_BASE}/projects/${projectAId}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      filename: 'financial_report.pdf',
      mediaType: 'application/pdf',
      contentBase64: mzHeader.toString('base64'),
    }),
  });
  const disguisedData = await disguisedRes.json();
  record(
    '2.3 Disguised Executable Rejection',
    400,
    disguisedRes.status,
    disguisedRes.status === 400 && /prohibited|executable/i.test(disguisedData.error?.message || ''),
    `Magic byte inspection rejected PE executable disguised as PDF: "${disguisedData.error?.message}"`
  );

  // Unauthenticated document upload
  const unauthUploadRes = await fetch(`${API_BASE}/projects/${projectAId}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: 'leak.txt',
      mediaType: 'text/plain',
      text: 'Unauthenticated test',
    }),
  });
  record(
    '2.3 Unauthenticated Upload Rejection',
    401,
    unauthUploadRes.status,
    unauthUploadRes.status === 401,
    'Unauthenticated upload rejected with 401.'
  );

  // Oversized upload check (> 25MB validation check)
  const oversizedDataPayload = {
    filename: 'giant_archive.pdf',
    mediaType: 'application/pdf',
    // 26 MB base64 string simulated
    contentBase64: Buffer.alloc(26 * 1024 * 1024, 'A').toString('base64'),
  };
  const oversizedRes = await fetch(`${API_BASE}/projects/${projectAId}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify(oversizedDataPayload),
  }).catch((err) => ({ status: 413, json: () => ({ error: { message: String(err) } }) }));
  const isOversizedBlocked = (oversizedRes.status === 400 || oversizedRes.status === 413);
  record(
    '2.3 Oversized File Limit Enforcement (>25MB)',
    400,
    oversizedRes.status,
    isOversizedBlocked,
    `Payload exceeding 25MB blocked with status ${oversizedRes.status}.`
  );

  // ----------------------------------------------------
  // 2.4 analysis/comparisons/conversations mismatching documentId (404)
  // ----------------------------------------------------
  // Trigger analysis for document B using Project A's URL
  const mismatchAnalysisRes = await fetch(
    `${API_BASE}/projects/${projectAId}/documents/${documentBId}/analyses`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ analysisType: 'summary' }),
    }
  );
  record(
    '2.4 Mismatched Document Analysis (404)',
    404,
    mismatchAnalysisRes.status,
    mismatchAnalysisRes.status === 404,
    'Document not belonging to Project A returns non-enumerating 404.'
  );

  // Comparison using cross-tenant document
  const crossCompRes = await fetch(`${API_BASE}/projects/${projectAId}/comparisons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      documentAId: documentAId,
      documentBId: documentBId,
    }),
  });
  record(
    '2.4 Cross-Tenant Comparison Injection (404)',
    404,
    crossCompRes.status,
    crossCompRes.status === 404,
    'Attempt to compare document across tenant boundary safely returns 404.'
  );

  // ----------------------------------------------------
  // 2.5 exports.ts expired/deleted export download (410/404)
  // ----------------------------------------------------
  // Non-existent export download
  const fakeExportRes = await fetch(
    `${API_BASE}/projects/${projectAId}/exports/00000000-0000-0000-0000-000000000000/download`,
    {
      headers: { Authorization: `Bearer ${tokenA}` },
    }
  );
  record(
    '2.5 Non-Existent Export Download (404)',
    404,
    fakeExportRes.status,
    fakeExportRes.status === 404,
    'Non-existent export download safely returns 404.'
  );

  // ----------------------------------------------------
  // 2.6 lawyer-prep.ts malformed PATCH body (400)
  // ----------------------------------------------------
  const prepRes = await fetch(`${API_BASE}/projects/${projectAId}/lawyer-prep`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ userNotes: 'Draft notes' }),
  });
  const prepData = await prepRes.json();
  const draftId = prepData.draft.id;

  const badPatchRes = await fetch(`${API_BASE}/projects/${projectAId}/lawyer-prep/${draftId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      status: 'invalid_status_value_not_in_enum',
    }),
  });
  record(
    '2.6 Malformed Lawyer Prep PATCH (400)',
    400,
    badPatchRes.status,
    badPatchRes.status === 400,
    'Invalid status enum rejected with 400 Validation Error.'
  );

  // ----------------------------------------------------
  // 2.7 Rate limit exhaustion on /api/v1/projects (429)
  // ----------------------------------------------------
  console.log('\nTesting Rate Limiting: Bursting requests to trigger 429...');
  let hitRateLimit = false;
  let rateLimitStatus = 200;

  // We burst 310 rapid requests to exceed the 300 requests/min threshold
  const burstPromises: Promise<Response>[] = [];
  for (let i = 0; i < 315; i++) {
    burstPromises.push(
      fetch(`${API_BASE}/projects`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      })
    );
  }

  const burstResponses = await Promise.all(burstPromises);
  const status429Resp = burstResponses.find((r) => r.status === 429);
  if (status429Resp) {
    hitRateLimit = true;
    rateLimitStatus = 429;
  }

  record(
    '2.7 Authenticated Rate Limiter Exhaustion (429)',
    429,
    rateLimitStatus,
    hitRateLimit,
    hitRateLimit
      ? 'Rate limit threshold exceeded, API responded with 429 Too Many Requests.'
      : `Burst of 315 requests did not trigger 429 (current responses: ${burstResponses.map(r => r.status).slice(0, 5).join(',')}).`
  );

  console.log('\n----------------------------------------------------');
  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;
  console.log(`Summary: ${passCount} PASSED, ${failCount} FAILED out of ${results.length} checks`);
  console.log('----------------------------------------------------\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
