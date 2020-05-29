import types from "./schema/types";
import Query from "./schema/query";
import Mutation from "./schema/mutation";
import Subscription from "./schema/subscription";
import { nexusPrismaPlugin } from "nexus-prisma";
import { makeSchema } from "@nexus/schema";

export const schema = makeSchema({
  types: [...types, Query, Mutation, Subscription],
  plugins: [nexusPrismaPlugin()],
  outputs: {
    schema: __dirname + "/generated/schema.graphql",
    typegen: __dirname + "/generated/nexus.ts"
  },
  typegenAutoConfig: {
    contextType: "Context.Context",
    sources: [
      {
        source: "@prisma/client",
        alias: "prisma"
      }
    ]
  }
});
