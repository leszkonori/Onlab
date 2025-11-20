package backend.competition_hub.services;

import backend.competition_hub.dtos.ApplicationNotificationDTO;
import backend.competition_hub.entities.Application;
import backend.competition_hub.entities.Round;
import backend.competition_hub.entities.Task;
import backend.competition_hub.repositories.ApplicationRepository;
import backend.competition_hub.repositories.RoundRepository;
import backend.competition_hub.repositories.TaskRepository;
import backend.competition_hub.services.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Service
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final RoundRepository roundRepository;
    private final ApplicationRepository applicationRepository;

    public TaskServiceImpl(TaskRepository taskRepository, RoundRepository roundRepository, ApplicationRepository applicationRepository) {
        this.taskRepository = taskRepository;
        this.roundRepository = roundRepository;
        this.applicationRepository = applicationRepository;
    }

    @Override
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @Override
    public ResponseEntity<Task> getTaskById(Long id) {
        return taskRepository.findById(id)
                .map(task -> {
                    List<Round> rounds = roundRepository.findByTaskId(id);
                    task.setRounds(rounds);

                    List<Application> applications = applicationRepository.findByTaskId(id);
                    task.setApplications(applications);
                    return ResponseEntity.ok(task);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Override
    @Transactional
    public Task createTask(Task task) {
        if (task.getRounds() != null && !task.getRounds().isEmpty()) {
            // biztosítsuk a determinisztikus sorrendet (pl. határidő szerint)
            task.getRounds().sort(Comparator.comparing(Round::getDeadline));
            for (int i = 0; i < task.getRounds().size(); i++) {
                Round round = task.getRounds().get(i);
                round.setTask(task);
                round.setIsActive(i == 0); // első aktív, a többi nem
            }
        }
        return taskRepository.save(task);
    }

    @Override
    @Transactional
    public ResponseEntity<Task> updateTask(Long id, Task updatedTask) {
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

    @Override
    public ResponseEntity<Object> deleteTask(Long id) {
        return taskRepository.findById(id)
                .map(task -> {
                    taskRepository.delete(task);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Override
    public ResponseEntity<List<ApplicationNotificationDTO>> getTasksWithNewApplicationCounts(String creator) {
        List<Object[]> results = taskRepository.getTasksWithNewApplicationCount(creator);

        // Konvertáljuk az Object[] listát ApplicationNotificationDTO listává
        List<ApplicationNotificationDTO> notifications = results.stream()
                .map(result -> new ApplicationNotificationDTO(
                        ((Number) result[0]).longValue(),
                        (String) result[1],
                        ((Number) result[2]).longValue()
                ))
                .toList();

        return ResponseEntity.ok(notifications);
    }

    @Override
    @Transactional
    public ResponseEntity<Object> touchView(Long id) {
        return taskRepository.findById(id).map(task -> {
            task.setCreatorLastViewedAt(LocalDateTime.now());
            taskRepository.save(task);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @Override
    @Transactional
    public ResponseEntity<Task> eliminateApplicants(Long taskId, List<String> eliminatedUsernames) {
        return taskRepository.findById(taskId)
                .map(task -> {
                    // Átadjuk az új listát a Task entitásnak
                    task.setEliminatedApplicants(eliminatedUsernames);
                    Task savedTask = taskRepository.save(task);
                    return ResponseEntity.ok(savedTask);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Override
    @Transactional
    public ResponseEntity<Object> activateNextRound(Long taskId) {
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
            current.setActivatedAt(Instant.now());
            Round next = rounds.get(activeIdx + 1);
            next.setIsActive(true);
            roundRepository.save(current);
            roundRepository.save(next);

            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}