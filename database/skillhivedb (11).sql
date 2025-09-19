-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 12, 2025 at 12:53 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `skillhivedb`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_logs`
--

CREATE TABLE `admin_logs` (
  `log_id` int(11) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `action` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `approval_shadow`
--

CREATE TABLE `approval_shadow` (
  `id` int(11) NOT NULL,
  `batch_key` varchar(64) NOT NULL,
  `pending_id` int(11) NOT NULL,
  `created_user_id` int(11) DEFAULT NULL,
  `created_tutor_id` int(11) DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `approval_shadow`
--

INSERT INTO `approval_shadow` (`id`, `batch_key`, `pending_id`, `created_user_id`, `created_tutor_id`, `admin_id`, `created_at`) VALUES
(1, '82a9021d1fe2ce6c', 1, 9, NULL, 8, '2025-08-17 16:23:28');

-- --------------------------------------------------------

--
-- Table structure for table `available_times`
--

CREATE TABLE `available_times` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_id` int(11) DEFAULT NULL,
  `day` varchar(20) NOT NULL,
  `time` varchar(20) NOT NULL,
  `topic_title` varchar(255) NOT NULL DEFAULT '',
  `topic_description` text NOT NULL DEFAULT '',
  `booked` int(11) DEFAULT 0,
  `capacity` int(11) NOT NULL,
  `ongoing` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `available_times`
--

INSERT INTO `available_times` (`id`, `user_id`, `session_id`, `day`, `time`, `topic_title`, `topic_description`, `booked`, `capacity`, `ongoing`, `created_at`, `updated_at`) VALUES
(1, 4, 6, 'Monday', '09:00-10:00', 'Admin via test', 'OK', 2, 4, 0, '2025-08-20 08:00:00', '2025-09-05 17:58:50'),
(2, 4, 6, 'Wednesday', '14:00-15:00', '', '', 1, 4, 1, '2025-08-20 08:05:00', '2025-08-21 22:41:33'),
(3, 5, 7, 'Tuesday', '10:00-11:00', 'Java Data Types', 'Primitive data types are the simplest types in programming language.', 2, 3, 0, '2025-08-20 09:00:00', '2025-09-05 19:02:21'),
(4, 5, NULL, 'Thursday', '16:00-17:00', '', '', 0, 5, 0, '2025-08-20 09:05:00', '2025-08-20 09:05:00'),
(5, 6, 10, 'Monday', '18:00-19:00', '', '', 1, 2, 1, '2025-08-20 10:00:00', '2025-08-21 11:01:43'),
(6, 6, 8, 'Friday', '08:00-09:00', '', '', 7, 3, 0, '2025-08-20 10:10:00', '2025-09-06 18:38:32'),
(7, 7, 9, 'Saturday', '11:00-12:00', '', '', 5, 6, 0, '2025-08-20 11:00:00', '2025-09-05 09:44:24'),
(8, 7, 9, 'Sunday', '13:00-14:00', '', '', 4, 4, 0, '2025-08-20 11:05:00', '2025-09-04 20:56:52'),
(21, 6, 22, 'Monday', '05:00-06:00', 'sacfsa', 'evecwceg', 1, 5, 0, '2025-09-06 19:35:01', '2025-09-06 19:35:48'),
(22, 6, 23, 'Tuesday', '03:00-04:30', 'basta', 'dayadun basta', 1, 5, 0, '2025-09-06 19:42:05', '2025-09-06 19:42:50'),
(23, 6, 24, 'Wednesday', '10:00-11:00', 'asdwwwd', 'asdasfdefqwdasdaadd', 0, 5, 0, '2025-09-10 11:31:29', '2025-09-10 11:31:29'),
(24, 6, 25, 'Thursday', '09:00-04:00', 'ASCVDFDB', 'SDWDDWD', 0, 4, 0, '2025-09-10 11:53:23', '2025-09-10 11:53:23');

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `available_time_id` int(11) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  `booked_at` datetime DEFAULT current_timestamp(),
  `session_id` int(11) DEFAULT NULL,
  `tutor_id` int(11) DEFAULT NULL,
  `price_charged` decimal(10,2) DEFAULT NULL,
  `voucher_inventory_id` int(11) DEFAULT NULL,
  `voucher_item_id` int(11) DEFAULT NULL,
  `voucher_code` varchar(64) DEFAULT NULL,
  `voucher_discount` decimal(10,2) DEFAULT NULL,
  `price_before` decimal(10,2) DEFAULT NULL,
  `price_after` decimal(10,2) DEFAULT NULL,
  `voucher_used_at` datetime DEFAULT NULL,
  `student_college` varchar(255) DEFAULT NULL,
  `tutor_reason` text DEFAULT NULL,
  `tutor_responded_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `available_time_id`, `user_id`, `status`, `booked_at`, `session_id`, `tutor_id`, `price_charged`, `voucher_inventory_id`, `voucher_item_id`, `voucher_code`, `voucher_discount`, `price_before`, `price_after`, `voucher_used_at`, `student_college`, `tutor_reason`, `tutor_responded_at`) VALUES
(19, 3, '202300001', 'pending', '2025-09-04 18:58:37', 7, 6, 90.00, 4, 4, 'SUMMER10', 10.00, 100.00, 90.00, '2025-09-04 18:58:37', NULL, NULL, NULL),
(29, 6, '202300001', '', '2025-09-06 18:38:32', 8, 6, 90.00, 3, 19, 'VCHR0019', 10.00, 100.00, 90.00, '2025-09-06 18:38:32', NULL, NULL, NULL),
(30, 21, '202300001', 'pending', '2025-09-06 19:35:47', 22, 6, 36.00, 6, 21, 'VCHR0021', 4.00, 40.00, 36.00, '2025-09-06 19:35:47', NULL, NULL, NULL),
(31, 22, '202300001', 'pending', '2025-09-06 19:42:48', 23, 6, 18.00, 6, 21, 'VCHR0021', 2.00, 20.00, 18.00, '2025-09-06 19:42:48', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `slug` varchar(128) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(2048) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `slug`, `name`, `description`, `image_url`, `created_at`, `updated_at`) VALUES
(1, 'programming', 'Programming & Development', 'Learn languages, algorithms and software development.', 'assets/images/mainpage_pictures/candc.png', '2025-08-16 04:00:00', '2025-08-17 10:48:23'),
(2, 'Creative & Design', 'Creative & Design', 'Creative & Design', 'assets/images/mainpage_pictures/candd.png', '2025-08-16 04:00:00', '2025-08-16 14:13:00'),
(3, 'Productivity & Tools', 'Productivity & Tools', 'Productivity & Tools', 'assets/images/mainpage_pictures/pandg.png', '2025-08-16 04:00:00', '2025-08-16 14:13:30'),
(4, 'Career & Communication', 'Career & Communication', 'Career & Communication', 'assets/images/mainpage_pictures/pandt.png', '2025-08-16 04:00:00', '2025-08-16 14:13:58'),
(8, 'djajajaj', 'kd skcakakxakx', 'saax kvkskska', NULL, '2025-09-11 09:42:05', '2025-09-11 09:42:05'),
(9, 'svscscc', 'egefbwbetb', 'wcehecavegrg', 'assets/images/mainpage_pictures/svscscc_1757584393.jpg', '2025-09-11 09:53:13', '2025-09-11 09:53:13'),
(10, 'sseffed', 's sxwze', 'ajshsjqjajs', 'http://127.0.0.1:3000/assets/images/mainpage_pictures/sseffed_1757592056.jpg', '2025-09-11 11:49:27', '2025-09-11 12:00:56'),
(11, 'sjajsjsjsjs', ',ejezzjezje', 'e,kzeneJe', 'http://127.0.0.1:3000/assets/images/mainpage_pictures/sjajsjsjsjs_1757592315.jpg', '2025-09-11 12:01:14', '2025-09-11 12:05:15'),
(12, 'dbdvdcsc', 'vnxnsjsjsjs', 'djsjsjxudjd', 'http://127.0.0.1:3000/assets/images/mainpage_pictures/dbdvdcsc_1757592370.jpg', '2025-09-11 12:06:10', '2025-09-11 12:06:10'),
(13, 'vevscw', 'vevecwcwc', 'fvevscec', 'http://127.0.0.1:3000/assets/images/mainpage_pictures/vevscw_1757592449.jpg', '2025-09-11 12:07:29', '2025-09-11 12:07:29'),
(14, 'jzshahsha', 'ejejsjsjs', 'jsjasjsjsj', 'http://127.0.0.1:3000/assets/images/mainpage_pictures/dahon_1757592579191.jpg', '2025-09-11 12:09:39', '2025-09-11 12:09:39');

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `conversation_id` int(11) NOT NULL,
  `type` enum('direct','group') NOT NULL DEFAULT 'direct',
  `title` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `conversations`
--

INSERT INTO `conversations` (`conversation_id`, `type`, `title`, `created_at`) VALUES
(1, 'direct', NULL, '2025-08-19 14:06:13'),
(2, 'direct', NULL, '2025-08-19 14:21:30'),
(3, 'direct', NULL, '2025-08-19 20:55:42'),
(4, 'direct', NULL, '2025-08-21 17:49:04'),
(5, 'direct', NULL, '2025-08-22 01:00:38'),
(6, 'direct', NULL, '2025-09-01 21:48:21');

-- --------------------------------------------------------

--
-- Table structure for table `conversation_participants`
--

CREATE TABLE `conversation_participants` (
  `id` int(11) NOT NULL,
  `conversation_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `conversation_participants`
