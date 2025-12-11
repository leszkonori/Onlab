package backend.competition_hub.services;

import backend.competition_hub.EvaluationType;
import backend.competition_hub.dtos.ApplicationNotificationDTO;
import backend.competition_hub.dtos.RoundActivationNotificationDTO;
import backend.competition_hub.entities.Application;
import backend.competition_hub.entities.Round;
import backend.competition_hub.entities.Task;
import backend.competition_hub.repositories.ApplicationRepository;
import backend.competition_hub.repositories.TaskRepository;
import backend.competition_hub.services.ApplicationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ApplicationServiceImpl implements ApplicationService {

    private static final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    private final ApplicationRepository applicationRepository;
    private final TaskRepository taskRepository;

    public ApplicationServiceImpl(ApplicationRepository applicationRepository, TaskRepository taskRepository) {
        this.applicationRepository = applicationRepository;
        this.taskRepository = taskRepository;
    }

    @Override
    @Transactional
    public ResponseEntity<String> handleFileUpload(Long taskId, MultipartFile file, Long roundId, String keycloakUserId, String keycloakUserName) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("No file uploaded.");
        }

        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return ResponseEntity.badRequest().body("Task not found.");
        }

        if (task.getEliminatedApplicants() != null && task.getEliminatedApplicants().contains(keycloakUserName)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Ezt a felhasználót a Task kiírója kizárta/elutasította a versenyből.");
        }

        Round targetRound = null;
        if (roundId != null) {
            if (task.getRounds() == null) {
                return ResponseEntity.badRequest().body("Round not found in this Task.");
            }
            targetRound = task.getRounds().stream()
                    .filter(r -> r.getId().equals(roundId))
                    .findFirst()
                    .orElse(null);

            if (targetRound == null) {
                return ResponseEntity.badRequest().body("Round not found in this Task.");
            }

            if (targetRound.getDeadline().isBefore(LocalDate.now())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("A kiválasztott forduló beküldési határideje lejárt.");
            }

            if (!targetRound.getIsActive()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Csak az aktív fordulóba lehet beküldeni.");
            }
        }

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR + taskId);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String filename = keycloakUserName + (roundId != null ? "_R" + roundId : "") + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(filename);
            file.transferTo(filePath.toFile());

            Application application = new Application();
            application.setTask(task);
            application.setKeycloakUserId(keycloakUserId);
            application.setKeycloakUserName(keycloakUserName);
            application.setFilePath(filePath.toString());
            application.setApplicationDate(LocalDateTime.now());
            application.setRound(targetRound);
            applicationRepository.save(application);

            return ResponseEntity.ok("File uploaded and application submitted successfully.");

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ResponseEntity<String> handleFileUploadForRound(Long taskId, Long roundId, MultipartFile file, String keycloakUserId, String keycloakUserName) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("No file uploaded.");
        }

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR + taskId + "/round_" + roundId);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(file.getOriginalFilename());
            file.transferTo(filePath.toFile());

            Task task = taskRepository.findById(taskId).orElse(null);
            if (task == null) {
                return ResponseEntity.badRequest().body("Task not found.");
            }

            Round round = task.getRounds().stream()
                    .filter(r -> r.getId().equals(roundId))
                    .findFirst()
                    .orElse(null);

            if (round == null) {
                return ResponseEntity.badRequest().body("Round not found in this Task.");
            }

            if (!round.getIsActive()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Csak az aktív fordulóba lehet beküldeni.");
            }

            Application application = new Application();
            application.setRound(round);
            application.setTask(round.getTask());
            application.setKeycloakUserId(keycloakUserId);
            application.setKeycloakUserName(keycloakUserName);
            application.setFilePath(filePath.toString());
            application.setApplicationDate(LocalDateTime.now());
            applicationRepository.save(application);

            return ResponseEntity.ok("File uploaded and application submitted successfully.");

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<byte[]> downloadFile(Long applicationId) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Path filePath = Paths.get(application.getFilePath());
        if (!Files.exists(filePath)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        try {
            byte[] fileBytes = Files.readAllBytes(filePath);
            String fileName = filePath.getFileName().toString();

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + fileName + "\"")
                    .header("Content-Type", "application/octet-stream")
                    .body(fileBytes);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @Override
    @Transactional
    public ResponseEntity<Application> updateReview(
            Long id,
            Map<String, String> body) {

        return applicationRepository.findById(id).map(app -> {
            Task task = null;
            if (app.getTask() != null) {
                task = app.getTask();
            } else if (app.getRound() != null && app.getRound().getTask() != null) {
                task = app.getRound().getTask();
            }
            if (task == null) {
                return ResponseEntity.badRequest().<Application>build();
            }

            EvaluationType et = task.getEvaluationType();

            String text = body.getOrDefault("text", body.get("review"));
            String pointsStr = body.get("points");
            Integer points = null;
            if (pointsStr != null && !pointsStr.isBlank()) {
                try {
                    points = Integer.valueOf(pointsStr);
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest().<Application>build();
                }
            }

            switch (et) {
                case TEXT:
                    app.setReviewText((text != null && !text.isBlank()) ? text : null);
                    app.setReviewPoints(null);
                    break;

                case BOTH:
                    if (points != null && (points < 0 || points > 10)) {
                        return ResponseEntity.badRequest().<Application>build();
                    }
                    app.setReviewText((text != null && !text.isBlank()) ? text : null);
                    app.setReviewPoints(points);
                    break;

                case POINTS:
                    if (points == null || points < 0 || points > 10) {
                        return ResponseEntity.badRequest().<Application>build();
                    }
                    app.setReviewText(null);
                    app.setReviewPoints(points);
                    break;

            }

            app.setReviewCreatedAt(LocalDateTime.now());
            applicationRepository.save(app);
            return ResponseEntity.ok(app);
        }).orElse(ResponseEntity.notFound().<Application>build());
    }


    @Override
    public ResponseEntity<List<Application>> getApplicationsByUser(String keycloakUserId) {
        List<Application> apps = applicationRepository.findByKeycloakUserId(keycloakUserId);
        return ResponseEntity.ok(apps);
    }

    @Override
    public ResponseEntity<List<ApplicationNotificationDTO>> getReviewsWithNewCount(String username) {
        List<Object[]> results = applicationRepository.getTasksWithNewReviewCount(username);

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
    public ResponseEntity<Object> touchReviewView(Long taskId, String username) {
        List<Application> applications = applicationRepository.findByTaskIdAndKeycloakUserName(taskId, username);

        if (applications.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        LocalDateTime now = LocalDateTime.now();
        applications.forEach(app -> {
            app.setApplicantLastViewedReviewAt(now);
        });

        applicationRepository.saveAll(applications);
        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<List<ApplicationNotificationDTO>> getUnseenEliminations(String username) {
        List<Object[]> rows = applicationRepository.getTasksWithUnseenElimination(username);
        List<ApplicationNotificationDTO> notifications = rows.stream()
                .map(r -> new ApplicationNotificationDTO(
                        ((Number) r[0]).longValue(),
                        (String) r[1],
                        ((Number) r[2]).longValue()))
                .toList();
        return ResponseEntity.ok(notifications);
    }

    @Override
    @Transactional
    public ResponseEntity<Object> touchEliminationView(Long taskId, String username) {
        applicationRepository.markEliminationSeen(username, taskId);
        return ResponseEntity.ok().build();
    }

    @Override
    public List<RoundActivationNotificationDTO> listRoundActivationNotifications(String username) {
        List<Application> apps = applicationRepository.findByKeycloakUserName(username);
        Instant epoch = Instant.EPOCH;

        return apps.stream()
                .filter(app -> {
                    Task t = app.getTask();
                    return !t.getEliminatedApplicants().contains(username);
                })
                .map(app -> {
                    Task t = app.getTask();
                    Instant lastActivated = t.getRounds() != null ? t.getRounds().stream()
                            .map(Round::getActivatedAt)
                            .filter(Objects::nonNull)
                            .max(Comparator.naturalOrder())
                            .orElse(null) : null;

                    if (lastActivated == null) return null;

                    Instant lastSeen = Optional.ofNullable(app.getLastRoundActivationViewAt()).orElse(epoch);

                    if (lastActivated.isAfter(lastSeen)) {
                        return new RoundActivationNotificationDTO(t.getId(), t.getTitle());
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .toList();
    }

    @Override
    public List<RoundActivationNotificationDTO> roundActivationNotifs(String username) {
        return listRoundActivationNotifications(username);
    }

    @Override
    @Transactional
    public void touchRoundActivationView(Long taskId, String username) {
        List<Application> applications = applicationRepository.findByTaskIdAndKeycloakUserName(taskId, username);
        if (applications.isEmpty()) {
            return;
        }

        applications.forEach(app -> {
            app.setLastRoundActivationViewAt(Instant.now());
        });
        applicationRepository.saveAll(applications);
    }
}