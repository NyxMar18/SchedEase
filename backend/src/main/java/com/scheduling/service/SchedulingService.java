package com.scheduling.service;

import com.scheduling.model.*;
import com.scheduling.repository.ClassroomRepository;
import com.scheduling.repository.ScheduleRepository;
import com.scheduling.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class SchedulingService {
    
    @Autowired
    private ClassroomRepository classroomRepository;
    
    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private ScheduleRepository scheduleRepository;
    
    public List<Schedule> generateConflictFreeSchedule(List<SchedulingRequest> requests) {
        List<Schedule> generatedSchedules = new ArrayList<>();
        
        // Sort requests by priority (you can add priority field to SchedulingRequest)
        Collections.sort(requests, Comparator.comparing(SchedulingRequest::getSubject));
        
        for (SchedulingRequest request : requests) {
            Schedule schedule = findBestSchedule(request);
            if (schedule != null) {
                generatedSchedules.add(schedule);
                scheduleRepository.save(schedule);
            }
        }
        
        return generatedSchedules;
    }
    
    private Schedule findBestSchedule(SchedulingRequest request) {
        // Find available teachers for the subject and time slot
        List<Teacher> availableTeachers = teacherRepository.findAvailableTeachers(
            request.getSubject(),
            request.getDayOfWeek(),
            request.getStartTime(),
            request.getEndTime()
        );
        
        if (availableTeachers.isEmpty()) {
            return null; // No available teachers
        }
        
        // Find available classrooms
        List<Classroom> availableClassrooms = classroomRepository.findAvailableClassrooms(
            request.getRequiredCapacity(),
            request.getRoomType()
        );
        
        if (availableClassrooms.isEmpty()) {
            return null; // No available classrooms
        }
        
        // Try to find a conflict-free combination
        for (Teacher teacher : availableTeachers) {
            for (Classroom classroom : availableClassrooms) {
                if (isScheduleConflictFree(teacher, classroom, request)) {
                    return createSchedule(teacher, classroom, request);
                }
            }
        }
        
        return null; // No conflict-free combination found
    }
    
    private boolean isScheduleConflictFree(Teacher teacher, Classroom classroom, SchedulingRequest request) {
        // Check teacher conflicts
        List<Schedule> teacherConflicts = scheduleRepository.findConflictingTeacherSchedules(
            teacher,
            request.getDate(),
            request.getStartTime(),
            request.getEndTime()
        );
        
        if (!teacherConflicts.isEmpty()) {
            return false;
        }
        
        // Check classroom conflicts
        List<Schedule> classroomConflicts = scheduleRepository.findConflictingClassroomSchedules(
            classroom,
            request.getDate(),
            request.getStartTime(),
            request.getEndTime()
        );
        
        return classroomConflicts.isEmpty();
    }
    
    private Schedule createSchedule(Teacher teacher, Classroom classroom, SchedulingRequest request) {
        Schedule schedule = new Schedule();
        schedule.setDate(request.getDate());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setTeacher(teacher);
        schedule.setClassroom(classroom);
        schedule.setSubject(request.getSubject());
        schedule.setNotes(request.getNotes());
        schedule.setRecurring(request.isRecurring());
        
        return schedule;
    }
    
    public List<Schedule> generateWeeklySchedule(List<SchedulingRequest> requests, LocalDate weekStart) {
        List<Schedule> weeklySchedules = new ArrayList<>();
        
        for (int i = 0; i < 7; i++) {
            LocalDate currentDate = weekStart.plusDays(i);
            DayOfWeek dayOfWeek = DayOfWeek.values()[i];
            
            List<SchedulingRequest> dayRequests = requests.stream()
                .filter(req -> req.getDayOfWeek() == dayOfWeek)
                .toList();
            
            for (SchedulingRequest request : dayRequests) {
                request.setDate(currentDate);
                Schedule schedule = findBestSchedule(request);
                if (schedule != null) {
                    weeklySchedules.add(schedule);
                    scheduleRepository.save(schedule);
                }
            }
        }
        
        return weeklySchedules;
    }
    
    public Map<String, Object> getScheduleStatistics(LocalDate startDate, LocalDate endDate) {
        List<Schedule> schedules = scheduleRepository.findSchedulesBetweenDates(startDate, endDate);
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalSchedules", schedules.size());
        
        Map<String, Long> subjectCount = schedules.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                Schedule::getSubject,
                java.util.stream.Collectors.counting()
            ));
        statistics.put("subjectDistribution", subjectCount);
        
        Map<String, Long> teacherUtilization = schedules.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                s -> s.getTeacher().getFullName(),
                java.util.stream.Collectors.counting()
            ));
        statistics.put("teacherUtilization", teacherUtilization);
        
        Map<String, Long> classroomUtilization = schedules.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                s -> s.getClassroom().getRoomName(),
                java.util.stream.Collectors.counting()
            ));
        statistics.put("classroomUtilization", classroomUtilization);
        
        return statistics;
    }
    
    // Inner class for scheduling requests
    public static class SchedulingRequest {
        private LocalDate date;
        private LocalTime startTime;
        private LocalTime endTime;
        private DayOfWeek dayOfWeek;
        private String subject;
        private Integer requiredCapacity;
        private String roomType;
        private String notes;
        private boolean recurring;
        
        // Constructors
        public SchedulingRequest() {}
        
        public SchedulingRequest(LocalDate date, LocalTime startTime, LocalTime endTime,
                               DayOfWeek dayOfWeek, String subject, Integer requiredCapacity,
                               String roomType, String notes, boolean recurring) {
            this.date = date;
            this.startTime = startTime;
            this.endTime = endTime;
            this.dayOfWeek = dayOfWeek;
            this.subject = subject;
            this.requiredCapacity = requiredCapacity;
            this.roomType = roomType;
            this.notes = notes;
            this.recurring = recurring;
        }
        
        // Getters and Setters
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        
        public LocalTime getStartTime() { return startTime; }
        public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
        
        public LocalTime getEndTime() { return endTime; }
        public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
        
        public DayOfWeek getDayOfWeek() { return dayOfWeek; }
        public void setDayOfWeek(DayOfWeek dayOfWeek) { this.dayOfWeek = dayOfWeek; }
        
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        
        public Integer getRequiredCapacity() { return requiredCapacity; }
        public void setRequiredCapacity(Integer requiredCapacity) { this.requiredCapacity = requiredCapacity; }
        
        public String getRoomType() { return roomType; }
        public void setRoomType(String roomType) { this.roomType = roomType; }
        
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        
        public boolean isRecurring() { return recurring; }
        public void setRecurring(boolean recurring) { this.recurring = recurring; }
    }
}
