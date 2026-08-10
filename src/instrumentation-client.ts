void import('@/lib/analytics')
  .then(({ initDocsAnalytics }) => initDocsAnalytics())
  .catch(() => {
    // Analytics must never delay or break the documentation site.
  });
