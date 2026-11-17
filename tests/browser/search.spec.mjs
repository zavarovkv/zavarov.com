import {test, expect} from '@playwright/test';
import {searchContracts} from '../../themes/hugo-mini/tests/browser/search-contracts.mjs';
searchContracts({test, expect, site:true});
