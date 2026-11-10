import { test, expect } from '@playwright/test';
import { wideDiagramContracts } from '../../themes/hugo-mini/tests/browser/wide-diagram-contracts.mjs';
wideDiagramContracts(test, expect);
