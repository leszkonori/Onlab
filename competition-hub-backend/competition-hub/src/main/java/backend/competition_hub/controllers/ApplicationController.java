package backend.competition_hub.controllers;

import backend.competition_hub.EvaluationType;
import backend.competition_hub.dtos.ApplicationNotificationDTO;
import backend.competition_hub.entities.Application;
import backend.competition_hub.entities.Round;
import backend.competition_hub.entities.Task;
import backend.competition_hub.repositories.ApplicationRepository;
import backend.competition_hub.repositories.TaskRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private static final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    private final ApplicationRepository applicationRepository;
    private final TaskRepository taskRepository;

    public static class ReviewDto {
        public String text;     // opcionális
        public Integer points;  // opcionális, 0..10
    }

    public ApplicationController(ApplicationRepository applicationRepository, TaskRepository taskRepository) {
        this.applicationRepository = applicationRepository;
        this.taskRepository = taskRepository;
    }

    // MÓDOSÍTOTT VÉGPONT: Beküldés (hozzáadva a roundId, eliminációs és határidő ellenőrzés)
    @PostMapping("/{taskId}")
    public ResponseEntity<String> handleFileUpload(
            @PathVariable Long taskId,
            @RequestParam("file") MultipartFile file,
            // ÚJ: Opcionális roundId
            @RequestParam(value = "roundId", required = false) Long roundId,
            @RequestParam("keycloakUserId") String keycloakUserId,
            @RequestParam("keycloakUserName") String keycloakUserName) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("No file uploaded.");
        }

        // Feladat lekérése az ID alapján
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return ResponseEntity.badRequest().body("Task not found.");
        }

        // 1. ELLENŐRZÉS: Kiesett-e a felhasználó?
        if (task.getEliminatedApplicants() != null && task.getEliminatedApplicants().contains(keycloakUserName)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Ezt a felhasználót a Task kiírója kizárta/elutasította a versenyből.");
        }

        Round targetRound = null;
        if (roundId != null) {
            // 2. ELLENŐRZÉS: Round keresése a Task.rounds listában (Task entitáson keresztül)
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

            // 3. ELLENŐRZÉS: Határidő lejárt-e?
            if (targetRound.getDeadline().isBefore(LocalDate.now())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("A kiválasztott forduló beküldési határideje lejárt.");
            }
        }

        try {
            // ... (Fájl mentési logika változatlan) ...
            Path uploadPath = Paths.get(UPLOAD_DIR + taskId);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Fájl mentése (javasolt a keycloak username bevonása a fájlnévbe a duplikáció elkerülése érdekében)
            String filename = keycloakUserName + (roundId != null ? "_R" + roundId : "") + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(filename);
            file.transferTo(filePath.toFile());

            // Application entitás létrehozása és mentése
            Application application = new Application();
            application.setTask(task);
            application.setKeycloakUserId(keycloakUserId);
            application.setKeycloakUserName(keycloakUserName);
            application.setFilePath(filePath.toString());
            application.setApplicationDate(LocalDateTime.now());
            application.setRound(targetRound); // Kapcsolás a Round-hoz (ha van)
            applicationRepository.save(application);

            return ResponseEntity.ok("File uploaded and application submitted successfully.");

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    @PostMapping("/{taskId}/round/{roundId}")
    public ResponseEntity<String> handleFileUploadForRound(@PathVariable Long taskId,
                                                           @PathVariable Long roundId,
                                                           @RequestParam("file") MultipartFile file,
                                                           @RequestParam("keycloakUserId") String keycloakUserId,
                                                           @RequestParam("keycloakUserName") String keycloakUserName) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("No file uploaded.");
        }

        try {
            // Célkönyvtár létrehozása, ha nem létezik
            Path uploadPath = Paths.get(UPLOAD_DIR + taskId + "/round_" + roundId);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Fájl mentése
            Path filePath = uploadPath.resolve(file.getOriginalFilename());
            file.transferTo(filePath.toFile());

            // Feladat lekérése az ID alapján
            Task task = taskRepository.findById(taskId).orElse(null);
            if (task == null) {
                return ResponseEntity.badRequest().body("Task not found.");
            }

            // Round kiválasztása a Task alapján
            Round round = task.getRounds().stream()
                    .filter(r -> r.getId().equals(roundId))
                    .findFirst()
                    .orElse(null);

            if (round == null) {
                return ResponseEntity.badRequest().body("Round not found in this Task.");
            }

            // Application entitás létrehozása és mentése
            Application application = new Application();
            application.setRound(round);
            application.setTask(round.getTask());
            application.setKeycloakUserId(keycloakUserId);
            application.setKeycloakUserName(keycloakUserName);
            application.setFilePath(filePath.toString()); // Abszolút útvonal tárolása
            application.setApplicationDate(LocalDateTime.now());
            applicationRepository.save(application);

            return ResponseEntity.ok("File uploaded and application submitted successfully.");

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping("/download/{applicationId}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long applicationId) {
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

    @PutMapping("/{id}/review")
    public ResponseEntity<Application> updateReview(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        return applicationRepository.findById(id).map(app -> {
            // Task felkutatása (közvetlenül vagy round-on keresztül)
            Task task = null;
            if (app.getTask() != null) {
                task = app.getTask();
            } else if (app.getRound() != null && app.getRound().getTask() != null) {
                task = app.getRound().getTask();
            }
            if (task == null) {
                return ResponseEntity.badRequest().<Application>build();
            }

            EvaluationType et = task.getEvaluationType(); // TEXT | POINTS | BOTH (esetleg NUMERIC régről)

            // Kivesszük a bejövő értékeket (visszafelé kompatibilitás: "review" -> text)
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
                    // csak szöveg
                    app.setReviewText((text != null && !text.isBlank()) ? text : null);
                    app.setReviewPoints(null);
                    break;

                case BOTH:
                    // szöveg opcionális, pont opcionális (0..10, ha meg van adva)
                    if (points != null && (points < 0 || points > 10)) {
                        return ResponseEntity.badRequest().<Application>build();
                    }
                    app.setReviewText((text != null && !text.isBlank()) ? text : null);
                    app.setReviewPoints(points);
                    break;

                case POINTS:
                    // csak pont kötelező, 0..10
                    if (points == null || points < 0 || points > 10) {
                        return ResponseEntity.badRequest().<Application>build();
                    }
                    app.setReviewText(null);
                    app.setReviewPoints(points);
                    break;

            }

            applicationRepository.save(app);
            return ResponseEntity.ok(app);
        }).orElse(ResponseEntity.notFound().<Application>build());
    }


    @GetMapping("/by-user/{keycloakUserId}")
    public ResponseEntity<List<Application>> getApplicationsByUser(@PathVariable String keycloakUserId) {
        List<Application> apps = applicationRepository.findByKeycloakUserId(keycloakUserId);
        return ResponseEntity.ok(apps);
    }

    // ÚJ VÉGPONT: Jelentkező értesítései (Review-k)
    @GetMapping("/notifications/{username}")
    public ResponseEntity<List<ApplicationNotificationDTO>> getReviewsWithNewCount(@PathVariable String username) {

        List<Object[]> results = applicationRepository.getTasksWithNewReviewCount(username);

        List<ApplicationNotificationDTO> notifications = results.stream()
                .map(result -> new ApplicationNotificationDTO(
                        ((Number) result[0]).longValue(),     // Task ID
                        (String) result[1],                   // Task Title
                        ((Number) result[2]).longValue()      // New Reviews Count
                ))
                .toList();

        return ResponseEntity.ok(notifications);
    }

    // ÚJ VÉGPONT: Értesítés eltüntetése (Amikor a user megnézi a Task oldalt)
    @PutMapping("/tasks/{taskId}/touch-review-view/{username}")
    public ResponseEntity<Object> touchReviewView(@PathVariable Long taskId, @PathVariable String username) {

        // Megkeressük az összes Application-t a Task-hoz, amit ez a user küldött
        List<Application> applications = applicationRepository.findByTaskIdAndKeycloakUserName(taskId, username);

        if (applications.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        LocalDateTime now = LocalDateTime.now();
        // Frissítjük a nézettség időpontját mindegyik Application-höz
        applications.forEach(app -> {
            app.setApplicantLastViewedReviewAt(now);
        });

        applicationRepository.saveAll(applications);

        return ResponseEntity.ok().build();
    }
}