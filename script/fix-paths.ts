
import { storage } from "../server/storage";
import { db } from "../server/db";
import { paths, pathWeeks, pathTasks } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Fixing learning paths...");

    // Get all users
    const users = await storage.getUsers();

    for (const user of users) {
        console.log(`Processing user ${user.id}...`);

        // Delete existing path
        const existingPath = await storage.getLearningPath(user.id);
        if (existingPath) {
            console.log(`  Deleting path ${existingPath.id}...`);

            // We need to delete via DB directly to cascade or just delete tasks/weeks
            // Since we don't have cascade delete set up in schema usually, manual delete:
            const weeks = await storage.getPathWeeks(existingPath.id);
            for (const week of weeks) {
                await db.delete(pathTasks).where(eq(pathTasks.weekId, week.id));
                await db.delete(pathWeeks).where(eq(pathWeeks.id, week.id));
            }
            await db.delete(paths).where(eq(paths.id, existingPath.id));
            console.log("  Path deleted.");

            // Regenerate path
            console.log("  Regenerating path...");
            try {
                await storage.generatePath(user.id, {
                    triggeredBy: "system-fix"
                });
                console.log("  New path generated successfully.");
            } catch (err) {
                console.error("  Failed to generate path:", err);
            }
        } else {
            console.log("  No existing path found.");
        }
    }

    console.log("Done!");
    process.exit(0);
}

main().catch(console.error);
