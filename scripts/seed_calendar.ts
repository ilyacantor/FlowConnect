import { faker } from "@faker-js/faker";
import { db } from "../server/db";
import { calendarEntries, users } from "@shared/schema";

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedCalendar() {
  console.log("🌱 Starting calendar seeding...");

  // Get existing user IDs
  const existingUsers = await db.select({ id: users.id }).from(users).limit(100);
  
  if (existingUsers.length === 0) {
    console.log("⚠️  No users found. Please run the main seeder first (npm run db:seed)");
    return;
  }

  const userIds = existingUsers.map(u => u.id);
  console.log(`Found ${userIds.length} users, creating calendar entries...`);

  for (let i = 0; i < 100; i++) {
    await db.insert(calendarEntries).values({
      userId: randomChoice(userIds),
      source: randomChoice(["TrainingPeaks", "Garmin", "Strava", "Manual", "Flownation"]),
      type: randomChoice(["Ride", "Race", "Group Ride", "Workout", "Rest"]),
      title: randomChoice([
        "Threshold Intervals",
        "Coffee Ride",
        "B Ride – 17-19 mph, no-drop",
        "Leadville 2025 Prep",
        "Sunday Gravel Spin",
        "FTP Test",
        "Recovery Spin",
        "Hill Repeats",
        "Long Endurance Ride",
        "Race Day"
      ]),
      date: faker.date.between({ from: "2025-09-01", to: "2025-12-31" }).toISOString().split('T')[0],
      durationHours: faker.number.float({ min: 1, max: 4, fractionDigits: 1 }).toString(),
      distanceKm: faker.number.float({ min: 20, max: 120, fractionDigits: 1 }).toString(),
      tss: faker.number.int({ min: 30, max: 150 }),
      ctl: faker.number.int({ min: 40, max: 100 }),
      atl: faker.number.int({ min: 30, max: 110 }),
      route: null,
      buddies: []
    });
  }

  console.log("✅ Seeded 100 calendar entries.");
}

seedCalendar()
  .then(() => {
    console.log("🎉 Calendar seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Calendar seeding failed:", error);
    process.exit(1);
  });
