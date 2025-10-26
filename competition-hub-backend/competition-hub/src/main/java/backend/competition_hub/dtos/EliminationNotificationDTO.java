package backend.competition_hub.dtos;

import lombok.Data;

@Data
public class EliminationNotificationDTO {
    private Long taskId;
    private String taskTitle;
    private String eliminatedAt;

    public EliminationNotificationDTO(Long taskId, String taskTitle, String eliminatedAt) {
        this.taskId = taskId;
        this.taskTitle = taskTitle;
        this.eliminatedAt = eliminatedAt;
    }
}
