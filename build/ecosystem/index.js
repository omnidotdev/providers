// src/ecosystem/arborConnection.ts
var createArborConnection = (config) => ({
  linkOut: (ownerHandle, repoSlug) => `${config.appUrl}/@${ownerHandle.replace(/^@/, "")}/${repoSlug}`
});
// src/ecosystem/broker.ts
var resolveSupportCheckout = async (conn, req) => {
  const creator = await conn.readCreator(req.slug);
  if (creator?.acceptsPayments && req.amountCents >= 100) {
    const checkout = await conn.createSupportCheckout({
      organizationId: creator.organizationId,
      amountCents: req.amountCents,
      successUrl: `${req.returnBase}?support=success`,
      cancelUrl: `${req.returnBase}?support=cancel`,
      email: req.email,
      message: req.message
    });
    if (checkout)
      return { url: checkout.url, brokered: true };
  }
  return { url: conn.linkOut(req.slug), brokered: false };
};
var resolveBuyCheckout = async (conn, req) => {
  const product = await conn.readProduct(req.productId);
  if (product?.active) {
    const checkout = await conn.createBuyCheckout({
      productId: product.productId,
      quantity: req.quantity ?? 1,
      email: req.email,
      successUrl: `${req.returnBase}?buy=success`,
      cancelUrl: `${req.returnBase}?buy=cancel`
    });
    if (checkout)
      return { url: checkout.url, brokered: true };
  }
  return { url: conn.linkOut(product?.storeDomain), brokered: false };
};
var resolveSubscribe = async (conn, req) => {
  if (!conn.configured)
    return { ok: false, configured: false };
  const result = await conn.subscribe({
    audienceId: req.audienceId,
    email: req.email
  });
  return { ok: result.ok, configured: true };
};
// src/ecosystem/coalesce.ts
var createCoalescer = () => {
  const inflight = new Map;
  return (key, fn) => {
    const existing = inflight.get(key);
    if (existing)
      return existing;
    const promise = fn().finally(() => inflight.delete(key));
    inflight.set(key, promise);
    return promise;
  };
};
// src/ecosystem/crystalConnection.ts
var createCrystalConnection = (config) => {
  const call = config.fetchImpl ?? fetch;
  return {
    configured: Boolean(config.apiUrl),
    linkOut: (slug) => `${config.appUrl}/@${slug}`,
    readCreator: async (slug) => {
      if (!config.apiUrl)
        return null;
      try {
        const res = await call(`${config.apiUrl}/creators/${encodeURIComponent(slug)}`);
        if (!res.ok)
          return null;
        const data = await res.json();
        const org = data.organization;
        if (!org)
          return null;
        return {
          organizationId: org.id,
          name: org.name,
          slug: org.slug,
          acceptsPayments: Boolean(org.acceptsPayments)
        };
      } catch {
        return null;
      }
    },
    createSupportCheckout: async (input) => {
      if (!config.apiUrl)
        return null;
      try {
        const res = await call(`${config.apiUrl}/checkout/donation`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input)
        });
        if (!res.ok)
          return null;
        const data = await res.json();
        return data.url ? { url: data.url } : null;
      } catch {
        return null;
      }
    }
  };
};
// src/ecosystem/haloConnection.ts
var PRODUCT_QUERY = `query Product($rowId: UUID!) {
  product(rowId: $rowId) { rowId title status store { domain } }
}`;
var QUICK_BUY = `mutation QuickBuy($input: QuickBuyCheckoutInput!) {
  quickBuyCheckout(input: $input) { checkoutUrl }
}`;
var createHaloConnection = (config) => {
  const request = config.request;
  const configured = Boolean(config.apiUrl && request);
  return {
    configured,
    linkOut: (storeDomain) => storeDomain ? `https://${storeDomain}` : config.storefrontBase,
    readProduct: async (productId) => {
      if (!request)
        return null;
      try {
        const data = await request(PRODUCT_QUERY, { rowId: productId });
        const product = data.product;
        if (!product)
          return null;
        return {
          productId: product.rowId,
          title: product.title,
          active: product.status === "active",
          storeDomain: product.store?.domain
        };
      } catch {
        return null;
      }
    },
    createBuyCheckout: async (input) => {
      if (!request)
        return null;
      try {
        const data = await request(QUICK_BUY, {
          input: {
            productId: input.productId,
            quantity: input.quantity,
            email: input.email,
            successUrl: input.successUrl,
            cancelUrl: input.cancelUrl
          }
        });
        const url = data.quickBuyCheckout?.checkoutUrl;
        return url ? { url } : null;
      } catch {
        return null;
      }
    }
  };
};
// src/ecosystem/heraldConnection.ts
var ADD_CONTACT = `mutation AddContact($input: AddContactInput!) {
  addContact(input: $input) { contact { id } }
}`;
var createHeraldConnection = (config) => {
  const request = config.request;
  const configured = Boolean(config.apiUrl && config.apiKey && request);
  return {
    configured,
    subscribe: async (input) => {
      if (!request || !configured)
        return { ok: false };
      try {
        const data = await request(ADD_CONTACT, {
          input: {
            audienceId: input.audienceId,
            address: input.email,
            attributes: input.attributes
          }
        });
        return { ok: Boolean(data.addContact?.contact?.id) };
      } catch {
        return { ok: false };
      }
    }
  };
};
// src/ecosystem/ttlCache.ts
var createTtlCache = (ttlMs, now = Date.now) => {
  const store = new Map;
  return {
    get(key) {
      const entry = store.get(key);
      if (!entry)
        return;
      if (now() > entry.expiresAt) {
        store.delete(key);
        return;
      }
      return entry.value;
    },
    set(key, value) {
      store.set(key, { value, expiresAt: now() + ttlMs });
    }
  };
};
// src/ecosystem/ttlReadCache.ts
var ECOSYSTEM_READ_TTL_MS = 45000;
var ECOSYSTEM_READ_NEGATIVE_TTL_MS = 1e4;
var ECOSYSTEM_READ_MAX_ENTRIES = 5000;
var createTtlReadCache = ({
  ttlMs = ECOSYSTEM_READ_TTL_MS,
  negativeTtlMs = ECOSYSTEM_READ_NEGATIVE_TTL_MS,
  maxEntries = ECOSYSTEM_READ_MAX_ENTRIES,
  now = Date.now
} = {}) => {
  const store = new Map;
  const evict = (nowMs) => {
    if (store.size <= maxEntries)
      return;
    for (const [key, entry] of store) {
      if (entry.expiresAt <= nowMs)
        store.delete(key);
    }
    while (store.size > maxEntries) {
      const oldest = store.keys().next().value;
      if (oldest === undefined)
        break;
      store.delete(oldest);
    }
  };
  return {
    read: async (key, load) => {
      const nowMs = now();
      const hit = store.get(key);
      if (hit) {
        if (hit.expiresAt > nowMs)
          return hit.value;
        store.delete(key);
      }
      const value = await load();
      const ttl = value === null ? negativeTtlMs : ttlMs;
      store.set(key, { value, expiresAt: now() + ttl });
      evict(now());
      return value;
    },
    clear: () => store.clear()
  };
};
export {
  ECOSYSTEM_READ_NEGATIVE_TTL_MS,
  ECOSYSTEM_READ_TTL_MS,
  createArborConnection,
  createCoalescer,
  createCrystalConnection,
  createHaloConnection,
  createHeraldConnection,
  createTtlCache,
  createTtlReadCache,
  resolveBuyCheckout,
  resolveSubscribe,
  resolveSupportCheckout
};
