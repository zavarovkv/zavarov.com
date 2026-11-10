import {test, expect} from '@playwright/test';
import {editorialContracts} from '../../themes/hugo-mini/tests/browser/editorial-contracts.mjs';
editorialContracts({test, expect});
