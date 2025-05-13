package backend.competition_hub.controllers;

import backend.competition_hub.entities.Round;
import backend.competition_hub.entities.Task;
import backend.competition_hub.repositories.TaskRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
//@CrossOrigin(origins = "http://localhost:3000") // hogy a React hozzáférjen
public class TaskController {

    private final TaskRepository taskRepository;

    public TaskController(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @GetMapping
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return taskRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        if (task.getRounds() != null) {
            for (Round round : task.getRounds()) {
                round.setTask(task);
            }
        }
        return taskRepository.save(task);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task updatedTask) {
        return taskRepository.findById(id)
                .map(task -> {
                    task.setTitle(updatedTask.getTitle());
                    task.setDescription(updatedTask.getDescription());
                    task.setApplicationDeadline(updatedTask.getApplicationDeadline());
                    Task savedTask = taskRepository.save(task);
                    return ResponseEntity.ok(savedTask);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteTask(@PathVariable Long id) {
        return taskRepository.findById(id)
                .map(task -> {
                    taskRepository.delete(task);
                    return ResponseEntity.ok().build(); // Visszaadjuk a 200 OK választ
                })
                .orElseGet(() -> ResponseEntity.notFound().build()); // Ha nem találjuk, 404-et adunk
    }
}

