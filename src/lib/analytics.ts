import posthog, { type CaptureResult, type Properties } from 'posthog-js';

export const docsAnalyticsEvents = [
  'docs_open_quickstart',
  'docs_open_api_reference',
  'docs_open_path',
  'docs_search_used',
  'docs_copy_code',
  'docs_open_external_link',
] as const;

export type DocsAnalyticsEvent = (typeof docsAnalyticsEvents)[number];

type AnalyticsProperties = {
  placement?: string;
  target?: string;
};

const eventNames = new Set<string>(docsAnalyticsEvents);
const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';
let initialized = false;

function cleanUrl(value: string) {
  try {
    const url = new URL(value, window.location.origin);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return value;
  }
}

function sanitizeHeatmapData(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([url, points]) => [cleanUrl(url), points]),
  );
}

function sanitizeCapture(capture: CaptureResult | null): CaptureResult | null {
  if (!capture) return null;

  const properties: Properties = {
    ...capture.properties,
    surface: 'docs',
    page_path: window.location.pathname,
  };

  for (const [key, value] of Object.entries(properties)) {
    if (
      typeof value === 'string' &&
      (key.includes('url') || key.includes('referrer'))
    ) {
      properties[key] = cleanUrl(value);
    }
  }

  if ('$heatmap_data' in properties) {
    properties.$heatmap_data = sanitizeHeatmapData(properties.$heatmap_data);
  }

  return { ...capture, properties };
}

function handleTrackedClick(event: MouseEvent) {
  const source = event.target;
  if (!(source instanceof Element)) return;

  const tracked = source.closest<HTMLElement>('[data-analytics-event]');
  if (!tracked) return;

  const eventName = tracked.dataset.analyticsEvent;
  if (!eventName || !eventNames.has(eventName)) return;

  captureDocsEvent(eventName as DocsAnalyticsEvent, {
    placement: tracked.dataset.analyticsPlacement,
    target: tracked.dataset.analyticsTarget,
  });
}

export function initDocsAnalytics() {
  if (
    initialized ||
    !projectToken ||
    window.location.hostname !== 'docs.brawsr.io'
  ) {
    return;
  }

  posthog.init(projectToken, {
    api_host: apiHost,
    ui_host: 'https://eu.posthog.com',
    defaults: '2026-05-30',
    autocapture: false,
    rageclick: false,
    capture_pageview: 'history_change',
    capture_pageleave: 'if_capture_pageview',
    cookieless_mode: 'always',
    person_profiles: 'never',
    respect_dnt: true,
    disable_capture_url_hashes: true,
    disable_session_recording: true,
    disable_surveys: true,
    disable_surveys_automatic_display: true,
    disable_product_tours: true,
    disable_conversations: true,
    disable_web_experiments: true,
    disable_external_dependency_loading: true,
    advanced_disable_feature_flags: true,
    before_send: sanitizeCapture,
  });

  initialized = true;
  document.addEventListener('click', handleTrackedClick, true);
}

export function captureDocsEvent(
  event: DocsAnalyticsEvent,
  properties: AnalyticsProperties = {},
) {
  if (!initialized) return;

  posthog.capture(event, {
    ...properties,
    page_path: window.location.pathname,
  });
}
