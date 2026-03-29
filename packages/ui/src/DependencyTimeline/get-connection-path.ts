export interface ConnectionPathInput {
	columnGap: number;
	columnPadding: number;
	columnWidth: number;
	dependencyIndex: number;
	dependencyTotal: number;
	fromColumnIndex: number;
	fromRowIndex: number;
	headerHeight: number;
	rowGap: number;
	rowHeight: number;
	toColumnIndex: number;
	toRowIndex: number;
}

const getPortOffset = (dependencyIndex: number, dependencyTotal: number) => {
	if (dependencyTotal <= 1) {
		return 0;
	}

	const middleIndex = (dependencyTotal - 1) / 2;

	return (dependencyIndex - middleIndex) * 18;
};

export const getConnectionPath = ({
	columnGap,
	columnPadding,
	columnWidth,
	dependencyIndex,
	dependencyTotal,
	fromColumnIndex,
	fromRowIndex,
	headerHeight,
	rowGap,
	rowHeight,
	toColumnIndex,
	toRowIndex,
}: ConnectionPathInput) => {
	const startX =
		fromColumnIndex * (columnWidth + columnGap) +
		columnPadding +
		(columnWidth - columnPadding * 2);
	const startY =
		headerHeight +
		fromRowIndex * (rowHeight + rowGap) +
		rowHeight / 2 +
		getPortOffset(dependencyIndex, dependencyTotal);
	const endX =
		toColumnIndex * (columnWidth + columnGap) + columnPadding;
	const endY =
		headerHeight +
		toRowIndex * (rowHeight + rowGap) +
		rowHeight / 2 +
		getPortOffset(dependencyIndex, dependencyTotal);
	const horizontalDistance = endX - startX;
	const bend = Math.max(horizontalDistance * 0.28, 44);
	const leadOutX = startX + bend;
	const leadInX = endX - bend;
	const laneOffset = Math.max(Math.abs(toRowIndex - fromRowIndex) * 20, 0);
	const controlY =
		fromRowIndex === toRowIndex
			? startY
			: startY < endY
				? startY + laneOffset
				: startY - laneOffset;

	return [
		`M ${startX} ${startY}`,
		`C ${leadOutX} ${controlY}, ${leadInX} ${endY}, ${endX} ${endY}`,
	].join(" ");
};
