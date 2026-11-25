import { describe, expect, it } from "bun:test";

import { switchAccountParams } from "./switchAccount";

describe("switchAccountParams", () => {
  it("opens the account picker", () => {
    expect(switchAccountParams()).toEqual({ prompt: "select_account" });
    expect(switchAccountParams(null)).toEqual({ prompt: "select_account" });
  });

  it("names the account to continue as", () => {
    expect(switchAccountParams("handle-1")).toEqual({
      prompt: "select_account",
      login_hint: "handle-1",
    });
  });
});
