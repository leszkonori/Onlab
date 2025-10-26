package backend.competition_hub.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
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
    private LocalDateTime applicationDate;
    //private String review;

    @Column(name = "review_text")
    private String reviewText;

    @Column(name = "review_points")
    private Integer reviewPoints;

    @Column(name = "applicant_last_viewed_review_at")
    private LocalDateTime applicantLastViewedReviewAt;

    @Column(name = "review_created_at")
    private LocalDateTime reviewCreatedAt;

    public Application() {}

    public Application(Task task, String keycloakUserId, String keycloakUserName, String filePath, LocalDateTime applicationDate) {
        this.task = task;
        this.keycloakUserId = keycloakUserId;
        this.keycloakUserName = keycloakUserName;
        this.filePath = filePath;
        this.applicationDate = applicationDate;
    }
}

