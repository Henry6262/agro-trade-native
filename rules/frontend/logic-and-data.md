# Hooks & Services Rules

## Hooks
- Encapsulate **all** business logic, derived data, and side effects.
- Use React Query (`@tanstack/react-query`) for server data: `useQuery`, `useMutation`.
- Accept plain arguments (e.g., filters) and return serialized data ready for components.
- Transform/format data inside hooks (e.g., `formattedPrice`, `formattedDate`).
- Compose Zustand selectors if the feature has a store.
- Maximum 100 lines per hook file.

### Example
```ts
import { useQuery } from '@tanstack/react-query';
import { tokenService } from '../service';
import { formatPrice } from '../utils';

export function useTokens(filters: TokenFilters) {
  const query = useQuery({
    queryKey: ['tokens', filters],
    queryFn: () => tokenService.fetchTokens(filters),
  });

  const tokens = useMemo(
    () => query.data?.map((token) => ({ ...token, formattedPrice: formatPrice(token.price) })) ?? [],
    [query.data]
  );

  return { ...query, tokens };
}
```

## Services
- Live in `service.ts` inside each feature folder.
- Responsible for API calls, business rules, and data validation.
- Use the shared API client: `import { apiClient } from '@/app/services/api/client';`
- Handle errors (throw typed errors or return discriminated unions).
- Maximum 200 lines; split per domain if necessary.

### Example
```ts
export const tokenService = {
  async fetchTokens(filters: TokenFilters) {
    const { data } = await apiClient.get<TokenResponse[]>('/tokens', { params: filters });
    return data;
  },
  async submitSelection(payload: TokenSelectionPayload) {
    await apiClient.post('/tokens/selection', payload);
  },
};
```

## Utilities
- Use `utils.ts` for pure helpers (formatters, calculators).
- Must be side-effect free.

## Networking
- All network requests go through the shared client (Axios/fetch) with interceptors for auth/logging.
- Do not import `fetch` directly in features.

## Error Handling
- Services convert HTTP errors to typed errors (`DomainError`).
- Hooks decide how to surface errors (toast, inline message) but components only receive status/handlers.
