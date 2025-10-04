import { db } from "../db";
import { users, buddyMatches } from "@shared/schema";
import { eq, and, or, ne, sql } from "drizzle-orm";

export interface MatchCandidate {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  location: string | null;
  avgSpeed: string | null;
  weeklyMileage: number | null;
  ftpWatts: number | null;
  tier: "A" | "B" | "C" | null;
  matchScore: number;
}

export interface SensorMatchCandidate {
  id: string;
  name: string | null;
  ftp_watts?: number | null;
  weight_kg?: number | null;
  avg_speed_mph?: string | null;
  location: string | null;
  sensor_class: "power-meter" | "non-sensor";
  compatibility: number;
  match_reason: string;
  metric_used: string;
}

export async function findBuddyMatches(
  userId: string,
  speedTolerance: number = 2.0
): Promise<MatchCandidate[]> {
  // 1. Get the current user's profile
  const [athlete] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!athlete) {
    throw new Error("User not found");
  }

  // 2. Get existing match IDs to exclude
  const existingMatches = await db
    .select({
      userId: sql<string>`CASE WHEN ${buddyMatches.user1} = ${userId} THEN ${buddyMatches.user2} ELSE ${buddyMatches.user1} END`.as('userId')
    })
    .from(buddyMatches)
    .where(or(eq(buddyMatches.user1, userId), eq(buddyMatches.user2, userId)));

  const excludeIds = existingMatches.map(m => m.userId).filter(id => id !== userId);

  // 3. Build match criteria
  const athleteSpeed = parseFloat(athlete.avgSpeed || "0");
  const athleteLocation = athlete.location;

  // Build where conditions
  const whereConditions = [
    ne(users.id, userId),
    athleteLocation ? eq(users.location, athleteLocation) : sql`1=1`
  ];

  // Add exclusions if there are existing matches
  if (excludeIds.length > 0) {
    whereConditions.push(sql`${users.id} NOT IN (${sql.join(excludeIds.map(id => sql`${id}`), sql`, `)})`);
  }

  // Find candidates with same location
  const candidates = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      location: users.location,
      avgSpeed: users.avgSpeed,
      weeklyMileage: users.weeklyMileage,
      ftpWatts: users.ftpWatts,
      tier: users.tier,
    })
    .from(users)
    .where(and(...whereConditions))
    .limit(50);

  // 4. Calculate match scores and filter by speed tolerance
  const scoredCandidates: MatchCandidate[] = candidates
    .map(candidate => {
      const candidateSpeed = parseFloat(candidate.avgSpeed || "0");
      const speedDelta = Math.abs(candidateSpeed - athleteSpeed);

      // Filter by speed tolerance
      if (speedDelta > speedTolerance) {
        return null;
      }

      // Calculate match score (100 - speed delta penalty)
      // Speed delta penalty: 10 points per 1 mph difference
      const speedScore = Math.max(0, 100 - speedDelta * 10);

      // Location bonus (already filtered by location)
      const locationScore = candidate.location === athleteLocation ? 100 : 0;

      // FTP similarity bonus
      let ftpScore = 50; // default
      if (athlete.ftpWatts && candidate.ftpWatts) {
        const ftpDelta = Math.abs(candidate.ftpWatts - athlete.ftpWatts);
        ftpScore = Math.max(0, 100 - ftpDelta / 2); // 50 watts delta = -25 points
      }

      // Tier match bonus
      const tierScore = candidate.tier === athlete.tier ? 100 : 50;

      // Weighted average: speed is most important, then tier, then FTP, then location
      const matchScore = Math.round(
        speedScore * 0.4 + 
        tierScore * 0.3 + 
        ftpScore * 0.2 + 
        locationScore * 0.1
      );

      return {
        ...candidate,
        matchScore,
      };
    })
    .filter((c): c is MatchCandidate => c !== null)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10); // Top 10 matches

  return scoredCandidates;
}

