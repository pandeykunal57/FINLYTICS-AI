import { currentUser } from "@clerk/nextjs/server";  // Import Clerk function to get current authenticated user server-side
import { db } from "./prisma";  // Import Prisma client for database interaction

export const checkUser = async () => {
  // Get the currently logged-in user from Clerk
  const user = await currentUser();

  // If no user is logged in, return null immediately
  if (!user) {
    return null;
  }

  try {
    // Try to find this user in our database by their Clerk user ID
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,  // Search by Clerk user ID
      },
    });

    // If the user exists in our database, return the record
    if (loggedInUser) {
      return loggedInUser;
    }

    // Otherwise, create a new user record in our database using info from Clerk
    const name = `${user.firstName} ${user.lastName}`;  // Construct full name

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,          // Store Clerk user ID
        name,                         // Store user's full name
        imageUrl: user.imageUrl,       // Store profile image URL
        email: user.emailAddresses[0].emailAddress,  // Store primary email address
      },
    });

    // Return the newly created user record
    return newUser;
  } catch (error) {
    // Log any error that occurs during database operations
    console.log(error.message);
  }
};


// This function integrates Clerk authentication with the Prisma database.

// It checks if the currently logged-in user exists in the DB, returns the record if found.

// If not found, creates a new user record using information provided by Clerk.

// Handles errors gracefully by logging them.

// Ensures synchronization between the authentication service and application database.
// */