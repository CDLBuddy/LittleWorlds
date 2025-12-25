/**
 * Task System - toddler-friendly task chains
 */

export interface Task {
  id: string;
  name: string;
  description: string;
  icon: string;
  completed: boolean;
  dependencies: string[];
}

export class TaskSystem {
  private tasks = new Map<string, Task>();
  private completedTasks = new Set<string>();

  registerTask(task: Task): void {
    this.tasks.set(task.id, task);
  }

  completeTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.completed = true;
    this.completedTasks.add(taskId);
    
    console.log(`Task completed: ${task.name}`);
    // TODO: Trigger celebration, UI update
  }

  isTaskAvailable(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // Check if all dependencies are completed
    return task.dependencies.every((depId) => this.completedTasks.has(depId));
  }

  getAvailableTasks(): Task[] {
    return Array.from(this.tasks.values()).filter(
      (task) => !task.completed && this.isTaskAvailable(task.id)
    );
  }

  getCompletedTasks(): Task[] {
    return Array.from(this.tasks.values()).filter((task) => task.completed);
  }
}
