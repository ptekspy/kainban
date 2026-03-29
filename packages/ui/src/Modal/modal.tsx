"use client";

import type { MouseEvent, ReactNode } from "react";

interface ModalProps {
	children: ReactNode;
	description?: string;
	isOpen: boolean;
	onClose: () => void;
	title: string;
}

export const Modal = ({
	children,
	description,
	isOpen,
	onClose,
	title,
}: ModalProps) => {
	if (!isOpen) {
		return null;
	}

	const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
		if (event.target === event.currentTarget) {
			onClose();
		}
	};

	return (
		<div
			aria-modal="true"
			role="dialog"
			aria-labelledby="modal-title"
			aria-describedby={description ? "modal-description" : undefined}
			className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
			onClick={handleBackdropClick}
		>
			<div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_32px_120px_rgba(15,23,42,0.28)]">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2
							id="modal-title"
							className="text-2xl font-semibold text-slate-950"
						>
							{title}
						</h2>
						{description ? (
							<p id="modal-description" className="mt-2 text-sm text-slate-600">
								{description}
							</p>
						) : null}
					</div>
					<button
						type="button"
						aria-label="Close modal"
						onClick={onClose}
						className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
					>
						Close
					</button>
				</div>
				<div className="mt-6">{children}</div>
			</div>
		</div>
	);
};
