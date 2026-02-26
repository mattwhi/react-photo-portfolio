-- AlterTable
ALTER TABLE `SiteSettings` ADD COLUMN `defaultDescription` TEXT NULL,
    ADD COLUMN `defaultOgImageUrl` TEXT NULL,
    ADD COLUMN `globalNoindex` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `siteName` VARCHAR(255) NOT NULL DEFAULT 'Cre8 Photography',
    ADD COLUMN `siteUrl` VARCHAR(255) NULL,
    ADD COLUMN `titleTemplate` VARCHAR(255) NOT NULL DEFAULT '%s | cre8 Photography',
    ADD COLUMN `twitterHandle` VARCHAR(64) NULL,
    MODIFY `logoUrl` TEXT NULL,
    MODIFY `logoAlt` VARCHAR(255) NULL,
    MODIFY `logoTitle` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `SeoMeta` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` ENUM('GALLERY', 'PAGE', 'PROFILE', 'POST') NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `canonicalUrl` VARCHAR(191) NULL,
    `ogTitle` VARCHAR(191) NULL,
    `ogDescription` VARCHAR(191) NULL,
    `ogImageUrl` VARCHAR(191) NULL,
    `twitterCard` VARCHAR(191) NULL,
    `noindex` BOOLEAN NOT NULL DEFAULT false,
    `nofollow` BOOLEAN NOT NULL DEFAULT false,
    `jsonLd` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SeoMeta_entityType_idx`(`entityType`),
    UNIQUE INDEX `SeoMeta_entityType_entityId_key`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RedirectRule` (
    `id` VARCHAR(191) NOT NULL,
    `fromPath` VARCHAR(191) NOT NULL,
    `toPath` VARCHAR(191) NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 301,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RedirectRule_fromPath_key`(`fromPath`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
