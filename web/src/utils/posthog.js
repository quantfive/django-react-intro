import posthog from 'posthog-js';

// Initialize PostHog
// Replace these with your actual PostHog credentials
const POSTHOG_KEY = process.env.REACT_APP_POSTHOG_KEY || 'phc_YOUR_PROJECT_API_KEY';
const POSTHOG_HOST = process.env.REACT_APP_POSTHOG_HOST || 'https://app.posthog.com';

if (POSTHOG_KEY && POSTHOG_KEY !== 'phc_YOUR_PROJECT_API_KEY') {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageviews: true,
    capture_pageleave: true,
  });
}

export default posthog;
