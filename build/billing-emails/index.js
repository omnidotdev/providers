// src/billing-emails/index.ts
var BRAND = "#00a3a2";
var PRODUCT_NAME_OVERRIDES = {
  myfi: "MyFi",
  odk: "ODK",
  rdk: "RDK",
  zdk: "ZDK",
  gel: "gel",
  "can-opener": "Can-Opener",
  streamcut: "StreamCut",
  timever: "TimeVer",
  retrace: "ReTrace",
  resense: "ReSense",
  "omni-api": "Omni API",
  "omni-cli": "Omni CLI",
  "hidra-gatekeeper": "HIDRA Gatekeeper",
  "hidra-warden": "HIDRA Warden",
  "life-json": "life.json",
  "persona-json": "persona.json"
};
function productNameFromAppId(appId) {
  if (!appId)
    return;
  const key = appId.toLowerCase();
  if (PRODUCT_NAME_OVERRIDES[key])
    return PRODUCT_NAME_OVERRIDES[key];
  return key.split(/[-_\s]+/).filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
var layout = (heading, bodyHtml, manageBillingUrl) => {
  const footer = manageBillingUrl ? `Manage your billing any time from <a href="${manageBillingUrl}" style="color:${BRAND}">your billing settings</a>.` : "Manage your billing any time from your billing settings.";
  return `
<div style="font-family:Assistant,Verdana,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#374151">
  <h1 style="font-size:22px;font-weight:400;text-align:center;margin:24px 0">${heading}</h1>
  ${bodyHtml}
  <hr style="border:none;border-top:1px solid #eaeaea;margin:24px 0" />
  <p style="font-size:12px;color:#9ca3af;text-align:center">
    ${footer}
  </p>
</div>`.trim();
};
var cta = (href, label) => href ? `
<p style="text-align:center;margin:24px 0">
  <a href="${href}" style="background:${BRAND};color:#fff;border-radius:8px;padding:12px 16px;text-decoration:none;display:inline-block">${label}</a>
</p>`.trim() : "";
var subscriptionLabel = (productName, planName) => {
  const qualifier = [productName, planName].filter(Boolean).join(" ");
  return qualifier ? `${qualifier} subscription` : "subscription";
};
var paymentFailedTemplate = (opts) => {
  const label = subscriptionLabel(opts?.productName, opts?.planName);
  return {
    subject: `Action required: your ${opts?.productName ? `${opts.productName} ` : ""}payment failed`,
    html: layout("Your payment didn't go through", `<p style="font-size:14px;line-height:24px;text-align:center">
      We were unable to process the payment for your most recent ${label} invoice.
      To avoid any interruption to your service, please update your payment method.
    </p>
    ${cta(opts?.manageBillingUrl, "Update payment method")}`, opts?.manageBillingUrl)
  };
};
var paymentReceiptTemplate = (opts) => {
  const label = subscriptionLabel(opts?.productName, opts?.planName);
  const forLabel = label === "subscription" ? "your subscription" : `your ${label}`;
  const amount = opts?.amount ? ` of ${opts.amount}` : "";
  const when = opts?.paidOn ? ` on ${opts.paidOn}` : "";
  return {
    subject: `Your ${opts?.productName ? `${opts.productName} ` : ""}payment receipt`,
    html: layout("Thanks for your payment", `<p style="font-size:14px;line-height:24px;text-align:center">
      We received your payment${amount} for ${forLabel}${when}. No action is
      needed. This email is your receipt.
    </p>
    ${cta(opts?.manageBillingUrl, "View billing")}`, opts?.manageBillingUrl)
  };
};
var renewalReminderTemplate = (opts) => {
  const label = subscriptionLabel(opts?.productName, opts?.planName);
  const heading = label === "subscription" ? "Your subscription renews soon" : `Your ${label} renews soon`;
  const when = opts?.renewsOn ? ` on ${opts.renewsOn}` : " soon";
  const amount = opts?.amount ? ` for ${opts.amount}` : "";
  return {
    subject: heading,
    html: layout(heading, `<p style="font-size:14px;line-height:24px;text-align:center">
      Your ${label} will renew automatically${when}${amount}. No action is
      needed to stay subscribed. If your billing details have changed, you can
      update them now.
    </p>
    ${cta(opts?.manageBillingUrl, "Manage billing")}`, opts?.manageBillingUrl)
  };
};
var subscriptionCanceledTemplate = (opts) => {
  const label = subscriptionLabel(opts?.productName, opts?.planName);
  const ending = opts?.accessEndsAt ? `and access ends on ${opts.accessEndsAt}` : "and will not renew";
  const heading = label === "subscription" ? "Your subscription was canceled" : `Your ${label} was canceled`;
  return {
    subject: heading,
    html: layout(heading, `<p style="font-size:14px;line-height:24px;text-align:center">
      Your ${label} has been canceled ${ending}.
    </p>`)
  };
};
var spendWarningTemplate = (opts) => {
  const product = opts?.productName ? `${opts.productName} ` : "";
  const usedPhrase = opts?.percentUsed != null ? `used ${opts.percentUsed}% of` : "used most of";
  return {
    subject: `Heads up: approaching your ${product}spending limit`,
    html: layout("You're approaching your spending limit", `<p style="font-size:14px;line-height:24px;text-align:center">
      You've ${usedPhrase} your monthly ${product}spending limit. Once you reach it,
      metered usage is paused until the next billing period or you raise the limit.
    </p>
    ${cta(opts?.manageBillingUrl, "Review spending limit")}`, opts?.manageBillingUrl)
  };
};
var softLimitReachedTemplate = (opts) => {
  const product = opts?.productName ? `${opts.productName} ` : "";
  return {
    subject: `You've reached your ${product}spending alert threshold`,
    html: layout("You've reached your spending alert threshold", `<p style="font-size:14px;line-height:24px;text-align:center">
      Your ${product}usage has crossed the spending alert threshold you set. This is
      an alert only, your services keep running. You can review or adjust it any time.
    </p>
    ${cta(opts?.manageBillingUrl, "Review spending limit")}`, opts?.manageBillingUrl)
  };
};
var spendLimitReachedTemplate = (opts) => {
  const product = opts?.productName ? `${opts.productName} ` : "";
  return {
    subject: `Your ${product}spending limit was reached`,
    html: layout("Your spending limit was reached", `<p style="font-size:14px;line-height:24px;text-align:center">
      Your ${product}usage reached your monthly spending limit, so metered services
      have been paused to prevent further charges. Raise your limit to resume them.
    </p>
    ${cta(opts?.manageBillingUrl, "Raise spending limit")}`, opts?.manageBillingUrl)
  };
};
var creditsExhaustedTemplate = (opts) => {
  const product = opts?.productName ? `${opts.productName} ` : "";
  return {
    subject: `Your ${product}credits are used up`,
    html: layout("Your credits are used up", `<p style="font-size:14px;line-height:24px;text-align:center">
      You've used all of your included ${product}credits for this period. Add a
      payment method to keep your services running without interruption.
    </p>
    ${cta(opts?.manageBillingUrl, "Add payment method")}`, opts?.manageBillingUrl)
  };
};
var trialPausedTemplate = (opts) => {
  const product = opts?.productName ? `${opts.productName} ` : "";
  const grace = opts?.graceDays != null ? `Your data is kept for ${opts.graceDays} days.` : "Your data is kept safe in the meantime.";
  return {
    subject: `Your ${product}trial ended, add a card to resume`,
    html: layout("Your free trial ended", `<p style="font-size:14px;line-height:24px;text-align:center">
      Your ${product}trial has ended, so your apps have been paused. ${grace}
      Add a payment method to resume everything exactly as it was.
    </p>
    ${cta(opts?.manageBillingUrl, "Add a card to resume")}`, opts?.manageBillingUrl)
  };
};
var trialEndingTemplate = (opts) => {
  const label = subscriptionLabel(opts?.productName, opts?.planName);
  return {
    subject: `Your ${opts?.productName ? `${opts.productName} ` : ""}free trial is ending soon`,
    html: layout("Your free trial is ending soon", `<p style="font-size:14px;line-height:24px;text-align:center">
      Your ${label === "subscription" ? "free trial" : `${label} trial`}${opts?.trialEnd ? ` ends on ${opts.trialEnd}` : " is ending soon"}.
      Add or confirm a payment method to keep your subscription active.
    </p>
    ${cta(opts?.manageBillingUrl, "Confirm payment method")}`, opts?.manageBillingUrl)
  };
};
var overageChargeFailedTemplate = (opts) => {
  const product = opts?.productName ? `${opts.productName} ` : "";
  const amount = opts?.amount ? ` of ${opts.amount}` : "";
  return {
    subject: `Action required: your ${product}usage charge failed`,
    html: layout("We couldn't charge for your usage", `<p style="font-size:14px;line-height:24px;text-align:center">
      We were unable to collect the charge${amount} for your recent ${product}usage
      beyond your plan. To avoid your metered services being paused, please update
      your payment method.
    </p>
    ${cta(opts?.manageBillingUrl, "Update payment method")}`, opts?.manageBillingUrl)
  };
};
var creditPurchaseReceiptTemplate = (opts) => {
  const product = opts?.productName ? `${opts.productName} ` : "";
  const amount = opts?.amount ? ` of ${opts.amount}` : "";
  const credits = opts?.credits ? ` (${opts.credits})` : "";
  const when = opts?.paidOn ? ` on ${opts.paidOn}` : "";
  return {
    subject: `Your ${product}credit purchase receipt`,
    html: layout("Thanks for your purchase", `<p style="font-size:14px;line-height:24px;text-align:center">
      We received your payment${amount}${when} and added the ${product}credits${credits}
      to your account. No action is needed. This email is your receipt.
    </p>
    ${cta(opts?.manageBillingUrl, "View billing")}`, opts?.manageBillingUrl)
  };
};
export {
  creditPurchaseReceiptTemplate,
  creditsExhaustedTemplate,
  overageChargeFailedTemplate,
  paymentFailedTemplate,
  paymentReceiptTemplate,
  productNameFromAppId,
  renewalReminderTemplate,
  softLimitReachedTemplate,
  spendLimitReachedTemplate,
  spendWarningTemplate,
  subscriptionCanceledTemplate,
  trialEndingTemplate,
  trialPausedTemplate
};
