package backend.competition_hub.repositories;
import backend.competition_hub.entities.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // Egy taskhoz tartozó összes jelentkezést lekérni
    List<Application> findByTaskId(Long taskId);

    List<Application> findByKeycloakUserId(String keycloakUserId);

    @Query("SELECT a.task.id, a.task.title, COUNT(a.id) " +
            "FROM Application a " +
            "WHERE a.keycloakUserName = :username " +
            "AND (a.reviewText IS NOT NULL OR a.reviewPoints IS NOT NULL) " +
            "AND a.applicantLastViewedReviewAt IS NULL " +
            "GROUP BY a.task.id, a.task.title " +
            "HAVING COUNT(a.id) > 0")
    List<Object[]> getTasksWithNewReviewCount(@Param("username") String username);

    List<Application> findByTaskIdAndKeycloakUserName(Long taskId, String keycloakUserName);
}