export async function findSensorBasedMatches(
  userId: string,
  speedTolerance: number = 1.5
): Promise<SensorMatchCandidate[]> {
  const [athlete] = await db.select().from(users).where(eq(users.id, userId));
  if (!athlete) throw new Error("User not found");

  // Fetch all potential candidates in same location
  const results = await db.execute(sql`
    SELECT u.id, 
           CONCAT(u.first_name, ' ', u.last_name) as name,
           u.ftp_watts,
           u.weight_kg,
           u.ftp_wkg,
           u.weekly_hours,
           u.avg_speed as avg_speed_mph,
           u.location,
           u.sensor_class
    FROM users u
    WHERE u.id != ${userId}
      AND u.location = ${athlete.location}
    LIMIT 50
  `);

  // Process candidates with 4-tier hierarchy
  const matches = results.rows.map((candidate: any) => {
    let compatibility = 0;
    let reason = "";
    let metricUsed = "";

    // Tier 1: FTP w/kg (if both have weight and FTP watts)
    const athleteFtpWkg = athlete.ftpWkg ? parseFloat(athlete.ftpWkg.toString()) : 
                         (athlete.ftpWatts && athlete.weightKg ? 
                          Number(athlete.ftpWatts) / parseFloat(athlete.weightKg.toString()) : null);
    const candidateFtpWkg = candidate.ftp_wkg ? parseFloat(candidate.ftp_wkg) :
                           (candidate.ftp_watts && candidate.weight_kg ?
                            Number(candidate.ftp_watts) / parseFloat(candidate.weight_kg) : null);

    if (athleteFtpWkg && candidateFtpWkg) {
      const tolerance = athlete.ftpTolerancePct || 20;
      const lower = athleteFtpWkg * (1 - tolerance / 100);
      const upper = athleteFtpWkg * (1 + tolerance / 100);
      
      if (candidateFtpWkg >= lower && candidateFtpWkg <= upper) {
        const deltaPct = Math.abs((candidateFtpWkg - athleteFtpWkg) / athleteFtpWkg) * 100;
        compatibility = Math.max(0, 100 - deltaPct);
        const deltaWkg = Math.abs(candidateFtpWkg - athleteFtpWkg);
        reason = `FTP match ±${deltaWkg.toFixed(1)} w/kg (${tolerance}% range)`;
        metricUsed = "ftp_wkg";
      }
    }
    
    // Tier 2: FTP watts (if no w/kg match and both have FTP watts)
    if (compatibility === 0 && athlete.ftpWatts && candidate.ftp_watts) {
      const tolerance = athlete.ftpTolerancePct || 20;
      const lower = Number(athlete.ftpWatts) * (1 - tolerance / 100);
      const upper = Number(athlete.ftpWatts) * (1 + tolerance / 100);
      
      if (Number(candidate.ftp_watts) >= lower && Number(candidate.ftp_watts) <= upper) {
        const deltaPct = Math.abs((Number(candidate.ftp_watts) - Number(athlete.ftpWatts)) / Number(athlete.ftpWatts)) * 100;
        compatibility = Math.max(0, 100 - deltaPct);
        const deltaWatts = Math.abs(Number(candidate.ftp_watts) - Number(athlete.ftpWatts));
        reason = `FTP match ±${Math.round(deltaWatts)}w (${tolerance}% range)`;
        metricUsed = "ftp_watts";
      }
    }
    
    // Tier 3: Weekly hours (if no FTP match and both have weekly hours)
    if (compatibility === 0 && athlete.weeklyHours && candidate.weekly_hours) {
      const athleteHours = parseFloat(athlete.weeklyHours.toString());
      const candidateHours = parseFloat(candidate.weekly_hours);
      const delta = Math.abs(candidateHours - athleteHours);
      const tolerance = athleteHours * 0.25; // ±25%
      
      if (delta <= tolerance) {
        compatibility = Math.max(0, 100 - (delta / athleteHours) * 100);
        reason = `Training volume ±${delta.toFixed(1)} hrs/week`;
        metricUsed = "weekly_hours";
      }
    }
    
    // Tier 4: Avg speed (fallback if no other match)
    if (compatibility === 0 && athlete.avgSpeed && candidate.avg_speed_mph) {
      const athleteSpeed = parseFloat(athlete.avgSpeed.toString());
      const candidateSpeed = parseFloat(candidate.avg_speed_mph);
      const delta = Math.abs(candidateSpeed - athleteSpeed);
      
      if (delta <= speedTolerance) {
        compatibility = Math.max(0, 100 - delta * 10);
        reason = `Pace band ±${delta.toFixed(1)} mph, same city`;
        metricUsed = "avg_speed_mph";
      }
    }

    return {
      id: candidate.id,
      name: candidate.name,
      ftp_watts: candidate.ftp_watts,
      weight_kg: candidate.weight_kg,
      avg_speed_mph: candidate.avg_speed_mph,
      location: candidate.location,
      sensor_class: candidate.sensor_class || "non-sensor",
      compatibility: Math.round(compatibility),
      match_reason: reason,
      metric_used: metricUsed,
    } as SensorMatchCandidate;
  });

  // Filter out non-matches and sort by compatibility
  return matches
    .filter(m => m.compatibility > 0)
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, 10);
}

