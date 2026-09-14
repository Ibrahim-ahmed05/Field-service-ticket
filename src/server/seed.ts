import dotenv from "dotenv";
import { connectDB, isDbConnected } from "./db";
import {
  CustomerModel,
  SiteModel,
  EquipmentModel,
  TechnicianModel,
  TicketModel,
  TicketHistoryModel,
  AttachmentModel,
  CommentModel,
  NotificationLogModel,
} from "./models/index";
import {
  seedCustomers,
  seedSites,
  seedEquipment,
  seedTechnicians,
  seedTickets,
  seedHistory,
  seedComments,
  seedAttachments,
  seedNotificationLogs,
} from "../data/seed-data";

export {
  seedCustomers,
  seedSites,
  seedEquipment,
  seedTechnicians,
  seedTickets,
  seedHistory,
  seedComments,
  seedAttachments,
  seedNotificationLogs,
};

dotenv.config();

/**
 * Execute Database Seeding
 */
export async function seedDatabase() {
  console.log("=================================================");
  console.log("🌱 Starting Field Service Database Seeding...");
  console.log("=================================================");

  const db = await connectDB();
  if (!db || !isDbConnected()) {
    console.log("ℹ️ Running in persistent in-memory mode (MONGODB_URI not configured or unreachable).");
    console.log(`✅ Loaded ${seedCustomers.length} customers, ${seedSites.length} sites, ${seedEquipment.length} equipment, ${seedTechnicians.length} technicians, ${seedTickets.length} tickets.`);
    return { ok: true, inMemoryOnly: true };
  }

  try {
    // Clean and insert collections
    await Promise.all([
      CustomerModel.deleteMany({}),
      SiteModel.deleteMany({}),
      EquipmentModel.deleteMany({}),
      TechnicianModel.deleteMany({}),
      TicketModel.deleteMany({}),
      TicketHistoryModel.deleteMany({}),
      AttachmentModel.deleteMany({}),
      CommentModel.deleteMany({}),
      NotificationLogModel.deleteMany({}),
    ]);

    await CustomerModel.insertMany(seedCustomers);
    console.log(`✅ Seeded ${seedCustomers.length} Customers`);

    await SiteModel.insertMany(seedSites);
    console.log(`✅ Seeded ${seedSites.length} Sites`);

    await EquipmentModel.insertMany(seedEquipment);
    console.log(`✅ Seeded ${seedEquipment.length} Equipment`);

    await TechnicianModel.insertMany(seedTechnicians);
    console.log(`✅ Seeded ${seedTechnicians.length} Technicians`);

    await TicketModel.insertMany(seedTickets);
    console.log(`✅ Seeded ${seedTickets.length} Tickets (across all 8 statuses with 1 urgent overdue ticket)`);

    await TicketHistoryModel.insertMany(seedHistory);
    console.log(`✅ Seeded ${seedHistory.length} Ticket History entries`);

    await CommentModel.insertMany(seedComments);
    console.log(`✅ Seeded ${seedComments.length} Comments & Notes`);

    await AttachmentModel.insertMany(seedAttachments);
    console.log(`✅ Seeded ${seedAttachments.length} Attachments`);

    await NotificationLogModel.insertMany(seedNotificationLogs);
    console.log(`✅ Seeded ${seedNotificationLogs.length} Notification Logs`);

    console.log("=================================================");
    console.log("🎉 Database seeding completed successfully!");
    console.log("=================================================");

    return { ok: true, inMemoryOnly: false };
  } catch (error: any) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// Auto-run if executed directly via node / tsx
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("seed.ts")) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
