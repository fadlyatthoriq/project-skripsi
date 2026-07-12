-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('NURSE', 'DOCTOR', 'ADMIN') NOT NULL DEFAULT 'NURSE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `predictions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `pregnancies` DOUBLE NOT NULL,
    `glucose` DOUBLE NOT NULL,
    `bloodPressure` DOUBLE NOT NULL,
    `skinThickness` DOUBLE NOT NULL,
    `insulin` DOUBLE NOT NULL,
    `bmi` DOUBLE NOT NULL,
    `diabetesPedigreeFunction` DOUBLE NOT NULL,
    `age` INTEGER NOT NULL,
    `result` INTEGER NOT NULL,
    `probability` DOUBLE NOT NULL,
    `riskLabel` VARCHAR(191) NOT NULL,
    `recommendation` TEXT NOT NULL,
    `glucoseSummary` VARCHAR(191) NOT NULL,
    `bmiSummary` VARCHAR(191) NOT NULL,
    `bloodPressureSummary` VARCHAR(191) NOT NULL,
    `ageSummary` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `predictions` ADD CONSTRAINT `predictions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('NURSE', 'DOCTOR', 'ADMIN', 'PATIENT') NOT NULL DEFAULT 'NURSE';
