import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  decimal,
  boolean,
  uuid,
  serial,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  location: varchar("location"),
  bio: text("bio"),
  avgSpeed: decimal("avg_speed", { precision: 5, scale: 2 }),
  weeklyMileage: integer("weekly_mileage"),
  ftpWatts: integer("ftp_watts"),
  weightKg: decimal("weight_kg", { precision: 5, scale: 2 }),
  ftpWkg: decimal("ftp_wkg", { precision: 5, scale: 2 }),
  weeklyHours: decimal("weekly_hours", { precision: 5, scale: 2 }),
  sensorClass: varchar("sensor_class", { enum: ["power-meter", "non-sensor"] }),
  ftpTolerancePct: integer("ftp_tolerance_pct").default(20),
  totalRides: integer("total_rides").default(0),
  kudosReceived: integer("kudos_received").default(0),
  tier: varchar("tier", { enum: ["A", "B", "C"] }),
  preferences: jsonb("preferences"),
  achievements: jsonb("achievements"),
  paceZone: varchar("pace_zone", { enum: ["NoPref", "Z1", "Z2", "Z3", "Z4"] }),
  elevationPref: varchar("elevation_pref", { enum: ["NoPref", "flat", "rolling", "hilly"] }),
  rideTypePref: varchar("ride_type_pref", { enum: ["any", "road", "gravel", "mtb"] }),
  maxDistanceMi: integer("max_distance_mi"),
  socialPref: varchar("social_pref", { enum: ["social", "solo", "flexible"] }),
  activeBuddySearch: boolean("active_buddy_search").default(false),
  visibleInPassivePool: boolean("visible_in_passive_pool").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Group rides table
export const groupRides = pgTable("group_rides", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  organizer: varchar("organizer").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  tier: varchar("tier", { enum: ["A", "B", "C"] }).notNull(),
  pace: varchar("pace"),
  distance: integer("distance"),
  elevation: integer("elevation"),
  location: varchar("location"),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0),
  isNoDrop: boolean("is_no_drop").default(false),
  hasRegroups: boolean("has_regroups").default(false),
  dropPolicy: varchar("drop_policy"),
  tags: jsonb("tags"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ride participants table
export const rideParticipants = pgTable("ride_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  rideId: uuid("ride_id").notNull().references(() => groupRides.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Buddy matches table
export const buddyMatches = pgTable("buddy_matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  user1: varchar("user1").notNull().references(() => users.id),
  user2: varchar("user2").notNull().references(() => users.id),
  user1Decision: varchar("user1_decision", { enum: ["like", "pass", "pending"] }).default("pending"),
  user2Decision: varchar("user2_decision", { enum: ["like", "pass", "pending"] }).default("pending"),
  isMatch: boolean("is_match").default(false),
  matchScore: decimal("match_score", { precision: 5, scale: 2 }),
  scheduledTime: timestamp("scheduled_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity posts table
export const activityPosts = pgTable("activity_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  rideId: uuid("ride_id").references(() => groupRides.id),
  content: text("content"),
  rideData: jsonb("ride_data"),
  imageUrl: varchar("image_url"),
  photos: jsonb("photos"),
  kudosCount: integer("kudos_count").default(0),
  commentsCount: integer("comments_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Kudos table
export const kudos = pgTable("kudos", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => activityPosts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => activityPosts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clubs table
export const clubs = pgTable("clubs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull(),
  location: varchar("location", { length: 100 }),
  members: jsonb("members").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Calendar entries table
export const calendarEntries = pgTable("calendar_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  source: varchar("source", { length: 50 }),
  type: varchar("type", { length: 50 }),
  title: varchar("title", { length: 200 }),
  date: date("date").notNull(),
  durationHours: decimal("duration_hours", { precision: 4, scale: 2 }),
  distanceKm: decimal("distance_km", { precision: 6, scale: 1 }),
  tss: integer("tss"),
  ctl: integer("ctl"),
  atl: integer("atl"),
  route: jsonb("route"),
  buddies: jsonb("buddies").default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  organizedRides: many(groupRides),
  rideParticipations: many(rideParticipants),
  activityPosts: many(activityPosts),
  givenKudos: many(kudos),
  comments: many(comments),
  calendarEntries: many(calendarEntries),
}));

export const groupRidesRelations = relations(groupRides, ({ one, many }) => ({
  organizer: one(users, {
    fields: [groupRides.organizer],
    references: [users.id],
  }),
  participants: many(rideParticipants),
}));

export const rideParticipantsRelations = relations(rideParticipants, ({ one }) => ({
  ride: one(groupRides, {
    fields: [rideParticipants.rideId],
    references: [groupRides.id],
  }),
  user: one(users, {
    fields: [rideParticipants.userId],
    references: [users.id],
  }),
}));

export const activityPostsRelations = relations(activityPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [activityPosts.userId],
    references: [users.id],
  }),
  ride: one(groupRides, {
    fields: [activityPosts.rideId],
    references: [groupRides.id],
  }),
  kudos: many(kudos),
  comments: many(comments),
}));

export const kudosRelations = relations(kudos, ({ one }) => ({
  post: one(activityPosts, {
    fields: [kudos.postId],
    references: [activityPosts.id],
  }),
  user: one(users, {
    fields: [kudos.userId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(activityPosts, {
    fields: [comments.postId],
    references: [activityPosts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const calendarEntriesRelations = relations(calendarEntries, ({ one }) => ({
  user: one(users, {
    fields: [calendarEntries.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertGroupRideSchema = createInsertSchema(groupRides).omit({
  id: true,
  createdAt: true,
  currentParticipants: true,
});

export const insertActivityPostSchema = createInsertSchema(activityPosts).omit({
  id: true,
  createdAt: true,
  kudosCount: true,
  commentsCount: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertClubSchema = createInsertSchema(clubs).omit({
  id: true,
  createdAt: true,
});

export const insertCalendarEntrySchema = createInsertSchema(calendarEntries).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type GroupRide = typeof groupRides.$inferSelect;
export type InsertGroupRide = z.infer<typeof insertGroupRideSchema>;
export type ActivityPost = typeof activityPosts.$inferSelect;
export type InsertActivityPost = z.infer<typeof insertActivityPostSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Club = typeof clubs.$inferSelect;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type BuddyMatch = typeof buddyMatches.$inferSelect;
export type RideParticipant = typeof rideParticipants.$inferSelect;
export type Kudos = typeof kudos.$inferSelect;
export type CalendarEntry = typeof calendarEntries.$inferSelect;
export type InsertCalendarEntry = z.infer<typeof insertCalendarEntrySchema>;
