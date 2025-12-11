package backend.competition_hub.repositories;

import backend.competition_hub.entities.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    /**
     * Megszámolja azokat az Application-öket, amelyek a Task kiírója által
     * utoljára megtekintett idő (Task.creatorLastViewedAt) után érkeztek.
     * Task.creator a Task kiírójának Keycloak username-je.
     */
    @Query("SELECT t.id, t.title, COUNT(a) " +
            "FROM Task t JOIN t.applications a " +
            "WHERE t.creator = :creator " +
            "AND (t.creatorLastViewedAt IS NULL OR a.applicationDate > t.creatorLastViewedAt)" +
            "GROUP BY t.id, t.title HAVING COUNT(a) > 0")
    List<Object[]> getTasksWithNewApplicationCount(@Param("creator") String creator);

}