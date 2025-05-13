package backend.competition_hub.controllers;

import backend.competition_hub.entities.Application;
import backend.competition_hub.entities.Task;
import backend.competition_hub.entities.User;
import backend.competition_hub.repositories.ApplicationRepository;
import backend.competition_hub.repositories.TaskRepository;
import backend.competition_hub.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.util.Date;


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
                                                   @RequestParam("file") MultipartFile file) {
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

            // Felhasználó lekérése a Principalból
//            String username = principal.getName();
//            User user = userRepository.findByUsername(username);
//            if (user == null) {
//                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found.");
//            }

            // Feladat lekérése az ID alapján
            Task task = taskRepository.findById(taskId).orElse(null);
            if (task == null) {
                return ResponseEntity.badRequest().body("Task not found.");
            }

            // Application entitás létrehozása és mentése
            Application application = new Application();
            application.setTask(task);
            //application.setUser(user);
            application.setUser(null);
            application.setFilePath(filePath.toString()); // Abszolút útvonal tárolása
            application.setApplicationDate(new Date());
            applicationRepository.save(application);

            return ResponseEntity.ok("File uploaded and application submitted successfully.");

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }
}