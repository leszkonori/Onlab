package backend.competition_hub.repositories;
import backend.competition_hub.dtos.EliminationNotificationDTO;
import backend.competition_hub.entities.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // Egy taskhoz tartozó összes jelentkezést lekérni
    List<Application> findByTaskId(Long taskId);

    List<Application> findByKeycloakUserId(String keycloakUserId);

    @Query("SELECT a.task.id, a.task.title, COUNT(a.id) " +
            "FROM Application a " +
            "WHERE a.keycloakUserName = :username " +
            "AND (a.reviewText IS NOT NULL OR a.reviewPoints IS NOT NULL) " +
            "AND (a.applicantLastViewedReviewAt IS NULL OR a.applicantLastViewedReviewAt < a.reviewCreatedAt) " +
            "GROUP BY a.task.id, a.task.title " +
            "HAVING COUNT(a.id) > 0")
    List<Object[]> getTasksWithNewReviewCount(@Param("username") String username);

    @Query("""
        select a.task.id, a.task.title, count(a.id)
        from Application a
        where a.keycloakUserName = :username
          and :username member of a.task.eliminatedApplicants
          and (a.eliminatedSeen = false or a.eliminatedSeen is null)
        group by a.task.id, a.task.title
        having count(a.id) > 0
    """)
    List<Object[]> getTasksWithUnseenElimination(@Param("username") String username);

    @Modifying
    @Transactional
    @Query("""
        update Application a
        set a.eliminatedSeen = true
        where a.keycloakUserName = :username
          and a.task.id = :taskId
          and :username member of a.task.eliminatedApplicants
          and (a.eliminatedSeen = false or a.eliminatedSeen is null)
    """)
    int markEliminationSeen(@Param("username") String username, @Param("taskId") Long taskId);

    List<Application> findByTaskIdAndKeycloakUserName(Long taskId, String keycloakUserName);

}