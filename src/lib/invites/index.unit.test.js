import { inviteQuery } from "./index";
import casual from "casual";

describe("inviteQuery", () => {
  test("query using id if supplied", () => {
    const id = casual.uuid;
    const args = {
      invite: {
        inviteUuid: id
      }
    };
    const res = inviteQuery(args);
    expect(res).toHaveProperty("id", id);
  });

  test("query using email if supplied", () => {
    const email = casual.email;
    const args = {
      invite: {
        email
      }
    };
    const res = inviteQuery(args);
    expect(res).toHaveProperty("email_contains", email.toLowerCase());
  });
});
