package backend.competition_hub.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;

@Data
@Entity
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String filePath;
    private Date applicationDate;

    public Application() {}

    public Application(Task task, User user, String filePath, Date applicationDate) {
        this.task = task;
        this.user = user;
        this.filePath = filePath;
        this.applicationDate = applicationDate;
    }
}