export async function findMatchesWithParams(
  params: {
    ftp_watts?: number;
    weight_kg?: number;
    weekly_hours?: number;
    avg_speed_mph?: number;
    location?: string;
    ftp_tolerance_pct?: number;
  },
  speedTolerance: number = 1.5
): Promise<SensorMatchCandidate[]> {
  // Use default location if not provided
  const location = params.location || "San Jose, CA";
  
  // Fetch all potential candidates in same location
  const results = await db.execute(sql`
    SELECT u.id, 
           CONCAT(u.first_name, ' ', u.last_name) as name,
           u.ftp_watts,
           u.weight_kg,
           u.ftp_wkg,
           u.weekly_hours,
           u.avg_speed as avg_speed_mph,
           u.location,
           u.sensor_class
    FROM users u
    WHERE u.location = ${location}
    LIMIT 50
  `);

  // Calculate athlete's FTP w/kg if both watts and weight provided
  const athleteFtpWkg = params.ftp_watts && params.weight_kg 
    ? params.ftp_watts / params.weight_kg 
    : null;

  // Process candidates with 4-tier hierarchy
  const matches = results.rows.map((candidate: any) => {
    let compatibility = 0;
    let reason = "";
    let metricUsed = "";

    // Tier 1: FTP w/kg (if both have weight and FTP watts)
    const candidateFtpWkg = candidate.ftp_wkg ? parseFloat(candidate.ftp_wkg) :
                           (candidate.ftp_watts && candidate.weight_kg ?
                            Number(candidate.ftp_watts) / parseFloat(candidate.weight_kg) : null);

    if (athleteFtpWkg && candidateFtpWkg) {
      const tolerance = params.ftp_tolerance_pct || 20;
      const lower = athleteFtpWkg * (1 - tolerance / 100);
      const upper = athleteFtpWkg * (1 + tolerance / 100);
      
      if (candidateFtpWkg >= lower && candidateFtpWkg <= upper) {
        const deltaPct = Math.abs((candidateFtpWkg - athleteFtpWkg) / athleteFtpWkg) * 100;
        compatibility = Math.max(0, 100 - deltaPct);
        const deltaWkg = Math.abs(candidateFtpWkg - athleteFtpWkg);
        reason = `FTP match ±${deltaWkg.toFixed(1)} w/kg (${tolerance}% range)`;
        metricUsed = "ftp_wkg";
      }
    }
    
    // Tier 2: FTP watts (if no w/kg match and both have FTP watts)
    if (compatibility === 0 && params.ftp_watts && candidate.ftp_watts) {
      const tolerance = params.ftp_tolerance_pct || 20;
      const lower = params.ftp_watts * (1 - tolerance / 100);
      const upper = params.ftp_watts * (1 + tolerance / 100);
      
      if (Number(candidate.ftp_watts) >= lower && Number(candidate.ftp_watts) <= upper) {
        const deltaPct = Math.abs((Number(candidate.ftp_watts) - params.ftp_watts) / params.ftp_watts) * 100;
        compatibility = Math.max(0, 100 - deltaPct);
        const deltaWatts = Math.abs(Number(candidate.ftp_watts) - params.ftp_watts);
        reason = `FTP match ±${Math.round(deltaWatts)}w (${tolerance}% range)`;
        metricUsed = "ftp_watts";
      }
    }
    
    // Tier 3: Weekly hours (if no FTP match and both have weekly hours)
    if (compatibility === 0 && params.weekly_hours && candidate.weekly_hours) {
      const candidateHours = parseFloat(candidate.weekly_hours);
      const delta = Math.abs(candidateHours - params.weekly_hours);
      const tolerance = params.weekly_hours * 0.25; // ±25%
      
      if (delta <= tolerance) {
        compatibility = Math.max(0, 100 - (delta / params.weekly_hours) * 100);
        reason = `Training volume ±${delta.toFixed(1)} hrs/week`;
        metricUsed = "weekly_hours";
      }
    }
    
    // Tier 4: Avg speed (fallback if no other match)
    if (compatibility === 0 && params.avg_speed_mph && candidate.avg_speed_mph) {
      const candidateSpeed = parseFloat(candidate.avg_speed_mph);
      const delta = Math.abs(candidateSpeed - params.avg_speed_mph);
      
      if (delta <= speedTolerance) {
        compatibility = Math.max(0, 100 - delta * 10);
        reason = `Pace band ±${delta.toFixed(1)} mph, same city`;
        metricUsed = "avg_speed_mph";
      }
    }

    return {
      id: candidate.id,
      name: candidate.name,
      ftp_watts: candidate.ftp_watts,
      weight_kg: candidate.weight_kg,
      avg_speed_mph: candidate.avg_speed_mph,
      location: candidate.location,
      sensor_class: candidate.sensor_class || "non-sensor",
      compatibility: Math.round(compatibility),
      match_reason: reason,
      metric_used: metricUsed,
    } as SensorMatchCandidate;
  });

  // Filter out non-matches and sort by compatibility
  return matches
    .filter(m => m.compatibility > 0)
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, 10);
}

