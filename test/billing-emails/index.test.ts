import { describe, expect, it } from "bun:test";

import {
  creditPurchaseReceiptTemplate,
  overageChargeFailedTemplate,
  paymentReceiptTemplate,
  productNameFromAppId,
  renewalReminderTemplate,
  subscriptionCanceledTemplate,
} from "../../src/billing-emails";

describe("productNameFromAppId", () => {
  it("title-cases a simple id", () => {
    expect(productNameFromAppId("fractal")).toBe("Fractal");
  });

  it("applies canonical overrides", () => {
    expect(productNameFromAppId("myfi")).toBe("MyFi");
    expect(productNameFromAppId("omni-api")).toBe("Omni API");
    expect(productNameFromAppId("life-json")).toBe("life.json");
  });

  it("title-cases each word of an unmapped multi-word id", () => {
    expect(productNameFromAppId("see-less")).toBe("See Less");
  });

  it("returns undefined for a missing id", () => {
    expect(productNameFromAppId(undefined)).toBeUndefined();
  });
});

describe("billing email templates", () => {
  it("renewal reminder names the product in the subject", () => {
    const { subject, html } = renewalReminderTemplate({
      productName: "Fractal",
      planName: "Pro",
      renewsOn: "September 10, 2026",
      amount: "$20.00",
      manageBillingUrl: "https://example.com/billing",
    });
    expect(subject).toBe("Your Fractal Pro subscription renews soon");
    expect(html).toContain("September 10, 2026");
    expect(html).toContain("$20.00");
    expect(html).toContain("https://example.com/billing");
  });

  it("receipt names product, amount, and date", () => {
    const { subject, html } = paymentReceiptTemplate({
      productName: "Fractal",
      amount: "$20.00",
      paidOn: "September 10, 2026",
    });
    expect(subject).toBe("Your Fractal payment receipt");
    expect(html).toContain("$20.00");
    expect(html.toLowerCase()).toContain("receipt");
  });

  it("cancellation degrades to a generic subject without a product", () => {
    expect(subscriptionCanceledTemplate().subject).toBe(
      "Your subscription was canceled",
    );
  });

  it("overage-charge-failed is action-required and names the product + amount", () => {
    const { subject, html } = overageChargeFailedTemplate({
      productName: "Fractal",
      amount: "$4.20",
      manageBillingUrl: "https://example.com/billing",
    });
    expect(subject).toBe("Action required: your Fractal usage charge failed");
    expect(html).toContain("$4.20");
    expect(html).toContain("https://example.com/billing");
  });

  it("credit-purchase receipt names product, amount, and credits", () => {
    const { subject, html } = creditPurchaseReceiptTemplate({
      productName: "Aspen",
      amount: "$10.00",
      credits: "1,000 credits",
      paidOn: "September 4, 2026",
    });
    expect(subject).toBe("Your Aspen credit purchase receipt");
    expect(html).toContain("$10.00");
    expect(html).toContain("1,000 credits");
    expect(html.toLowerCase()).toContain("receipt");
  });
});
