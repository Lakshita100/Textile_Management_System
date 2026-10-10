import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge, KpiCard, EmptyState } from './ui';

describe('UI components', () => {
  it('renders machine status badge', () => {
    render(<StatusBadge status="RUNNING" />);
    expect(screen.getByText('Running')).toBeTruthy();
  });

  it('renders KPI card with value', () => {
    render(<KpiCard label="Total machines" value={6} />);
    expect(screen.getByText('Total machines')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
  });

  it('renders empty state', () => {
    render(<EmptyState title="No machines" hint="Add one" />);
    expect(screen.getByText('No machines')).toBeTruthy();
  });
});
