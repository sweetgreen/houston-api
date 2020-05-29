import { createStripeCustomer } from "stripe";
import { track } from "analytics";

/*
 * Add payment information to a workspace. Create a customer for the user and a subscription for the Workspace in Stripe.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Card} The card information for the customer added.
 */
export default async function addCard(parent, args, ctx) {
  const { company, billingEmail, token, workspaceUuid } = args;

  const response = await createStripeCustomer(
    company,
    billingEmail,
    token,
    workspaceUuid
  );

  const stripeCustomerId = response.id || {};
  const cardInfo = response.sources.data[0] || {};

  const data = {
    stripeCustomerId,
    isSuspended: false,
    trialEndsAt: new Date()
  };

  const where = { id: workspaceUuid };

  const workspace = await ctx.prisma.workspace.update({
    data,
    where
  });

  // Run the analytics track event
  track(ctx.user.id, "Added Payment Method", {
    workspaceId: workspaceUuid,
    label: workspace.label,
    stripeCustomerId: workspace.stripeCustomerId,
    addedAt: new Date()
  });

  const card = {
    expMonth: cardInfo.exp_month,
    expYear: cardInfo.exp_year,
    last4: cardInfo.last4,
    name: cardInfo.name,
    brand: cardInfo.brand,
    billingEmail: cardInfo.email,
    company: cardInfo.metadata.company || company
  };

  return card;
}
