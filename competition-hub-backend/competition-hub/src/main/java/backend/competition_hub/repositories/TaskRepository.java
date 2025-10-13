package backend.competition_hub.repositories;

import backend.competition_hub.entities.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long> {
    /**
     * Megszámolja azokat az Application-öket, amelyek a Task kiírója által
     * utoljára megtekintett idő (Task.creatorLastViewedAt) után érkeztek.
     * Task.creator a Task kiírójának Keycloak username-je.
     */
    @Query("SELECT COUNT(a) " +
            "FROM Task t JOIN t.applications a " +
            "WHERE t.creator = :creator " +
            // JAVÍTOTT FELTÉTEL:
            "AND (t.creatorLastViewedAt IS NULL OR a.applicationDate > t.creatorLastViewedAt)")
    Long countNewApplicationsForCreator(@Param("creator") String creator);

}