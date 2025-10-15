package backend.competition_hub.controllers;

import backend.competition_hub.dtos.ApplicationNotificationDTO;
import backend.competition_hub.entities.Application;
import backend.competition_hub.entities.Round;
import backend.competition_hub.entities.Task;
import backend.competition_hub.repositories.ApplicationRepository;
import backend.competition_hub.repositories.RoundRepository;
import backend.competition_hub.repositories.TaskRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collections;
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
                            round.setTask(task);
                            round.setApplications(Collections.emptyList());
                        }
                        roundRepository.saveAll(updatedTask.getRounds());
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

    // Módosított Metódus: Visszaadja a Taskok listáját és az új application-ök számát
    @GetMapping("/notifications/{creator}") // Kivehetjük a /{creator}-t, ha a Keycloak usernamet használjuk Service-ben (így könnyebb)
    public ResponseEntity<List<ApplicationNotificationDTO>> getTasksWithNewApplicationCounts(@PathVariable String creator) {

        List<Object[]> results = taskRepository.getTasksWithNewApplicationCount(creator);

        // Konvertáljuk az Object[] listát ApplicationNotificationDTO listává
        List<ApplicationNotificationDTO> notifications = results.stream()
                .map(result -> new ApplicationNotificationDTO(
                        ((Number) result[0]).longValue(),     // JAVÍTVA: Biztonságos casting Long-ra
                        (String) result[1],                   // Task Title
                        ((Number) result[2]).longValue()      // JAVÍTVA: Biztonságos casting Long-ra
                ))
                .toList();

        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{id}/touch-view")
    public ResponseEntity<Object> touchView(@PathVariable Long id) {
        return taskRepository.findById(id).map(task -> {
            task.setCreatorLastViewedAt(LocalDateTime.now());
            taskRepository.save(task);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}

