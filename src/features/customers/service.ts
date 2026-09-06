import { requireAuth } from '@/lib/auth/rbac';
import { AuthorizationError, BusinessError } from '@/lib/errors';
import { findCustomerProfile, updateCustomerProfile } from './repository';
import { updateProfileInput } from './types';

async function customerIdentity() {
  const user = await requireAuth();
  if (user.role !== 'CUSTOMER' || !user.customerId) throw new AuthorizationError('Customer account required');
  return user;
}
function safeProfile(profile: NonNullable<Awaited<ReturnType<typeof findCustomerProfile>>>) {
  const safeUser: Partial<typeof profile.user> = { ...profile.user };
  delete safeUser.passwordHash;
  return { user: safeUser, customer: profile.customer };
}
export async function getMyProfile() {
  const user = await customerIdentity();
  const profile = await findCustomerProfile(user.userId);
  if (!profile) throw new BusinessError('Customer profile not found', 'NOT_FOUND', 404);
  return safeProfile(profile);
}
export async function updateMyProfile(input: unknown) {
  const user = await customerIdentity();
  const values = updateProfileInput.parse(input);
  const profile = await updateCustomerProfile(
    user.userId, user.customerId!,
    { firstName: values.firstName, lastName: values.lastName },
    { name: values.companyName, industry: values.industry },
  );
  if (!profile) throw new BusinessError('Customer profile not found', 'NOT_FOUND', 404);
  return safeProfile(profile);
}
