const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
const password = process.env.SMOKE_TEST_PASSWORD || 'ClauseIQXSmoke1';
const email = `smoke-${Date.now()}@example.test`;

async function request(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`${init.method || 'GET'} ${path} failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

async function main(): Promise<void> {
  if (process.env.LLM_PROVIDER !== 'openai' || process.env.EMBEDDING_PROVIDER !== 'openai' || process.env.OCR_PROVIDER !== 'tesseract') {
    throw new Error('Set LLM_PROVIDER=openai, EMBEDDING_PROVIDER=openai, and OCR_PROVIDER=tesseract before running this smoke test.');
  }

  const signup = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, displayName: 'Real AI Smoke Test' }),
  });
  const token = String(signup.token);
  const authHeaders = { Authorization: `Bearer ${token}`, 'content-type': 'application/json' };

  const projectResponse = await request('/api/v1/projects', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'Real provider smoke test', documentType: 'contract' }),
  });
  const project = projectResponse.project as { id: string };
  const uploadResponse = await request(`/api/v1/projects/${project.id}/documents`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      filename: 'smoke-contract.txt',
      mediaType: 'text/plain',
      text: 'Payment is due within thirty days of invoice. The agreement may be terminated with written notice.',
    }),
  });
  const document = uploadResponse.document as { id: string };

  const analysis = await request(`/api/v1/projects/${project.id}/documents/${document.id}/analyses`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ analysisType: 'summary' }),
  });
  const answer = await request(`/api/v1/projects/${project.id}/conversations/direct`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ question: 'When is payment due?', documentId: document.id }),
  });

  console.log(JSON.stringify({
    upload_status: uploadResponse.document && (uploadResponse.document as { status: string }).status,
    analysis_status: (analysis.analysis as { status: string }).status,
    citation_validation_passed: analysis.citation_validation_passed,
    answer_status: (answer.message as { status: string }).status,
    citation_count: answer.citations && (answer.citations as unknown[]).length,
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error('[real-ai-smoke] Failed:', error);
  process.exit(1);
});
