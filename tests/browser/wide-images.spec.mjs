import { test, expect } from '@playwright/test';
import { wideImageContracts } from '../../themes/hugo-mini/tests/browser/wide-image-contracts.mjs';
wideImageContracts(test, expect);
