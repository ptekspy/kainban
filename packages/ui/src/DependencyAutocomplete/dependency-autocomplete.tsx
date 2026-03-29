"use client";

export interface DependencyOption {
	description?: string;
	id: string;
	label: string;
}

interface DependencyAutocompleteProps {
	onChange: (nextSelection: string[]) => void;
	options: DependencyOption[];
	placeholder?: string;
	search: string;
	selectedIds: string[];
	setSearch: (nextSearch: string) => void;
}

export const DependencyAutocomplete = ({
	onChange,
	options,
	placeholder = "Search dependencies",
	search,
	selectedIds,
	setSearch,
}: DependencyAutocompleteProps) => {
	const selectedOptions = options.filter((option) =>
		selectedIds.includes(option.id),
	);
	const availableOptions = options.filter(
		(option) =>
			!selectedIds.includes(option.id) &&
			option.label.toLowerCase().includes(search.trim().toLowerCase()),
	);

	return (
		<div>
			<input
				value={search}
				onChange={(event) => setSearch(event.target.value)}
				placeholder={placeholder}
				className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500"
			/>
			{selectedOptions.length > 0 ? (
				<div className="mt-3 flex flex-wrap gap-2">
					{selectedOptions.map((option) => (
						<button
							key={option.id}
							type="button"
							onClick={() =>
								onChange(
									selectedIds.filter((selectedId) => selectedId !== option.id),
								)
							}
							className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-900"
						>
							{option.id} x
						</button>
					))}
				</div>
			) : null}
			<div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
				{availableOptions.length > 0 ? (
					availableOptions.map((option) => (
						<button
							key={option.id}
							type="button"
							onClick={() => {
								onChange([...selectedIds, option.id]);
								setSearch("");
							}}
							className="block w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-cyan-200 hover:bg-cyan-50"
						>
							<p className="text-sm font-semibold text-slate-950">
								{option.id}
							</p>
							<p className="text-sm text-slate-600">{option.label}</p>
							{option.description ? (
								<p className="mt-1 text-xs text-slate-500">
									{option.description}
								</p>
							) : null}
						</button>
					))
				) : (
					<p className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
						No matching dependencies found.
					</p>
				)}
			</div>
		</div>
	);
};
