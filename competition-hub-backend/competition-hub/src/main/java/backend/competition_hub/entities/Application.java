package backend.competition_hub.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
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
    @JsonBackReference(value = "task-application")
    private Task task;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference
    private User user;

    private String filePath;
    private Date applicationDate;
    private String review;

    public Application() {}

    public Application(Task task, User user, String filePath, Date applicationDate) {
        this.task = task;
        this.user = user;
        this.filePath = filePath;
        this.applicationDate = applicationDate;
    }
}

