export default async function suspendWorkspace(parent, args, ctx) {
  const workspace = await ctx.prisma.workspace.update({
    data: {
      isSuspended: args.isSuspended
    },
    where: {
      id: args.workspaceUuid
    }
  });

  return workspace;
}
