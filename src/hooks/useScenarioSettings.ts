import { useEffect, useState } from 'react';
import { baseScenario } from '../data/mockScenarios.ts';
import type { Scenario } from '../models/scenario.ts';

const STORAGE_KEY = 'sequoia.currentScenario';

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function cleanScenario(value: unknown): Scenario {
  if (!value || typeof value !== 'object') {
    return baseScenario;
  }

  const savedScenario = value as Partial<Scenario>;

  return {
    ...baseScenario,
    ...savedScenario,
    id: baseScenario.id,
    name: typeof savedScenario.name === 'string' ? savedScenario.name : baseScenario.name,
    description:
      typeof savedScenario.description === 'string'
        ? savedScenario.description
        : baseScenario.description,
    startYear: isNumber(savedScenario.startYear) ? savedScenario.startYear : baseScenario.startYear,
    horizonYears: isNumber(savedScenario.horizonYears)
      ? savedScenario.horizonYears
      : baseScenario.horizonYears,
    annualIncome: isNumber(savedScenario.annualIncome)
      ? savedScenario.annualIncome
      : baseScenario.annualIncome,
    annualExpenses: isNumber(savedScenario.annualExpenses)
      ? savedScenario.annualExpenses
      : baseScenario.annualExpenses,
    annualExpenseInflation: isNumber(savedScenario.annualExpenseInflation)
      ? savedScenario.annualExpenseInflation
      : baseScenario.annualExpenseInflation,
    annualExpectedReturn: isNumber(savedScenario.annualExpectedReturn)
      ? savedScenario.annualExpectedReturn
      : baseScenario.annualExpectedReturn,
    fireTarget: isNumber(savedScenario.fireTarget) ? savedScenario.fireTarget : baseScenario.fireTarget,
    withdrawalRate: isNumber(savedScenario.withdrawalRate)
      ? savedScenario.withdrawalRate
      : baseScenario.withdrawalRate,
  };
}

function readStoredScenario(): Scenario {
  try {
    const storedScenario = window.localStorage.getItem(STORAGE_KEY);

    if (!storedScenario) {
      return baseScenario;
    }

    return cleanScenario(JSON.parse(storedScenario));
  } catch {
    return baseScenario;
  }
}

export function useScenarioSettings() {
  const [scenario, setScenario] = useState<Scenario>(readStoredScenario);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));
  }, [scenario]);

  function resetScenario() {
    setScenario(baseScenario);
  }

  return {
    scenario,
    setScenario,
    resetScenario,
  };
}
