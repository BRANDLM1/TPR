-- Singleton table holding editable landing-page + nav copy and external URLs.
-- Seed exactly one row (id = 1) so the frontend's first read returns content.
-- Staff edit the row in Prisma Studio; the schema defaults are the safety net.
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "organizationName" TEXT NOT NULL DEFAULT 'The Tipi Raisers',
    "landingTitle" TEXT NOT NULL DEFAULT 'Vision 2035',
    "landingSubtitle" TEXT NOT NULL DEFAULT 'The Tipi Raisers invites you to join us in thinking big...',
    "landingCtaText" TEXT NOT NULL DEFAULT 'Explore Our Campaign',
    "donateUrl" TEXT NOT NULL DEFAULT 'https://www.thetipiraisers.org/donate.html',
    "donateLabel" TEXT NOT NULL DEFAULT 'Donate Today!',
    "contactUrl" TEXT NOT NULL DEFAULT 'https://www.thetipiraisers.org/contact-us.html',
    "contactLabel" TEXT NOT NULL DEFAULT 'Contact Us',

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SiteSettings" ("id") VALUES (1) ON CONFLICT DO NOTHING;
