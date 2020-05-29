import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";
import { SYSTEM_ADMIN } from "constants";

jest.mock("emails");

const query = `
  mutation removeUser($userUuid: Uuid!) {
    removeUser(userUuid: $userUuid) {
      id: id
    }
  }
`;

describe("removeUser", () => {
  test("removes the user role binding", async () => {
    // Create mock user.
    const userUuid = casual.uuid;

    // Mock up some db functions.
    const findOne = jest.fn().mockReturnValue({ roleBindings: [] });

    // Construct db object for context.
    const prisma = {
      user: { findOne, delete: jest.fn().mockReturnValue({ id: userUuid }) }
    };

    const vars = {
      userUuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();

    const where = { id: userUuid };
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where,
      select: { id: true }
    });
  });

  test("throws error if there are no other system admins", async () => {
    // Create mock user.
    const userUuid = casual.uuid;

    // Mock up some db functions.
    const findOne = jest
      .fn()
      .mockReturnValue({ roleBindings: [{ role: SYSTEM_ADMIN }] }); // User is an admin
    const findMany = jest.fn().mockReturnValue([]); // No other admins

    // Construct db object for context.
    const prisma = {
      user: { findOne, delete: jest.fn().mockReturnValue({ id: userUuid }) },
      roleBinding: { findMany }
    };

    const vars = {
      userUuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma }, vars);
    expect(res.errors).toHaveLength(1);
    expect(prisma.user.delete).toHaveBeenCalledTimes(0);
  });

  test("does not throw error if there are more admins", async () => {
    // Create mock user.
    const userUuid = casual.uuid;

    // Mock up some db functions.
    const findOne = jest
      .fn()
      .mockReturnValue({ roleBindings: [{ role: SYSTEM_ADMIN }] }); // User is an admin
    const findMany = jest.fn().mockReturnValue([{}, {}]); // More admins

    // Construct db object for context.
    const prisma = {
      user: { findOne, delete: jest.fn().mockReturnValue({ id: userUuid }) },
      roleBinding: { findMany }
    };

    const vars = {
      userUuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();

    const where = { id: userUuid };
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where,
      select: { id: true }
    });
  });
});
