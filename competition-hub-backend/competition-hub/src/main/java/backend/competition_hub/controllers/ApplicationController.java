package backend.competition_hub.controllers;

import backend.competition_hub.entities.Application;
import backend.competition_hub.entities.Round;
import backend.competition_hub.entities.Task;
import backend.competition_hub.repositories.ApplicationRepository;
import backend.competition_hub.repositories.TaskRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Date;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private static final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    private final ApplicationRepository applicationRepository;
    private final TaskRepository taskRepository;

    public ApplicationController(ApplicationRepository applicationRepository, TaskRepository taskRepository) {
        this.applicationRepository = applicationRepository;
        this.taskRepository = taskRepository;
    }

    @PostMapping("/{taskId}")
    public ResponseEntity<String> handleFileUpload(@PathVariable Long taskId,
                                                   @RequestParam("file") MultipartFile file,
                                                   @RequestParam("keycloakUserId") String keycloakUserId) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("No file uploaded.");
        }

        try {
            // Célkönyvtár létrehozása, ha nem létezik
            Path uploadPath = Paths.get(UPLOAD_DIR + taskId);
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

            // Application entitás létrehozása és mentése
            Application application = new Application();
            application.setTask(task);
            application.setKeycloakUserId(keycloakUserId);
            application.setFilePath(filePath.toString()); // Abszolút útvonal tárolása
            application.setApplicationDate(new Date());
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
                                                           @RequestParam("keycloakUserId") String keycloakUserId) {
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
            application.setFilePath(filePath.toString()); // Abszolút útvonal tárolása
            application.setApplicationDate(new Date());
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
    public ResponseEntity<Application> updateReview(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return applicationRepository.findById(id).map(app -> {
            app.setReview(body.get("review"));
            applicationRepository.save(app);
            return ResponseEntity.ok(app);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-user/{keycloakUserId}")
    public ResponseEntity<List<Application>> getApplicationsByUser(@PathVariable String keycloakUserId) {
        List<Application> apps = applicationRepository.findByKeycloakUserId(keycloakUserId);
        return ResponseEntity.ok(apps);
    }
}