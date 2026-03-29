export interface QueryDescriptor<TInput, TOutput> {
	queryKey: (input: TInput) => readonly unknown[];
	queryFn: (input: TInput) => Promise<TOutput>;
}

export const createQueryDescriptor = <TInput, TOutput>(
	queryKey: (input: TInput) => readonly unknown[],
	queryFn: (input: TInput) => Promise<TOutput>,
): QueryDescriptor<TInput, TOutput> => ({
	queryKey,
	queryFn,
});
