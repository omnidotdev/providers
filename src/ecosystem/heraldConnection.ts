import type { GraphqlRequest } from "./haloConnection";

export interface HeraldSubscribeInput {
  audienceId: string;
  email: string;
  attributes?: Record<string, unknown>;
}

export interface HeraldConfig {
  apiUrl?: string;
  apiKey?: string;
  request?: GraphqlRequest;
}

export interface HeraldConnection {
  configured: boolean;
  subscribe(input: HeraldSubscribeInput): Promise<{ ok: boolean }>;
}

const ADD_CONTACT = `mutation AddContact($input: AddContactInput!) {
  addContact(input: $input) { contact { id } }
}`;

/**
 * Herald (email) connection. Unlike buy/support there is no anonymous subscribe
 * endpoint and no meaningful link-out, so email capture is only functional when
 * configured with a tenant API key. When unconfigured `subscribe` returns
 * `{ ok: false }` so the block reports honestly rather than silently dropping an
 * address (never a silent data loss).
 */
export const createHeraldConnection = (
  config: HeraldConfig,
): HeraldConnection => {
  const request = config.request;
  const configured = Boolean(config.apiUrl && config.apiKey && request);

  return {
    configured,

    subscribe: async (input) => {
      if (!request || !configured) return { ok: false };

      try {
        const data = await request<{
          addContact?: { contact?: { id?: string } };
        }>(ADD_CONTACT, {
          input: {
            audienceId: input.audienceId,
            address: input.email,
            attributes: input.attributes,
          },
        });

        return { ok: Boolean(data.addContact?.contact?.id) };
      } catch {
        return { ok: false };
      }
    },
  };
};
