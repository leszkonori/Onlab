package backend.competition_hub.controllers;

import backend.competition_hub.dtos.ApplicationNotificationDTO;
import backend.competition_hub.entities.Application;
import backend.competition_hub.entities.Round;
import backend.competition_hub.entities.Task;
import backend.competition_hub.repositories.ApplicationRepository;
import backend.competition_hub.repositories.RoundRepository;
import backend.competition_hub.repositories.TaskRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
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
        if (task.getRounds() != null && !task.getRounds().isEmpty()) {
            // biztosítsuk a determinisztikus sorrendet (pl. határidő szerint)
            task.getRounds().sort(Comparator.comparing(Round::getDeadline));
            for (int i = 0; i < task.getRounds().size(); i++) {
                Round round = task.getRounds().get(i);
                round.setTask(task);
                round.setIsActive(i == 0); // első aktív, a többi nem
            }
            // Ha vannak roundok, a Task.applicationDeadline mindegy is (nálad amúgy is
            // szinkronizálod a legrégebbi round-deadline-re @PrePersist/@PreUpdate-ben). :contentReference[oaicite:2]{index=2}
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

    // ÚJ VÉGPONT: Kiesett jelentkezők listájának frissítése
    @PutMapping("/{taskId}/eliminate-applicants")
    public ResponseEntity<Task> eliminateApplicants(@PathVariable Long taskId, @RequestBody List<String> eliminatedUsernames) {
        return taskRepository.findById(taskId)
                .map(task -> {
                    // Átadjuk az új listát a Task entitásnak
                    task.setEliminatedApplicants(eliminatedUsernames);
                    Task savedTask = taskRepository.save(task);
                    return ResponseEntity.ok(savedTask);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{taskId}/activate-next")
    public ResponseEntity<Object> activateNextRound(@PathVariable Long taskId) {
        return (ResponseEntity<Object>) taskRepository.findById(taskId).map(task -> {
            // roundok betöltése a taskhoz (ha nem lenne)
            List<Round> rounds = roundRepository.findByTaskId(taskId);
            if (rounds == null || rounds.isEmpty()) {
                return ResponseEntity.badRequest().body("No rounds for this task.");
            }

            // rendezzük deadline szerint
            rounds.sort(Comparator.comparing(Round::getDeadline));

            // aktuális aktív
            int activeIdx = -1;
            for (int i = 0; i < rounds.size(); i++) {
                if (rounds.get(i).getIsActive()) {
                    activeIdx = i;
                    break;
                }
            }
            if (activeIdx == -1) {
                return ResponseEntity.badRequest().body("No active round to advance from.");
            }

            Round current = rounds.get(activeIdx);
            // csak akkor engedjük a váltást, ha lejárt
            if (current.getDeadline() != null && !current.getDeadline().isBefore(LocalDate.now())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Current active round hasn't reached its deadline yet.");
            }

            if (activeIdx == rounds.size() - 1) {
                // nincs következő
                return ResponseEntity.status(HttpStatus.CONFLICT).body("No next round to activate.");
            }

            // Átváltás
            current.setIsActive(false);
            Round next = rounds.get(activeIdx + 1);
            next.setIsActive(true);
            roundRepository.save(current);
            roundRepository.save(next);

            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

}

