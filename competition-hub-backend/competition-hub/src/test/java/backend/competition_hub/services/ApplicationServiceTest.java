package backend.competition_hub.services;

import backend.competition_hub.entities.Task;
import backend.competition_hub.repositories.ApplicationRepository;
import backend.competition_hub.repositories.TaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private ApplicationServiceImpl applicationService;

    @Test
    void handleFileUpload_ShouldBlockEliminatedUser() {
        // --- GIVEN ---
        Long taskId = 1L;
        String bannedUser = "bannedUser123";

        Task task = new Task();
        // A usert felvesszük az elimináltak közé
        task.setEliminatedApplicants(Arrays.asList("otherUser", bannedUser));

        MultipartFile mockFile = mock(MultipartFile.class); // Kamu fájl
        when(mockFile.isEmpty()).thenReturn(false);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        // --- WHEN ---
        ResponseEntity<String> response = applicationService.handleFileUpload(
                taskId, mockFile, null, "uid", bannedUser
        );

        // --- THEN ---
        // Ellenőrizzük, hogy 403 Forbidden jött-e
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("Ezt a felhasználót a Task kiírója kizárta/elutasította a versenyből.", response.getBody());

        // BIZTONSÁGI ELLENŐRZÉS: A repository save metódusát SOHA nem hívhatja meg!
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void updateReview_ShouldFail_WhenPointsAreInvalid() {
        // --- GIVEN ---
        Long appId = 5L;

        Task task = new Task();
        task.setEvaluationType(backend.competition_hub.EvaluationType.POINTS);

        backend.competition_hub.entities.Application app = new backend.competition_hub.entities.Application();
        app.setTask(task);

        when(applicationRepository.findById(appId)).thenReturn(Optional.of(app));

        java.util.Map<String, String> body = new java.util.HashMap<>();
        body.put("points", "12");

        ResponseEntity<backend.competition_hub.entities.Application> response =
                applicationService.updateReview(appId, body);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());

        verify(applicationRepository, never()).save(any());
    }
}