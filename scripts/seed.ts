import { faker } from "@faker-js/faker";
import { db } from "../server/db";
import { users, groupRides, activityPosts, buddyMatches, clubs } from "@shared/schema";

async function seed() {
  console.log("🌱 Starting database seeding...");

  // --- Users ---
  const userIds: string[] = [];
  console.log("Creating 100 users...");
  
  for (let i = 0; i < 100; i++) {
    const avgSpeed = faker.number.float({ min: 13, max: 24, fractionDigits: 1 });
    const tier = avgSpeed >= 19 ? "A" : avgSpeed >= 16 ? "B" : "C";
    
    const [user] = await db.insert(users).values({
      id: faker.string.uuid(),
      email: faker.internet.email().toLowerCase(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      profileImageUrl: `https://images.unsplash.com/photo-${faker.helpers.arrayElement([
        '1558618666-fcd25c85cd64',
        '1541625602-a8e58e52c60f',
        '1434596922112-19c563067271',
        '1507003211169-0a1dd7228f2d'
      ])}?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200`,
      location: faker.helpers.arrayElement([
        "San Jose, CA",
        "Palo Alto, CA", 
        "Los Gatos, CA",
        "Sunnyvale, CA",
        "Mountain View, CA",
        "Saratoga, CA",
        "Cupertino, CA"
      ]),
      bio: faker.helpers.arrayElement([
        "Weekend warrior looking for riding partners",
        "Love climbing and coffee stops",
        "Road cyclist focused on endurance",
        "Gravel enthusiast and explorer",
        "Training for my first century"
      ]),
      avgSpeed: avgSpeed.toString(),
      weeklyMileage: faker.number.int({ min: 50, max: 200 }),
      ftpWatts: faker.number.int({ min: 150, max: 320 }),
      totalRides: faker.number.int({ min: 0, max: 150 }),
      kudosReceived: faker.number.int({ min: 0, max: 500 }),
      tier: tier as "A" | "B" | "C",
      preferences: {
        rideTypes: faker.helpers.arrayElements(["Road", "Gravel", "MTB"], { min: 1, max: 2 }),
        interests: faker.helpers.arrayElements([
          "Coffee stops",
          "Hill climbing", 
          "Social rides",
          "Training",
          "Exploring new routes"
        ], { min: 2, max: 4 })
      },
      achievements: []
    }).returning();
    
    userIds.push(user.id);
  }

  // --- Group Rides ---
  const rideIds: string[] = [];
  console.log("Creating 20 group rides...");
  
  for (let i = 0; i < 20; i++) {
    const tier = faker.helpers.arrayElement(["A", "B", "C"]) as "A" | "B" | "C";
    const avgSpeed = tier === "A" 
      ? faker.number.float({ min: 19, max: 22, fractionDigits: 1 })
      : tier === "B"
      ? faker.number.float({ min: 16, max: 19, fractionDigits: 1 })
      : faker.number.float({ min: 13, max: 16, fractionDigits: 1 });
      
    const dropPolicy = tier === "A" ? "Drop" : tier === "B" ? "Regroup" : "No-drop";
    
    const location = faker.helpers.arrayElement([
      "San Jose",
      "Palo Alto",
      "Los Gatos",
      "Saratoga",
      "Mountain View"
    ]);
    
    const [ride] = await db.insert(groupRides).values({
      id: faker.string.uuid(),
      name: `${location} ${tier} Tier ${faker.helpers.arrayElement(['Morning', 'Weekend', 'Evening'])} Ride`,
      description: faker.helpers.arrayElement([
        "Steady pace with coffee stop",
        "Hilly route with amazing views",
        "Flat and fast training ride",
        "Social ride with regroups",
        "Challenging climbing route"
      ]),
      organizer: faker.helpers.arrayElement(userIds),
      date: faker.date.future({ years: 0.1 }),
      tier: tier,
      pace: `${avgSpeed} mph average`,
      distance: faker.number.int({ min: 20, max: 80 }),
      elevation: faker.number.int({ min: 500, max: 5000 }),
      location: `${location}, CA`,
      maxParticipants: faker.number.int({ min: 10, max: 30 }),
      currentParticipants: faker.number.int({ min: 0, max: 15 }),
      isNoDrop: tier === "C",
      hasRegroups: tier !== "A",
      dropPolicy: dropPolicy,
      tags: faker.helpers.arrayElements([
        "coffee-stop",
        "hills",
        "scenic",
        "training",
        "beginner-friendly"
      ], { min: 1, max: 3 })
    }).returning();
    
    rideIds.push(ride.id);
  }

  // --- Activity Posts ---
  console.log("Creating 50 activity posts...");
  
  for (let i = 0; i < 50; i++) {
    await db.insert(activityPosts).values({
      id: faker.string.uuid(),
      userId: faker.helpers.arrayElement(userIds),
      rideId: faker.helpers.maybe(() => faker.helpers.arrayElement(rideIds), { probability: 0.7 }) || null,
      content: faker.helpers.arrayElement([
        "Great group ride today! 🚴",
        "Coffee stop at mile 20 was perfect ☕",
        "Felt strong on the climbs 💪",
        "New PR on the local loop! 🎉",
        "No-drop ride with new friends",
        "Beautiful morning for a ride",
        "Conquered Old La Honda today!",
        "Perfect weather for cycling",
        "Made some new riding buddies",
        "Challenging but rewarding ride"
      ]),
      rideData: {
        distance: faker.number.float({ min: 15, max: 80, fractionDigits: 1 }),
        duration: faker.number.int({ min: 45, max: 300 }),
        elevation: faker.number.int({ min: 200, max: 4000 }),
        avgSpeed: faker.number.float({ min: 14, max: 22, fractionDigits: 1 })
      },
      imageUrl: faker.helpers.maybe(() => 
        `https://images.unsplash.com/photo-${faker.helpers.arrayElement([
          '1541625602-a8e58e52c60f',
          '1517649763962-0c623066013b',
          '1485965120165-ba87531d7f29',
          '1559827260-dc66d52bef19'
        ])}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600`,
        { probability: 0.6 }
      ) || null,
      photos: [],
      kudosCount: faker.number.int({ min: 0, max: 42 }),
      commentsCount: faker.number.int({ min: 0, max: 15 })
    });
  }

  // --- Buddy Matches ---
  console.log("Creating 30 buddy matches...");
  
  for (let i = 0; i < 30; i++) {
    const user1 = faker.helpers.arrayElement(userIds);
    let user2 = faker.helpers.arrayElement(userIds);
    
    // Ensure different users
    while (user2 === user1) {
      user2 = faker.helpers.arrayElement(userIds);
    }
    
    const user1Decision = faker.helpers.arrayElement(["like", "pass", "pending"]) as "like" | "pass" | "pending";
    const user2Decision = faker.helpers.arrayElement(["like", "pass", "pending"]) as "like" | "pass" | "pending";
    const isMatch = user1Decision === "like" && user2Decision === "like";
    
    await db.insert(buddyMatches).values({
      id: faker.string.uuid(),
      user1: user1,
      user2: user2,
      user1Decision: user1Decision,
      user2Decision: user2Decision,
      isMatch: isMatch,
      matchScore: faker.number.float({ min: 60, max: 98, fractionDigits: 1 }).toString(),
      scheduledTime: isMatch ? faker.date.future({ years: 0.05 }) : null
    });
  }

  // --- Clubs ---
  console.log("Creating 10 clubs...");
  
  for (let i = 0; i < 10; i++) {
    const memberCount = faker.number.int({ min: 5, max: 30 });
    const clubMembers = faker.helpers.arrayElements(userIds, memberCount);
    
    await db.insert(clubs).values({
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement([
        "Silicon Valley Cyclists",
        "Peninsula Pedalers",
        "South Bay Riders",
        "Mountain View Cycling Club",
        "Bay Area Road Warriors",
        "Los Gatos Hills Climbers",
        "Palo Alto Wheelers",
        "Saratoga Social Riders",
        "Coffee & Climbs Club",
        "Weekend Warriors Cycling"
      ]),
      location: faker.helpers.arrayElement([
        "San Jose, CA",
        "Palo Alto, CA",
        "Los Gatos, CA",
        "Mountain View, CA",
        "Saratoga, CA"
      ]),
      members: clubMembers
    });
  }

  console.log("✅ Seeded 100 users, 20 rides, 50 posts, 30 matches, 10 clubs");
  console.log("🎉 Database seeding complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
