import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
  QueryKey,
} from '@tanstack/react-query';

export function useQueryCustom<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): UseQueryResult<TData, TError> {
  return useQuery({
    retry: false,
    refetchOnWindowFocus: false,
    ...options,
  });
}
