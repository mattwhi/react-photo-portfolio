-- AlterTable
ALTER TABLE `BlogPage` ADD COLUMN `authorName` VARCHAR(120) NULL,
    ADD COLUMN `category` VARCHAR(120) NULL,
    ADD COLUMN `tags` JSON NULL;
