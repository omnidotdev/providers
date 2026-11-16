import { afterEach, describe, expect, it } from "bun:test";

import { cleanup, render } from "@testing-library/react";

import { AccountCreditNotice } from "../../src/react/AccountCreditNotice";

const INVOICES = "https://account.omni.dev/billing?workspace=acme&tab=invoices";

afterEach(cleanup);

describe("AccountCreditNotice", () => {
  it("shows account credit with an Invoices link", () => {
    const { container } = render(
      <AccountCreditNotice
        accountCredit={{
          balance: -1000,
          credit: 1000,
          due: 0,
          currency: "usd",
        }}
        invoicesUrl={INVOICES}
        locale="en-US"
      />,
    );

    expect(container.textContent).toBe(
      "Account credit: $10.00, applied to your next invoice. Invoices",
    );
    expect(container.querySelector("a")?.getAttribute("href")).toBe(INVOICES);
  });

  it("shows an amount owed as a balance due, never as credit", () => {
    const { container } = render(
      <AccountCreditNotice
        accountCredit={{ balance: 250, credit: 0, due: 250, currency: "usd" }}
        locale="en-US"
      />,
    );

    expect(container.textContent).toBe(
      "Balance due: $2.50, added to your next invoice.",
    );
  });

  it("shows only the Invoices link when there is no balance", () => {
    const { container } = render(
      <AccountCreditNotice
        accountCredit={{ balance: 0, credit: 0, due: 0, currency: "usd" }}
        invoicesUrl={INVOICES}
      />,
    );

    expect(container.textContent).toBe("Invoices");
  });

  it("renders nothing without a balance or an invoices link", () => {
    const { container } = render(<AccountCreditNotice accountCredit={null} />);

    expect(container.innerHTML).toBe("");
  });
});
