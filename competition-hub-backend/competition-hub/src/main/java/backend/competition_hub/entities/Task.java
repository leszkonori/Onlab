package backend.competition_hub.entities;

import backend.competition_hub.EvaluationType;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;


@Data
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
@Entity
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate applicationDeadline;

    @Column(nullable = false)
    private String creator;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EvaluationType evaluationType;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Round> rounds;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Application> applications;

    @Column(name = "creator_last_viewed_at")
    private LocalDateTime creatorLastViewedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "task_eliminated_applicants", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "keycloak_username")
    private List<String> eliminatedApplicants;

    @PrePersist
    @PreUpdate
    private void syncDeadlineFromRounds() {
        if (rounds != null && !rounds.isEmpty()) {
            this.applicationDeadline = rounds.stream()
                    .map(Round::getDeadline)     // már LocalDate
                    .filter(Objects::nonNull)
                    .min(Comparator.naturalOrder())
                    .orElse(this.applicationDeadline);
        }
    }
}