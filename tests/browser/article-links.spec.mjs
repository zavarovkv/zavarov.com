import {test, expect} from '@playwright/test';
import {articleLinkContracts} from '../../themes/hugo-mini/tests/browser/article-link-contracts.mjs';
articleLinkContracts({test, expect});
