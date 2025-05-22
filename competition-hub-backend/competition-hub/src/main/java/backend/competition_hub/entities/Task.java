package backend.competition_hub.entities;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

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

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Round> rounds;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    //@JsonManagedReference(value = "task-application")
    private List<Application> applications;


}