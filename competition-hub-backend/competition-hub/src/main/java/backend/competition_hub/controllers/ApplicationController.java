package backend.competition_hub.controllers;

import backend.competition_hub.dtos.ApplicationNotificationDTO;
import backend.competition_hub.dtos.RoundActivationNotificationDTO;
import backend.competition_hub.entities.Application;
import backend.competition_hub.services.ApplicationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping("/{taskId}")
    public ResponseEntity<String> handleFileUpload(
            @PathVariable Long taskId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "roundId", required = false) Long roundId,
            @RequestParam("keycloakUserId") String keycloakUserId,
            @RequestParam("keycloakUserName") String keycloakUserName) {

        return applicationService.handleFileUpload(taskId, file, roundId, keycloakUserId, keycloakUserName);
    }

    @PostMapping("/{taskId}/round/{roundId}")
    public ResponseEntity<String> handleFileUploadForRound(@PathVariable Long taskId,
                                                           @PathVariable Long roundId,
                                                           @RequestParam("file") MultipartFile file,
                                                           @RequestParam("keycloakUserId") String keycloakUserId,
                                                           @RequestParam("keycloakUserName") String keycloakUserName) {

        return applicationService.handleFileUploadForRound(taskId, roundId, file, keycloakUserId, keycloakUserName);
    }

    @GetMapping("/download/{applicationId}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long applicationId) {
        return applicationService.downloadFile(applicationId);
    }

    @PutMapping("/{id}/review")
    public ResponseEntity<Application> updateReview(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        return applicationService.updateReview(id, body);
    }


    @GetMapping("/by-user/{keycloakUserId}")
    public ResponseEntity<List<Application>> getApplicationsByUser(@PathVariable String keycloakUserId) {
        return applicationService.getApplicationsByUser(keycloakUserId);
    }

    @GetMapping("/notifications/{username}")
    public ResponseEntity<List<ApplicationNotificationDTO>> getReviewsWithNewCount(@PathVariable String username) {
        return applicationService.getReviewsWithNewCount(username);
    }

    @PutMapping("/tasks/{taskId}/touch-review-view/{username}")
    public ResponseEntity<Object> touchReviewView(@PathVariable Long taskId, @PathVariable String username) {
        return applicationService.touchReviewView(taskId, username);
    }

    @GetMapping("/elimination-notifications/{username}")
    public ResponseEntity<List<ApplicationNotificationDTO>> getUnseenEliminations(@PathVariable String username) {
        return applicationService.getUnseenEliminations(username);
    }

    @PutMapping("/tasks/{taskId}/touch-elimination-view/{username}")
    public ResponseEntity<Object> touchEliminationView(@PathVariable Long taskId, @PathVariable String username) {
        return applicationService.touchEliminationView(taskId, username);
    }

    @GetMapping("/round-activation-notifications/{username}")
    public List<RoundActivationNotificationDTO> roundActivationNotifs(@PathVariable String username) {
        return applicationService.roundActivationNotifs(username);
    }

    @PutMapping("/tasks/{taskId}/touch-round-activation-view/{username}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void touchRoundActivationView(@PathVariable Long taskId, @PathVariable String username) {
        applicationService.touchRoundActivationView(taskId, username);
    }
}