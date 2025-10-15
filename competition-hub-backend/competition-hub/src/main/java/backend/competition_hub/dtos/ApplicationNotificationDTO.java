package backend.competition_hub.dtos;

// Lombok használatával egyszerűbb:
import lombok.Data;

@Data
public class ApplicationNotificationDTO {
    private Long taskId;
    private String taskTitle;
    private Long newApplicationsCount;

    public ApplicationNotificationDTO(Long taskId, String taskTitle, Long newApplicationsCount) {
        this.taskId = taskId;
        this.taskTitle = taskTitle;
        this.newApplicationsCount = newApplicationsCount;
    }
}
