package backend.competition_hub.controllers;

import backend.competition_hub.dtos.ApplicationNotificationDTO;
import backend.competition_hub.entities.Task;
import backend.competition_hub.services.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
//@CrossOrigin(origins = "http://localhost:3000") // hogy a React hozzáférjen
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<Task> getAllTasks() {
        return taskService.getAllTasks();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return taskService.getTaskById(id);
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        return taskService.createTask(task);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task updatedTask) {
        return taskService.updateTask(id, updatedTask);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteTask(@PathVariable Long id) {
        return taskService.deleteTask(id);
    }

    @GetMapping("/notifications/{creator}")
    public ResponseEntity<List<ApplicationNotificationDTO>> getTasksWithNewApplicationCounts(@PathVariable String creator) {
        return taskService.getTasksWithNewApplicationCounts(creator);
    }

    @PutMapping("/{id}/touch-view")
    public ResponseEntity<Object> touchView(@PathVariable Long id) {
        return taskService.touchView(id);
    }

    @PutMapping("/{taskId}/eliminate-applicants")
    public ResponseEntity<Task> eliminateApplicants(@PathVariable Long taskId, @RequestBody List<String> eliminatedUsernames) {
        return taskService.eliminateApplicants(taskId, eliminatedUsernames);
    }

    @PutMapping("/{taskId}/activate-next")
    public ResponseEntity<Object> activateNextRound(@PathVariable Long taskId) {
        return taskService.activateNextRound(taskId);
    }

}