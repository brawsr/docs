'use client';

import { createOpenAPIPage } from 'fumadocs-openapi/ui';
import { createCodeUsageGeneratorRegistry } from 'fumadocs-openapi/requests/generators';

export const APIPage = createOpenAPIPage({
  codeUsages: createCodeUsageGeneratorRegistry(),
  playground: {
    enabled: false,
  },
});
