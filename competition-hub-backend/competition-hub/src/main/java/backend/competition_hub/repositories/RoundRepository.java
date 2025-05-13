package backend.competition_hub.repositories;

import backend.competition_hub.entities.Round;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoundRepository extends JpaRepository<Round, Long> {
    List<Round> findByTaskId(Long taskId);
}
