import { mutationOptions, queryOptions } from "@tanstack/react-query";

export const createQueryOptions = <TOutput>(
	queryKey: readonly unknown[],
	queryFn: () => Promise<TOutput>,
) =>
	queryOptions({
		queryKey,
		queryFn,
	});

export const createParameterizedQueryOptions = <TInput, TOutput>(
	queryKey: (input: TInput) => readonly unknown[],
	queryFn: (input: TInput) => Promise<TOutput>,
) => {
	return (input: TInput) =>
		queryOptions({
			queryKey: queryKey(input),
			queryFn: () => queryFn(input),
		});
};

export const createMutationOptions = <TInput, TOutput>(
	mutationKey: readonly unknown[],
	mutationFn: (input: TInput) => Promise<TOutput>,
) =>
	mutationOptions({
		mutationKey,
		mutationFn,
	});
