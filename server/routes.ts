import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertGroupRideSchema, 
  insertActivityPostSchema, 
  insertCommentSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.get('/api/profile/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      const user = await storage.updateUserProfile(userId, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Group rides routes
  app.get('/api/rides', async (req, res) => {
    try {
      const { tier, date } = req.query;
      const filters: any = {};
      if (tier) filters.tier = tier as string;
      if (date) filters.date = date as string;
      
      const rides = await storage.getGroupRides(filters);
      res.json(rides);
    } catch (error) {
      console.error("Error fetching rides:", error);
      res.status(500).json({ message: "Failed to fetch rides" });
    }
  });

  app.post('/api/rides', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rideData = insertGroupRideSchema.parse({
        ...req.body,
        organizer: userId,
      });
      const ride = await storage.createGroupRide(rideData);
      res.json(ride);
    } catch (error) {
      console.error("Error creating ride:", error);
      res.status(400).json({ message: "Failed to create ride" });
    }
  });

  app.post('/api/rides/:rideId/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { rideId } = req.params;
      await storage.joinGroupRide(rideId, userId);
      res.json({ message: "Joined ride successfully" });
    } catch (error) {
      console.error("Error joining ride:", error);
      res.status(500).json({ message: "Failed to join ride" });
    }
  });

  app.get('/api/user/rides', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rides = await storage.getUserRides(userId);
      res.json(rides);
    } catch (error) {
      console.error("Error fetching user rides:", error);
      res.status(500).json({ message: "Failed to fetch user rides" });
    }
  });

  // Buddy match routes
  app.get('/api/matches/potential', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const matches = await storage.getPotentialMatches(userId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching potential matches:", error);
      res.status(500).json({ message: "Failed to fetch potential matches" });
    }
  });

  app.post('/api/matches/:targetUserId/:decision', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { targetUserId, decision } = req.params;
      
      if (!['like', 'pass'].includes(decision)) {
        return res.status(400).json({ message: "Invalid decision" });
      }
      
      const match = await storage.updateBuddyMatch(userId, targetUserId, decision as "like" | "pass");
      res.json(match);
    } catch (error) {
      console.error("Error updating match:", error);
      res.status(500).json({ message: "Failed to update match" });
    }
  });

  app.get('/api/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const matches = await storage.getUserMatches(userId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // Sensor-based buddy match route (authenticated)
  app.get('/api/match', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { findSensorBasedMatches } = await import('./services/buddyMatch');
      const buddies = await findSensorBasedMatches(userId);
      res.json(buddies);
    } catch (error: any) {
      console.error("Error fetching sensor-based matches:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Simulate match with custom parameters
  app.post('/api/match/simulate', async (req, res) => {
    try {
      const { findMatchesWithParams } = await import('./services/buddyMatch');
      const matches = await findMatchesWithParams(req.body);
      res.json(matches);
    } catch (error: any) {
      console.error("Error simulating matches:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Buddy finder with filters - returns active/passive split
  app.get('/api/buddies/search', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const filters = {
        paceZone: req.query.pace_zone as string,
        elevationPref: req.query.elevation_pref as string,
        rideTypePref: req.query.ride_type as string,
        maxDistanceMi: req.query.max_distance_mi ? parseInt(req.query.max_distance_mi as string) : undefined,
      };
      const { findBuddiesWithFilters } = await import('./services/buddyMatch');
      const results = await findBuddiesWithFilters(userId, filters);
      res.json(results);
    } catch (error: any) {
      console.error("Error finding buddies:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Activity feed routes
  app.get('/api/activity', async (req, res) => {
    try {
      const posts = await storage.getActivityFeed();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching activity feed:", error);
      res.status(500).json({ message: "Failed to fetch activity feed" });
    }
  });

  app.post('/api/activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertActivityPostSchema.parse({
        ...req.body,
        userId,
      });
      const post = await storage.createActivityPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ message: "Failed to create post" });
    }
  });

  app.post('/api/activity/:postId/kudos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      const isKudos = await storage.toggleKudos(postId, userId);
      res.json({ kudos: isKudos });
    } catch (error) {
      console.error("Error toggling kudos:", error);
      res.status(500).json({ message: "Failed to toggle kudos" });
    }
  });

  app.post('/api/activity/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      const commentData = insertCommentSchema.parse({
        postId,
        userId,
        content: req.body.content,
      });
      const comment = await storage.addComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(400).json({ message: "Failed to add comment" });
    }
  });

  app.get('/api/activity/:postId/comments', async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Calendar routes
  app.get('/api/calendar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const { db } = await import('./db');
      const { calendarEntries } = await import('@shared/schema');
      const { eq, and, gte, lte } = await import('drizzle-orm');

      const conditions = [eq(calendarEntries.userId, userId)];
      
      if (from && to) {
        conditions.push(gte(calendarEntries.date, from));
        conditions.push(lte(calendarEntries.date, to));
      }
      
      const entries = await db
        .select()
        .from(calendarEntries)
        .where(and(...conditions));
      
      res.json(entries);
    } catch (error: any) {
      console.error("Error fetching calendar entries:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
