'use client';
// Reads the singleton SiteSettings row. Apollo dedups so multiple consumers
// (Nav, landing splash) share a single network request.
//
// DEFAULTS exist for two cases: (1) the brief loading window before the query
// resolves, (2) network failure. They mirror the Prisma schema defaults so
// staff edits made in Studio always win once the query lands.
import { useQuery } from '@apollo/client';
import { GET_SITE_SETTINGS } from './queries';

export type SiteSettings = {
  organizationName: string;
  landingTitle: string;
  landingSubtitle: string;
  landingCtaText: string;
  donateUrl: string;
  donateLabel: string;
  contactUrl: string;
  contactLabel: string;
};

const DEFAULTS: SiteSettings = {
  organizationName: 'The Tipi Raisers',
  landingTitle: 'Vision 2035',
  landingSubtitle: 'The Tipi Raisers invites you to join us in thinking big...',
  landingCtaText: 'Explore Our Campaign',
  donateUrl: 'https://www.thetipiraisers.org/donate.html',
  donateLabel: 'Donate Today!',
  contactUrl: 'https://www.thetipiraisers.org/contact-us.html',
  contactLabel: 'Contact Us',
};

export function useSiteSettings(): SiteSettings {
  const { data } = useQuery<{ siteSettings: SiteSettings }>(GET_SITE_SETTINGS);
  return data?.siteSettings ?? DEFAULTS;
}
