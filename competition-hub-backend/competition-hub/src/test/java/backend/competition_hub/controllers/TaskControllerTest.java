package backend.competition_hub.controllers;

import backend.competition_hub.entities.Task;
import backend.competition_hub.services.TaskService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TaskController.class) // Csak a web réteget tölti be
@AutoConfigureMockMvc(addFilters = false) // Kikapcsolja a Security-t a teszthez (egyszerűsítés)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean // A Service-t itt is mockoljuk, mert csak a Controllert teszteljük
    private TaskService taskService;

    @Test
    void getAllTasks_ShouldReturnJsonList() throws Exception {
        // GIVEN
        Task t1 = new Task(); t1.setId(1L); t1.setTitle("Task A");
        Task t2 = new Task(); t2.setId(2L); t2.setTitle("Task B");

        when(taskService.getAllTasks()).thenReturn(Arrays.asList(t1, t2));

        // WHEN & THEN
        mockMvc.perform(get("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk()) // HTTP 200
                .andExpect(jsonPath("$.size()").value(2)) // 2 elem van
                .andExpect(jsonPath("$[0].title").value("Task A")); // Az első címe helyes
    }

    @Test
    void getTaskById_ShouldReturn404_WhenTaskDoesNotExist() throws Exception {
        Long nonExistentId = 999L;

        when(taskService.getTaskById(nonExistentId))
                .thenReturn(org.springframework.http.ResponseEntity.notFound().build());

        mockMvc.perform(get("/api/tasks/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}