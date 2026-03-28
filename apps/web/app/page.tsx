import { Button } from "@repo/ui/Button";
import { KanbanBoard } from "./KanbanBoard";


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
