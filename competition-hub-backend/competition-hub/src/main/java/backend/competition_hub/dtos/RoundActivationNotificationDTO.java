package backend.competition_hub.dtos;

public class RoundActivationNotificationDTO {
    public Long taskId;
    public String taskTitle;
    public int newApplicationsCount = 1;

    public RoundActivationNotificationDTO(Long taskId, String taskTitle) {
        this.taskId = taskId;
        this.taskTitle = taskTitle;
    }
}
