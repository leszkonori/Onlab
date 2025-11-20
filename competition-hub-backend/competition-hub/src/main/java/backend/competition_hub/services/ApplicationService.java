package backend.competition_hub.services;

import backend.competition_hub.dtos.ApplicationNotificationDTO;
import backend.competition_hub.dtos.RoundActivationNotificationDTO;
import backend.competition_hub.entities.Application;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface ApplicationService {
    ResponseEntity<String> handleFileUpload(Long taskId, MultipartFile file, Long roundId, String keycloakUserId, String keycloakUserName);
    ResponseEntity<String> handleFileUploadForRound(Long taskId, Long roundId, MultipartFile file, String keycloakUserId, String keycloakUserName);
    ResponseEntity<byte[]> downloadFile(Long applicationId);
    ResponseEntity<Application> updateReview(Long id, Map<String, String> body);
    ResponseEntity<List<Application>> getApplicationsByUser(String keycloakUserId);
    ResponseEntity<List<ApplicationNotificationDTO>> getReviewsWithNewCount(String username);
    ResponseEntity<Object> touchReviewView(Long taskId, String username);
    ResponseEntity<List<ApplicationNotificationDTO>> getUnseenEliminations(String username);
    ResponseEntity<Object> touchEliminationView(Long taskId, String username);
    List<RoundActivationNotificationDTO> listRoundActivationNotifications(String username);
    List<RoundActivationNotificationDTO> roundActivationNotifs(String username);
    void touchRoundActivationView(Long taskId, String username);
}