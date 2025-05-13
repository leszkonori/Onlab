package backend.competition_hub.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String email;

    @OneToMany(mappedBy = "user")
    private List<Application> applications;

    public User() {}

    public User(String username, String email) {
        this.username = username;
        this.email = email;
    }
}

