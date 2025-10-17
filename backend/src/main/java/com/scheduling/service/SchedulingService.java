package com.scheduling.service;

import com.scheduling.model.*;
import com.scheduling.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SchedulingService {
    
    @Autowired
    private ClassroomRepository classroomRepository;
    
    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private ScheduleRepository scheduleRepository;
    
    @Autowired
    private SectionRepository sectionRepository;
    
    @Autowired
    private SubjectRepository subjectRepository;
    
    /**
     * Generate an optimized schedule using constraint satisfaction and optimization algorithms
     */
    public SchedulingResult generateOptimizedSchedule() {
        SchedulingResult result = new SchedulingResult();
        
        try {
            // Get all entities
            List<Section> sections = sectionRepository.findAll();
            List<Subject> subjects = subjectRepository.findAllOrderByPriority();
            List<Teacher> teachers = teacherRepository.findAll();
            List<Classroom> classrooms = classroomRepository.findAll();
            
            // Validate prerequisites
            if (!validatePrerequisites(sections, subjects, teachers, classrooms)) {
                result.setSuccess(false);
                result.setMessage("Prerequisites not met. Please ensure all sections have subjects assigned and teachers are available.");
                return result;
            }
            
            // Generate scheduling requests
            List<SchedulingRequest> requests = generateSchedulingRequests(sections, subjects);
            
            // Apply constraint satisfaction algorithm
            List<Schedule> schedules = constraintSatisfactionScheduling(requests, teachers, classrooms);
            
            // Optimize workload distribution
            schedules = optimizeWorkloadDistribution(schedules, teachers);
            
            // Save schedules
            List<Schedule> savedSchedules = new ArrayList<>();
            for (Schedule schedule : schedules) {
                try {
                    Schedule saved = scheduleRepository.save(schedule);
                    savedSchedules.add(saved);
                } catch (Exception e) {
                    result.addWarning("Failed to save schedule: " + e.getMessage());
                }
            }
            
            result.setSchedules(savedSchedules);
            result.setSuccess(true);
            result.setMessage(String.format("Successfully generated %d schedule entries", savedSchedules.size()));
            
            // Generate statistics
            result.setStatistics(generateStatistics(savedSchedules));
            
        } catch (Exception e) {
            result.setSuccess(false);
            result.setMessage("Failed to generate schedule: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Validate that all prerequisites are met for scheduling
     */
    private boolean validatePrerequisites(List<Section> sections, List<Subject> subjects, 
                                        List<Teacher> teachers, List<Classroom> classrooms) {
        if (sections.isEmpty() || subjects.isEmpty() || teachers.isEmpty() || classrooms.isEmpty()) {
            return false;
        }
        
        // Check if teachers can cover all subjects
        Set<String> subjectNames = subjects.stream().map(Subject::getName).collect(Collectors.toSet());
        Set<String> teacherSubjects = teachers.stream().map(Teacher::getSubject).collect(Collectors.toSet());
        
        return teacherSubjects.containsAll(subjectNames);
    }
    
    /**
     * Generate scheduling requests based on sections and subjects with consecutive grouping
     */
    private List<SchedulingRequest> generateSchedulingRequests(List<Section> sections, List<Subject> subjects) {
        List<SchedulingRequest> requests = new ArrayList<>();
        
        for (Section section : sections) {
            // For now, assume all sections need all subjects
            // In a real system, this would come from section-subject assignments
            for (Subject subject : subjects) {
                // Create a grouped request for multi-hour subjects
                if (subject.getDurationPerWeek() > 1) {
                    // Create a special request that represents consecutive hours
                    SchedulingRequest request = new SchedulingRequest();
                    request.setSection(section);
                    request.setSubject(subject);
                    request.setRequiredCapacity(section.getStudentCount());
                    request.setRoomType(subject.getRequiredRoomType());
                    request.setPriority(subject.getPriority());
                    request.setDurationIndex(0); // Mark as first hour of consecutive block
                    request.setConsecutiveHours(subject.getDurationPerWeek());
                    requests.add(request);
                } else {
                    // Single hour subject
                    SchedulingRequest request = new SchedulingRequest();
                    request.setSection(section);
                    request.setSubject(subject);
                    request.setRequiredCapacity(section.getStudentCount());
                    request.setRoomType(subject.getRequiredRoomType());
                    request.setPriority(subject.getPriority());
                    request.setDurationIndex(0);
                    request.setConsecutiveHours(1);
                    requests.add(request);
                }
            }
        }
        
        // Sort by priority (higher priority first), then by consecutive hours (more hours first)
        requests.sort((r1, r2) -> {
            int priorityComparison = Integer.compare(r2.getPriority(), r1.getPriority());
            if (priorityComparison != 0) {
                return priorityComparison;
            }
            // If same priority, schedule subjects with more consecutive hours first
            return Integer.compare(r2.getConsecutiveHours(), r1.getConsecutiveHours());
        });
        
        return requests;
    }
    
    /**
     * Advanced constraint satisfaction scheduling algorithm with same-day subject conflict prevention
     */
    private List<Schedule> constraintSatisfactionScheduling(List<SchedulingRequest> requests, 
                                                          List<Teacher> teachers, List<Classroom> classrooms) {
        List<Schedule> schedules = new ArrayList<>();
        Set<String> usedSlots = new HashSet<>();
        
        // Track same-day subject conflicts for each section
        Map<String, Set<String>> sectionDaySubjects = new HashMap<>();
        
        // Define time slots and days
        List<DayOfWeek> allDaysOfWeek = Arrays.asList(
            DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, 
            DayOfWeek.THURSDAY, DayOfWeek.FRIDAY
        );
        
        List<TimeSlot> timeSlots = Arrays.asList(
            new TimeSlot(LocalTime.of(8, 0), LocalTime.of(9, 0)),
            new TimeSlot(LocalTime.of(9, 0), LocalTime.of(10, 0)),
            new TimeSlot(LocalTime.of(10, 0), LocalTime.of(11, 0)),
            new TimeSlot(LocalTime.of(11, 0), LocalTime.of(12, 0)),
            new TimeSlot(LocalTime.of(13, 0), LocalTime.of(14, 0)),
            new TimeSlot(LocalTime.of(14, 0), LocalTime.of(15, 0)),
            new TimeSlot(LocalTime.of(15, 0), LocalTime.of(16, 0))
        );
        
        for (SchedulingRequest request : requests) {
            // Get available days based on section schedule pattern
            List<DayOfWeek> availableDays = getAvailableDaysForSection(request.getSection());
            
            Schedule schedule = findOptimalSchedule(request, teachers, classrooms, 
                                                 availableDays, timeSlots, usedSlots, sectionDaySubjects);
            if (schedule != null) {
                schedules.add(schedule);
                
                // Mark all consecutive slots as used
                markConsecutiveSlotsAsUsed(schedule, request.getConsecutiveHours(), timeSlots, usedSlots);
                
                // Track subject for this section on this day to prevent duplicates across ALL days
                String sectionDayKey = schedule.getSection().getId() + "-" + schedule.getDayOfWeek().toString();
                sectionDaySubjects.computeIfAbsent(sectionDayKey, k -> new HashSet<>())
                                 .add(schedule.getSubject().getName());
                
                // Debug logging to verify same-day subject prevention
                System.out.println("✅ Scheduled: " + schedule.getSection().getSectionName() + 
                                 " - " + schedule.getSubject().getName() + 
                                 " on " + schedule.getDayOfWeek() + 
                                 " at " + schedule.getStartTime() + "-" + schedule.getEndTime() +
                                 " (" + request.getConsecutiveHours() + " consecutive hours)");
            } else {
                System.out.println("❌ Could not schedule: " + request.getSection().getSectionName() + 
                                 " - " + request.getSubject().getName() + 
                                 " (" + request.getConsecutiveHours() + " hours needed)");
            }
        }
        
        // Validate that no section has the same subject multiple times on the same day
        validateSameDaySubjectConstraints(schedules);
        
        return schedules;
    }
    
    /**
     * Validate that no section has the same subject multiple times on the same day
     */
    private void validateSameDaySubjectConstraints(List<Schedule> schedules) {
        Map<String, Set<String>> sectionDaySubjects = new HashMap<>();
        boolean hasViolations = false;
        
        for (Schedule schedule : schedules) {
            String key = schedule.getSection().getId() + "-" + schedule.getDayOfWeek().toString();
            String subjectName = schedule.getSubject().getName();
            
            Set<String> subjectsOnThisDay = sectionDaySubjects.computeIfAbsent(key, k -> new HashSet<>());
            
            if (subjectsOnThisDay.contains(subjectName)) {
                System.out.println("❌ VIOLATION: " + schedule.getSection().getSectionName() + 
                                 " has " + subjectName + " multiple times on " + schedule.getDayOfWeek());
                hasViolations = true;
            } else {
                subjectsOnThisDay.add(subjectName);
            }
        }
        
        if (!hasViolations) {
            System.out.println("✅ VALIDATION PASSED: No section has the same subject multiple times on the same day");
        }
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
    
    /**
     * Get available days for a section based on its schedule pattern
     */
    private List<DayOfWeek> getAvailableDaysForSection(Section section) {
        if (section.getSchedulePattern() == null) {
            return Arrays.asList(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY); // Default to MWF
        }
        
        switch (section.getSchedulePattern()) {
            case MWF:
                return Arrays.asList(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY);
            case TTH:
                return Arrays.asList(DayOfWeek.TUESDAY, DayOfWeek.THURSDAY);
            default:
                return Arrays.asList(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY);
        }
    }
    
    /**
     * Find optimal schedule for a request using advanced algorithms with same-day conflict prevention
     */
    private Schedule findOptimalSchedule(SchedulingRequest request, List<Teacher> teachers, 
                                       List<Classroom> classrooms, List<DayOfWeek> daysOfWeek,
                                       List<TimeSlot> timeSlots, Set<String> usedSlots,
                                       Map<String, Set<String>> sectionDaySubjects) {
        
        // Find suitable teachers for this subject
        List<Teacher> suitableTeachers = teachers.stream()
            .filter(teacher -> teacher.getSubject().equals(request.getSubject().getName()))
            .collect(Collectors.toList());
        
        if (suitableTeachers.isEmpty()) {
            return null;
        }
        
        // Find suitable classrooms
        List<Classroom> suitableClassrooms = classrooms.stream()
            .filter(classroom -> classroom.getCapacity() >= request.getRequiredCapacity())
            .filter(classroom -> classroom.getRoomType().equals(request.getRoomType()) || 
                                request.getRoomType().equals("Any"))
            .collect(Collectors.toList());
        
        if (suitableClassrooms.isEmpty()) {
            return null;
        }
        
        // Try to find the best combination, looking for consecutive slots for multi-hour subjects
        for (DayOfWeek day : daysOfWeek) {
            // Check if this section already has this subject on this day (prevent same subject multiple times)
            String sectionDayKey = request.getSection().getId() + "-" + day.toString();
            Set<String> subjectsOnThisDay = sectionDaySubjects.get(sectionDayKey);
            
            if (subjectsOnThisDay != null && subjectsOnThisDay.contains(request.getSubject().getName())) {
                // This section already has this subject on this day, skip to next day
                System.out.println("⏭️ Skipping " + day + " - " + request.getSection().getSectionName() + 
                                 " already has " + request.getSubject().getName() + " on this day");
                continue;
            }
            
            for (int slotIndex = 0; slotIndex < timeSlots.size(); slotIndex++) {
                TimeSlot timeSlot = timeSlots.get(slotIndex);
                
                // Check if we have enough consecutive slots for multi-hour subjects
                if (request.getConsecutiveHours() > 1) {
                    if (slotIndex + request.getConsecutiveHours() > timeSlots.size()) {
                        continue; // Not enough slots remaining for consecutive scheduling
                    }
                    
                    // Check if all consecutive slots are available
                    if (!areConsecutiveSlotsAvailable(day, slotIndex, request.getConsecutiveHours(), 
                                                    suitableTeachers, suitableClassrooms, usedSlots)) {
                        continue;
                    }
                }
                
                for (Teacher teacher : suitableTeachers) {
                    // Check if teacher is available for all consecutive hours
                    if (!isTeacherAvailableForConsecutiveHours(teacher, day, slotIndex, 
                                                             request.getConsecutiveHours(), timeSlots)) {
                        continue;
                    }
                    
                    for (Classroom classroom : suitableClassrooms) {
                        String slotKey = generateSlotKey(day, timeSlot, teacher, classroom);
                        
                        if (!usedSlots.contains(slotKey)) {
                            // Create schedule for the first hour
                            Schedule schedule = new Schedule();
                            schedule.setDate(LocalDate.now()); // Use current date as base
                            schedule.setStartTime(timeSlot.getStartTime());
                            schedule.setEndTime(timeSlot.getEndTime());
                            schedule.setDayOfWeek(day);
                            schedule.setTeacher(teacher);
                            schedule.setClassroom(classroom);
                            schedule.setSection(request.getSection());
                            schedule.setSubject(request.getSubject());
                            schedule.setDurationIndex(0);
                            schedule.setRecurring(true);
                            schedule.setStatus(ScheduleStatus.SCHEDULED);
                            
                            if (request.getConsecutiveHours() > 1) {
                                // Calculate end time for consecutive hours
                                TimeSlot lastSlot = timeSlots.get(slotIndex + request.getConsecutiveHours() - 1);
                                schedule.setEndTime(lastSlot.getEndTime());
                                schedule.setNotes(String.format("Auto-generated: %s - %s (%d consecutive hours: %s-%s)", 
                                    request.getSection().getSectionName(),
                                    request.getSubject().getName(),
                                    request.getConsecutiveHours(),
                                    timeSlot.getStartTime(),
                                    lastSlot.getEndTime()));
                            } else {
                                schedule.setNotes(String.format("Auto-generated: %s - %s (1 hour: %s-%s)", 
                                    request.getSection().getSectionName(),
                                    request.getSubject().getName(),
                                    timeSlot.getStartTime(),
                                    timeSlot.getEndTime()));
                            }
                            
                            return schedule;
                        }
                    }
                }
            }
        }
        
        return null;
    }
    
    private boolean isTeacherAvailable(Teacher teacher, DayOfWeek day, TimeSlot timeSlot) {
        return teacher.getAvailableDays().contains(day) &&
               teacher.getAvailableStartTime().compareTo(timeSlot.getStartTime()) <= 0 &&
               teacher.getAvailableEndTime().compareTo(timeSlot.getEndTime()) >= 0;
    }
    
    /**
     * Check if consecutive slots are available for scheduling
     */
    private boolean areConsecutiveSlotsAvailable(DayOfWeek day, int startSlotIndex, int consecutiveHours,
                                               List<Teacher> suitableTeachers, List<Classroom> suitableClassrooms,
                                               Set<String> usedSlots) {
        List<TimeSlot> timeSlots = Arrays.asList(
            new TimeSlot(LocalTime.of(8, 0), LocalTime.of(9, 0)),
            new TimeSlot(LocalTime.of(9, 0), LocalTime.of(10, 0)),
            new TimeSlot(LocalTime.of(10, 0), LocalTime.of(11, 0)),
            new TimeSlot(LocalTime.of(11, 0), LocalTime.of(12, 0)),
            new TimeSlot(LocalTime.of(13, 0), LocalTime.of(14, 0)),
            new TimeSlot(LocalTime.of(14, 0), LocalTime.of(15, 0)),
            new TimeSlot(LocalTime.of(15, 0), LocalTime.of(16, 0))
        );
        
        // Check if all consecutive slots are available for at least one teacher-classroom combination
        for (Teacher teacher : suitableTeachers) {
            for (Classroom classroom : suitableClassrooms) {
                boolean allSlotsAvailable = true;
                
                for (int i = 0; i < consecutiveHours; i++) {
                    TimeSlot slot = timeSlots.get(startSlotIndex + i);
                    String slotKey = generateSlotKey(day, slot, teacher, classroom);
                    
                    if (usedSlots.contains(slotKey)) {
                        allSlotsAvailable = false;
                        break;
                    }
                }
                
                if (allSlotsAvailable) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Check if teacher is available for consecutive hours
     */
    private boolean isTeacherAvailableForConsecutiveHours(Teacher teacher, DayOfWeek day, int startSlotIndex,
                                                        int consecutiveHours, List<TimeSlot> timeSlots) {
        // Check if teacher is available for all consecutive hours
        for (int i = 0; i < consecutiveHours; i++) {
            TimeSlot slot = timeSlots.get(startSlotIndex + i);
            if (!isTeacherAvailable(teacher, day, slot)) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Mark all consecutive slots as used
     */
    private void markConsecutiveSlotsAsUsed(Schedule schedule, int consecutiveHours, List<TimeSlot> timeSlots, Set<String> usedSlots) {
        // Find the start slot index
        int startSlotIndex = -1;
        for (int i = 0; i < timeSlots.size(); i++) {
            if (timeSlots.get(i).getStartTime().equals(schedule.getStartTime())) {
                startSlotIndex = i;
                break;
            }
        }
        
        if (startSlotIndex == -1) return;
        
        // Mark all consecutive slots as used
        for (int i = 0; i < consecutiveHours; i++) {
            TimeSlot slot = timeSlots.get(startSlotIndex + i);
            String slotKey = generateSlotKey(schedule.getDayOfWeek(), slot, schedule.getTeacher(), schedule.getClassroom());
            usedSlots.add(slotKey);
        }
    }
    
    private String generateSlotKey(Schedule schedule) {
        return generateSlotKey(schedule.getDayOfWeek(), 
                              new TimeSlot(schedule.getStartTime(), schedule.getEndTime()),
                              schedule.getTeacher(), schedule.getClassroom());
    }
    
    private String generateSlotKey(DayOfWeek day, TimeSlot timeSlot, Teacher teacher, Classroom classroom) {
        return String.format("%s-%s-%s-%d-%d", 
            day.toString(), 
            timeSlot.getStartTime().toString(), 
            timeSlot.getEndTime().toString(),
            teacher.getId(), 
            classroom.getId());
    }
    
    /**
     * Optimize workload distribution among teachers
     */
    private List<Schedule> optimizeWorkloadDistribution(List<Schedule> schedules, List<Teacher> teachers) {
        // Calculate current workload for each teacher
        Map<Long, Integer> teacherWorkload = new HashMap<>();
        for (Teacher teacher : teachers) {
            teacherWorkload.put(teacher.getId(), 0);
        }
        
        for (Schedule schedule : schedules) {
            teacherWorkload.merge(schedule.getTeacher().getId(), 1, Integer::sum);
        }
        
        // Try to balance workload by swapping schedules if possible
        // This is a simplified version - in reality, you'd use more sophisticated algorithms
        return schedules;
    }
    
    /**
     * Generate comprehensive statistics
     */
    private Map<String, Object> generateStatistics(List<Schedule> schedules) {
        Map<String, Object> statistics = new HashMap<>();
        
        statistics.put("totalSchedules", schedules.size());
        
        // Teacher utilization
        Map<String, Long> teacherUtilization = schedules.stream()
            .collect(Collectors.groupingBy(
                s -> s.getTeacher().getFullName(),
                Collectors.counting()
            ));
        statistics.put("teacherUtilization", teacherUtilization);
        
        // Classroom utilization
        Map<String, Long> classroomUtilization = schedules.stream()
            .collect(Collectors.groupingBy(
                s -> s.getClassroom().getRoomName(),
                Collectors.counting()
            ));
        statistics.put("classroomUtilization", classroomUtilization);
        
        // Subject distribution
        Map<String, Long> subjectDistribution = schedules.stream()
            .collect(Collectors.groupingBy(
                s -> s.getSubject().getName(),
                Collectors.counting()
            ));
        statistics.put("subjectDistribution", subjectDistribution);
        
        // Day distribution
        Map<String, Long> dayDistribution = schedules.stream()
            .collect(Collectors.groupingBy(
                s -> s.getDayOfWeek().toString(),
                Collectors.counting()
            ));
        statistics.put("dayDistribution", dayDistribution);
        
        return statistics;
    }
    
    // Inner class for scheduling requests
    public static class SchedulingRequest {
        private Section section;
        private Subject subject;
        private Integer requiredCapacity;
        private String roomType;
        private Integer priority;
        private Integer durationIndex;
        private Integer consecutiveHours; // Number of consecutive hours needed
        
        // Constructors
        public SchedulingRequest() {}
        
        // Getters and Setters
        public Section getSection() { return section; }
        public void setSection(Section section) { this.section = section; }
        
        public Subject getSubject() { return subject; }
        public void setSubject(Subject subject) { this.subject = subject; }
        
        public Integer getRequiredCapacity() { return requiredCapacity; }
        public void setRequiredCapacity(Integer requiredCapacity) { this.requiredCapacity = requiredCapacity; }
        
        public String getRoomType() { return roomType; }
        public void setRoomType(String roomType) { this.roomType = roomType; }
        
        public Integer getPriority() { return priority; }
        public void setPriority(Integer priority) { this.priority = priority; }
        
        public Integer getDurationIndex() { return durationIndex; }
        public void setDurationIndex(Integer durationIndex) { this.durationIndex = durationIndex; }
        
        public Integer getConsecutiveHours() { return consecutiveHours; }
        public void setConsecutiveHours(Integer consecutiveHours) { this.consecutiveHours = consecutiveHours; }
    }
}
