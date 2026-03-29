"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, FC } from "react";
import { colours } from "../style/definition";

const button = cva("button rounded-2xl", {
	variants: {
		intent: {
			primary: [
				colours.primary.background,
				colours.primary.text,
				colours.primary.border,
				colours.primary.hover,
			],
			secondary: [
				colours.secondary.background,
				colours.secondary.text,
				colours.secondary.border,
				colours.secondary.hover,
			],
		},
		size: {
			small: ["text-sm", "py-1", "px-2"],
			medium: ["text-base", "py-2", "px-4"],
		},
		disabled: {
			false: null,
			true: [
				colours.disabled.background,
				colours.disabled.text,
				colours.disabled.border,
				colours.disabled.hover,
				"cursor-not-allowed",
			],
		},
	},
	defaultVariants: {
		disabled: false,
		intent: "primary",
		size: "medium",
	},
});

export interface ButtonProps
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled">,
		VariantProps<typeof button> {}

export const Button: FC<ButtonProps> = ({
	className,
	intent,
	size,
	disabled,
	...props
}) => (
	<button
		className={button({ intent, size, disabled, className })}
		disabled={disabled || undefined}
		{...props}
	/>
);
