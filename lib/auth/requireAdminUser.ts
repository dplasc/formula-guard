import { requireVerifiedUser } from './verify-email-guard';

/**
 * Server-side guard to ensure only authenticated, email-verified admins can access admin-only routes.
 * 
 * Requirements:
 * - User must be authenticated
 * - User's email must be verified
 * - User's email (lowercased + trimmed) must exist in ADMIN_EMAILS environment variable
 * 
 * @returns The authenticated admin user object
 * @throws Error('UNAUTHENTICATED') if user is not authenticated
 * @throws Error('EMAIL_NOT_VERIFIED') if user's email is not verified
 * @throws Error('ADMIN_EMAILS_NOT_CONFIGURED') if ADMIN_EMAILS env var is missing or empty
 * @throws Error('NOT_ADMIN') if user's email is not in the admin list
 */
export async function requireAdminUser() {
  // Get authenticated and verified user (throws if not authenticated or not verified)
  const user = await requireVerifiedUser();

  // Get and validate ADMIN_EMAILS environment variable
  const adminEmailsRaw = process.env.ADMIN_EMAILS;
  
  if (!adminEmailsRaw || adminEmailsRaw.trim().length === 0) {
    throw new Error('ADMIN_EMAILS_NOT_CONFIGURED');
  }

  // Normalize admin emails list (split, trim, lowercase)
  const adminEmails = adminEmailsRaw
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);

  // Normalize user email (trim and lowercase)
  const userEmailNormalized = user.email.trim().toLowerCase();

  // Check if user email is in admin list
  if (!adminEmails.includes(userEmailNormalized)) {
    throw new Error('NOT_ADMIN');
  }

  // User is authenticated, verified, and is an admin
  return user;
}

