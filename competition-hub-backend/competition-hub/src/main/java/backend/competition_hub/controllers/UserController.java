package backend.competition_hub.controllers;

import backend.competition_hub.entities.Application;
import backend.competition_hub.entities.User;
import backend.competition_hub.repositories.ApplicationRepository;
import backend.competition_hub.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;

    public UserController(UserRepository userRepository, ApplicationRepository applicationRepository) {
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

//    @GetMapping("/applications/{username}")
//    public ResponseEntity<List<Application>> getUserApplicationsByUsername(@PathVariable String username) {
//        User user = userRepository.findByUsername(username);
//        if (user == null) {
//            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
//        }
//        List<Application> applications = applicationRepository.findByKeycloakUserId(user.getId());
//        return ResponseEntity.ok(applications);
//    }
}