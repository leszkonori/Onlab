package backend.competition_hub.repositories;
import backend.competition_hub.entities.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // Egy taskhoz tartozó összes jelentkezést lekérni
    List<Application> findByTaskId(Long taskId);

    List<Application> findByKeycloakUserId(String keycloakUserId);
}