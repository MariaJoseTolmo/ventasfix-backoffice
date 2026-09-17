import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/testUtils';
import StockGauge, { stockStatus, stockStatusRank } from './StockGauge';

// Thresholds used throughout: minimum 10, low 20, high 80 (minimum <= low <= high).
const thresholds = { minimum: 10, low: 20, high: 80 };

describe('stockStatus', () => {
  it('is critical when current is below minimum', () => {
    expect(stockStatus({ current: 5, ...thresholds })).toEqual({ status: 'critical', label: 'Below minimum' });
  });

  it('is low, not critical, when current equals minimum (strict < check)', () => {
    expect(stockStatus({ current: 10, ...thresholds })).toEqual({ status: 'low', label: 'Low stock' });
  });

  it('is low when current is between minimum and low', () => {
    expect(stockStatus({ current: 15, ...thresholds })).toEqual({ status: 'low', label: 'Low stock' });
  });

  it('is healthy, not low, when current equals low (strict < check)', () => {
    expect(stockStatus({ current: 20, ...thresholds })).toEqual({ status: 'ok', label: 'Healthy' });
  });

  it('is healthy when current is between low and high', () => {
    expect(stockStatus({ current: 50, ...thresholds })).toEqual({ status: 'ok', label: 'Healthy' });
  });

  it('is healthy, not overstock, when current equals high (strict > check)', () => {
    expect(stockStatus({ current: 80, ...thresholds })).toEqual({ status: 'ok', label: 'Healthy' });
  });

  it('is overstock when current is above high', () => {
    expect(stockStatus({ current: 90, ...thresholds })).toEqual({ status: 'overstock', label: 'Overstock' });
  });
});

describe('stockStatusRank', () => {
  it('ranks critical before low, low before ok, and ok before overstock', () => {
    const critical = stockStatusRank({ current: 5, ...thresholds });
    const low = stockStatusRank({ current: 15, ...thresholds });
    const ok = stockStatusRank({ current: 50, ...thresholds });
    const overstock = stockStatusRank({ current: 90, ...thresholds });

    expect(critical).toBeLessThan(low);
    expect(low).toBeLessThan(ok);
    expect(ok).toBeLessThan(overstock);
  });
});

describe('StockGauge', () => {
  it('exposes the value, the scale and the three thresholds through aria-label', () => {
    renderWithProviders(<StockGauge current={18} minimum={10} low={20} high={80} />);

    // scaleMax = max(80, 18) * 1.2 = 96
    const gauge = screen.getByRole('img', {
      name: 'Stock 18 of 96 — minimum 10, low 20, high 80',
    });
    expect(gauge).toBeInTheDocument();
    expect(screen.getByText('Low stock')).toBeInTheDocument();
  });

  it('labels a below-minimum value as critical', () => {
    renderWithProviders(<StockGauge current={2} minimum={10} low={20} high={100} />);

    expect(screen.getByText('Below minimum')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Stock 2 of 120/ })).toBeInTheDocument();
  });
});
