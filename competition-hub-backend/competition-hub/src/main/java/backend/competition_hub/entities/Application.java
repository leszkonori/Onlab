package backend.competition_hub.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;

@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
@Data
@Entity
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String keycloakUserId;
    private String keycloakUserName;

    @ManyToOne
    @JoinColumn(name = "task_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Task task;

    @ManyToOne
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Round round;

    private String filePath;
    private Date applicationDate;
    private String review;

    public Application() {}

    public Application(Task task, String keycloakUserId, String keycloakUserName, String filePath, Date applicationDate) {
        this.task = task;
        this.keycloakUserId = keycloakUserId;
        this.keycloakUserName = keycloakUserName;
        this.filePath = filePath;
        this.applicationDate = applicationDate;
    }
}

