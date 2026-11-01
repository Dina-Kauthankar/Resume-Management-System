-- ============================================================
-- RESUME MANAGEMENT SYSTEM
-- MYSQL DATABASE SCHEMA
-- ============================================================

-- ============================================================
-- TABLE: users
-- ============================================================

CREATE TABLE `users` (
    `id` int NOT NULL AUTO_INCREMENT,

    `full_name` varchar(191)
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `email` varchar(191)
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `password` varchar(191)
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `role` enum(
        'HR',
        'CANDIDATE'
    )
        COLLATE utf8mb4_unicode_ci NOT NULL
        DEFAULT 'CANDIDATE',

    `applicant_type` enum(
        'SINGLE_JOB_SEEKER',
        'SINGLE_INTERN',
        'BATCH_INTERN'
    )
        COLLATE utf8mb4_unicode_ci NOT NULL
        DEFAULT 'SINGLE_JOB_SEEKER',

    `phone` varchar(191)
        COLLATE utf8mb4_unicode_ci DEFAULT NULL,

    `college_details` text
        COLLATE utf8mb4_unicode_ci,

    `company_address` text
        COLLATE utf8mb4_unicode_ci DEFAULT NULL,

    `created_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    `updated_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    UNIQUE KEY `users_email_key` (`email`)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: projects
-- ============================================================

CREATE TABLE `projects` (
    `id` int NOT NULL AUTO_INCREMENT,

    `title` varchar(191)
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `description` text
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `target_type` enum(
        'SINGLE_JOB_SEEKER',
        'SINGLE_INTERN',
        'BATCH_INTERN'
    )
        COLLATE utf8mb4_unicode_ci NOT NULL
        DEFAULT 'SINGLE_JOB_SEEKER',

    `status` enum(
        'ACTIVE',
        'CLOSED',
        'DRAFT'
    )
        COLLATE utf8mb4_unicode_ci NOT NULL
        DEFAULT 'ACTIVE',

    `created_by_id` int NOT NULL,

    `created_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    `updated_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    KEY `projects_created_by_id_fkey` (`created_by_id`),

    CONSTRAINT `projects_created_by_id_fkey`
        FOREIGN KEY (`created_by_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: project_modules
-- ============================================================

CREATE TABLE `project_modules` (
    `id` int NOT NULL AUTO_INCREMENT,

    `project_id` int NOT NULL,

    `name` varchar(191)
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `description` text
        COLLATE utf8mb4_unicode_ci,

    `required_skills` text
        COLLATE utf8mb4_unicode_ci,

    `created_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    `updated_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    KEY `project_modules_project_id_idx` (`project_id`),

    CONSTRAINT `project_modules_project_id_fkey`
        FOREIGN KEY (`project_id`)
        REFERENCES `projects` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: project_keywords
-- ============================================================

CREATE TABLE `project_keywords` (
    `id` int NOT NULL AUTO_INCREMENT,

    `project_id` int NOT NULL,

    `keyword` varchar(191)
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `weight` int NOT NULL DEFAULT '1',

    `created_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    KEY `project_keywords_project_id_idx` (`project_id`),

    CONSTRAINT `project_keywords_project_id_fkey`
        FOREIGN KEY (`project_id`)
        REFERENCES `projects` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: applications
-- ============================================================

CREATE TABLE `applications` (
    `id` int NOT NULL AUTO_INCREMENT,

    `user_id` int NOT NULL,

    `project_id` int NOT NULL,

    `applicant_type` enum(
        'SINGLE_JOB_SEEKER',
        'SINGLE_INTERN',
        'BATCH_INTERN'
    )
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `status` enum(
        'APPLIED',
        'SHORTLISTED',
        'INTERVIEW_SCHEDULED',
        'SELECTED',
        'REJECTED'
    )
        COLLATE utf8mb4_unicode_ci NOT NULL
        DEFAULT 'APPLIED',

    `score` int NOT NULL DEFAULT '0',

    `matched_keywords` int NOT NULL DEFAULT '0',

    `created_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    `updated_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    `confidence_percentage` double
        NOT NULL
        DEFAULT '0',

    PRIMARY KEY (`id`),

    KEY `applications_user_id_idx` (`user_id`),

    KEY `applications_project_id_idx` (`project_id`),

    CONSTRAINT `applications_project_id_fkey`
        FOREIGN KEY (`project_id`)
        REFERENCES `projects` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT `applications_user_id_fkey`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: resumes
-- ============================================================

CREATE TABLE `resumes` (
    `id` int NOT NULL AUTO_INCREMENT,

    `application_id` int NOT NULL,

    `file_name` varchar(191)
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `file_extension` varchar(191)
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `file_path` varchar(191)
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `extracted_text` longtext
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `character_count` int NOT NULL,

    `word_count` int NOT NULL,

    `uploaded_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    UNIQUE KEY `resumes_application_id_key`
        (`application_id`),

    CONSTRAINT `resumes_application_id_fkey`
        FOREIGN KEY (`application_id`)
        REFERENCES `applications` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: appointments
-- ============================================================

CREATE TABLE `appointments` (
    `id` int NOT NULL AUTO_INCREMENT,

    `application_id` int NOT NULL,

    `interview_date` date NOT NULL,

    `interview_time` time NOT NULL,

    `meeting_link` varchar(500)
        COLLATE utf8mb4_unicode_ci DEFAULT NULL,

    `physical_location` varchar(500)
        COLLATE utf8mb4_unicode_ci DEFAULT NULL,

    `interview_type` enum(
        'ONLINE',
        'OFFLINE'
    )
        COLLATE utf8mb4_unicode_ci NOT NULL
        DEFAULT 'ONLINE',

    `status` enum(
        'SCHEDULED',
        'COMPLETED',
        'CANCELLED'
    )
        COLLATE utf8mb4_unicode_ci NOT NULL
        DEFAULT 'SCHEDULED',

    `notes` text
        COLLATE utf8mb4_unicode_ci,

    `created_by` int DEFAULT NULL,

    `created_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    `updated_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    KEY `idx_appointments_application_id`
        (`application_id`),

    KEY `idx_appointments_status`
        (`status`),

    KEY `idx_appointments_interview_date`
        (`interview_date`),

    KEY `fk_appointments_created_by`
        (`created_by`),

    CONSTRAINT `fk_appointments_application`
        FOREIGN KEY (`application_id`)
        REFERENCES `applications` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT `fk_appointments_created_by`
        FOREIGN KEY (`created_by`)
        REFERENCES `users` (`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: application_status_history
-- ============================================================

CREATE TABLE `application_status_history` (
    `id` int NOT NULL AUTO_INCREMENT,

    `application_id` int NOT NULL,

    `old_status` varchar(50)
        COLLATE utf8mb4_unicode_ci DEFAULT NULL,

    `new_status` varchar(50)
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `changed_by` int DEFAULT NULL,

    `decision_note` text
        COLLATE utf8mb4_unicode_ci,

    `changed_at` datetime
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),

    KEY `idx_application_status_history_application_id`
        (`application_id`),

    KEY `fk_application_status_history_changed_by`
        (`changed_by`),

    CONSTRAINT `fk_application_status_history_application`
        FOREIGN KEY (`application_id`)
        REFERENCES `applications` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT `fk_application_status_history_changed_by`
        FOREIGN KEY (`changed_by`)
        REFERENCES `users` (`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- ============================================================
-- TABLE: password_reset_tokens
-- ============================================================

CREATE TABLE `password_reset_tokens` (
    `id` int NOT NULL AUTO_INCREMENT,

    `user_id` int NOT NULL,

    `otp_hash` varchar(255)
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `expires_at` datetime(3) NOT NULL,

    `attempts` int NOT NULL DEFAULT '0',

    `is_used` tinyint(1) NOT NULL DEFAULT '0',

    `reset_token_hash` varchar(255)
        COLLATE utf8mb4_unicode_ci DEFAULT NULL,

    `created_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    KEY `idx_password_reset_user_id` (`user_id`),

    KEY `idx_password_reset_created_at` (`created_at`),

    CONSTRAINT `fk_password_reset_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: notifications
-- ============================================================

CREATE TABLE `notifications` (
    `id` int NOT NULL AUTO_INCREMENT,

    `recipient_user_id` int NOT NULL,

    `type` varchar(50)
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `title` varchar(255)
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `message` text
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `reference_id` int DEFAULT NULL,

    `reference_type` varchar(50)
        COLLATE utf8mb4_unicode_ci DEFAULT NULL,

    `is_read` tinyint(1) NOT NULL DEFAULT '0',

    `created_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    KEY `idx_notifications_recipient` (`recipient_user_id`),

    KEY `idx_notifications_is_read` (`is_read`),

    KEY `idx_notifications_created_at` (`created_at`),

    CONSTRAINT `fk_notifications_recipient`
        FOREIGN KEY (`recipient_user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: job_change_requests
-- ============================================================

CREATE TABLE `job_change_requests` (
    `id` int NOT NULL AUTO_INCREMENT,

    `user_id` int NOT NULL,

    `current_type` enum(
        'SINGLE_JOB_SEEKER',
        'SINGLE_INTERN',
        'BATCH_INTERN'
    )
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `requested_type` enum(
        'SINGLE_JOB_SEEKER',
        'SINGLE_INTERN',
        'BATCH_INTERN'
    )
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `status` enum(
        'PENDING',
        'APPROVED',
        'REJECTED'
    )
        COLLATE utf8mb4_unicode_ci NOT NULL
        DEFAULT 'PENDING',

    `reviewed_by` int DEFAULT NULL,

    `reviewed_at` datetime(3) DEFAULT NULL,

    `decision_note` text
        COLLATE utf8mb4_unicode_ci,

    `created_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    `updated_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    KEY `idx_job_change_user_id` (`user_id`),

    KEY `idx_job_change_status` (`status`),

    CONSTRAINT `fk_job_change_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT `fk_job_change_reviewed_by`
        FOREIGN KEY (`reviewed_by`)
        REFERENCES `users` (`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: teams
-- ============================================================

CREATE TABLE `teams` (
    `id` int NOT NULL AUTO_INCREMENT,

    `project_id` int NOT NULL,

    `name` varchar(191)
        COLLATE utf8mb4_unicode_ci NOT NULL,

    `created_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    `updated_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    KEY `teams_project_id_idx` (`project_id`),

    CONSTRAINT `teams_project_id_fkey`
        FOREIGN KEY (`project_id`)
        REFERENCES `projects` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: team_members
-- ============================================================

CREATE TABLE `team_members` (
    `id` int NOT NULL AUTO_INCREMENT,

    `team_id` int NOT NULL,

    `user_id` int NOT NULL,

    `application_id` int NOT NULL,

    `project_module_id` int NOT NULL,

    `assigned_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    UNIQUE KEY `team_members_application_id_unique` (`application_id`),

    UNIQUE KEY `team_members_team_user_unique` (`team_id`, `user_id`),

    KEY `team_members_team_id_idx` (`team_id`),

    KEY `team_members_user_id_idx` (`user_id`),

    KEY `team_members_module_id_idx` (`project_module_id`),

    CONSTRAINT `team_members_team_id_fkey`
        FOREIGN KEY (`team_id`)
        REFERENCES `teams` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT `team_members_user_id_fkey`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT `team_members_application_id_fkey`
        FOREIGN KEY (`application_id`)
        REFERENCES `applications` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT `team_members_module_id_fkey`
        FOREIGN KEY (`project_module_id`)
        REFERENCES `project_modules` (`id`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: company_settings
-- ============================================================

CREATE TABLE `company_settings` (
    `id` int NOT NULL DEFAULT '1',

    `company_name` varchar(191)
        COLLATE utf8mb4_unicode_ci NOT NULL
        DEFAULT 'Demerge Systems India',

    `company_logo` varchar(500)
        COLLATE utf8mb4_unicode_ci DEFAULT '/demerg_system_india_logo.jpg',

    `recruitment_email` varchar(191)
        COLLATE utf8mb4_unicode_ci DEFAULT NULL,

    `phone` varchar(50)
        COLLATE utf8mb4_unicode_ci DEFAULT NULL,

    `address` text
        COLLATE utf8mb4_unicode_ci DEFAULT NULL,

    `website` varchar(255)
        COLLATE utf8mb4_unicode_ci DEFAULT NULL,

    `contact_message` text
        COLLATE utf8mb4_unicode_ci DEFAULT NULL,

    `office_hours` varchar(255)
        COLLATE utf8mb4_unicode_ci DEFAULT 'Mon - Fri, 9:00 AM - 6:00 PM',

    `brand_color` varchar(50)
        COLLATE utf8mb4_unicode_ci NOT NULL
        DEFAULT '#4f46e5',

    `allowed_formats` varchar(255)
        COLLATE utf8mb4_unicode_ci NOT NULL
        DEFAULT 'pdf,docx,tex',

    `max_file_size_mb` int NOT NULL
        DEFAULT '5',

    `created_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    `updated_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    CONSTRAINT `company_settings_singleton_chk`
        CHECK (`id` = 1)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

INSERT INTO `company_settings` (`id`, `company_name`, `company_logo`, `office_hours`, `brand_color`, `allowed_formats`, `max_file_size_mb`)
VALUES (1, 'Demerge Systems India', '/demerg_system_india_logo.jpg', 'Mon - Fri, 9:00 AM - 6:00 PM', '#4f46e5', 'pdf,docx,tex', 5)
ON DUPLICATE KEY UPDATE `id` = `id`;


-- ============================================================
-- TABLE: notification_preferences
-- ============================================================

CREATE TABLE `notification_preferences` (
    `id` int NOT NULL AUTO_INCREMENT,

    `user_id` int NOT NULL,

    `notify_new_applications` tinyint(1) NOT NULL
        DEFAULT '1',

    `notify_interviews` tinyint(1) NOT NULL
        DEFAULT '1',

    `notify_selections` tinyint(1) NOT NULL
        DEFAULT '1',

    `notify_batch_allocations` tinyint(1) NOT NULL
        DEFAULT '1',

    `created_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    `updated_at` datetime(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    UNIQUE KEY `notification_preferences_user_id_unique` (`user_id`),

    KEY `idx_notification_preferences_user` (`user_id`),

    CONSTRAINT `fk_notification_preferences_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;