export async function findBuddiesWithFilters(
  userId: string,
  filters?: {
    paceZone?: string;
    elevationPref?: string;
    rideTypePref?: string;
    maxDistanceMi?: number;
  }
): Promise<{ active: SensorMatchCandidate[]; passive: SensorMatchCandidate[]; total: number }> {
  const [athlete] = await db.select().from(users).where(eq(users.id, userId));
  if (!athlete) throw new Error("User not found");

  let query = sql`
    SELECT u.id, 
           CONCAT(u.first_name, ' ', u.last_name) as name,
           u.first_name,
           u.last_name,
           u.location,
           u.ftp_watts,
           u.weight_kg,
           u.ftp_wkg,
           u.weekly_hours,
           u.avg_speed as avg_speed_mph,
           u.sensor_class,
           u.active_buddy_search,
           u.pace_zone,
           u.elevation_pref,
           u.ride_type_pref,
           u.max_distance_mi,
           u.social_pref
    FROM users u
    WHERE u.id != ${userId}
      AND TRIM(SPLIT_PART(u.location, ',', 1)) = TRIM(SPLIT_PART(${athlete.location}, ',', 1))
  `;

  if (filters?.paceZone && filters.paceZone !== 'NoPref') {
    query = sql`${query} AND (u.pace_zone = ${filters.paceZone} OR u.pace_zone = 'NoPref')`;
  }
  if (filters?.elevationPref && filters.elevationPref !== 'NoPref') {
    query = sql`${query} AND (u.elevation_pref = ${filters.elevationPref} OR u.elevation_pref = 'NoPref')`;
  }
  if (filters?.rideTypePref && filters.rideTypePref !== 'any') {
    query = sql`${query} AND (u.ride_type_pref = ${filters.rideTypePref} OR u.ride_type_pref = 'any')`;
  }

  query = sql`${query} LIMIT 100`;

  const results = await db.execute(query);

  const athleteFtpWkg = athlete.ftpWkg ? parseFloat(athlete.ftpWkg.toString()) : 
                       (athlete.ftpWatts && athlete.weightKg ? 
                        Number(athlete.ftpWatts) / parseFloat(athlete.weightKg.toString()) : null);

  const matches = results.rows.map((candidate: any) => {
    let compatibility = 0;
    let reason = "";
    let metricUsed = "";

    const candidateFtpWkg = candidate.ftp_wkg ? parseFloat(candidate.ftp_wkg) :
                           (candidate.ftp_watts && candidate.weight_kg ?
                            Number(candidate.ftp_watts) / parseFloat(candidate.weight_kg) : null);

    if (athleteFtpWkg && candidateFtpWkg) {
      const tolerance = athlete.ftpTolerancePct || 20;
      const lower = athleteFtpWkg * (1 - tolerance / 100);
      const upper = athleteFtpWkg * (1 + tolerance / 100);
      
      if (candidateFtpWkg >= lower && candidateFtpWkg <= upper) {
        const deltaPct = Math.abs((candidateFtpWkg - athleteFtpWkg) / athleteFtpWkg) * 100;
        compatibility = Math.max(0, 100 - deltaPct);
        metricUsed = "ftp_wkg";
        reason = "Power-to-weight match";
      }
    }
    
    if (compatibility === 0 && athlete.ftpWatts && candidate.ftp_watts) {
      const tolerance = athlete.ftpTolerancePct || 20;
      const lower = Number(athlete.ftpWatts) * (1 - tolerance / 100);
      const upper = Number(athlete.ftpWatts) * (1 + tolerance / 100);
      
      if (Number(candidate.ftp_watts) >= lower && Number(candidate.ftp_watts) <= upper) {
        const deltaPct = Math.abs((Number(candidate.ftp_watts) - Number(athlete.ftpWatts)) / Number(athlete.ftpWatts)) * 100;
        compatibility = Math.max(0, 100 - deltaPct);
        metricUsed = "ftp_watts";
        reason = "Power match";
      }
    }
    
    if (compatibility === 0 && athlete.weeklyHours && candidate.weekly_hours) {
      const athleteHours = parseFloat(athlete.weeklyHours.toString());
      const candidateHours = parseFloat(candidate.weekly_hours);
      const delta = Math.abs(candidateHours - athleteHours);
      const tolerance = athleteHours * 0.25;
      
      if (delta <= tolerance) {
        compatibility = Math.max(0, 100 - (delta / athleteHours) * 100);
        metricUsed = "weekly_hours";
        reason = "Training volume match";
      }
    }
    
    if (compatibility === 0 && athlete.avgSpeed && candidate.avg_speed_mph) {
      const athleteSpeed = parseFloat(athlete.avgSpeed.toString());
      const candidateSpeed = parseFloat(candidate.avg_speed_mph);
      const delta = Math.abs(candidateSpeed - athleteSpeed);
      
      if (delta <= 1.5) {
        compatibility = Math.max(0, 100 - delta * 10);
        metricUsed = "avg_speed_mph";
        reason = "Pace match";
      }
    }

    if (compatibility === 0) {
      compatibility = 50;
      reason = "Same location";
      metricUsed = "location";
    }

    return {
      id: candidate.id,
      name: candidate.name,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      location: candidate.location,
      ftp_watts: candidate.ftp_watts,
      weight_kg: candidate.weight_kg,
      avg_speed_mph: candidate.avg_speed_mph,
      sensor_class: candidate.sensor_class || "non-sensor",
      compatibility: Math.round(compatibility),
      match_reason: reason,
      metric_used: metricUsed,
      is_active: candidate.active_buddy_search || false,
      pace_zone: candidate.pace_zone,
      elevation_pref: candidate.elevation_pref,
      ride_type_pref: candidate.ride_type_pref,
      max_distance_mi: candidate.max_distance_mi,
      social_pref: candidate.social_pref,
    } as SensorMatchCandidate & { 
      is_active: boolean; 
      first_name: string;
      last_name: string;
      pace_zone: string;
      elevation_pref: string;
      ride_type_pref: string;
      max_distance_mi: number;
      social_pref: string;
    };
  });

  const sortedMatches = matches.sort((a, b) => b.compatibility - a.compatibility);
  
  const active = sortedMatches.filter(m => m.is_active);
  const passive = sortedMatches.filter(m => !m.is_active);

  return {
    active,
    passive,
    total: sortedMatches.length
  };
}

export async function createMatchWithScore(
  userId: string,
  buddyId: string,
  matchScore: number,
  scheduledTime?: Date
): Promise<void> {
  // Check if match already exists
  const existing = await db
    .select()
    .from(buddyMatches)
    .where(
      or(
        and(eq(buddyMatches.user1, userId), eq(buddyMatches.user2, buddyId)),
        and(eq(buddyMatches.user1, buddyId), eq(buddyMatches.user2, userId))
      )
    );

  if (existing.length > 0) {
    // Update match score on existing match
    await db
      .update(buddyMatches)
      .set({
        matchScore: matchScore.toString(),
        scheduledTime: scheduledTime || null,
      })
      .where(eq(buddyMatches.id, existing[0].id));
  } else {
    // Create new match with score
    await db.insert(buddyMatches).values({
      user1: userId,
      user2: buddyId,
      user1Decision: "pending",
      user2Decision: "pending",
      isMatch: false,
      matchScore: matchScore.toString(),
      scheduledTime: scheduledTime || null,
    });
  }
}
