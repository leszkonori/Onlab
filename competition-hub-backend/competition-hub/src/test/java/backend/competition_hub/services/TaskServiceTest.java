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

@ExtendWith(MockitoExtension.class) // Mockito bekapcsolása
class TaskServiceTest {

    @Mock // A valódi repository helyett egy "bábut" használunk
    private TaskRepository taskRepository;
    @Mock
    private RoundRepository roundRepository;
    @Mock
    private ApplicationRepository applicationRepository;

    @InjectMocks // Ebbe az osztályba injektáljuk a fenti mockokat
    private TaskServiceImpl taskService;

    @Test
    void createTask_ShouldSetFirstRoundActive() {
        // --- 1. GIVEN (Előkészítés) ---
        Task task = new Task();
        task.setTitle("Teszt Feladat");

        // Hozzáadunk 2 fordulót
        List<Round> rounds = new ArrayList<>();
        Round r1 = new Round(); r1.setDeadline(LocalDate.of(2025, 10, 10));
        Round r2 = new Round(); r2.setDeadline(LocalDate.of(2025, 11, 10));
        rounds.add(r1);
        rounds.add(r2);
        task.setRounds(rounds);

        // Megmondjuk a Mocknak, hogy ha a save-et hívják, adja vissza a taskot
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        // --- 2. WHEN (Végrehajtás) ---
        Task createdTask = taskService.createTask(task);

        // --- 3. THEN (Ellenőrzés) ---
        assertNotNull(createdTask);
        assertEquals(2, createdTask.getRounds().size());

        // KRITIKUS ÜZLETI LOGIKA ELLENŐRZÉSE:
        // Az első fordulónak aktívnak kell lennie
        assertTrue(createdTask.getRounds().get(0).getIsActive(), "Az első fordulónak aktívnak kell lennie");
        // A másodiknak inaktívnak
        assertFalse(createdTask.getRounds().get(1).getIsActive(), "A második fordulónak inaktívnak kell lennie");

        // Ellenőrizzük, hogy a repository save metódusa lefutott-e
        verify(taskRepository).save(task);
    }

    @Test
    void activateNextRound_ShouldSwitchRounds_WhenDeadlinePassed() {
        // --- GIVEN ---
        Long taskId = 1L;
        Task task = new Task();
        task.setId(taskId);

        // Létrehozunk két fordulót
        Round currentRound = new Round();
        currentRound.setId(10L);
        currentRound.setIsActive(true);
        // TEGNAPI határidő (tehát lejárt -> aktiválható a kövi)
        currentRound.setDeadline(LocalDate.now().minusDays(1));

        Round nextRound = new Round();
        nextRound.setId(11L);
        nextRound.setIsActive(false);
        nextRound.setDeadline(LocalDate.now().plusDays(10));

        List<Round> rounds = new ArrayList<>(List.of(currentRound, nextRound));

        // Mockoljuk a függőségeket
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(roundRepository.findByTaskId(taskId)).thenReturn(rounds);

        // --- WHEN ---
        // Meghívjuk a logikát
        ResponseEntity<Object> response = taskService.activateNextRound(taskId);

        // --- THEN ---
        assertEquals(200, response.getStatusCodeValue()); // 200 OK

        // Ellenőrizzük, hogy az állapotok megfordultak-e
        assertFalse(currentRound.getIsActive());
        assertTrue(nextRound.getIsActive());

        // Ellenőrizzük, hogy a mentés lefutott mindkettőre
        verify(roundRepository).save(currentRound);
        verify(roundRepository).save(nextRound);
    }

    @Test
    void activateNextRound_ShouldFail_WhenDeadlineNotPassed() {
        // --- GIVEN ---
        Long taskId = 1L;
        Round currentRound = new Round();
        currentRound.setIsActive(true);
        // HOLNAPI határidő (még nem járt le -> hiba)
        currentRound.setDeadline(LocalDate.now().plusDays(1));

        List<Round> rounds = new ArrayList<>(List.of(currentRound));

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(new Task()));
        when(roundRepository.findByTaskId(taskId)).thenReturn(rounds);

        // --- WHEN ---
        ResponseEntity<Object> response = taskService.activateNextRound(taskId);

        // --- THEN ---
        // 403 Forbidden-t várunk
        assertEquals(403, response.getStatusCodeValue());
        // Nem szabad menteni semmit
        verify(roundRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void eliminateApplicants_ShouldUpdateListAndSave() {
        // --- GIVEN ---
        Long taskId = 5L;
        Task task = new Task();
        task.setId(taskId);
        // Eredetileg üres lista
        task.setEliminatedApplicants(new java.util.ArrayList<>());

        // Új lista, amit a frontend küld
        List<String> newEliminated = java.util.Arrays.asList("user1", "bad_actor");

        when(taskRepository.findById(taskId)).thenReturn(java.util.Optional.of(task));
        // A save híváskor visszaadjuk a módosított taskot
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> i.getArguments()[0]);

        // --- WHEN ---
        // Logika hívása
        ResponseEntity<Task> response = taskService.eliminateApplicants(taskId, newEliminated);

        // --- THEN ---
        assertEquals(HttpStatus.OK, response.getStatusCode());

        // Ellenőrizzük, hogy a Task objektumban frissült-e a lista
        Task updatedTask = response.getBody();
        assertNotNull(updatedTask);
        assertEquals(2, updatedTask.getEliminatedApplicants().size());
        assertTrue(updatedTask.getEliminatedApplicants().contains("bad_actor"));

        // Ellenőrizzük, hogy a repository save metódusa lefutott
        verify(taskRepository).save(task);
    }
}