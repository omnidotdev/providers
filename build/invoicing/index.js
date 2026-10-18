// src/invoicing/index.ts
var CREDIT_TRANSACTION_KINDS = [
  "overpayment",
  "creditNote",
  "application",
  "adjustment",
  "void"
];
var PAYMENT_EVENT_SUFFIXES = [
  "payment.created",
  "payment.updated",
  "payment.deleted"
];
var CREDIT_EVENT_SUFFIXES = [
  "credit.issued",
  "credit.applied",
  "credit.voided"
];
var invoicingEventType = (product, suffix) => `${product}.${suffix}`;
var toCents = (value) => {
  if (value === null || value === undefined)
    return null;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(n))
    return null;
  return Math.round(n * 100);
};
var fromCents = (cents) => (cents / 100).toFixed(2);
var outstandingCents = (totalCents, paidCents, appliedCreditCents = 0) => totalCents - paidCents - appliedCreditCents;
var isSettled = (totalCents, paidCents, appliedCreditCents = 0) => totalCents > 0 && paidCents + appliedCreditCents >= totalCents;
export {
  CREDIT_EVENT_SUFFIXES,
  CREDIT_TRANSACTION_KINDS,
  PAYMENT_EVENT_SUFFIXES,
  fromCents,
  invoicingEventType,
  isSettled,
  outstandingCents,
  toCents
};
