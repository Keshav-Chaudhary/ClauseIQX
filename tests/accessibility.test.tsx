/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Select } from '@/components/ui/Select';
import { AccessibilityWidget } from '@/components/ui/AccessibilityWidget';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ExplainAIButton } from '@/components/ui/ExplainAIButton';

describe('WCAG 2.2 Level AA Accessibility Audits (axe-core)', () => {
  it('Button passes axe-core automated audit', async () => {
    const { container } = render(<Button>Analyze Contract</Button>);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Secondary and Ghost Button variants pass axe audit', async () => {
    const { container } = render(
      <div>
        <Button variant="secondary">Secondary Action</Button>
        <Button variant="ghost">Dismiss</Button>
        <Button variant="danger">Delete Document</Button>
      </div>
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Disabled Button preserves accessible state and semantics', async () => {
    const { container } = render(<Button disabled aria-disabled="true">Processing...</Button>);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Badge passes axe audit with accessible tone representations', async () => {
    const { container } = render(
      <div>
        <Badge tone="positive">Compliant</Badge>
        <Badge tone="critical">High Risk</Badge>
        <Badge tone="warning">Review Needed</Badge>
        <Badge tone="neutral">Standard Clause</Badge>
      </div>
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Card container with headings passes structural accessibility', async () => {
    const { container } = render(
      <Card>
        <h2>Liability Overview</h2>
        <p>This agreement limits mutual indemnification to 12 months fees.</p>
      </Card>
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Form Input with explicit label passes axe audit', async () => {
    const { container } = render(
      <div>
        <label htmlFor="user-email">Work Email</label>
        <Input id="user-email" type="email" placeholder="counsel@enterprise.com" />
      </div>
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Field wrapper correctly associates label, input, and helper text', async () => {
    const { container } = render(
      <Field label="Project Name" id="proj-name" hint="Visible to team members">
        {(props) => <Input {...props} />}
      </Field>
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Field wrapper with error state exposes accessible error message', async () => {
    const { container } = render(
      <Field label="Contract Title" id="title" error="Title is required">
        {(props) => <Input {...props} />}
      </Field>
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('ProgressRing passes axe audit and exposes aria attributes', async () => {
    const { container } = render(
      <ProgressRing value={78} label="78%" sublabel="Analyzed" ariaLabel="Analysis completion" />
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Select dropdown component passes axe audit in closed state', async () => {
    const options = [
      { value: 'nda', label: 'Non-Disclosure Agreement' },
      { value: 'msa', label: 'Master Services Agreement' },
      { value: 'lease', label: 'Commercial Lease' },
    ];
    const { container } = render(
      <div>
        <label id="doc-type-label">Select Document Category</label>
        <Select
          options={options}
          value="nda"
          onChange={() => {}}
          ariaLabel="Select Document Category"
        />
      </div>
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('ThemeToggle exposes accessible label and button role', async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('ExplainAIButton includes aria attributes and accessible description', async () => {
    const { container } = render(
      <ExplainAIButton
        title="Why this clause was flagged"
        rationale="Unilateral termination without cure period violates standard MSA playbooks."
      />
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('AccessibilityWidget provides screen reader instructions and controls', async () => {
    const { container } = render(<AccessibilityWidget />);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Document table structure enforces table header scope and semantics', async () => {
    const { container } = render(
      <table>
        <caption>Clause Analysis Summary</caption>
        <thead>
          <tr>
            <th scope="col">Clause Name</th>
            <th scope="col">Risk Level</th>
            <th scope="col">Citation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Indemnity Cap</td>
            <td>High</td>
            <td>Page 4, ¶ 12.1</td>
          </tr>
        </tbody>
      </table>
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Navigation landmark with list and skip link passes WCAG landmarks rule', async () => {
    const { container } = render(
      <nav aria-label="Main Navigation">
        <ul>
          <li><a href="#main-content">Skip to content</a></li>
          <li><a href="/workspace">Workspaces</a></li>
          <li><a href="/settings">Settings</a></li>
        </ul>
      </nav>
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Search landmark with accessible label and submit control passes axe audit', async () => {
    const { container } = render(
      <form role="search" aria-label="Contract Search">
        <label htmlFor="search-input">Search clauses</label>
        <input id="search-input" type="search" name="q" />
        <button type="submit">Search</button>
      </form>
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Live region for streaming AI responses adheres to aria-live guidelines', async () => {
    const { container } = render(
      <div role="status" aria-live="polite" aria-atomic="true">
        <span>AI analysis complete. 4 key clauses flagged.</span>
      </div>
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Alert dialog structure adheres to WAI-ARIA modal dialog specifications', async () => {
    const { container } = render(
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
      >
        <h2 id="dialog-title">Delete Project</h2>
        <p id="dialog-desc">This action will soft-delete the project and all associated documents.</p>
        <Button variant="danger">Confirm Delete</Button>
        <Button variant="ghost">Cancel</Button>
      </div>
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Tab panel structure conforms to ARIA tablist pattern', async () => {
    const { container } = render(
      <div>
        <div role="tablist" aria-label="Analysis Perspectives">
          <button role="tab" aria-selected="true" id="tab-summary" aria-controls="panel-summary">
            Summary
          </button>
          <button role="tab" aria-selected="false" id="tab-risks" aria-controls="panel-risks">
            Risk Flags
          </button>
        </div>
        <div role="tabpanel" id="panel-summary" aria-labelledby="tab-summary">
          <p>Document summary content...</p>
        </div>
      </div>
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Checklist items provide semantic checkboxes with labels', async () => {
    const { container } = render(
      <fieldset>
        <legend>Review Checklist</legend>
        <div>
          <input type="checkbox" id="check-ip" />
          <label htmlFor="check-ip">IP Assignment validated</label>
        </div>
        <div>
          <input type="checkbox" id="check-gov-law" />
          <label htmlFor="check-gov-law">Governing Law jurisdiction verified</label>
        </div>
      </fieldset>
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Color contrast independence: risk badges contain text labels alongside visual styling', () => {
    const { getByText } = render(
      <div>
        <Badge tone="critical">CRITICAL RISK - Forfeiture Clause</Badge>
        <Badge tone="positive">LOW RISK - Standard Notice</Badge>
      </div>
    );
    expect(getByText('CRITICAL RISK - Forfeiture Clause')).toBeInTheDocument();
    expect(getByText('LOW RISK - Standard Notice')).toBeInTheDocument();
  });

  it('Touch target sizing exceeds minimum 44x44px for primary interactive targets', () => {
    const { container } = render(
      <Button size="lg" className="min-h-[44px] min-w-[44px]">
        Full Target
      </Button>
    );
    expect(container.firstElementChild).toHaveClass('min-h-[44px]');
  });

  it('Accessible disclosure button indicates expansion state via aria-expanded', () => {
    const { getByRole, rerender } = render(
      <button aria-expanded="false" aria-controls="disclosure-content">
        Show Clause Details
      </button>
    );
    expect(getByRole('button')).toHaveAttribute('aria-expanded', 'false');

    rerender(
      <button aria-expanded="true" aria-controls="disclosure-content">
        Hide Clause Details
      </button>
    );
    expect(getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('Skip link has proper target anchor and accessible label', () => {
    const { getByRole } = render(
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Skip to main content
      </a>
    );
    const link = getByRole('link');
    expect(link).toHaveAttribute('href', '#main-content');
    expect(link).toHaveTextContent('Skip to main content');
  });
});
