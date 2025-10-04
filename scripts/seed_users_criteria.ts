import { faker } from "@faker-js/faker";
import { db } from "../server/db";
import { users } from "../shared/schema";

async function seedUserCriteria() {
  const paceZones = ["Z1", "Z2", "Z3", "Z4", "NoPref"];
  const elevations = ["flat", "rolling", "hilly", "NoPref"];
  const rideTypes = ["road", "gravel", "mtb", "any"];
  const socialModes = ["social", "solo", "flexible"];
  const locations = ["San Francisco", "Boulder", "Austin", "Portland", "Seattle", "Denver"];

  console.log("🌱 Seeding 100 users with broader defaults...");

  for (let i = 0; i < 100; i++) {
    // Bias toward openness
    const active = faker.number.int({ min: 0, max: 100 }) < 70; // 70% active
    const visible = true; // everyone visible by default
    const pace = faker.number.int({ min: 0, max: 100 }) < 50 ? "NoPref" : faker.helpers.arrayElement(paceZones);
    const elevation = faker.number.int({ min: 0, max: 100 }) < 50 ? "NoPref" : faker.helpers.arrayElement(elevations);
    const rideType = faker.number.int({ min: 0, max: 100 }) < 40 ? "any" : faker.helpers.arrayElement(rideTypes);

    const ftpWatts = faker.number.int({ min: 150, max: 350 });
    const weightKg = faker.number.float({ min: 55, max: 85, fractionDigits: 1 });
    const ftpWkg = (ftpWatts / weightKg).toFixed(2);
    const weeklyHours = faker.number.int({ min: 3, max: 18 });

    await db.insert(users).values({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      location: faker.helpers.arrayElement(locations),
      ftpWatts,
      weightKg: weightKg.toString(),
      ftpWkg,
      weeklyHours: weeklyHours.toString(),
      avgSpeed: faker.number.int({ min: 14, max: 24 }).toString(),
      paceZone: pace,
      elevationPref: elevation,
      maxDistanceMi: faker.helpers.arrayElement([10, 20, 40, 60, 80, 100]),
      rideTypePref: rideType,
      socialPref: faker.helpers.arrayElement(socialModes),
      activeBuddySearch: active,
      visibleInPassivePool: visible,
      experienceYears: faker.helpers.arrayElement(["0-2", "2-5", "5+"]),
      radiusGroupMi: faker.helpers.arrayElement([20, 40, 60]),
      radiusBuddyMi: faker.helpers.arrayElement([40, 60, 80]),
      tier: faker.helpers.arrayElement(["A", "B", "C"]),
      sensorClass: faker.helpers.arrayElement(["power-meter", "non-sensor"]),
    });
  }

  console.log("✅ Seeded 100 users with broader defaults (70% active, 100% visible, many NoPref).");
}

seedUserCriteria()
  .then(() => {
    console.log("🎉 Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
