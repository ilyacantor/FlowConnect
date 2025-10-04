import {
  users,
  groupRides,
  rideParticipants,
  buddyMatches,
  activityPosts,
  kudos,
  comments,
  type User,
  type UpsertUser,
  type GroupRide,
  type InsertGroupRide,
  type ActivityPost,
  type InsertActivityPost,
  type Comment,
  type InsertComment,
  type BuddyMatch,
  type RideParticipant,
  type Kudos,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, ne, inArray } from "drizzle-orm";
import { findBuddyMatches, type MatchCandidate } from "./services/buddyMatch";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Profile operations
  updateUserProfile(id: string, updates: Partial<User>): Promise<User>;
  getUsersByTier(tier: string): Promise<User[]>;
  
  // Group rides operations
  createGroupRide(ride: InsertGroupRide): Promise<GroupRide>;
  getGroupRides(filters?: { tier?: string; date?: string }): Promise<GroupRide[]>;
  joinGroupRide(rideId: string, userId: string): Promise<void>;
  getGroupRideById(id: string): Promise<GroupRide | undefined>;
  getUserRides(userId: string): Promise<GroupRide[]>;
  
  // Buddy match operations
  createBuddyMatch(user1: string, user2: string): Promise<BuddyMatch>;
  updateBuddyMatch(user1: string, user2: string, decision: "like" | "pass"): Promise<BuddyMatch>;
  getPotentialMatches(userId: string, speedTolerance?: number): Promise<MatchCandidate[]>;
  getUserMatches(userId: string): Promise<User[]>;
  
  // Activity feed operations
  createActivityPost(post: InsertActivityPost): Promise<ActivityPost>;
  getActivityFeed(userId?: string): Promise<ActivityPost[]>;
  toggleKudos(postId: string, userId: string): Promise<boolean>;
  addComment(comment: InsertComment): Promise<Comment>;
  getPostComments(postId: string): Promise<Comment[]>;
  getUserActivityPosts(userId: string): Promise<ActivityPost[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Profile operations
  async updateUserProfile(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUsersByTier(tier: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.tier, tier as "A" | "B" | "C"));
  }

  // Group rides operations
  async createGroupRide(ride: InsertGroupRide): Promise<GroupRide> {
    const [groupRide] = await db.insert(groupRides).values(ride).returning();
    return groupRide;
  }

  async getGroupRides(filters?: { tier?: string; date?: string }): Promise<GroupRide[]> {
    const conditions = [];
    if (filters?.tier) {
      conditions.push(eq(groupRides.tier, filters.tier as "A" | "B" | "C"));
    }
    if (filters?.date) {
      const date = new Date(filters.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      conditions.push(
        and(
          sql`${groupRides.date} >= ${date}`,
          sql`${groupRides.date} < ${nextDay}`
        )!
      );
    }
    
    if (conditions.length > 0) {
      return await db.select().from(groupRides).where(and(...conditions)!).orderBy(groupRides.date);
    }
    
    return await db.select().from(groupRides).orderBy(groupRides.date);
  }

  async joinGroupRide(rideId: string, userId: string): Promise<void> {
    // Check if user already joined
    const [existing] = await db
      .select()
      .from(rideParticipants)
      .where(and(eq(rideParticipants.rideId, rideId), eq(rideParticipants.userId, userId)));
    
    if (existing) return;

    // Add participant and increment count
    await db.transaction(async (tx) => {
      await tx.insert(rideParticipants).values({ rideId, userId });
      await tx
        .update(groupRides)
        .set({ currentParticipants: sql`${groupRides.currentParticipants} + 1` })
        .where(eq(groupRides.id, rideId));
    });
  }

  async getGroupRideById(id: string): Promise<GroupRide | undefined> {
    const [ride] = await db.select().from(groupRides).where(eq(groupRides.id, id));
    return ride;
  }

  async getUserRides(userId: string): Promise<GroupRide[]> {
    return await db
      .select({
        id: groupRides.id,
        name: groupRides.name,
        description: groupRides.description,
        organizer: groupRides.organizer,
        date: groupRides.date,
        tier: groupRides.tier,
        pace: groupRides.pace,
        distance: groupRides.distance,
        elevation: groupRides.elevation,
        location: groupRides.location,
        maxParticipants: groupRides.maxParticipants,
        currentParticipants: groupRides.currentParticipants,
        isNoDrop: groupRides.isNoDrop,
        hasRegroups: groupRides.hasRegroups,
        dropPolicy: groupRides.dropPolicy,
        tags: groupRides.tags,
        createdAt: groupRides.createdAt,
      })
      .from(groupRides)
      .innerJoin(rideParticipants, eq(groupRides.id, rideParticipants.rideId))
      .where(eq(rideParticipants.userId, userId))
      .orderBy(groupRides.date);
  }

  // Buddy match operations
  async createBuddyMatch(user1: string, user2: string): Promise<BuddyMatch> {
    const [match] = await db
      .insert(buddyMatches)
      .values({ user1, user2 })
      .returning();
    return match;
  }

  async updateBuddyMatch(user1: string, user2: string, decision: "like" | "pass"): Promise<BuddyMatch> {
    // Find existing match
    const [existing] = await db
      .select()
      .from(buddyMatches)
      .where(
        or(
          and(eq(buddyMatches.user1, user1), eq(buddyMatches.user2, user2)),
          and(eq(buddyMatches.user1, user2), eq(buddyMatches.user2, user1))
        )
      );

    if (!existing) {
      // Create new match
      return await this.createBuddyMatch(user1, user2);
    }

    // Update decision
    const isUser1 = existing.user1 === user1;
    const updateData: { user1Decision?: "like" | "pass"; user2Decision?: "like" | "pass"; isMatch?: boolean } = isUser1
      ? { user1Decision: decision }
      : { user2Decision: decision };

    // Check if it's a match
    const otherDecision = isUser1 ? existing.user2Decision : existing.user1Decision;
    if (decision === "like" && otherDecision === "like") {
      updateData.isMatch = true;
    }

    const [match] = await db
      .update(buddyMatches)
      .set(updateData)
      .where(eq(buddyMatches.id, existing.id))
      .returning();

    return match;
  }

  async getPotentialMatches(userId: string, speedTolerance: number = 2.0): Promise<MatchCandidate[]> {
    // Use the smart matching service to find compatible buddies
    return await findBuddyMatches(userId, speedTolerance);
  }

  async getUserMatches(userId: string): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        location: users.location,
        bio: users.bio,
        avgSpeed: users.avgSpeed,
        weeklyMileage: users.weeklyMileage,
        ftpWatts: users.ftpWatts,
        totalRides: users.totalRides,
        kudosReceived: users.kudosReceived,
        tier: users.tier,
        preferences: users.preferences,
        achievements: users.achievements,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .innerJoin(buddyMatches, 
        or(
          and(eq(buddyMatches.user1, userId), eq(buddyMatches.user2, users.id)),
          and(eq(buddyMatches.user2, userId), eq(buddyMatches.user1, users.id))
        )
      )
      .where(eq(buddyMatches.isMatch, true));
  }

  // Activity feed operations
  async createActivityPost(post: InsertActivityPost): Promise<ActivityPost> {
    const [activityPost] = await db.insert(activityPosts).values(post).returning();
    return activityPost;
  }

  async getActivityFeed(userId?: string): Promise<ActivityPost[]> {
    return await db
      .select({
        id: activityPosts.id,
        userId: activityPosts.userId,
        rideId: activityPosts.rideId,
        content: activityPosts.content,
        rideData: activityPosts.rideData,
        imageUrl: activityPosts.imageUrl,
        photos: activityPosts.photos,
        kudosCount: activityPosts.kudosCount,
        commentsCount: activityPosts.commentsCount,
        createdAt: activityPosts.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(activityPosts)
      .innerJoin(users, eq(activityPosts.userId, users.id))
      .orderBy(desc(activityPosts.createdAt))
      .limit(50);
  }

  async toggleKudos(postId: string, userId: string): Promise<boolean> {
    // Check if kudos already exists
    const [existing] = await db
      .select()
      .from(kudos)
      .where(and(eq(kudos.postId, postId), eq(kudos.userId, userId)));

    if (existing) {
      // Remove kudos
      await db.transaction(async (tx) => {
        await tx.delete(kudos).where(eq(kudos.id, existing.id));
        await tx
          .update(activityPosts)
          .set({ kudosCount: sql`${activityPosts.kudosCount} - 1` })
          .where(eq(activityPosts.id, postId));
      });
      return false;
    } else {
      // Add kudos
      await db.transaction(async (tx) => {
        await tx.insert(kudos).values({ postId, userId });
        await tx
          .update(activityPosts)
          .set({ kudosCount: sql`${activityPosts.kudosCount} + 1` })
          .where(eq(activityPosts.id, postId));
      });
      return true;
    }
  }

  async addComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.transaction(async (tx) => {
      const [comment_result] = await tx.insert(comments).values(comment).returning();
      await tx
        .update(activityPosts)
        .set({ commentsCount: sql`${activityPosts.commentsCount} + 1` })
        .where(eq(activityPosts.id, comment.postId));
      return [comment_result];
    });
    return newComment;
  }

  async getPostComments(postId: string): Promise<Comment[]> {
    return await db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
  }

  async getUserActivityPosts(userId: string): Promise<ActivityPost[]> {
    return await db
      .select()
      .from(activityPosts)
      .where(eq(activityPosts.userId, userId))
      .orderBy(desc(activityPosts.createdAt));
  }
}

export const storage = new DatabaseStorage();