--

INSERT INTO `conversation_participants` (`id`, `conversation_id`, `user_id`) VALUES
(1, 1, 2),
(2, 1, 3),
(3, 2, 2),
(4, 2, 4),
(5, 3, 2),
(6, 3, 7),
(7, 4, 3),
(8, 4, 15),
(9, 5, 3),
(10, 5, 6),
(11, 6, 2),
(12, 6, 6);

-- --------------------------------------------------------

--
-- Table structure for table `enrolled_students`
--

CREATE TABLE `enrolled_students` (
  `id` int(11) NOT NULL,
  `student_id` varchar(64) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `course` varchar(128) DEFAULT NULL,
  `college` varchar(64) NOT NULL DEFAULT 'CCS',
  `year_level` int(11) DEFAULT NULL,
  `section` varchar(64) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `enrolled_students`
--

INSERT INTO `enrolled_students` (`id`, `student_id`, `full_name`, `course`, `college`, `year_level`, `section`, `is_active`, `added_at`, `updated_at`) VALUES
(1, '202400001', 'Miguel Santos', 'BSIT', 'CCS', 3, 'A', 1, '2025-01-10 01:15:00', '2025-08-19 15:07:03'),
(2, '202400002', 'Ana Lopez', 'BSCS', 'CCS', 2, 'B', 1, '2025-01-11 02:30:00', '2025-08-19 15:07:03'),
(3, '202400003', 'Carlos Rivera', 'BSED', 'CEA', 4, 'C', 1, '2025-01-12 03:05:00', '2025-08-19 15:07:03'),
(4, '202400004', 'Jessa Cruz', 'BSBA', 'CE', 1, 'A', 1, '2025-01-13 00:45:00', '2025-08-19 15:07:03'),
(5, '202400005', 'Rico Tan', 'BSIS', 'CIE', 3, 'B', 1, '2025-01-14 04:20:00', '2025-08-19 15:07:03'),
(6, '202400006', 'Liza Moreno', 'BSIT', 'CCS', 4, 'A', 1, '2025-01-15 01:55:00', '2025-08-19 15:07:03'),
(7, '202400007', 'Daniel Gomez', 'BSCS', 'CCS', 5, 'C', 1, '2025-01-16 06:00:00', '2025-08-19 15:07:03'),
(8, '202400008', 'Karen Villanueva', 'BSIT', 'CCS', 2, 'B', 1, '2025-01-17 05:10:00', '2025-08-19 15:07:03'),
(9, '202300009', 'Former Student', 'BSIT', 'CCS', 4, 'A', 0, '2021-06-01 01:00:00', '2025-08-19 15:07:03'),
(10, '202200010', 'Alvin Reyes', 'BSBA', 'CE', 5, 'B', 0, '2020-05-20 00:30:00', '2025-08-19 15:07:03'),
(11, '202400011', 'Jorge Mirano', 'BSCS', 'CCS', 3, 'A', 1, '2025-02-05 02:00:00', '2025-08-19 15:07:03'),
(12, '202400012', 'Maria Santos', 'BSIS', 'CIE', 3, 'C', 1, '2025-03-02 03:45:00', '2025-08-19 15:07:03'),
(13, '012345', 'Jorge Mirano', NULL, 'CCS', NULL, NULL, 1, '2025-08-17 16:10:55', '2025-08-19 15:07:03');

-- --------------------------------------------------------

--
-- Table structure for table `featured_tutors`
--

CREATE TABLE `featured_tutors` (
  `id` int(10) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `tutor_id` int(10) UNSIGNED NOT NULL,
  `position` int(11) NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `featured_tutors`
--

INSERT INTO `featured_tutors` (`id`, `category_id`, `tutor_id`, `position`, `active`, `starts_at`, `ends_at`, `created_at`) VALUES
(1, 1, 2, 0, 1, NULL, NULL, '2025-08-16 11:17:23'),
(3, 3, 3, 0, 1, NULL, NULL, '2025-08-16 11:17:23'),
(4, 4, 6, 0, 1, NULL, NULL, '2025-08-16 14:49:20'),
(5, 2, 1, 0, 1, NULL, NULL, '2025-08-17 10:47:29');

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `helpful_count` int(11) DEFAULT 0,
  `rating` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `is_helpful` tinyint(1) DEFAULT 0,
  `tutor_id` int(50) DEFAULT NULL,
  `session_id` int(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `feedback`
--

INSERT INTO `feedback` (`id`, `user_id`, `helpful_count`, `rating`, `comment`, `date`, `is_helpful`, `tutor_id`, `session_id`) VALUES
(1, 2, 3, 5, 'Great session — very clear explanations!', '2025-09-01 05:39:36', 1, 6, 8),
(2, 2, 1, 4, 'Useful examples, would recommend.', '2025-08-29 05:39:36', 1, 4, 6),
(3, 3, 0, 3, 'Good, but pacing was a little fast.', '2025-08-22 05:39:36', 0, 6, 7),
(4, 15, 2, 5, 'Excellent — helped me pass my test!', '2025-08-02 05:39:36', 1, 6, 7),
(5, 3, 3, 5, 'Great session — very clear explanations!', '2025-09-01 06:03:24', 1, 4, 6),
(6, 15, 1, 4, 'Useful examples, would recommend.', '2025-08-29 06:03:24', 1, 4, 6),
(7, 3, 1, 3, 'Good, but pacing was a little fast.', '2025-08-22 06:03:24', 0, 6, 7),
(8, 15, 2, 5, 'Excellent — helped me pass my test!', '2025-08-02 06:03:24', 1, 6, 7);

-- --------------------------------------------------------

--
-- Table structure for table `feedback_helpful`
--

CREATE TABLE `feedback_helpful` (
  `id` int(11) NOT NULL,
  `feedback_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `feedback_helpful`
--

INSERT INTO `feedback_helpful` (`id`, `feedback_id`, `user_id`, `created_at`) VALUES
(17, 7, 6, '2025-09-05 15:51:09');

-- --------------------------------------------------------

--
-- Table structure for table `files`
--

CREATE TABLE `files` (
  `file_id` int(11) NOT NULL,
  `session_id` int(11) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `firebase_url` text DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gamification`
--

CREATE TABLE `gamification` (
  `user_id` int(11) NOT NULL,
  `xp` int(11) DEFAULT NULL,
  `points` int(11) DEFAULT NULL,
  `level` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `gamification`
--

INSERT INTO `gamification` (`user_id`, `xp`, `points`, `level`) VALUES
(2, 99, 9900, 3),
(3, 100, 48540, 2),
(5, 4, 50000, 2),
(6, 88, 100, 5),
(15, 12, 10000000, 5);

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` bigint(20) NOT NULL,
  `conversation_id` int(11) DEFAULT NULL,
  `from_user_id` int(11) NOT NULL,
  `to_user_id` int(11) DEFAULT NULL,
  `content` text NOT NULL,
  `content_type` varchar(32) NOT NULL DEFAULT 'text',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime DEFAULT current_timestamp(),
  `delivered_at` datetime DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `from_user_id`, `to_user_id`, `content`, `content_type`, `metadata`, `created_at`, `delivered_at`, `read_at`, `is_deleted`) VALUES
(1, 1, 2, 3, 'Ahahaha', 'text', NULL, '2025-08-19 13:22:34', NULL, NULL, 0),
(2, 1, 2, 3, 'Ahahaha', 'text', NULL, '2025-08-19 13:22:34', NULL, NULL, 0),
(3, 1, 3, 2, 'Jsajajs', 'text', NULL, '2025-08-19 14:01:59', NULL, NULL, 0),
(4, 1, 3, 2, 'Jsajajs', 'text', NULL, '2025-08-19 14:01:59', NULL, NULL, 0),
(5, 1, 2, 3, 'Rzseserz', 'text', NULL, '2025-08-19 14:06:15', NULL, NULL, 0),
(6, 1, 2, 3, 'Rzseserz', 'text', NULL, '2025-08-19 14:06:15', NULL, NULL, 0),
(7, 1, 2, 3, 'Dddd', 'text', NULL, '2025-08-19 14:07:35', NULL, NULL, 0),
(8, 1, 2, 3, 'Dddd', 'text', NULL, '2025-08-19 14:07:35', NULL, NULL, 0),
(9, 1, 2, 3, 'Hoyy ako si john', 'text', NULL, '2025-08-19 14:21:46', NULL, NULL, 0),
(10, 1, 2, 3, 'Hoyy ako si john', 'text', NULL, '2025-08-19 14:21:46', NULL, NULL, 0),
(11, 1, 3, 2, 'Ay ok', 'text', NULL, '2025-08-19 14:22:20', NULL, NULL, 0),
(12, 1, 3, 2, 'Ay ok', 'text', NULL, '2025-08-19 14:22:20', NULL, NULL, 0),
(13, 1, 3, 2, 'Ahhh', 'text', NULL, '2025-08-19 19:28:00', NULL, NULL, 0),
(14, 1, 3, 2, 'Hahahsaa', 'text', NULL, '2025-08-19 19:32:45', NULL, NULL, 0),
(15, 1, 2, 3, 'Hakdog', 'text', NULL, '2025-08-19 19:32:50', NULL, NULL, 0),
(16, 1, 3, 2, 'Ihhh', 'text', NULL, '2025-08-19 19:32:54', NULL, NULL, 0),
(17, 1, 3, 2, 'Rdfdd', 'text', NULL, '2025-08-19 19:32:56', NULL, NULL, 0),
(18, 1, 2, 3, 'Dkaoqwa', 'text', NULL, '2025-08-19 19:33:15', NULL, NULL, 0),
(19, 1, 3, 2, 'Awhadjaa', 'text', NULL, '2025-08-19 19:33:19', NULL, NULL, 0),
(20, 1, 3, 2, 'Dbsbshs', 'text', NULL, '2025-08-19 19:33:21', NULL, NULL, 0),
(21, 1, 3, 2, 'Dhdsha', 'text', NULL, '2025-08-19 19:33:22', NULL, NULL, 0),
(22, 1, 3, 2, 'Djsjas', 'text', NULL, '2025-08-19 19:33:23', NULL, NULL, 0),
(23, 1, 2, 3, 'Shahazolxc', 'text', NULL, '2025-08-19 19:33:25', NULL, NULL, 0),
(24, 1, 3, 2, 'Afsgdg', 'text', NULL, '2025-08-19 19:34:36', NULL, NULL, 0),
(25, 1, 2, 3, 'Snaba', 'text', NULL, '2025-08-19 19:34:57', NULL, NULL, 0),
(26, 1, 2, 3, 'Skskxx', 'text', NULL, '2025-08-19 19:35:04', NULL, NULL, 0),
(27, 1, 3, 2, 'Gvev', 'text', NULL, '2025-08-19 19:35:06', NULL, NULL, 0),
(28, 1, 2, 3, '????', 'text', NULL, '2025-08-19 19:36:04', NULL, NULL, 0),
(29, 1, 3, 2, 'Sywue', 'text', NULL, '2025-08-19 19:43:15', NULL, NULL, 0),
(30, 1, 2, 3, 'Awww', 'text', NULL, '2025-08-19 19:43:37', NULL, NULL, 0),
(31, 1, 2, 3, '????????', 'text', NULL, '2025-08-19 19:43:41', NULL, NULL, 0),
(32, 1, 2, 3, '????', 'text', NULL, '2025-08-19 19:43:44', NULL, NULL, 0),
(33, 3, 2, 7, 'Fxxsa', 'text', NULL, '2025-08-19 20:55:46', NULL, NULL, 0),
(34, 1, 2, 3, 'Dhajajs', 'text', NULL, '2025-08-20 11:13:51', NULL, NULL, 0),
(35, 1, 2, 3, 'Hshauaa', 'text', NULL, '2025-08-20 11:14:44', NULL, NULL, 0),
(36, 1, 3, 2, 'Mike', 'text', NULL, '2025-08-20 11:14:47', NULL, NULL, 0),
(37, 1, 3, 2, 'Jshsvs', 'text', NULL, '2025-08-20 11:14:48', NULL, NULL, 0),
(38, 1, 3, 2, '????', 'text', NULL, '2025-08-20 11:14:50', NULL, NULL, 0),
(39, 1, 2, 3, 'Jorge hauqa', 'text', NULL, '2025-08-20 11:14:50', NULL, NULL, 0),
(40, 1, 2, 3, 'Jsaka', 'text', NULL, '2025-08-20 11:14:52', NULL, NULL, 0),
(41, 1, 3, 2, 'Buto', 'text', NULL, '2025-08-20 11:14:57', NULL, NULL, 0),
(42, 1, 2, 3, 'Sss', 'text', NULL, '2025-08-20 11:15:52', NULL, NULL, 0),
(43, 1, 3, 2, 'Bruh', 'text', NULL, '2025-08-20 11:16:05', NULL, NULL, 0),
(44, 1, 2, 3, 'Usuaka', 'text', NULL, '2025-08-20 11:16:40', NULL, NULL, 0),
(45, 1, 2, 3, 'Zbababa', 'text', NULL, '2025-08-20 11:17:02', NULL, NULL, 0),
(46, 1, 3, 2, 'Hi', 'text', NULL, '2025-08-20 13:49:27', NULL, NULL, 0),
(47, 1, 2, 3, 'Hsajaha', 'text', NULL, '2025-08-20 13:49:32', NULL, NULL, 0),
(48, 1, 2, 3, 'Sbaba', 'text', NULL, '2025-08-20 13:49:34', NULL, NULL, 0),
(49, 1, 3, 2, 'Jddhfjgk', 'text', NULL, '2025-08-20 13:49:36', NULL, NULL, 0),
(50, 1, 2, 3, 'Shshs', 'text', NULL, '2025-08-20 13:49:36', NULL, NULL, 0),
(51, 1, 3, 2, 'Jgjgfkg', 'text', NULL, '2025-08-20 13:49:37', NULL, NULL, 0),
(52, 1, 3, 2, 'Mvncmg', 'text', NULL, '2025-08-20 13:49:38', NULL, NULL, 0),
(53, 1, 3, 2, 'Jsajajs', 'text', NULL, '2025-08-21 16:56:48', NULL, NULL, 0),
(54, 1, 3, 2, 'Dnsjs', 'text', NULL, '2025-08-21 16:56:50', NULL, NULL, 0),
(55, 1, 2, 3, 'TDSYTDD', 'text', NULL, '2025-08-21 16:56:55', NULL, NULL, 0),
(56, 4, 3, 15, 'Hoy', 'text', NULL, '2025-08-21 17:49:07', NULL, NULL, 0),
(57, 4, 15, 3, 'Alin', 'text', NULL, '2025-08-21 17:52:01', NULL, NULL, 0),
(58, 5, 3, 6, 'jorgeee', 'text', NULL, '2025-08-22 01:00:48', NULL, NULL, 0),
(59, 6, 2, 6, 'Jorge may piso ka', 'text', NULL, '2025-09-01 21:48:33', NULL, NULL, 0),
(60, 1, 2, 3, 'Hiii', 'text', NULL, '2025-09-05 08:55:43', NULL, NULL, 0),
(61, 1, 2, 3, 'Gaalin na ikaw?', 'text', NULL, '2025-09-05 08:55:49', NULL, NULL, 0),
(62, 1, 2, 3, 'Esemel', 'text', NULL, '2025-09-05 08:55:56', NULL, NULL, 0),
(63, 1, 3, 2, 'check', 'text', NULL, '2025-09-05 09:43:22', NULL, NULL, 0),
(64, 1, 2, 3, 'Renxh', 'text', NULL, '2025-09-05 09:43:27', NULL, NULL, 0),
(65, 1, 2, 3, 'Shaha', 'text', NULL, '2025-09-05 09:43:34', NULL, NULL, 0),
(66, 5, 6, 6, 'dasd', 'text', NULL, '2025-09-05 23:52:00', NULL, NULL, 0),
(67, 5, 6, 6, 'daa', 'text', NULL, '2025-09-05 23:52:14', NULL, NULL, 0),
(68, 1, 2, 3, 'Ajzazja', 'text', NULL, '2025-09-09 21:34:49', NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `type` varchar(32) NOT NULL,
  `title` varchar(128) NOT NULL,
  `message` text NOT NULL,
  `icon` varchar(16) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `related_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `icon`, `is_read`, `created_at`, `related_id`) VALUES
(1, 4, 'Payment', 'Payment', 'Jong Paid', NULL, 0, '2025-08-13 09:58:49', 123111),
(12, 6, 'booking_request', 'New booking request', 'John Doe requested a session', NULL, 1, '2025-09-06 19:42:53', 31),
(13, 6, 'category_recommendation', 'Recommendation Approved', 'Your category recommendation \"kd skcakakxakx\" has been approved.', NULL, 0, '2025-09-11 17:42:05', 8),
(14, 6, 'category_recommendation', 'Recommendation Approved', 'Your category recommendation \"kd skcakakxakx\" has been approved.', NULL, 0, '2025-09-11 17:52:54', 8),
(15, 6, 'category_recommendation', 'Recommendation Approved', 'Your category recommendation \"egefbwbetb\" has been approved.', NULL, 0, '2025-09-11 17:53:13', 9),
(16, 6, 'category_recommendation', 'Recommendation Approved', 'Your category recommendation \"s sxwze\" has been approved.', NULL, 0, '2025-09-11 19:49:27', 10),
(17, 6, 'category_recommendation', 'Recommendation Approved', 'Your category recommendation \"s sxwze\" has been approved.', NULL, 0, '2025-09-11 20:00:11', 10),
(18, 6, 'category_recommendation', 'Recommendation Approved', 'Your category recommendation \"s sxwze\" has been approved.', NULL, 0, '2025-09-11 20:00:56', 10),
(19, 6, 'category_recommendation', 'Recommendation Approved', 'Your category recommendation \",ejezzjezje\" has been approved.', NULL, 0, '2025-09-11 20:01:14', 11),
(20, 6, 'category_recommendation', 'Recommendation Approved', 'Your category recommendation \",ejezzjezje\" has been approved.', NULL, 0, '2025-09-11 20:05:21', 11),
(21, 6, 'category_recommendation', 'Recommendation Approved', 'Your category recommendation \"vnxnsjsjsjs\" has been approved.', NULL, 0, '2025-09-11 20:06:13', 12),
(22, 6, 'category_recommendation', 'Recommendation Approved', 'Your category recommendation \"vevecwcwc\" has been approved.', NULL, 0, '2025-09-11 20:07:29', 13),
(23, 6, 'category_recommendation', 'Recommendation Approved', 'Your category recommendation \"ejejsjsjs\" has been approved.', NULL, 0, '2025-09-11 20:09:39', 14);

-- --------------------------------------------------------

--
-- Table structure for table `official_students`
--

CREATE TABLE `official_students` (
  `id` int(11) NOT NULL,
  `student_id_no` varchar(50) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `course` varchar(100) DEFAULT NULL,
  `year_level` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `official_students`
--

INSERT INTO `official_students` (`id`, `student_id_no`, `full_name`, `course`, `year_level`, `is_active`) VALUES
(9, '202300001', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `pending_registrations`
--

CREATE TABLE `pending_registrations` (
  `id` int(11) NOT NULL,
  `student_id` varchar(64) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` enum('student','tutor') NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `extra` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`extra`)),
  `matched_enrolled_id` int(11) DEFAULT NULL,
  `match_score` tinyint(4) DEFAULT NULL,
  `auto_suggested` tinyint(1) NOT NULL DEFAULT 0,
  `document_path` varchar(1024) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pending_registrations`
--

INSERT INTO `pending_registrations` (`id`, `student_id`, `full_name`, `role`, `username`, `password_hash`, `extra`, `matched_enrolled_id`, `match_score`, `auto_suggested`, `document_path`, `status`, `submitted_at`, `reviewed_by`, `reviewed_at`, `review_notes`) VALUES
(1, '012345', 'Jorge Mirano', 'student', 'jmirano', '$2b$10$ZrYel9UfNfg3eAILJhZQzOe4mr3f985sqntIfmHhzwxHN3XfUrwuK', NULL, 13, 90, 0, NULL, 'approved', '2025-08-17 14:55:58', 8, '2025-08-17 16:23:28', 'Auto-approved via bulk_auto_approve'),
(2, '214340', 'Carl Ariel Igong-igong', 'student', 'carldaya', '$2b$10$It7x3iZFQfCRlg1JdBKdJ.AE1jWR81jXMT7A6S6LRpsunbm3Zep0O', NULL, NULL, NULL, 0, NULL, 'approved', '2025-08-17 15:09:28', NULL, '2025-08-17 15:18:16', NULL),
(3, '202400012', 'Maria Santos', 'student', 'marss', '$2b$10$GPvFfe72weJZeK2f0WtHe.ZwWoNlT3JI9SjMmoJg2dmY4cbG.VkPK', NULL, NULL, NULL, 0, NULL, 'approved', '2025-08-18 03:27:42', 8, '2025-08-18 03:28:46', NULL),
(4, '202020', 'Carl Ariel Igong-igong', 'student', 'carlll', '$2b$10$Q7Gh1Sk/Ha7sZzaQq.bLQ.YjavEsQofj2ROfwr4sVaJ0LDZxGQ27m', NULL, NULL, NULL, 0, NULL, 'pending', '2025-08-18 11:26:30', NULL, NULL, NULL),
(5, '13213216', 'Carl Daya', 'student', 'carlqwe', '$2b$10$BIyuprGicnxbPUOf/kyLf.QM.bIPbagvTemrc2I32g76Djydb/NRK', NULL, NULL, NULL, 0, NULL, 'approved', '2025-08-18 13:28:59', 8, '2025-08-18 13:29:08', NULL),
(6, '1231223', 'carlaaa', 'student', 'carle', '$2b$10$SBpNXngdQlBclA0ngMXB0.02RT7NiEKCcl62aQhYibMfSk08UUwZa', NULL, NULL, NULL, 0, NULL, 'approved', '2025-08-18 13:33:51', 8, '2025-08-18 13:34:11', NULL),
(7, '797949', 'wjajsj', 'student', 'znansn', '$2b$10$WIFgv9Qqkd8cs89nzjL/6eSNOIbYXNnVWCtyhMc5CYmmqU3XHRtoy', NULL, NULL, NULL, 0, NULL, 'approved', '2025-08-18 13:39:39', 8, '2025-08-18 13:39:49', NULL),
(8, '1646', 'hwwha', 'student', 'znanaj', '$2b$10$nemoJfTmAe4V4O.UtMutvOCT1U8uiLR5.PDEGdKd7vDEFutRH9UwW', NULL, NULL, NULL, 0, NULL, 'approved', '2025-08-18 13:41:12', 8, '2025-08-18 13:41:20', NULL),
(9, '202400006', 'Liza Moreno', 'student', 'liza', '$2b$10$hTScKfxsk2II2Zz8BDOXpOgnFUQr90sd0/A3RclAZVJar8wmClMl6', NULL, NULL, NULL, 0, NULL, 'approved', '2025-08-20 06:46:44', 8, '2025-08-20 06:49:13', NULL),
(10, '13794949', 'duahwha', 'student', 'djsusj', '$2b$10$pcu66UCz.cU4hVokcXvpSuBe3nD9WW9vp8lv5VCbSoBINxKFMeU26', NULL, NULL, NULL, 0, NULL, 'pending', '2025-08-21 09:47:20', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `ratings`
--

CREATE TABLE `ratings` (
  `rating_id` int(11) NOT NULL,
  `session_id` int(11) DEFAULT NULL,
  `tutor_id` int(11) NOT NULL,
  `rating` int(11) DEFAULT NULL,
  `COMMENT` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ratings`
--

INSERT INTO `ratings` (`rating_id`, `session_id`, `tutor_id`, `rating`, `COMMENT`, `created_at`) VALUES
(9, NULL, 2, 5, 'Great tutor, very helpful!', NULL),
(10, NULL, 2, 4, 'Explained concepts clearly.', NULL),
(11, NULL, 3, 3, 'Session was okay, could be better.', NULL),
(12, NULL, 2, 5, 'Amazing experience!', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `recommended_categories`
--

CREATE TABLE `recommended_categories` (
  `id` int(11) NOT NULL,
  `tutor_id` varchar(100) DEFAULT NULL,
  `slug` varchar(150) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recommended_categories`
--

INSERT INTO `recommended_categories` (`id`, `tutor_id`, `slug`, `name`, `description`, `reason`, `status`, `created_at`, `updated_at`) VALUES
(1, '6', 'svscscc', 'egefbwbetb', 'wcehecavegrg', 's fjrfacdjrhefwvegevevec', 'approved', '2025-09-10 13:06:05', '2025-09-11 09:53:13'),
(2, '6', 'djajajaj', 'kd skcakakxakx', 'saax kvkskska', 'cjsjsjKxl zlsl', 'approved', '2025-09-10 13:07:07', '2025-09-11 09:52:54'),
(3, '6', 'sseffed', 's sxwze', 'ajshsjqjajs', 'jcsoakakalaa', 'approved', '2025-09-11 11:49:07', '2025-09-11 12:00:56'),
(4, '6', 'sjajsjsjsjs', ',ejezzjezje', 'e,kzeneJe', 'ajajsjsjsj', 'approved', '2025-09-11 12:00:51', '2025-09-11 12:05:17'),
(5, '6', 'dbdvdcsc', 'vnxnsjsjsjs', 'djsjsjxudjd', 'jdjzzjdjsj', 'approved', '2025-09-11 12:05:10', '2025-09-11 12:06:12'),
(6, '6', 'vevscw', 'vevecwcwc', 'fvevscec', 'dvdcscscc', 'approved', '2025-09-11 12:07:18', '2025-09-11 12:07:29'),
(7, '6', 'jzshahsha', 'ejejsjsjs', 'jsjasjsjsj', 'nsnsjaja', 'approved', '2025-09-11 12:09:00', '2025-09-11 12:09:39');

-- --------------------------------------------------------

--
-- Table structure for table `reconciliation_log`
--

CREATE TABLE `reconciliation_log` (
  `id` int(11) NOT NULL,
  `pending_id` int(11) NOT NULL,
  `enrolled_id` int(11) DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `action` varchar(64) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reconciliation_log`
--

INSERT INTO `reconciliation_log` (`id`, `pending_id`, `enrolled_id`, `admin_id`, `action`, `notes`, `created_at`) VALUES
(1, 1, 13, 8, 'auto_approve', 'auto-approved by bulk action; batch=82a9021d1fe2ce6c', '2025-08-17 16:23:28');

-- --------------------------------------------------------

--
-- Table structure for table `reject_comments`
--

CREATE TABLE `reject_comments` (
  `id` int(11) NOT NULL,
  `student_id_no` varchar(11) NOT NULL,
  `comment` mediumtext NOT NULL,
  `rejected_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reject_comments`
--

INSERT INTO `reject_comments` (`id`, `student_id_no`, `comment`, `rejected_at`) VALUES
(4, '202300004', 'sefrsdfsd', '2025-08-11 23:40:55'),
(5, '202300003', 'admin ka boiii', '2025-08-13 09:35:35');

-- --------------------------------------------------------

--
-- Table structure for table `rewards`
--

CREATE TABLE `rewards` (
  `reward_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `cost` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` int(11) NOT NULL,
  `tutor_id` int(11) DEFAULT NULL,
  `category_id` int(10) UNSIGNED DEFAULT NULL,
  `skill_tag` varchar(100) DEFAULT NULL,
  `session_date` date DEFAULT NULL,
  `price` varchar(20) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `successful_sessions` int(11) DEFAULT 0,
  `rating` double DEFAULT 0,
  `rating_count` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`session_id`, `tutor_id`, `category_id`, `skill_tag`, `session_date`, `price`, `title`, `successful_sessions`, `rating`, `rating_count`) VALUES
(6, 4, 1, 'C++', '2025-08-15', '100', 'C++ Problem Solving', 12, 4.8, 25),
(7, 6, 2, 'Java', '2025-08-16', '100', 'Java Fundamentals', 8, 4.5, 18),
(8, 6, 3, 'SQL', '2025-08-17', '100', 'SQL and Database Development', 15, 4.7, 30),
(9, 7, 4, 'PHP', '2025-08-18', '100', 'PHP Backend Development', 10, 2.5, 22),
(10, 6, 4, 'Python', '2025-08-19', '120', 'Python for Data Science', 20, 4.9, 40),
(23, 6, 1, 'saging', NULL, '20', 'babababa', 0, 0, 0),
(24, 6, 1, 'asaww', NULL, '20', 'fasdf', 0, 0, 0),
(25, 6, 3, 'ADCSFGXCC', NULL, '60', 'sdfsdwefdrtghjk', 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `session_attendance`
--

CREATE TABLE `session_attendance` (
  `attendance_id` int(11) NOT NULL,
  `session_id` int(11) DEFAULT NULL,
  `learner_id` int(11) DEFAULT NULL,
  `joined_at` datetime NOT NULL DEFAULT current_timestamp(),
  `attended` tinyint(1) NOT NULL DEFAULT 1,
  `left_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shop_items`
--

CREATE TABLE `shop_items` (
  `item_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `type` enum('voucher','border','badge','other') DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `cost` int(11) DEFAULT NULL,
  `level_required` int(11) DEFAULT 0,
  `voucher_code` varchar(64) DEFAULT NULL,
  `discount_type` enum('percent','fixed') DEFAULT NULL,
  `discount_value` decimal(10,2) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `per_user_limit` int(11) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shop_items`
--

INSERT INTO `shop_items` (`item_id`, `name`, `type`, `description`, `image_url`, `cost`, `level_required`, `voucher_code`, `discount_type`, `discount_value`, `expires_at`, `usage_limit`, `per_user_limit`, `active`) VALUES
(1, 'Beginner_border', 'border', 'Beginner border for leaners', 'assets/images/learner/borders/bronze-border.png', 0, 2, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(2, 'Blue Border', 'border', 'Stylish blue border for your profile.', 'assets/images/learner/borders/gold-border3.png', 100, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(3, 'Golden Badge', 'badge', 'Shiny golden badge to show off achievements.', 'assets/images/shop_items/badge.png', 200, 2, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(4, 'Voucher: 10% Off', 'voucher', 'Get 10% off on selected services.', 'assets/images/vouchers/voucher.png', 150, 2, 'SUMMER10', 'percent', 10.00, '2025-12-31 23:59:59', NULL, NULL, 1),
(5, 'Red Border', 'border', 'Fiery red border for standout profiles.', 'assets/images/learner/borders/silver-border2.png', 120, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(6, 'Silver Badge', 'badge', 'Elegant silver badge for mid-tier users.', 'assets/images/shop_items/badge.png', 180, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(7, 'Voucher: Free Session', 'voucher', 'Redeem 1 free tutor session.', 'assets/images/vouchers/voucher.png', 300, 5, 'FREES1', 'fixed', 300.00, '2025-12-31 23:59:59', NULL, NULL, 1),
(8, 'Green Border', 'border', 'Fresh green border to refresh your profile.', 'assets/images/learner/borders/gold-border2.png', 110, 5, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(9, 'Bronze Badge', 'badge', 'Starter badge for new users.', 'assets/images/shop_items/badge.png', 80, 5, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(10, 'Voucher: 1 Extra Spin', 'voucher', 'Grants one extra spin in games.', 'assets/images/vouchers/voucher.png', 90, 5, 'VCHR0010', 'percent', 10.00, '2025-12-31 23:59:59', NULL, NULL, 1),
(11, 'Black Border', 'border', 'Dark and cool black profile border.', 'assets/images/learner/borders/silver-border.png', 140, 2, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(12, 'Platinum Badge', 'badge', 'Premium badge for elite members.', 'assets/images/shop_items/badge.png', 250, 6, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(13, 'Voucher: Skip Queue', 'voucher', 'Skip verification request queue.', 'assets/images/vouchers/voucher.png', 170, 1, 'VCHR0013', 'percent', 10.00, '2025-12-31 23:59:59', NULL, NULL, 1),
(14, 'Animated Flame Border', 'border', 'Animated flames around your profile.', 'assets/images/shop_items/profile_boarder.png', 300, 2, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(15, 'Badge of Honor', 'badge', 'Awarded to top-performing users.', 'assets/images/shop_items/badge.png', 220, 4, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(16, 'Voucher: Double Points', 'voucher', 'Earn double points in activities.', 'assets/images/vouchers/voucher.png', 190, 1, 'VCHR0016', 'percent', 10.00, '2025-12-31 23:59:59', NULL, NULL, 1),
(17, 'Rainbow Border', 'border', 'A colorful border for your flair.', 'assets/images/shop_items/profile_boarder.png', 200, 3, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(18, 'Mystery Badge', 'badge', '', 'assets/images/shop_items/badge.png', 210, 0, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(19, 'Voucher: Random Reward', 'voucher', 'Get a random in-app item.', 'assets/images/vouchers/voucher.png', 160, 0, 'VCHR0019', 'percent', 10.00, '2025-12-31 23:59:59', NULL, NULL, 1),
(20, 'Glitch Border', 'border', 'Glitch-style border effect.', 'assets/images/learner/borders/gold-border.png', 130, 0, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(21, 'Voucher: Free Customization', 'voucher', 'Free avatar or theme customization.', 'assets/images/vouchers/voucher.png', 230, 0, 'VCHR0021', 'percent', 10.00, '2025-12-31 23:59:59', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `txn_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `session_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `TYPE` enum('credit','debit') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tutors`
--

CREATE TABLE `tutors` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `role` varchar(32) NOT NULL DEFAULT 'tutor',
  `profile_pic_url` varchar(2048) DEFAULT NULL,
  `profile_pic_asset` varchar(255) DEFAULT NULL,
  `profile_border_url` varchar(2048) DEFAULT NULL,
  `badge_url` varchar(2048) DEFAULT NULL,
  `status` varchar(64) DEFAULT NULL,
  `rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `rating_count` int(11) NOT NULL DEFAULT 0,
  `chat_response` int(11) NOT NULL,
  `successful_sessions` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tutors`
--

INSERT INTO `tutors` (`id`, `user_id`, `full_name`, `email`, `role`, `profile_pic_url`, `profile_pic_asset`, `profile_border_url`, `badge_url`, `status`, `rating`, `rating_count`, `chat_response`, `successful_sessions`, `created_at`, `updated_at`) VALUES
(1, 4, 'Admin User', 'admin@example.com', 'tutor', NULL, 'assets/images/profile_icons/5.jpg', 'assets/images/profile_icons/profile_boarder.png', 'assets\\images\\profile_icons\\badge.png', 'active', 4.80, 25, 0, 12, '2025-07-03 01:15:00', '2025-08-17 09:04:19'),
(2, 5, 'Haha Hahaha', 'haha@example.com', 'tutor', NULL, 'assets/images/profile_icons/4.jpg', 'assets/images/profile_icons/profile_boarder.png', 'assets\\images\\profile_icons\\badge.png', 'active', 4.20, 10, 0, 5, '2025-07-04 00:45:00', '2025-08-16 13:44:18'),
(3, 6, 'Jorge Mirano', 'jorge@gmail.com', 'tutor', NULL, 'assets/images/profile_icons/6.jpg', 'assets/images/profile_icons/profile_boarder.png', 'assets\\images\\profile_icons\\badge.png\r\n', 'active', 4.60, 8, 0, 7, '2025-06-11 02:22:00', '2025-08-16 13:44:18'),
(6, 7, 'Maria Santos', 'maria.santos@example.com', 'tutor', NULL, 'assets/images/profile_icons/6.jpg', 'assets/images/profile_icons/profile_boarder.png', 'assets\\images\\profile_icons\\badge.png\r\n', 'active', 4.75, 98, 0, 210, '2025-02-28 03:00:00', '2025-08-17 09:05:41');

-- --------------------------------------------------------

--
-- Table structure for table `tutor_categories`
--

CREATE TABLE `tutor_categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `tutor_id` int(10) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tutor_profiles`
--

CREATE TABLE `tutor_profiles` (
  `id` int(11) NOT NULL,
  `tutor_id` int(10) UNSIGNED NOT NULL,
  `bio` text DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `availability` text DEFAULT NULL,
  `endorsement_pts` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tutor_profiles`
--

INSERT INTO `tutor_profiles` (`id`, `tutor_id`, `bio`, `skills`, `availability`, `endorsement_pts`) VALUES
(1, 4, 'Senior software tutor with 10+ years of experience teaching algorithms and system design.', 'C++,Algorithms,Data Structures,System Design', 'Mon 09:00-12:00; Wed 14:00-17:00; Sat 09:00-11:00', 120),
(2, 5, 'Full‑stack web developer and PHP specialist; loves building REST APIs.', 'PHP,MySQL,Laravel,REST', 'Tue 10:00-13:00; Thu 16:00-19:00', 85),
(3, 6, 'Data analyst and SQL tutor; focuses on database design and reporting.', 'SQL,Database Design,Postgres,ETL', 'Mon 13:00-16:00; Fri 09:00-12:00', 45),
(4, 7, 'Creative & design tutor focusing on UI/UX fundamentals and Figma.', 'UI/UX,Figma,Design Thinking,Prototyping', 'Mon 18:00-20:00; Sun 10:00-13:00', 210);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `student_id_no` varchar(50) DEFAULT NULL,
  `username` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `PASSWORD` varchar(500) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role` enum('student','tutor','admin') DEFAULT NULL,
  `STATUS` enum('active','inactive') DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `apply_as_tutor` enum('n','p','y','r') NOT NULL DEFAULT 'n',
  `course` varchar(100) DEFAULT NULL,
  `year_level` int(11) DEFAULT NULL,
  `profile_pic_url` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `current_border` int(11) DEFAULT NULL,
  `current_badge` int(11) DEFAULT NULL,
  `college` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `student_id_no`, `username`, `email`, `contact_number`, `PASSWORD`, `full_name`, `role`, `STATUS`, `is_verified`, `apply_as_tutor`, `course`, `year_level`, `profile_pic_url`, `created_at`, `current_border`, `current_badge`, `college`) VALUES
(2, '202300001', 'carl', 'johndoe@example.com', '09121212121', '$2b$10$WIFgv9Qqkd8cs89nzjL/6eSNOIbYXNnVWCtyhMc5CYmmqU3XHRtoy', 'John Doe', 'student', 'active', 1, 'n', 'BSIT', 3, 'assets/images/profile_icons/2.png', '2025-07-01 10:00:00', 2, 3, 'CCS'),
(3, '202300002', 'baboy', 'janedoe@example.com', '', '$2b$10$nemoJfTmAe4V4O.UtMutvOCT1U8uiLR5.PDEGdKd7vDEFutRH9UwW', 'Jane Doe', 'student', 'active', 1, 'n', 'BSCS', 4, 'assets/images/profile_icons/3.jpg', '2025-07-02 11:30:00', 1, 3, 'CCS'),
(4, '202300003', 'admin', 'admin@example.com', NULL, '@a121212', 'Admin User', 'tutor', 'active', 1, 'r', 'BSED', 0, 'assets/images/profile_icons/5.jpg', '2025-07-03 09:15:00', 0, 0, 'CCS'),
(5, '202300004', 'haha', 'haha@example.com', NULL, '11111@a', 'haha hahahaha', 'tutor', 'inactive', 2, 'n', 'BSBA', 3, 'assets/images/profile_icons/4.jpg', '2025-07-04 08:45:00', 4, 7, 'CCS'),
(6, '202300005', 'jorge', 'jorge@gmail.com', NULL, '$2b$10$WIFgv9Qqkd8cs89nzjL/6eSNOIbYXNnVWCtyhMc5CYmmqU3XHRtoy', 'jorge mirano', 'tutor', 'active', 1, 'n', 'asddfasd', 3, 'assets/images/profile_icons/6.jpg', NULL, 1, 5, 'CCS'),
(7, '20230007', 'maria', 'maria@gmail.com', NULL, '@a123123', 'Maria Santos', 'tutor', 'active', 1, 'n', 'BSIS', 3, 'assets/images/profile_icons/6.jpg', NULL, 1, 1, 'CCS'),
(8, '12332111', '', 'admin2@gmail.com', NULL, '123123@a', 'admin', 'admin', 'active', 1, 'n', NULL, NULL, NULL, NULL, NULL, NULL, 'CCS'),
(15, '202400006', 'liza', NULL, NULL, '$2b$10$pcu66UCz.cU4hVokcXvpSuBe3nD9WW9vp8lv5VCbSoBINxKFMeU26', 'Liza Moreno', 'student', '', 1, 'n', NULL, NULL, NULL, '2025-08-20 14:49:13', NULL, NULL, 'CCS');

-- --------------------------------------------------------

--
-- Table structure for table `user_inventory`
--

CREATE TABLE `user_inventory` (
  `inventory_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `item_id` int(11) DEFAULT NULL,
  `owned_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `on_use` enum('0','1') NOT NULL DEFAULT '0',
  `category` enum('border','badge','voucher') NOT NULL,
  `used_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_inventory`
--

INSERT INTO `user_inventory` (`inventory_id`, `user_id`, `item_id`, `owned_at`, `is_active`, `on_use`, `category`, `used_at`) VALUES
(1, 2, 6, '2025-08-13 19:26:57', 1, '1', 'badge', NULL),
(2, 2, 5, '2025-08-13 19:27:19', 1, '0', 'border', NULL),
(3, 2, 19, '2025-08-13 19:49:45', 1, '1', 'voucher', '2025-09-06 18:38:33'),
(4, 2, 4, '2025-08-13 19:49:45', 1, '0', 'voucher', '2025-09-05 08:54:37'),
(6, 2, 21, '2025-08-13 20:34:15', 1, '0', 'voucher', '2025-09-06 19:42:52'),
(7, 2, 3, '2025-08-13 20:34:17', 1, '0', 'badge', NULL),
(8, 2, 20, '2025-08-13 21:14:50', 1, '0', 'border', NULL),
(9, 3, 2, '2025-08-13 21:24:50', 1, '0', 'border', NULL),
(10, 3, 11, '2025-08-13 21:25:00', 1, '0', 'border', NULL),
(11, 3, 3, '2025-08-13 21:25:01', 1, '0', 'badge', NULL),
(12, 3, 18, '2025-08-13 21:25:05', 1, '0', 'badge', NULL),
(13, 3, 18, '2025-08-13 21:25:06', 1, '1', 'badge', NULL),
(14, 3, 4, '2025-08-13 21:25:09', 1, '0', 'voucher', NULL),
(15, 3, 13, '2025-08-22 00:27:50', 1, '0', 'voucher', NULL),
(16, 3, 19, '2025-08-22 00:27:55', 1, '0', 'voucher', '2025-09-05 09:44:42'),
(17, 2, 2, '2025-08-22 14:27:03', 1, '1', 'border', NULL),
(18, 3, 5, '2025-09-05 09:46:01', 1, '1', 'border', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `verification_requests`
--

CREATE TABLE `verification_requests` (
  `request_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `student_id_no` varchar(50) DEFAULT NULL,
  `id_photo_url` text DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `voucher_usage`
--

CREATE TABLE `voucher_usage` (
  `usage_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `item_id` int(11) DEFAULT NULL,
  `session_id` int(11) DEFAULT NULL,
  `applied_at` datetime DEFAULT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `applied_amount` decimal(10,2) DEFAULT NULL,
  `discount_type` enum('percent','fixed') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `voucher_usage`
--

INSERT INTO `voucher_usage` (`usage_id`, `user_id`, `item_id`, `session_id`, `applied_at`, `booking_id`, `applied_amount`, `discount_type`) VALUES
(8, 2, 4, 7, '2025-09-04 18:58:37', 19, 10.00, 'percent');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `approval_shadow`
--
ALTER TABLE `approval_shadow`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_batch` (`batch_key`),
  ADD KEY `ix_pending` (`pending_id`);

--
-- Indexes for table `available_times`
--
ALTER TABLE `available_times`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `available_time_id` (`available_time_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_bookings_user` (`user_id`),
  ADD KEY `idx_bookings_session` (`session_id`),
  ADD KEY `idx_bookings_tutor` (`tutor_id`),
  ADD KEY `idx_bookings_voucher_inventory_id` (`voucher_inventory_id`),
  ADD KEY `idx_bookings_voucher_item_id` (`voucher_item_id`),
  ADD KEY `idx_bookings_student_college` (`student_college`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`conversation_id`);

--
-- Indexes for table `conversation_participants`
--
ALTER TABLE `conversation_participants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_conv` (`conversation_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexes for table `enrolled_students`
--
ALTER TABLE `enrolled_students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ux_student_id` (`student_id`),
  ADD KEY `ix_course` (`course`),
  ADD KEY `ix_year_level` (`year_level`);

--
-- Indexes for table `featured_tutors`
--
ALTER TABLE `featured_tutors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ft_tutor` (`tutor_id`),
  ADD KEY `category_id` (`category_id`,`position`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `feedback_helpful`
--
ALTER TABLE `feedback_helpful`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_feedback_user` (`feedback_id`,`user_id`),
  ADD KEY `idx_feedback_id` (`feedback_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `files`
--
ALTER TABLE `files`
  ADD PRIMARY KEY (`file_id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `gamification`
--
ALTER TABLE `gamification`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_to_user_created` (`to_user_id`,`created_at`),
  ADD KEY `idx_conv_created` (`conversation_id`,`created_at`),
  ADD KEY `idx_from_user_created` (`from_user_id`,`created_at`),
  ADD KEY `idx_messages_conv` (`conversation_id`),
  ADD KEY `idx_messages_created` (`created_at`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `official_students`
--
ALTER TABLE `official_students`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fkaa_student_id_no` (`student_id_no`);

--
-- Indexes for table `pending_registrations`
--
ALTER TABLE `pending_registrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ux_username` (`username`),
  ADD KEY `ix_student_id` (`student_id`),
  ADD KEY `ix_status` (`status`),
  ADD KEY `ix_pending_matched_enrolled` (`matched_enrolled_id`);

--
-- Indexes for table `ratings`
--
ALTER TABLE `ratings`
  ADD PRIMARY KEY (`rating_id`),
  ADD UNIQUE KEY `session_id` (`session_id`),
  ADD KEY `fk_tutor` (`tutor_id`);

--
-- Indexes for table `recommended_categories`
--
ALTER TABLE `recommended_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `reconciliation_log`
--
ALTER TABLE `reconciliation_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_pending` (`pending_id`),
  ADD KEY `ix_enrolled` (`enrolled_id`),
  ADD KEY `ix_admin` (`admin_id`);

--
-- Indexes for table `reject_comments`
--
ALTER TABLE `reject_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id_no` (`student_id_no`);

--
-- Indexes for table `rewards`
--
ALTER TABLE `rewards`
  ADD PRIMARY KEY (`reward_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `tutor_id` (`tutor_id`);

--
-- Indexes for table `session_attendance`
--
ALTER TABLE `session_attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD UNIQUE KEY `ux_session_learner` (`session_id`,`learner_id`),
  ADD KEY `idx_session_id` (`session_id`),
  ADD KEY `idx_learner_id` (`learner_id`),
  ADD KEY `idxe_session_id` (`session_id`),
  ADD KEY `idxe_learner_id` (`learner_id`);

--
-- Indexes for table `shop_items`
--
ALTER TABLE `shop_items`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`txn_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `session_id` (`session_id`);

--
-- Indexes for table `tutors`
--
ALTER TABLE `tutors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `full_name` (`full_name`),
  ADD KEY `role` (`role`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tutor_categories`
--
ALTER TABLE `tutor_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_tutor_category` (`tutor_id`,`category_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `tutor_profiles`
--
ALTER TABLE `tutor_profiles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `idx_student_id_no` (`student_id_no`),
  ADD KEY `idxes_student_id_no` (`student_id_no`),
  ADD KEY `idxess_student_id_no` (`student_id_no`);

--
-- Indexes for table `user_inventory`
--
ALTER TABLE `user_inventory`
  ADD PRIMARY KEY (`inventory_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `verification_requests`
--
ALTER TABLE `verification_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `voucher_usage`
--
ALTER TABLE `voucher_usage`
  ADD PRIMARY KEY (`usage_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `idx_voucher_usage_booking` (`booking_id`),
  ADD KEY `idx_voucher_usage_item` (`item_id`),
  ADD KEY `idx_voucher_usage_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_logs`
--
ALTER TABLE `admin_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `approval_shadow`
--
ALTER TABLE `approval_shadow`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `available_times`
--
ALTER TABLE `available_times`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `conversation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `conversation_participants`
--
ALTER TABLE `conversation_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `enrolled_students`
--
ALTER TABLE `enrolled_students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `featured_tutors`
--
ALTER TABLE `featured_tutors`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `feedback_helpful`
--
ALTER TABLE `feedback_helpful`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `files`
--
ALTER TABLE `files`
  MODIFY `file_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `official_students`
--
ALTER TABLE `official_students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `pending_registrations`
--
ALTER TABLE `pending_registrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `ratings`
--
ALTER TABLE `ratings`
  MODIFY `rating_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `recommended_categories`
--
ALTER TABLE `recommended_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `reconciliation_log`
--
ALTER TABLE `reconciliation_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `reject_comments`
--
ALTER TABLE `reject_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `rewards`
--
ALTER TABLE `rewards`
  MODIFY `reward_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sessions`
--
ALTER TABLE `sessions`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `session_attendance`
--
ALTER TABLE `session_attendance`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shop_items`
--
ALTER TABLE `shop_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `txn_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tutors`
--
ALTER TABLE `tutors`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tutor_categories`
--
ALTER TABLE `tutor_categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `user_inventory`
--
ALTER TABLE `user_inventory`
  MODIFY `inventory_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `verification_requests`
--
ALTER TABLE `verification_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `voucher_usage`
--
ALTER TABLE `voucher_usage`
  MODIFY `usage_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `available_times`
--
ALTER TABLE `available_times`
  ADD CONSTRAINT `fk_available_times_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`available_time_id`) REFERENCES `available_times` (`id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`student_id_no`),
  ADD CONSTRAINT `fk_bookings_voucher_inv_v1` FOREIGN KEY (`voucher_inventory_id`) REFERENCES `user_inventory` (`inventory_id`),
  ADD CONSTRAINT `fk_bookings_voucher_inventory` FOREIGN KEY (`voucher_inventory_id`) REFERENCES `user_inventory` (`inventory_id`),
  ADD CONSTRAINT `fk_bookings_voucher_item` FOREIGN KEY (`voucher_item_id`) REFERENCES `shop_items` (`item_id`);

--
-- Constraints for table `featured_tutors`
--
ALTER TABLE `featured_tutors`
  ADD CONSTRAINT `fk_ft_cat` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ft_tutor` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `feedback_helpful`
--
ALTER TABLE `feedback_helpful`
  ADD CONSTRAINT `fk_feedback_helpful_feedback` FOREIGN KEY (`feedback_id`) REFERENCES `feedback` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_feedback_helpful_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `files`
--
ALTER TABLE `files`
  ADD CONSTRAINT `files_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`),
  ADD CONSTRAINT `files_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `gamification`
--
ALTER TABLE `gamification`
  ADD CONSTRAINT `gamification_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_from_user` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `official_students`
--
ALTER TABLE `official_students`
  ADD CONSTRAINT `fk_student_id_no` FOREIGN KEY (`student_id_no`) REFERENCES `users` (`student_id_no`),
  ADD CONSTRAINT `fka_student_id_no` FOREIGN KEY (`student_id_no`) REFERENCES `users` (`student_id_no`),
  ADD CONSTRAINT `fkaa_student_id_no` FOREIGN KEY (`student_id_no`) REFERENCES `users` (`student_id_no`);

--
-- Constraints for table `ratings`
--
ALTER TABLE `ratings`
  ADD CONSTRAINT `fk_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sessions` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tutor` FOREIGN KEY (`tutor_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`);

--
-- Constraints for table `reject_comments`
--
ALTER TABLE `reject_comments`
  ADD CONSTRAINT `stud_id` FOREIGN KEY (`student_id_no`) REFERENCES `users` (`student_id_no`);

--
-- Constraints for table `session_attendance`
--
ALTER TABLE `session_attendance`
  ADD CONSTRAINT `session_attendance_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`),
  ADD CONSTRAINT `session_attendance_ibfk_2` FOREIGN KEY (`learner_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`);

--
-- Constraints for table `tutor_categories`
--
ALTER TABLE `tutor_categories`
  ADD CONSTRAINT `fk_tc_cat` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tc_tutor` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_inventory`
--
ALTER TABLE `user_inventory`
  ADD CONSTRAINT `user_inventory_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `user_inventory_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `shop_items` (`item_id`);

--
-- Constraints for table `verification_requests`
--
ALTER TABLE `verification_requests`
  ADD CONSTRAINT `verification_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `voucher_usage`
--
ALTER TABLE `voucher_usage`
  ADD CONSTRAINT `fk_voucher_usage_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `fk_voucher_usage_item` FOREIGN KEY (`item_id`) REFERENCES `shop_items` (`item_id`),
  ADD CONSTRAINT `voucher_usage_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `voucher_usage_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `shop_items` (`item_id`),
  ADD CONSTRAINT `voucher_usage_ibfk_3` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
