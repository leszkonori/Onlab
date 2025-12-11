package backend.competition_hub.services;

import backend.competition_hub.entities.Round;
import backend.competition_hub.entities.Task;
import backend.competition_hub.repositories.RoundRepository;
import backend.competition_hub.repositories.TaskRepository;
import backend.competition_hub.repositories.ApplicationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private RoundRepository roundRepository;
    @Mock
    private ApplicationRepository applicationRepository;

    @InjectMocks
    private TaskServiceImpl taskService;

    @Test
    void createTask_ShouldSetFirstRoundActive() {
        Task task = new Task();
        task.setTitle("Teszt Feladat");

        // Hozzáadunk 2 fordulót
        List<Round> rounds = new ArrayList<>();
        Round r1 = new Round(); r1.setDeadline(LocalDate.of(2025, 10, 10));
        Round r2 = new Round(); r2.setDeadline(LocalDate.of(2025, 11, 10));
        rounds.add(r1);
        rounds.add(r2);
        task.setRounds(rounds);

        when(taskRepository.save(any(Task.class))).thenReturn(task);

        Task createdTask = taskService.createTask(task);

        assertNotNull(createdTask);
        assertEquals(2, createdTask.getRounds().size());

        assertTrue(createdTask.getRounds().get(0).getIsActive(), "Az első fordulónak aktívnak kell lennie");

        assertFalse(createdTask.getRounds().get(1).getIsActive(), "A második fordulónak inaktívnak kell lennie");

        verify(taskRepository).save(task);
    }

    @Test
    void activateNextRound_ShouldSwitchRounds_WhenDeadlinePassed() {
        Long taskId = 1L;
        Task task = new Task();
        task.setId(taskId);

        Round currentRound = new Round();
        currentRound.setId(10L);
        currentRound.setIsActive(true);
        currentRound.setDeadline(LocalDate.now().minusDays(1));

        Round nextRound = new Round();
        nextRound.setId(11L);
        nextRound.setIsActive(false);
        nextRound.setDeadline(LocalDate.now().plusDays(10));

        List<Round> rounds = new ArrayList<>(List.of(currentRound, nextRound));

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(roundRepository.findByTaskId(taskId)).thenReturn(rounds);

        ResponseEntity<Object> response = taskService.activateNextRound(taskId);

        assertEquals(200, response.getStatusCodeValue());

        assertFalse(currentRound.getIsActive());
        assertTrue(nextRound.getIsActive());

        verify(roundRepository).save(currentRound);
        verify(roundRepository).save(nextRound);
    }

    @Test
    void activateNextRound_ShouldFail_WhenDeadlineNotPassed() {
        Long taskId = 1L;
        Round currentRound = new Round();
        currentRound.setIsActive(true);
        currentRound.setDeadline(LocalDate.now().plusDays(1));

        List<Round> rounds = new ArrayList<>(List.of(currentRound));

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(new Task()));
        when(roundRepository.findByTaskId(taskId)).thenReturn(rounds);

        ResponseEntity<Object> response = taskService.activateNextRound(taskId);

        assertEquals(403, response.getStatusCodeValue());
        verify(roundRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void eliminateApplicants_ShouldUpdateListAndSave() {
        Long taskId = 5L;
        Task task = new Task();
        task.setId(taskId);
        task.setEliminatedApplicants(new java.util.ArrayList<>());

        List<String> newEliminated = java.util.Arrays.asList("user1", "bad_actor");

        when(taskRepository.findById(taskId)).thenReturn(java.util.Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> i.getArguments()[0]);

        ResponseEntity<Task> response = taskService.eliminateApplicants(taskId, newEliminated);

        assertEquals(HttpStatus.OK, response.getStatusCode());

        Task updatedTask = response.getBody();
        assertNotNull(updatedTask);
        assertEquals(2, updatedTask.getEliminatedApplicants().size());
        assertTrue(updatedTask.getEliminatedApplicants().contains("bad_actor"));

        verify(taskRepository).save(task);
    }
}