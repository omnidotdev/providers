/**
 * Authorization request parameters for switching Omni accounts, passed to the
 * app's sign-in (`authClient.signIn.social({ provider: "omni", callbackURL,
 * additionalParams: switchAccountParams(hint) })`).
 *
 * Without a hint the identity provider shows its account picker (the accounts
 * signed in on this browser, or another one). With one it continues as the
 * named account without asking when that account is signed in on this
 * browser, and shows the picker otherwise. A hint is a remembered account's
 * `handle` (`useRememberedAccounts`), or an account's subject when following a
 * link made for that account
 * @param loginHint - Which account to switch to
 */
export declare const switchAccountParams: (loginHint?: string | null) => Record<string, string>;
