import { Button } from "@repo/ui/Button";
import { KanbanBoard } from "@repo/ui/KanbanBoard";

export default function Home() {
	return (
		<div>
			<KanbanBoard />
			<Button intent="primary" size="medium" disabled>
				Hello World
			</Button>
		</div>
	);
}
