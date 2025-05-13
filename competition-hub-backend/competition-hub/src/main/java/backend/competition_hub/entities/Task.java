package backend.competition_hub.entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Entity
public class Task {

    @Setter
    @Getter
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @Getter
    @Column(nullable = false)
    private String title;

    @Setter
    @Getter
    @Column(columnDefinition = "TEXT")
    private String description;

    @Setter
    @Getter
    @Column(nullable = false)
    private LocalDate applicationDeadline;

    @Setter
    @Getter
    @Column(nullable = false)
    private String creator;

    @Setter
    @Getter
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Round> rounds;

    @Setter
    @Getter
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference(value = "task-application")
    private List<Application> applications;


}