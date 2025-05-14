package backend.competition_hub.controllers;

import backend.competition_hub.entities.Application;
import backend.competition_hub.entities.Task;
import backend.competition_hub.entities.User;
import backend.competition_hub.repositories.ApplicationRepository;
import backend.competition_hub.repositories.TaskRepository;
import backend.competition_hub.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.util.Date;
import java.util.Map;


@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private static final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    private final ApplicationRepository applicationRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public ApplicationController(ApplicationRepository applicationRepository, TaskRepository taskRepository, UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/{taskId}")
    public ResponseEntity<String> handleFileUpload(@PathVariable Long taskId,
                                                   @RequestParam("file") MultipartFile file,
                                                   @AuthenticationPrincipal Jwt jwt) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("No file uploaded.");
        }

        String keycloakId = jwt.getSubject(); // Keycloak user ID (sub)
        String username = jwt.getClaimAsString("preferred_username");

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR + taskId);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(file.getOriginalFilename());
            file.transferTo(filePath.toFile());

            Task task = taskRepository.findById(taskId).orElse(null);
            if (task == null) {
                return ResponseEntity.badRequest().body("Task not found.");
            }

            // 👤 Felhasználó kezelése
            User user = userRepository.findByKeycloakId(keycloakId);
            if (user == null) {
                // Ha a felhasználó nem létezik, új felhasználót hozunk létre
                user = new User();
                user.setKeycloakId(keycloakId);
                user.setUsername(username);
                user.setEmail(jwt.getClaimAsString("email")); // Email is kinyerhető, ha kell
                userRepository.save(user);
            }

            // 📄 Jelentkezés mentése
            Application application = new Application();
            application.setTask(task);
            application.setUser(user);
            application.setFilePath(filePath.toString());
            application.setApplicationDate(new Date());
            applicationRepository.save(application);

            return ResponseEntity.ok("File uploaded and application submitted successfully.");

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
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
}