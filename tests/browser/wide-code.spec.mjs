import { test, expect } from '@playwright/test';
import { wideCodeContracts } from '../../themes/hugo-mini/tests/browser/wide-code-contracts.mjs';
wideCodeContracts(test, expect);
