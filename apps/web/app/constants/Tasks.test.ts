import { describe, expect, it } from "vitest";
import { mockTasks, updateTaskColumn } from "./Tasks";

describe("updateTaskColumn", () => {
  it("moves only the targeted task to the new column", () => {
    const updatedTasks = updateTaskColumn(mockTasks, "1", "IN_DEVELOPMENT");

    expect(updatedTasks.find((task) => task.id === "1")?.column).toBe(
      "IN_DEVELOPMENT",
    );
    expect(updatedTasks.find((task) => task.id === "2")?.column).toBe(
      "IN_DEVELOPMENT",
    );
    expect(mockTasks.find((task) => task.id === "1")?.column).toBe(
      "READY_FOR_DEVELOPMENT",
    );
    expect(updatedTasks).not.toBe(mockTasks);
  });

  it("returns the same array when the task is missing", () => {
    const updatedTasks = updateTaskColumn(mockTasks, "missing", "RELEASED");

    expect(updatedTasks).toBe(mockTasks);
  });

  it("returns the same array when the task is already in the target column", () => {
    const updatedTasks = updateTaskColumn(
      mockTasks,
      "1",
      "READY_FOR_DEVELOPMENT",
    );

    expect(updatedTasks).toBe(mockTasks);
  });
});
