package backend.competition_hub.controllers;

import backend.competition_hub.services.ApplicationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

@WebMvcTest(ApplicationController.class)
@AutoConfigureMockMvc(addFilters = false) // Security kikapcsolása teszthez
class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApplicationService applicationService;

    @Test
    void handleFileUploadForRound_ShouldDelegateToService() throws Exception {
        // --- GIVEN ---
        // Létrehozunk egy "kamu" fájlt
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.zip",
                "application/zip",
                "dummy content".getBytes()
        );

        // Mockoljuk a Service választ
        when(applicationService.handleFileUploadForRound(
                eq(1L), eq(2L), any(), eq("uid123"), eq("student1")
        )).thenReturn(ResponseEntity.ok("Upload success"));

        // --- WHEN & THEN ---
        // Szimuláljuk a Multipart POST kérést
        mockMvc.perform(multipart("/api/applications/{taskId}/round/{roundId}", 1L, 2L)
                        .file(file)
                        .param("keycloakUserId", "uid123")
                        .param("keycloakUserName", "student1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Upload success"));

        // Ellenőrizzük, hogy a Controller tényleg átadta-e a fájlt a Service-nek
        verify(applicationService).handleFileUploadForRound(
                eq(1L), eq(2L), any(), eq("uid123"), eq("student1")
        );
    }
}