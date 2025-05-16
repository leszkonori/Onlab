package backend.competition_hub.controllers;

import backend.competition_hub.entities.Application;
import backend.competition_hub.entities.Round;
import backend.competition_hub.entities.Task;
import backend.competition_hub.repositories.ApplicationRepository;
import backend.competition_hub.repositories.RoundRepository;
import backend.competition_hub.repositories.TaskRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
//@CrossOrigin(origins = "http://localhost:3000") // hogy a React hozzáférjen
public class TaskController {

    private final TaskRepository taskRepository;
    private final RoundRepository roundRepository;
    private final ApplicationRepository applicationRepository;

    public TaskController(TaskRepository taskRepository, RoundRepository roundRepository, ApplicationRepository applicationRepository) {
        this.taskRepository = taskRepository;
        this.roundRepository = roundRepository;
        this.applicationRepository = applicationRepository;
    }

    @GetMapping
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return taskRepository.findById(id)
                .map(task -> {
                    List<Round> rounds = roundRepository.findByTaskId(id);
                    task.setRounds(rounds);

                    List<Application> applications = applicationRepository.findByTaskId(id); // Lekérjük az applications-t
                    task.setApplications(applications);
                    return ResponseEntity.ok(task);
                })
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
                    if (updatedTask.getRounds() != null) {
                        for (Round round : updatedTask.getRounds()) {
                            round.setTask(task);  // Újra összekapcsoljuk a taskot a rounddal
                        }
                        roundRepository.saveAll(updatedTask.getRounds()); // Mentjük a frissített roundokat
                    }

                    if (updatedTask.getApplications() != null) {
                        // Fontos: a task referenciát beállítjuk az alkalmazásokra is
                        updatedTask.getApplications().forEach(app -> app.setTask(task));
                        // Kiürítjük a régieket, majd hozzáadjuk az újak, így a review-k is frissülnek
                        task.getApplications().clear();
                        task.getApplications().addAll(updatedTask.getApplications());
                    }

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

