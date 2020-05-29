export default async function deploymentAlertsUpdate(parent, args, ctx) {
  const alertEmails = { set: args.alertEmails };
  const where = { id: args.deploymentUuid };
  const data = { alertEmails };
  return await ctx.prisma.deployment.update({ where, data });
}
