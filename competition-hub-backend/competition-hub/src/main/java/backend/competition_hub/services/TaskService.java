package backend.competition_hub.services;

import backend.competition_hub.dtos.ApplicationNotificationDTO;
import backend.competition_hub.entities.Task;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface TaskService {
    List<Task> getAllTasks();
    ResponseEntity<Task> getTaskById(Long id);
    Task createTask(Task task);
    ResponseEntity<Task> updateTask(Long id, Task updatedTask);
    ResponseEntity<Object> deleteTask(Long id);
    ResponseEntity<List<ApplicationNotificationDTO>> getTasksWithNewApplicationCounts(String creator);
    ResponseEntity<Object> touchView(Long id);
    ResponseEntity<Task> eliminateApplicants(Long taskId, List<String> eliminatedUsernames);
    ResponseEntity<Object> activateNextRound(Long taskId);
}