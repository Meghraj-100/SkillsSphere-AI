import { z } from 'zod';

const validTypes = [
  "info",
  "warning",
  "success",
  "error",
  "job-update",
  "interview",
  "application",
  "new_application",
  "skill_gap_alert",
  "application_status",
  "system",
  "message",
];

export const createNotificationSchema = z.object({
  userId: z.string({ required_error: "User ID is required" }),
  title: z.string({ required_error: "Title is required" }),
  message: z.string({ required_error: "Message is required" }),
  type: z.enum(validTypes, { required_error: "Type is required" }),
  metadata: z.record(z.any()).optional()
});

export const bulkDeleteNotificationsSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required")
});
